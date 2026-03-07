# Test retry flow end-to-end (T064)
# 
# Prerequisites:
# 1. Backend server running (uvicorn app.main:app --reload)
# 2. Redis running
# 3. Celery worker running (celery -A app.tasks.celery_app worker --loglevel=info --pool=solo)
# 4. PostgreSQL database running
# 5. Valid Google OAuth token
#
# Test flow:
# 1. Create task with simulate_failure_stage="ai_understanding"
# 2. Wait for task to fail
# 3. Verify error and retry_count
# 4. Retry the task
# 5. Wait for completion
# 6. Verify retry_count_by_stage["ai_understanding"] = 1

param(
    [string]$Token = $env:GOOGLE_TOKEN,
    [string]$BaseUrl = "http://localhost:8000"
)

if (-not $Token) {
    Write-Error "Google OAuth token required. Set GOOGLE_TOKEN environment variable or pass -Token parameter."
    exit 1
}

Write-Host "=== Testing Retry Flow End-to-End ===" -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $Token"
    "Content-Type" = "application/json"
}

# Step 1: Create task with simulate_failure_stage
Write-Host "[1/6] Creating task with simulate_failure_stage='ai_understanding'..." -ForegroundColor Yellow

$createBody = @{
    simulate_failure_stage = "ai_understanding"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tasks" `
        -Method POST `
        -Headers $headers `
        -Body $createBody `
        -ErrorAction Stop
    
    $taskId = $createResponse.task_id
    Write-Host "✓ Task created: $taskId" -ForegroundColor Green
    Write-Host "  Status: $($createResponse.status)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Error "Failed to create task: $_"
    exit 1
}

# Step 2: Poll until task fails
Write-Host "[2/6] Waiting for task to fail at ai_understanding..." -ForegroundColor Yellow

$maxWait = 60  # seconds
$elapsed = 0
$failed = $false

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    try {
        $taskResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tasks/$taskId" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop
        
        Write-Host "  Progress: $($taskResponse.progress)% | Status: $($taskResponse.status) | Stage: $($taskResponse.current_stage)" -ForegroundColor Gray
        
        if ($taskResponse.status -eq "failed") {
            $failed = $true
            Write-Host "✓ Task failed as expected" -ForegroundColor Green
            Write-Host "  Error: $($taskResponse.error)" -ForegroundColor Gray
            break
        }
        
        if ($taskResponse.status -eq "completed") {
            Write-Error "Task completed unexpectedly (should have failed)"
            exit 1
        }
    } catch {
        Write-Error "Failed to get task status: $_"
        exit 1
    }
}

if (-not $failed) {
    Write-Error "Task did not fail within $maxWait seconds"
    exit 1
}

Write-Host ""

# Step 3: Verify error and retry_count
Write-Host "[3/6] Verifying failed state..." -ForegroundColor Yellow

if ($taskResponse.status -ne "failed") {
    Write-Error "Task status is not 'failed': $($taskResponse.status)"
    exit 1
}

if ($taskResponse.current_stage -ne "ai_understanding") {
    Write-Error "Task did not fail at expected stage. Expected: ai_understanding, Got: $($taskResponse.current_stage)"
    exit 1
}

if ($taskResponse.error -notlike "*ai_understanding*") {
    Write-Warning "Error message doesn't mention ai_understanding: $($taskResponse.error)"
}

if ($taskResponse.retry_count_by_stage.ai_understanding -ne 0) {
    Write-Error "Retry count should be 0 before retry. Got: $($taskResponse.retry_count_by_stage.ai_understanding)"
    exit 1
}

Write-Host "✓ Failed state verified" -ForegroundColor Green
Write-Host "  Current stage: $($taskResponse.current_stage)" -ForegroundColor Gray
Write-Host "  Error: $($taskResponse.error)" -ForegroundColor Gray
Write-Host "  Retry count (ai_understanding): $($taskResponse.retry_count_by_stage.ai_understanding)" -ForegroundColor Gray
Write-Host ""

# Step 4: Retry the task
Write-Host "[4/6] Retrying the task..." -ForegroundColor Yellow

try {
    $retryResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tasks/$taskId/retry" `
        -Method POST `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "✓ Retry initiated" -ForegroundColor Green
    Write-Host "  Status: $($retryResponse.status)" -ForegroundColor Gray
    Write-Host "  Retry count (ai_understanding): $($retryResponse.retry_count_by_stage.ai_understanding)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Error "Failed to retry task: $_"
    exit 1
}

# Verify retry response
if ($retryResponse.status -ne "running") {
    Write-Error "Task status after retry should be 'running'. Got: $($retryResponse.status)"
    exit 1
}

if ($retryResponse.retry_count_by_stage.ai_understanding -ne 1) {
    Write-Error "Retry count should be 1 after retry. Got: $($retryResponse.retry_count_by_stage.ai_understanding)"
    exit 1
}

if ($retryResponse.error) {
    Write-Error "Error should be cleared after retry. Got: $($retryResponse.error)"
    exit 1
}

# Step 5: Poll until completion
Write-Host "[5/6] Waiting for task to complete on retry..." -ForegroundColor Yellow

$elapsed = 0
$completed = $false

while ($elapsed -lt $maxWait) {
    Start-Sleep -Seconds 2
    $elapsed += 2
    
    try {
        $taskResponse = Invoke-RestMethod -Uri "$BaseUrl/api/v1/tasks/$taskId" `
            -Method GET `
            -Headers $headers `
            -ErrorAction Stop
        
        Write-Host "  Progress: $($taskResponse.progress)% | Status: $($taskResponse.status) | Stage: $($taskResponse.current_stage)" -ForegroundColor Gray
        
        if ($taskResponse.status -eq "completed") {
            $completed = $true
            Write-Host "✓ Task completed successfully" -ForegroundColor Green
            break
        }
        
        if ($taskResponse.status -eq "failed") {
            Write-Error "Task failed again on retry"
            Write-Error "Error: $($taskResponse.error)"
            exit 1
        }
    } catch {
        Write-Error "Failed to get task status: $_"
        exit 1
    }
}

if (-not $completed) {
    Write-Error "Task did not complete within $maxWait seconds"
    exit 1
}

Write-Host ""

# Step 6: Verify final state
Write-Host "[6/6] Verifying final state..." -ForegroundColor Yellow

if ($taskResponse.status -ne "completed") {
    Write-Error "Final status should be 'completed'. Got: $($taskResponse.status)"
    exit 1
}

if ($taskResponse.progress -ne 100) {
    Write-Error "Final progress should be 100. Got: $($taskResponse.progress)"
    exit 1
}

if ($taskResponse.error) {
    Write-Error "Error should be null in completed state. Got: $($taskResponse.error)"
    exit 1
}

if ($taskResponse.retry_count_by_stage.ai_understanding -ne 1) {
    Write-Error "Retry count (ai_understanding) should be 1. Got: $($taskResponse.retry_count_by_stage.ai_understanding)"
    exit 1
}

Write-Host "✓ Final state verified" -ForegroundColor Green
Write-Host "  Status: $($taskResponse.status)" -ForegroundColor Gray
Write-Host "  Progress: $($taskResponse.progress)%" -ForegroundColor Gray
Write-Host "  Retry count (ai_understanding): $($taskResponse.retry_count_by_stage.ai_understanding)" -ForegroundColor Gray
Write-Host ""

Write-Host "=== RETRY FLOW TEST PASSED ===" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "• Task created with simulated failure" -ForegroundColor White
Write-Host "• Task failed at ai_understanding stage" -ForegroundColor White
Write-Host "• Task retried successfully" -ForegroundColor White
Write-Host "• Retry count incremented correctly" -ForegroundColor White
Write-Host "• Task completed on retry" -ForegroundColor White
Write-Host ""
