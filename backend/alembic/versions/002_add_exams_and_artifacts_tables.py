"""Add exams and artifacts tables with task linkage

Revision ID: 002_add_exams_and_artifacts
Revises: 001_initial
Create Date: 2026-03-12 00:00:00.000000

This migration adds:
- exams table for business metadata
- artifacts table for pipeline outputs
- exam_id column to tasks table (nullable initially, then NOT NULL after data migration)

Migration Strategy (per research.md):
Step 1: Create new tables with exam_id as NULLABLE
Step 2: Backfill data - create legacy exams for users with existing tasks
Step 3: Make exam_id NOT NULL with FK constraint
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import text
import uuid


# revision identifiers, used by Alembic.
revision = '002_add_exams_and_artifacts'
down_revision = '001_initial'
branch_labels = None
depends_on = None


def generate_legacy_exam_for_user(connection, user_id: uuid.UUID) -> uuid.UUID:
    """
    Create a "Legacy Import" exam for a user with existing tasks.
    
    This helper function is used during data migration to ensure all
    existing tasks have a valid exam_id reference.
    
    Args:
        connection: Active database connection
        user_id: User UUID who owns the tasks
    
    Returns:
        UUID of the created legacy exam
    """
    exam_id = uuid.uuid4()
    
    connection.execute(
        text("""
            INSERT INTO exams (exam_id, user_id, name, subject, academic_year, num_variants, status, created_at, updated_at)
            VALUES (:exam_id, :user_id, :name, :subject, :academic_year, :num_variants, :status, NOW(), NOW())
        """),
        {
            "exam_id": exam_id,
            "user_id": user_id,
            "name": "Legacy Import",
            "subject": "Imported",
            "academic_year": "Pre-Migration",
            "num_variants": 1,
            "status": "completed"
        }
    )
    
    return exam_id


def upgrade() -> None:
    """
    Apply migration: Add exams and artifacts tables, link tasks to exams.
    
    Three-step process to maintain referential integrity:
    1. Create tables with nullable exam_id
    2. Backfill legacy exams for existing tasks
    3. Add NOT NULL constraint and FK
    """
    connection = op.get_bind()
    
    # ============================================================================
    # STEP 1: Create new tables with exam_id as NULLABLE
    # ============================================================================
    
    # Create exams table
    op.create_table(
        'exams',
        sa.Column('exam_id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('name', sa.String(500), nullable=False),
        sa.Column('subject', sa.String(500), nullable=False),
        sa.Column('academic_year', sa.String(50), nullable=False),
        sa.Column('grade_level', sa.String(100), nullable=True),
        sa.Column('num_variants', sa.Integer(), nullable=False),
        sa.Column('instructions', sa.Text(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, index=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint('num_variants > 0', name='check_num_variants_positive'),
    )
    
    # Create artifacts table
    op.create_table(
        'artifacts',
        sa.Column('artifact_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('exam_id', UUID(as_uuid=True), sa.ForeignKey('exams.exam_id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.task_id', ondelete='SET NULL'), nullable=True, index=True),
        sa.Column('artifact_type', sa.String(50), nullable=False, index=True),
        sa.Column('file_name', sa.String(255), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('mime_type', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )
    
    # Create composite index on artifacts (exam_id, artifact_type)
    op.create_index('ix_artifacts_exam_id_artifact_type', 'artifacts', ['exam_id', 'artifact_type'])
    
    # Add exam_id column to tasks table (NULLABLE initially for data migration)
    op.add_column('tasks', sa.Column('exam_id', UUID(as_uuid=True), nullable=True))
    op.create_index('ix_tasks_exam_id', 'tasks', ['exam_id'])
    
    # ============================================================================
    # STEP 2: Data Migration - Create legacy exams and link existing tasks
    # ============================================================================
    
    # Find all users who have tasks but no exams
    result = connection.execute(
        text("""
            SELECT DISTINCT user_id 
            FROM tasks 
            WHERE exam_id IS NULL
        """)
    )
    
    users_with_tasks = [row[0] for row in result]
    
    # Create a legacy exam for each user and link their tasks
    for user_id in users_with_tasks:
        # Create legacy exam
        legacy_exam_id = generate_legacy_exam_for_user(connection, user_id)
        
        # Link all user's tasks to the legacy exam
        connection.execute(
            text("""
                UPDATE tasks 
                SET exam_id = :exam_id 
                WHERE user_id = :user_id AND exam_id IS NULL
            """),
            {"exam_id": legacy_exam_id, "user_id": user_id}
        )
    
    # ============================================================================
    # STEP 3: Add constraints - Make exam_id NOT NULL with FK
    # ============================================================================
    
    # Now that all tasks have exam_id, make it NOT NULL
    op.alter_column('tasks', 'exam_id', nullable=False)
    
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_tasks_exam_id_exams',
        'tasks',
        'exams',
        ['exam_id'],
        ['exam_id'],
        ondelete='CASCADE'
    )


def downgrade() -> None:
    """
    Rollback migration: Remove exams and artifacts tables, remove exam_id from tasks.
    
    WARNING: This will delete all exam and artifact data!
    """
    # Drop FK constraint first
    op.drop_constraint('fk_tasks_exam_id_exams', 'tasks', type_='foreignkey')
    
    # Drop exam_id column from tasks
    op.drop_index('ix_tasks_exam_id', 'tasks')
    op.drop_column('tasks', 'exam_id')
    
    # Drop artifacts table (and its indexes/constraints)
    op.drop_index('ix_artifacts_exam_id_artifact_type', 'artifacts')
    op.drop_table('artifacts')
    
    # Drop exams table
    op.drop_table('exams')
