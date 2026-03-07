# End-to-End Validation Test Plan (T100)

**Feature**: 001-mvp-foundation  
**Date**: 2025-02-22  
**Purpose**: Manual validation of complete user journey before production readiness

---

## Prerequisites

- [ ] All services running via `docker compose up`
- [ ] Google OAuth credentials configured in `.env`
- [ ] Frontend accessible at http://localhost:3000
- [ ] Backend API docs accessible at http://localhost:8000/docs

---

## Test 1: Authentication Flow

### Steps:
1. Navigate to http://localhost:3000
2. **Expected**: See login page with "Sign in with Google" button
3. Click "Sign in with Google"
4. **Expected**: Google OAuth consent screen appears
5. Select Google account and grant permissions
6. **Expected**: Redirect back to http://localhost:3000 with user logged in
7. **Expected**: Dashboard shows:
   - User's name/email from Google profile
   - "Create New Task" button
   - Empty task list (if first time user)

### Validation Criteria:
- ✅ Google OAuth flow completes without errors
- ✅ User profile data (name, email) displays correctly
- ✅ Session persists on page refresh
- ✅ Backend `/api/v1/me` endpoint returns user data

### Troubleshooting:
- **redirect_uri_mismatch**: Check Google Console redirect URI matches exactly
- **401 Unauthorized**: Check GOOGLE_CLIENT_ID in backend `.env`
- **CORS errors**: Verify CORS_ORIGINS in backend `.env` includes frontend URL

---

## Test 2: Task Creation (Success Path)

### Steps:
1. From dashboard, click **"Create New Task"**
2. **Expected**: Task creation form appears
3. Leave "Simulate Failure" **unchecked**
4. Click **"Submit"**
5. **Expected**: 
   - Task appears in task list with status "Queued"
   - Progress bar at 0%
   - Status changes to "Running" within 2-3 seconds
6. Monitor progress bar updating through stages:
   - Extract DOCX: 0% → 20% (~3-5 seconds)
   - AI Understanding: 20% → 40% (~3-5 seconds)
   - AI Analysis: 40% → 60% (~3-5 seconds)
   - Shuffle: 60% → 80% (~3-5 seconds)
   - Render DOCX: 80% → 100% (~3-5 seconds)
7. **Expected**: 
   - Status changes to "Completed"
   - Total duration: 15-25 seconds
   - Progress bar at 100%

### Validation Criteria:
- ✅ Task transitions: Queued → Running → Completed
- ✅ Progress updates smoothly (no stuck stages)
- ✅ All 5 pipeline stages execute in order
- ✅ Completion time within 15-25 seconds
- ✅ No errors in backend logs
- ✅ No errors in worker logs

### API Validation:
- Backend logs show:
  ```
  [INFO] → POST /api/v1/tasks
  [INFO] Task created: <task_id>
  ```
- Worker logs show:
  ```
  [INFO] Task process_task[...] received
  [INFO] Stage: extract_docx - Progress: 20%
  [INFO] Stage: ai_understanding - Progress: 40%
  ...
  [SUCCESS] Task process_task[...] succeeded
  ```

---

## Test 3: Task Creation with Simulated Failure

### Steps:
1. Click **"Create New Task"**
2. **Check** "Simulate Failure" checkbox
3. Select failure stage: **"AI Understanding"** from dropdown
4. Click **"Submit"**
5. **Expected**:
   - Task starts processing normally
   - Reaches "Extract DOCX" stage (20%)
   - Starts "AI Understanding" stage (40%)
   - Status changes to **"Failed"**
   - Error message appears: "Simulated failure at stage: ai_understanding"
   - Progress stuck at 40%

### Validation Criteria:
- ✅ Task fails at specified stage
- ✅ Error message displayed in UI
- ✅ Status = "Failed"
- ✅ Progress stopped at 40%
- ✅ Worker logs show failure exception

---

## Test 4: Task Retry Mechanism

### Steps (continuing from Test 3):
1. On the failed task, click **"Retry"** button
2. **Expected**:
   - Status changes from "Failed" to "Queued"
   - Then to "Running"
   - Task resumes from "AI Understanding" stage (40%)
   - Progress continues: 40% → 60% → 80% → 100%
   - Status changes to "Completed"
3. Click **"View Details"** on the task
4. **Expected**: Retry count shows `retry_count_by_stage: { "ai_understanding": 1 }`

### Validation Criteria:
- ✅ Retry button triggers task re-execution
- ✅ Task resumes from failed stage (idempotent retry)
- ✅ Retry count increments correctly
- ✅ Subsequent stages execute successfully
- ✅ Final status = "Completed"
- ✅ Worker logs show retry attempt

### API Validation:
- Backend logs show:
  ```
  [INFO] → POST /api/v1/tasks/{task_id}/retry
  [INFO] Retrying task: <task_id>
  ```
- Worker logs show:
  ```
  [INFO] Task process_task[...] retry
  [INFO] Stage: ai_understanding (retry 1) - Progress: 40%
  ```

---

## Test 5: Task Logs Inspection

### Steps:
1. Select any completed task
2. Click **"View Logs"** button
3. **Expected**:
   - Modal/panel opens showing task logs
   - Logs include entries for each stage:
     - Stage name
     - Progress percentage
     - Timestamp
     - Log message
   - Logs ordered chronologically (oldest to newest)

### Validation Criteria:
- ✅ At least 5 log entries (one per stage)
- ✅ Each log has: stage, progress, message, timestamp
- ✅ Timestamps are sequential
- ✅ Messages describe stage activities

---

## Test 6: Concurrent Task Execution

### Steps:
1. Rapidly create **3 tasks** (without simulated failure)
2. **Expected**:
   - All 3 tasks appear in task list
   - All start with status "Queued"
   - Worker processes tasks (may be sequential or parallel depending on concurrency=2)
   - All tasks eventually complete successfully

### Validation Criteria:
- ✅ Multiple tasks can be queued
- ✅ Celery worker processes tasks from queue
- ✅ No task left stuck in "Queued" status indefinitely
- ✅ All tasks complete within ~60 seconds (3 × 20s + overhead)

---

## Test 7: User Isolation (Multiple Users)

### Steps:
1. Sign out from current user
2. Sign in with **different Google account**
3. **Expected**:
   - Dashboard shows empty task list
   - Previous user's tasks NOT visible
4. Create a test task
5. **Expected**:
   - Only this user's task appears
6. Sign out and sign back in with **original user**
7. **Expected**:
   - Original user's tasks reappear
   - Second user's task NOT visible

### Validation Criteria:
- ✅ Each user sees only their own tasks
- ✅ Task ownership enforced by `user_id` foreign key
- ✅ 403 Forbidden if attempting to access another user's task
- ✅ Authentication required for all API endpoints

---

## Test 8: API Direct Testing (Optional)

### Using Swagger UI (http://localhost:8000/docs):

1. **GET /api/v1/me**
   - Click "Try it out"
   - Add Authorization header: `Bearer <google_id_token>`
   - Execute
   - **Expected**: Returns user profile JSON with `user_id`, `email`, `display_name`

2. **POST /api/v1/tasks**
   - Add Authorization header
   - Request body: `{}`
   - Execute
   - **Expected**: Returns task JSON with `task_id`, `status: "queued"`

3. **GET /api/v1/tasks/{task_id}**
   - Use task_id from step 2
   - Add Authorization header
   - Execute
   - **Expected**: Returns task details with current progress

---

## Test 9: Error Handling

### 401 Unauthorized:
- Try accessing `/api/v1/me` without Authorization header
- **Expected**: 401 response with error message

### 403 Forbidden:
- Try accessing another user's task (if task_id known)
- **Expected**: 403 response: "Not authorized to access this task"

### 404 Not Found:
- Access non-existent task: `/api/v1/tasks/00000000-0000-0000-0000-000000000000`
- **Expected**: 404 response: "Task not found"

### 422 Validation Error:
- POST invalid data to `/api/v1/tasks`
- **Expected**: 422 response with validation details

---

## Test 10: Service Health

### Steps:
1. Access http://localhost:8000/api/v1/health
2. **Expected**: JSON response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "celery": "connected"
   }
   ```

### Database Connection:
```bash
docker compose exec db psql -U siromix -d siromix_v2 -c "SELECT COUNT(*) FROM users;"
```
- **Expected**: Returns count of users

### Redis Connection:
```bash
docker compose exec redis redis-cli PING
```
- **Expected**: Returns "PONG"

---

## Test 11: Logs and Monitoring

### Backend Logs:
```bash
docker compose logs backend -f
```
- **Expected**: 
  - Request/response logs with status codes and duration
  - No ERROR or CRITICAL level logs during normal operation
  - Clean startup sequence

### Worker Logs:
```bash
docker compose logs worker -f
```
- **Expected**:
  - Celery startup message: "celery@worker ready"
  - Task execution logs for each stage
  - Success messages on task completion

### Database Logs:
```bash
docker compose logs db
```
- **Expected**:
  - PostgreSQL startup complete
  - No connection errors
  - Healthy connections from backend

---

## Success Criteria Summary

**All tests must pass:**
- ✅ Authentication flow works end-to-end
- ✅ Tasks execute through all 5 pipeline stages
- ✅ Simulated failures work correctly
- ✅ Retry mechanism is idempotent
- ✅ Task logs are accessible and accurate
- ✅ Multiple concurrent tasks process successfully
- ✅ User isolation enforced (multi-user safety)
- ✅ API error handling returns proper status codes
- ✅ Health checks show all services connected
- ✅ No critical errors in logs

---

## Post-Test Checklist

- [ ] All 11 tests completed successfully
- [ ] No errors in backend logs
- [ ] No errors in worker logs
- [ ] Database schema matches models
- [ ] Frontend UI responsive and intuitive
- [ ] Performance meets targets (<200ms task creation, <100ms polling)
- [ ] Security validated (authentication, authorization, CORS)
- [ ] Documentation accurate (README, quickstart, API docs)

---

## Production Readiness

**If all tests pass, the system is ready for:**
- ✅ MVP deployment
- ✅ User acceptance testing
- ✅ Production environment setup
- ✅ Feature flag enabling

**Next Steps After Validation:**
1. Deploy to staging environment
2. Run full test suite against staging
3. Performance testing with realistic load
4. Security audit (penetration testing)
5. Production deployment
