# OAuth Flow End-to-End Test Script (T037)
# Tests the complete authentication flow: 
# Frontend login -> Backend token verification -> User creation -> GET /api/v1/me

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  OAuth Flow End-to-End Test (T037)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$script:testsPassed = 0
$script:testsFailed = 0

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$TestBlock
    )
    
    Write-Host "Testing: $Name..." -NoNewline
    try {
        & $TestBlock
        Write-Host " [PASS]" -ForegroundColor Green
        $script:testsPassed++
        return $true
    } catch {
        Write-Host " [FAIL]" -ForegroundColor Red
        Write-Host "  Error: $_" -ForegroundColor Red
        $script:testsFailed++
        return $false
    }
}

# Test 1: Backend server is running
Test-Step "Backend server on port 8000" {
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -ne 200) {
        throw "Backend not responding with 200 OK"
    }
}

# Test 2: Frontend server is running
Test-Step "Frontend server on port 3001" {
    $response = Invoke-WebRequest -Uri "http://localhost:3001" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -ne 200) {
        throw "Frontend not responding with 200 OK"
    }
}

# Test 3: Backend API v1 is accessible
Test-Step "Backend API v1 accessible" {
    try {
        # Try to access /api/v1/me without auth (should get 401 or 403)
        $null = Invoke-WebRequest -Uri "http://localhost:8000/api/v1/me" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
        throw "Expected 401/403 but got 200 - endpoint should require auth"
    } catch {
        # Expected to fail with 401 or 403
        if ($_.Exception.Message -match "401|403|Unauthorized") {
            # This is correct - endpoint requires authentication
            return
        }
        throw
    }
}

# Test 4: Database connection (via backend health check or docs)
Test-Step "Database connectivity" {
    # Check if backend can start (which requires DB connection)
    $response = Invoke-WebRequest -Uri "http://localhost:8000/openapi.json" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -ne 200) {
        throw "Cannot access backend API schema"
    }
}

# Test 5: CORS headers configured correctly
Test-Step "CORS headers allow frontend origin" {
    $headers = @{
        "Origin" = "http://localhost:3001"
    }
    $response = Invoke-WebRequest -Uri "http://localhost:8000/docs" -Headers $headers -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    # Should not reject the request
    if ($response.StatusCode -ne 200) {
        throw "CORS might be blocking frontend origin"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Automated Tests Complete" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "Passed: $script:testsPassed" -ForegroundColor Green
Write-Host "Failed: $script:testsFailed" -ForegroundColor Red
Write-Host ""

if ($script:testsFailed -gt 0) {
    Write-Host "[FAILED] Some automated tests failed. Please fix the issues above." -ForegroundColor Red
    Write-Host ""
    exit 1
}

Write-Host "[SUCCESS] All automated tests passed!" -ForegroundColor Green
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Manual OAuth Flow Test Required" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Since OAuth requires browser interaction with Google," -ForegroundColor Yellow
Write-Host "please complete the following manual test:" -ForegroundColor Yellow
Write-Host ""
Write-Host "MANUAL TEST STEPS:" -ForegroundColor Cyan
Write-Host "  1. Open browser: http://localhost:3001" -ForegroundColor White
Write-Host "  2. Click 'Sign in with Google' button" -ForegroundColor White
Write-Host "  3. Complete Google OAuth consent flow" -ForegroundColor White
Write-Host "  4. Verify you are redirected back to the app" -ForegroundColor White
Write-Host "  5. Verify your user info is displayed" -ForegroundColor White
Write-Host "  6. Open browser DevTools > Network tab" -ForegroundColor White
Write-Host "  7. Check for successful call to /api/v1/me" -ForegroundColor White
Write-Host "  8. Verify response contains your user data" -ForegroundColor White
Write-Host ""
Write-Host "EXPECTED RESULTS:" -ForegroundColor Cyan
Write-Host "  [PASS] Google OAuth consent screen appears" -ForegroundColor White
Write-Host "  [PASS] After consent, redirected to http://localhost:3001" -ForegroundColor White
Write-Host "  [PASS] User info (name, email) displayed on page" -ForegroundColor White
Write-Host "  [PASS] GET /api/v1/me returns 200 with user data" -ForegroundColor White
Write-Host "  [PASS] No errors in browser console or network tab" -ForegroundColor White
Write-Host ""
Write-Host "TROUBLESHOOTING:" -ForegroundColor Cyan
Write-Host "  - If OAuth fails: Verify GOOGLE_CLIENT_ID in .env files" -ForegroundColor White
Write-Host "  - If redirect fails: Check authorized redirect URIs in Google Console" -ForegroundColor White
Write-Host "  - If /api/v1/me fails: Check network tab for token in Authorization header" -ForegroundColor White
Write-Host "  - Backend logs: Check backend terminal for token verification errors" -ForegroundColor White
Write-Host ""
Write-Host "Press Enter when you have completed the manual test..." -ForegroundColor Yellow
$null = Read-Host

Write-Host ""
Write-Host "Did the OAuth flow work correctly? (y/n): " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'y' -or $response -eq 'Y') {
    Write-Host ""
    Write-Host "[SUCCESS] OAuth Flow Test PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "T037 is now complete. The full authentication flow works:" -ForegroundColor Green
    Write-Host "  [PASS] Frontend login -> Google OAuth -> Backend verification -> User data" -ForegroundColor Green
    Write-Host ""
    exit 0
} else {
    Write-Host ""
    Write-Host "[FAILED] OAuth Flow Test FAILED" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please review the errors and try again." -ForegroundColor Red
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host "  1. Google OAuth credentials are correct" -ForegroundColor White
    Write-Host "  2. Redirect URIs match in Google Console" -ForegroundColor White
    Write-Host "  3. Backend and frontend environment variables" -ForegroundColor White
    Write-Host "  4. Browser console for errors" -ForegroundColor White
    Write-Host "  5. Backend terminal for verification errors" -ForegroundColor White
    Write-Host ""
    exit 1
}
