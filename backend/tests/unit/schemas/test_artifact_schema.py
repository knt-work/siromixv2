"""Unit tests for Artifact Pydantic schemas.

Feature: 003-exams-artifacts-model
User Story 3: Artifact Tracking
"""

import pytest
from uuid import uuid4
from datetime import datetime, timezone
from pydantic import ValidationError

from app.models.artifact import ArtifactType
from app.schemas.artifact import ArtifactCreate, ArtifactResponse, ArtifactListResponse, ArtifactsByType


def test_artifact_create_valid():
    """T052: Test ArtifactCreate schema validation with all required fields."""
    exam_id = uuid4()
    task_id = uuid4()
    
    data = {
        "exam_id": exam_id,
        "task_id": task_id,
        "artifact_type": "dij",
        "file_name": "math-exam.dij.pdf",
        "file_path": "exams/550e8400-e29b-41d4-a716-446655440000/math-exam/math-exam.dij.pdf",
        "mime_type": "application/pdf"
    }
    
    artifact = ArtifactCreate(**data)
    
    assert artifact.exam_id == exam_id
    assert artifact.task_id == task_id
    assert artifact.artifact_type == ArtifactType.DIJ
    assert artifact.file_name == "math-exam.dij.pdf"
    assert artifact.file_path == "exams/550e8400-e29b-41d4-a716-446655440000/math-exam/math-exam.dij.pdf"
    assert artifact.mime_type == "application/pdf"


def test_artifact_create_path_validation():
    """T053: Test ArtifactCreate schema file_path validation (must start with 'exams/')."""
    exam_id = uuid4()
    
    # Invalid: path doesn't start with 'exams/'
    invalid_data = {
        "exam_id": exam_id,
        "artifact_type": "dij",
        "file_name": "test.pdf",
        "file_path": "uploads/test.pdf",  # Wrong prefix
        "mime_type": "application/pdf"
    }
    
    with pytest.raises(ValidationError) as exc_info:
        ArtifactCreate(**invalid_data)
    
    assert "file_path must start with 'exams/'" in str(exc_info.value)
    
    # Invalid: path contains double slashes
    invalid_data_double_slash = {
        "exam_id": exam_id,
        "artifact_type": "dij",
        "file_name": "test.pdf",
        "file_path": "exams/user//test.pdf",  # Double slash
        "mime_type": "application/pdf"
    }
    
    with pytest.raises(ValidationError) as exc_info:
        ArtifactCreate(**invalid_data_double_slash)
    
    assert "cannot contain double slashes" in str(exc_info.value)
    
    # Invalid: path ends with slash
    invalid_data_trailing_slash = {
        "exam_id": exam_id,
        "artifact_type": "dij",
        "file_name": "test.pdf",
        "file_path": "exams/user/test/",  # Trailing slash
        "mime_type": "application/pdf"
    }
    
    with pytest.raises(ValidationError) as exc_info:
        ArtifactCreate(**invalid_data_trailing_slash)
    
    assert "end with slash" in str(exc_info.value)
    
    # Valid: proper path format
    valid_data = {
        "exam_id": exam_id,
        "artifact_type": "dij",
        "file_name": "test.pdf",
        "file_path": "exams/user123/exam-slug/test.pdf",
        "mime_type": "application/pdf"
    }
    
    artifact = ArtifactCreate(**valid_data)
    assert artifact.file_path == "exams/user123/exam-slug/test.pdf"


def test_artifact_create_no_task_id():
    """T054: Test ArtifactCreate schema without task_id (optional field)."""
    exam_id = uuid4()
    
    data = {
        "exam_id": exam_id,
        # task_id omitted (optional)
        "artifact_type": "question_preview",
        "file_name": "question-1.png",
        "file_path": "exams/user/exam/question-1.png",
        "mime_type": "image/png"
    }
    
    artifact = ArtifactCreate(**data)
    
    assert artifact.exam_id == exam_id
    assert artifact.task_id is None
    assert artifact.artifact_type == ArtifactType.QUESTION_PREVIEW
    assert artifact.file_name == "question-1.png"


def test_artifact_response_from_orm():
    """T055: Test ArtifactResponse schema ORM conversion."""
    # Simulate ORM model data
    orm_data = {
        'artifact_id': 42,
        'exam_id': uuid4(),
        'task_id': uuid4(),
        'artifact_type': ArtifactType.DIJ,
        'file_name': 'math-exam.dij.pdf',
        'file_path': 'exams/user/exam/math-exam.dij.pdf',
        'mime_type': 'application/pdf',
        'created_at': datetime.now(timezone.utc)
    }
    
    # Convert using from_attributes=True
    response = ArtifactResponse.model_validate(orm_data)
    
    assert response.artifact_id == 42
    assert response.exam_id == orm_data['exam_id']
    assert response.task_id == orm_data['task_id']
    assert response.artifact_type == ArtifactType.DIJ
    assert response.file_name == 'math-exam.dij.pdf'
    assert response.file_path == 'exams/user/exam/math-exam.dij.pdf'
    assert response.mime_type == 'application/pdf'
    assert response.created_at == orm_data['created_at']


def test_artifact_list_response():
    """Test ArtifactListResponse schema for pagination."""
    exam_id = uuid4()
    
    artifact_data = {
        'artifact_id': 1,
        'exam_id': exam_id,
        'task_id': None,
        'artifact_type': ArtifactType.DIJ,
        'file_name': 'test.pdf',
        'file_path': 'exams/user/exam/test.pdf',
        'mime_type': 'application/pdf',
        'created_at': datetime.now(timezone.utc)
    }
    
    response = ArtifactResponse.model_validate(artifact_data)
    
    list_response = ArtifactListResponse(
        items=[response],
        total=100,
        page=1,
        page_size=20
    )
    
    assert len(list_response.items) == 1
    assert list_response.total == 100
    assert list_response.page == 1
    assert list_response.page_size == 20


def test_artifacts_by_type():
    """Test ArtifactsByType schema for grouped responses."""
    exam_id = uuid4()
    
    dij_artifact = ArtifactResponse.model_validate({
        'artifact_id': 1,
        'exam_id': exam_id,
        'task_id': None,
        'artifact_type': ArtifactType.DIJ,
        'file_name': 'exam.dij.pdf',
        'file_path': 'exams/user/exam/exam.dij.pdf',
        'mime_type': 'application/pdf',
        'created_at': datetime.now(timezone.utc)
    })
    
    preview_artifact = ArtifactResponse.model_validate({
        'artifact_id': 2,
        'exam_id': exam_id,
        'task_id': None,
        'artifact_type': ArtifactType.QUESTION_PREVIEW,
        'file_name': 'question-1.png',
        'file_path': 'exams/user/exam/question-1.png',
        'mime_type': 'image/png',
        'created_at': datetime.now(timezone.utc)
    })
    
    grouped = ArtifactsByType(
        exam_id=exam_id,
        artifacts_by_type={
            ArtifactType.DIJ: [dij_artifact],
            ArtifactType.QUESTION_PREVIEW: [preview_artifact]
        }
    )
    
    assert grouped.exam_id == exam_id
    assert len(grouped.artifacts_by_type) == 2
    assert len(grouped.artifacts_by_type[ArtifactType.DIJ]) == 1
    assert len(grouped.artifacts_by_type[ArtifactType.QUESTION_PREVIEW]) == 1
