"""Initial migration: Create users, tasks, task_logs tables

Revision ID: 001_initial
Revises: 
Create Date: 2026-02-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB


# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('user_id', UUID(as_uuid=True), primary_key=True),
        sa.Column('google_sub', sa.String(255), nullable=False, unique=True, index=True),
        sa.Column('email', sa.String(255), nullable=False),
        sa.Column('display_name', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    
    # Create tasks table
    op.create_table(
        'tasks',
        sa.Column('task_id', UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', UUID(as_uuid=True), sa.ForeignKey('users.user_id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('status', sa.String(20), nullable=False, index=True),
        sa.Column('current_stage', sa.String(50), nullable=True),
        sa.Column('progress', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('retry_count_by_stage', JSONB, nullable=False, server_default='{}'),
        sa.Column('error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa. CheckConstraint('progress >= 0 AND progress <= 100', name='progress_range'),
    )
    
    # Create task_logs table
    op.create_table(
        'task_logs',
        sa.Column('log_id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('task_id', UUID(as_uuid=True), sa.ForeignKey('tasks.task_id', ondelete='CASCADE'), nullable=False, index=True),
        sa.Column('stage', sa.String(50), nullable=True),
        sa.Column('level', sa.String(20), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('data_json', JSONB, nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
    )


def downgrade() -> None:
    op.drop_table('task_logs')
    op.drop_table('tasks')
    op.drop_table('users')
