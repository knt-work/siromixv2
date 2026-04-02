"""
Pipeline stages for SiroMix exam processing.

Phase 7: Real DOCX extraction integration (T097-T103).
Other stages remain as mocks for MVP.
"""

import asyncio
import random
import json
import time
from typing import Any
from pathlib import Path
from uuid import UUID
import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.task import Task
from app.models.exam import Exam
from app.models.artifact import Artifact, ArtifactType
from app.services.extraction_service import ExtractionService
from app.core.storage import StorageClient
from app.core.exceptions import ExtractionError, ErrorCode


logger = logging.getLogger(__name__)


def _extract_dij_sync(temp_path: Path, task: Task, exam: Exam):
    """
    Synchronous helper for DIJ extraction (for async timeout wrapper).
    
    Args:
        temp_path: Path to temporary DOCX file
        task: Task model instance
        exam: Exam model instance
    
    Returns:
        Tuple of (dij, warnings)
    """
    extraction_service = ExtractionService()
    
    dij = extraction_service.extract_dij(
        file_path=temp_path,
        source_document_id=str(exam.exam_id),
        source_filename=exam.name + ".docx",
        task_id=task.task_id,
        exam_id=exam.exam_id
    )
    
    return dij, extraction_service.warnings


async def extract_docx(
    task_id: str,
    simulate_failure: bool = False,
    db: AsyncSession | None = None,
) -> dict[str, Any]:
    """
    Stage 1: Extract document structure from DOCX (Phase 7 - T097-T103).
    
    Real implementation that:
    1. Loads Task from database (T098)
    2. Retrieves DOCX artifact path (T099)
    3. Calls ExtractionService to extract DIJ (T100)
    4. Persists DIJ as S3 artifact (T101)
    5. Updates task with dij_artifact_id (T102)
    6. Returns extraction result (T103)
    
    Args:
        task_id: UUID string of the task being processed
        simulate_failure: If True, raise an exception to simulate failure
        
    Returns:
        Dict with extraction results:
            - task_id: UUID of processed task
            - dij_artifact_id: UUID of created DIJ artifact (None if failed)
            - blocks_extracted: Number of blocks extracted
            - duration_ms: Extraction duration in milliseconds
            - status: 'completed' or 'failed'
            - error: Error message if failed
            - warnings: List of non-fatal warnings
            - metadata: Additional extraction metadata
        
    Raises:
        Exception: If simulate_failure is True or critical errors occur
    """
    start_time = time.time()
    
    if simulate_failure:
        raise Exception("Simulated failure in extract_docx stage")
    
    # Convert task_id string to UUID
    task_uuid = UUID(task_id)
    
    if db is None:
        raise ValueError("db session is required for extract_docx")

    try:
        # Load Task from database (T098)
        result = await db.execute(
            select(Task).where(Task.task_id == task_uuid)
        )
        task = result.scalar_one_or_none()

        if not task:
            raise ValueError(f"Task not found: {task_id}")

        # Load Exam to get DOCX artifact path (T099)
        exam_result = await db.execute(
            select(Exam).where(Exam.exam_id == task.exam_id)
        )
        exam = exam_result.scalar_one_or_none()

        if not exam:
            raise ValueError(f"Exam not found: {task.exam_id}")

        # Get DOCX artifact path from storage
        # For MVP, reconstruct the path using the same logic as exam upload
        # Pattern: exams/{user_id}/{exam-name-kebab}/original.docx
        from app.core.artifact_paths import generate_artifact_path

        storage_path = generate_artifact_path(
            user_id=task.user_id,
            exam_name=exam.name,
            filename="original.docx"
        )

        logger.info(f"Extracting DOCX for task {task_id}, storage_path: {storage_path}")

        # Download DOCX from S3 to temporary file
        storage = StorageClient()
        import tempfile
        temp_dir = Path(tempfile.gettempdir())
        temp_path = temp_dir / f"exam_{task.exam_id}.docx"

        try:
            file_data = storage.download_file(storage_path)

            # File size validation (T104) - 50MB max
            MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes
            file_size = len(file_data)

            if file_size > MAX_FILE_SIZE:
                raise ExtractionError(
                    message=f"File size ({file_size / 1024 / 1024:.1f}MB) exceeds maximum allowed size (50MB)",
                    error_code=ErrorCode.DOCX_TOO_LARGE,
                    details={"file_size_bytes": file_size, "max_size_bytes": MAX_FILE_SIZE}
                )

            temp_path.write_bytes(file_data)

            logger.info(f"Downloaded DOCX to {temp_path}, size: {len(file_data)} bytes")

            # Timeout handling (T105) - 5 minute max
            EXTRACTION_TIMEOUT = 5 * 60  # 5 minutes in seconds

            try:
                # Wrap extraction in async timeout
                extraction_task = asyncio.create_task(
                    asyncio.to_thread(
                        _extract_dij_sync,
                        temp_path,
                        task,
                        exam
                    )
                )

                dij, warnings = await asyncio.wait_for(extraction_task, timeout=EXTRACTION_TIMEOUT)

            except asyncio.TimeoutError:
                raise ExtractionError(
                    message=f"Extraction exceeded maximum timeout ({EXTRACTION_TIMEOUT / 60:.0f} minutes)",
                    error_code=ErrorCode.EXTRACTION_TIMEOUT,
                    details={"timeout_seconds": EXTRACTION_TIMEOUT}
                )

            logger.info(
                f"DIJ extracted successfully: {len(dij.blocks)} blocks, "
                f"{len(warnings)} warnings"
            )

            # Convert DIJ to JSON for storage
            dij_json = dij.model_dump_json(indent=2)

            # Persist DIJ as S3 artifact (T101)
            dij_storage_path = generate_artifact_path(
                user_id=task.user_id,
                exam_name=exam.name,
                filename=f"dij_v1_{task_id}.json"
            )

            from io import BytesIO
            dij_bytes = BytesIO(dij_json.encode('utf-8'))

            storage.upload_file(
                file_data=dij_bytes,
                file_path=dij_storage_path,
                content_type="application/json"
            )

            logger.info(f"DIJ uploaded to S3: {dij_storage_path}")

            # Create Artifact database record for DIJ (T101)
            dij_artifact = Artifact(
                exam_id=task.exam_id,
                task_id=task.task_id,
                artifact_type=ArtifactType.DIJ,
                file_name=f"dij_v1_{task_id}.json",
                file_path=dij_storage_path,
                mime_type="application/json"
            )
            db.add(dij_artifact)
            await db.commit()
            await db.refresh(dij_artifact)

            logger.info(f"DIJ artifact created: artifact_id={dij_artifact.artifact_id}")

            # Calculate extraction duration
            duration_ms = int((time.time() - start_time) * 1000)

            # Build extraction response (T103)
            return {
                "task_id": str(task_uuid),  # Convert UUID to string for JSON serialization
                "dij_artifact_id": str(dij_artifact.artifact_id),  # Convert UUID to string
                "blocks_extracted": len(dij.blocks),
                "duration_ms": duration_ms,
                "status": "completed",
                "error": None,
                "warnings": warnings,
                "metadata": {
                    "source_filename": exam.name + ".docx",
                    "file_size_bytes": len(file_data),
                    "extraction_timestamp": dij.metadata.extraction_timestamp.isoformat(),
                    "dij_version": dij.version
                }
            }

        finally:
            # Clean up temporary file
            if temp_path.exists():
                temp_path.unlink()
                logger.debug(f"Cleaned up temporary file: {temp_path}")

    except ExtractionError as e:
        # Structured extraction error (T110)
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Extraction failed for task {task_id}: {e.message}", exc_info=True)

        return {
            "task_id": str(task_uuid),  # Convert UUID to string
            "dij_artifact_id": None,
            "blocks_extracted": 0,
            "duration_ms": duration_ms,
            "status": "failed",
            "error": e.message,
            "warnings": [],
            "metadata": {
                "error_code": e.error_code.value if e.error_code else "UNKNOWN",
                "error_details": e.details
            }
        }

    except Exception as e:
        # Unexpected errors
        duration_ms = int((time.time() - start_time) * 1000)
        logger.error(f"Unexpected error during extraction for task {task_id}: {str(e)}", exc_info=True)

        return {
            "task_id": str(task_uuid),  # Convert UUID to string
            "dij_artifact_id": None,
            "blocks_extracted": 0,
            "duration_ms": duration_ms,
            "status": "failed",
            "error": f"Unexpected error: {str(e)}",
            "warnings": [],
            "metadata": {}
        }


async def ai_understanding(
    task_id: str,
    simulate_failure: bool = False,
    db: AsyncSession | None = None,
) -> dict[str, Any]:
    """
    Mock stage 2: Map extracted content to canonical schema using AI.
    
    In production: Use AI to understand question structure and normalize to schema.
    MVP: Simulates AI processing with random delay.
    
    Args:
        task_id: UUID of the task being processed
        simulate_failure: If True, raise an exception to simulate failure
        
    Returns:
        Dict with mock AI understanding results
        
    Raises:
        Exception: If simulate_failure is True
    """
    delay = random.uniform(3.0, 5.0)
    await asyncio.sleep(delay)

    if simulate_failure:
        raise Exception("Simulated failure in ai_understanding stage")

    return {
        "questions_mapped": 0,  # MVP: no actual mapping
        "confidence_score": round(random.uniform(0.85, 0.98), 2),
        "duration_ms": int(delay * 1000),
        "stage": "ai_understanding",
        "status": "completed"
    }


async def ai_analysis(
    task_id: str,
    simulate_failure: bool = False,
    db: AsyncSession | None = None,
) -> dict[str, Any]:
    """
    Mock stage 3: Add metadata and quality checks using AI.
    
    In production: Use AI to validate questions, detect issues, suggest improvements.
    MVP: Simulates AI analysis with random delay.
    
    Args:
        task_id: UUID of the task being processed
        simulate_failure: If True, raise an exception to simulate failure
        
    Returns:
        Dict with mock AI analysis results
        
    Raises:
        Exception: If simulate_failure is True
    """
    delay = random.uniform(3.0, 5.0)
    await asyncio.sleep(delay)

    if simulate_failure:
        raise Exception("Simulated failure in ai_analysis stage")

    return {
        "quality_score": round(random.uniform(0.75, 0.95), 2),
        "issues_found": 0,  # MVP: no actual analysis
        "duration_ms": int(delay * 1000),
        "stage": "ai_analysis",
        "status": "completed"
    }


async def shuffle(
    task_id: str,
    simulate_failure: bool = False,
    db: AsyncSession | None = None,
) -> dict[str, Any]:
    """
    Mock stage 4: Generate exam variants by shuffling questions/options.
    
    In production: Create multiple variants with randomized order.
    MVP: Simulates shuffling with random delay.
    
    Args:
        task_id: UUID of the task being processed
        simulate_failure: If True, raise an exception to simulate failure
        
    Returns:
        Dict with mock shuffle results
        
    Raises:
        Exception: If simulate_failure is True
    """
    delay = random.uniform(3.0, 5.0)
    await asyncio.sleep(delay)

    if simulate_failure:
        raise Exception("Simulated failure in shuffle stage")

    return {
        "variants_generated": 0,  # MVP: no actual variants
        "shuffle_seed": random.randint(1000, 9999),
        "duration_ms": int(delay * 1000),
        "stage": "shuffle",
        "status": "completed"
    }


async def render_docx(
    task_id: str,
    simulate_failure: bool = False,
    db: AsyncSession | None = None,
) -> dict[str, Any]:
    """
    Mock stage 5: Export final documents as DOCX files.
    
    In production: Generate DOCX files for each variant with proper formatting.
    MVP: Simulates rendering with random delay.
    
    Args:
        task_id: UUID of the task being processed
        simulate_failure: If True, raise an exception to simulate failure
        
    Returns:
        Dict with mock render results
        
    Raises:
        Exception: If simulate_failure is True
    """
    delay = random.uniform(3.0, 5.0)
    await asyncio.sleep(delay)

    if simulate_failure:
        raise Exception("Simulated failure in render_docx stage")

    return {
        "files_created": 0,  # MVP: no actual files
        "total_pages": 0,
        "duration_ms": int(delay * 1000),
        "stage": "render_docx",
        "status": "completed"
    }
