"""Utility functions for artifact file path generation.

This module provides helper functions for generating filesystem-safe
directory names and artifact file paths following the kebab-case pattern.

Pattern: exams/<user_id>/<exam-name-kebab-case>/<filename>
Example: exams/550e8400-e29b-41d4-a716-446655440000/mathematics-final-2026/question-1.png
"""

import re
import unicodedata
from uuid import UUID


def to_kebab_case(text: str, max_length: int = 100) -> str:
    """
    Convert text to kebab-case for filesystem-safe directory names.
    
    This function normalizes unicode characters, removes special characters,
    and converts spaces to hyphens to create filesystem-safe names.
    
    Examples:
        >>> to_kebab_case("Mathematics Final 2026")
        "mathematics-final-2026"
        >>> to_kebab_case("AP® Physics - C")
        "ap-physics-c"
        >>> to_kebab_case("Grade 10 Exam (Advanced)")
        "grade-10-exam-advanced"
        >>> to_kebab_case("")
        "untitled"
    
    Args:
        text: Input text (typically exam name)
        max_length: Maximum length for output (default 100)
        
    Returns:
        Kebab-case string safe for filesystem use, or "untitled" if empty
    """
    # Normalize unicode (remove accents: café → cafe)
    text = unicodedata.normalize('NFKD', text)
    text = text.encode('ascii', 'ignore').decode('ascii')

    # Lowercase
    text = text.lower()

    # Replace non-alphanumeric with hyphens
    text = re.sub(r'[^a-z0-9]+', '-', text)

    # Remove leading/trailing hyphens
    text = text.strip('-')

    # Collapse multiple hyphens
    text = re.sub(r'-+', '-', text)

    # Truncate to max length at word boundary
    if len(text) > max_length:
        text = text[:max_length].rsplit('-', 1)[0]

    return text or 'untitled'  # Fallback for empty result


def generate_artifact_path(
    user_id: UUID,
    exam_name: str,
    filename: str
) -> str:
    """
    Generate relative artifact file path from storage root.
    
    Follows the pattern: exams/<user_id>/<exam-name-kebab-case>/<filename>
    
    Example:
        >>> import uuid
        >>> user_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440000')
        >>> generate_artifact_path(user_id, "Mathematics Final 2026", "question-1.png")
        "exams/550e8400-e29b-41d4-a716-446655440000/mathematics-final-2026/question-1.png"
    
    Args:
        user_id: User's UUID
        exam_name: Exam name to convert to kebab-case
        filename: Artifact filename (preserved as-is)
        
    Returns:
        Relative path string from storage root
    """
    exam_slug = to_kebab_case(exam_name)
    return f"exams/{user_id}/{exam_slug}/{filename}"


def generate_exam_directory(user_id: UUID, exam_name: str) -> str:
    """
    Generate exam directory path without filename.
    
    Useful for creating directories or listing exam artifacts.
    
    Example:
        >>> import uuid
        >>> user_id = uuid.UUID('550e8400-e29b-41d4-a716-446655440000')
        >>> generate_exam_directory(user_id, "AP Physics C")
        "exams/550e8400-e29b-41d4-a716-446655440000/ap-physics-c"
    
    Args:
        user_id: User's UUID
        exam_name: Exam name to convert to kebab-case
        
    Returns:
        Directory path string (no trailing slash)
    """
    exam_slug = to_kebab_case(exam_name)
    return f"exams/{user_id}/{exam_slug}"
