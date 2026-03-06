# Alembic Configuration

This directory contains database migration scripts managed by Alembic.

## Usage

**Create a new migration**:
```bash
alembic revision --autogenerate -m "Description of changes"
```

**Apply migrations**:
```bash
alembic upgrade head
```

**Rollback one migration**:
```bash
alembic downgrade -1
```

**View migration history**:
```bash
alembic history
```

## Directory Structure

- `versions/` - Migration scripts (auto-generated)
- `env.py` - Alembic environment configuration
- `script.py.mako` - Template for new migrations
- `alembic.ini` - Alembic configuration file (in project root)
