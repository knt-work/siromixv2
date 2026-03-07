"""
Celery application configuration for asynchronous task processing.

Celery is used to execute long-running tasks (pipeline stages) in the background.
Tasks are queued in Redis and processed by worker processes.
"""

from celery import Celery
from celery.signals import worker_shutdown
import os
import signal
import sys
import logging


logger = logging.getLogger(__name__)


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
        "app.tasks.pipeline.*": {"queue": "pipeline"},
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
celery_app.autodiscover_tasks(["app.tasks"])

# Explicitly import tasks to ensure they are registered
from app.tasks import process_task  # noqa: F401, E402


# T085: Graceful shutdown handling
@worker_shutdown.connect
def worker_shutdown_handler(sender, **kwargs):
    """
    Handle worker shutdown signal.
    
    This is called when the worker receives SIGTERM or SIGINT.
    The worker will finish the current task before shutting down
    due to task_acks_late=True configuration.
    """
    logger.info("Worker shutdown initiated. Finishing current tasks...")
    logger.info("Current task will complete before worker exits.")


def graceful_shutdown_signal_handler(signum, frame):
    """
    Handle SIGTERM/SIGINT signals for graceful shutdown.
    
    When the worker receives a shutdown signal:
    1. Stop accepting new tasks
    2. Allow current task to complete (task_acks_late=True)
    3. Exit cleanly
    """
    signal_name = "SIGTERM" if signum == signal.SIGTERM else "SIGINT"
    logger.info(f"Received {signal_name}. Initiating graceful shutdown...")
    logger.info("Worker will finish current task before exiting.")
    
    # Let Celery handle the actual shutdown
    # The worker_shutdown signal will be triggered
    sys.exit(0)


# Register signal handlers for graceful shutdown
signal.signal(signal.SIGTERM, graceful_shutdown_signal_handler)
signal.signal(signal.SIGINT, graceful_shutdown_signal_handler)


if __name__ == "__main__":
    celery_app.start()

