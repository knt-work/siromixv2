# Database Migration Testing Guide

## Overview
This guide covers testing the Alembic migration `002_add_exams_and_artifacts_tables.py` which adds:
- `exams` table for exam metadata
- `artifacts` table for pipeline outputs  
- `exam_id` column to `tasks` table with backward-compatible data migration

## Prerequisites
- Docker Desktop running
- PostgreSQL container accessible (started via docker-compose)

## Test 1: Clean Database Migration (T092)

**Purpose**: Verify migration runs without errors on empty database

```powershell
# Start PostgreSQL container
cd infra
docker-compose up -d db

# Wait for database to be healthy
docker-compose ps db

# Run migration from backend directory
cd ..\backend
alembic upgrade head

# Expected output:
# INFO  [alembic.runtime.migration] Running upgrade 001_initial -> 002_add_exams_and_artifacts, Add exams and artifacts tables with task linkage

# Verify tables created
docker exec -it siromix-postgres psql -U siromix -d siromix_v2 -c "\dt"

# Expected tables:
#  exams
#  artifacts  
#  tasks (with exam_id column)
#  users
#  task_logs
```

**Success Criteria**:
- ✅ Migration completes without errors
- ✅ All 5 tables exist in database
- ✅ No warnings or constraint violations

---

## Test 2: Migration Rollback (T093)

**Purpose**: Verify downgrade removes changes cleanly

```powershell
# From backend directory
alembic downgrade -1

# Expected output:
# INFO  [alembic.runtime.migration] Running downgrade 002_add_exams_and_artifacts -> 001_initial

# Verify tables removed
docker exec -it siromix-postgres psql -U siromix -d siromix_v2 -c "\dt"

# Expected tables (only original 3):
#  users
#  tasks (without exam_id column)
#  task_logs

# Verify tasks.exam_id column removed
docker exec -it siromix-postgres psql -U siromix -d siromix_v2 -c "\d tasks"

# Re-apply migration for Test 3
alembic upgrade head
```

**Success Criteria**:
- ✅ Downgrade completes without errors
- ✅ exams and artifacts tables removed
- ✅ tasks.exam_id column removed
- ✅ No orphaned foreign keys or constraints

---

## Test 3: Migration with Existing Data (T094)

**Purpose**: Verify backward compatibility - legacy exam creation for existing tasks

```powershell
# Create test data BEFORE migration
# First, downgrade to remove exam tables
alembic downgrade -1

# Create test user and tasks using psql
docker exec -it siromix-postgres psql -U siromix -d siromix_v2 <<EOF
-- Insert test user
INSERT INTO users (user_id, google_id, email, full_name, created_at) 
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'test_google_123', 'test@example.com', 'Test User', NOW());

-- Insert test tasks (3 tasks for the user)
INSERT INTO tasks (task_id, user_id, task_type, status, retry_count, created_at) 
VALUES 
  ('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'grading', 'pending', 0, NOW()),
  ('b2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'parsing', 'completed', 0, NOW()),
  ('b3eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid, 'parsing', 'failed', 2, NOW());

-- Verify data inserted
SELECT task_id, task_type, status FROM tasks;
EOF

# Now run migration upgrade
alembic upgrade head

# Verify legacy exam was created
docker exec -it siromix-postgres psql -U siromix -d siromix_v2 <<EOF
-- Check legacy exam created
SELECT exam_id, user_id, name, subject, academic_year, status 
FROM exams 
WHERE name = 'Legacy Import';

-- Verify all tasks linked to legacy exam
SELECT t.task_id, t.task_type, t.status, t.exam_id, e.name as exam_name
FROM tasks t
JOIN exams e ON t.exam_id = e.exam_id
WHERE t.user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'::uuid;

-- Verify exam_id is NOT NULL
SELECT COUNT(*) as total_tasks, COUNT(exam_id) as linked_tasks 
FROM tasks;
EOF
```

**Success Criteria**:
- ✅ Migration creates exactly 1 "Legacy Import" exam for the test user
- ✅ All 3 test tasks have exam_id populated (linked to legacy exam)
- ✅ Legacy exam has: name="Legacy Import", subject="Imported", academic_year="Pre-Migration", status="completed", num_variants=1
- ✅ No tasks have NULL exam_id after migration
- ✅ No foreign key violations

---

## Cleanup

```powershell
# Stop and remove containers
cd ..\infra
docker-compose down -v

# This removes:
# - All containers
# - All volumes (postgres_data, redis_data)
# - All networks
```

---

## Migration File Details

**Location**: `backend/alembic/versions/002_add_exams_and_artifacts_tables.py`

**Key Components**:
- ✅ `generate_legacy_exam_for_user(connection, user_id)` helper function
- ✅ Three-step upgrade process:
  1. Create exams/artifacts tables, add tasks.exam_id as NULLABLE
  2. Find users with tasks, create legacy exam, link tasks
  3. Make tasks.exam_id NOT NULL, add FK constraint
- ✅ Comprehensive downgrade() for clean rollback

**Migration Strategy** (per research.md):
- Maintains backward compatibility by creating "Legacy Import" exams for existing tasks
- Uses three-step upgrade to avoid constraint violations during data migration
- Ensures no orphaned tasks after migration

---

## Troubleshooting

### Docker not running
```
Error: Cannot connect to Docker daemon
```
**Solution**: Start Docker Desktop, wait for it to fully initialize

### Database not accessible
```
Error: Could not resolve hostname "db"
```
**Solution**: 
```powershell
cd infra
docker-compose up -d db
docker-compose ps  # Verify db is "healthy"
```

### Migration already applied
```
INFO  [alembic.runtime.migration] Running upgrade  -> 002_add_exams_and_artifacts (head)
```
**Solution**: Migration already at head, no action needed

### Downgrade fails
```
ERROR: Cannot drop column exam_id due to dependent objects
```
**Solution**: Check for custom FK constraints, verify downgrade() drops FK before column
