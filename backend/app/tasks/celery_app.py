"""
Celery application configuration for asynchronous task processing.

Celery is used to execute long-running tasks (pipeline stages) in the background.
Tasks are queued in Redis and processed by worker processes.
"""

from celery import Celery
import os


# Redis URLs for broker and result backend
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")


# Create Celery app
celery_app = Celery(
    "siromix_tasks",
    broker=CELERY_BROKER_URL,
    backend=CELERY_RESULT_BACKEND,
)


# Celery configuration
celery_app.conf.update(
    # Task settings
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    
    # Task routing
    task_routes={
        "backend.app.tasks.pipeline.*": {"queue": "pipeline"},
    },
    
    # Task execution
    task_acks_late=True,  # Acknowledge after task completes, not when starting
    task_reject_on_worker_lost=True,  # Retry if worker dies
    
    # Result backend
    result_expires=3600,  # Results expire after 1 hour
    result_extended=True,  # Store additional metadata
    
    # Worker settings
    worker_prefetch_multiplier=1,  # Process one task at a time per worker
    worker_max_tasks_per_child=1000,  # Restart worker after 1000 tasks (prevent memory leaks)
)


# Auto-discover tasks from app.tasks module
celery_app.autodiscover_tasks(["backend.app.tasks"])


if __name__ == "__main__":
    celery_app.start()

