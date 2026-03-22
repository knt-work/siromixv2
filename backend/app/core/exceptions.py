"""
Extraction-specific exceptions for DOCX processing

Structured error handling for the DOCX extraction pipeline with:
- Standardized error codes for all failure modes
- User-friendly and technical error messages
- Complete exception context preservation
"""

from typing import Any
from enum import Enum


class ErrorCode(str, Enum):
    """Standardized error codes for extraction failures"""
    # File validation errors (4xx-style - client/input errors)
    DOCX_INVALID_FORMAT = "DOCX_INVALID_FORMAT"
    DOCX_CORRUPTED = "DOCX_CORRUPTED"
    DOCX_TOO_LARGE = "DOCX_TOO_LARGE"
    
    # Extraction runtime errors (5xx-style - processing errors)
    EXTRACTION_TIMEOUT = "EXTRACTION_TIMEOUT"
    OMML_CONVERSION_FAILED = "OMML_CONVERSION_FAILED"
    IMAGE_EXTRACTION_FAILED = "IMAGE_EXTRACTION_FAILED"
    
    # Infrastructure errors
    STORAGE_ERROR = "STORAGE_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    
    # Generic fallback
    UNKNOWN_ERROR = "UNKNOWN_ERROR"


# Error code metadata for user-friendly messages
ERROR_MESSAGES = {
    ErrorCode.DOCX_INVALID_FORMAT: "The uploaded file is not a valid DOCX document",
    ErrorCode.DOCX_CORRUPTED: "The DOCX file is corrupted and cannot be processed",
    ErrorCode.DOCX_TOO_LARGE: "The DOCX file exceeds the maximum size limit of 50MB",
    ErrorCode.EXTRACTION_TIMEOUT: "Document extraction timed out after 5 minutes",
    ErrorCode.OMML_CONVERSION_FAILED: "Failed to convert math equation to LaTeX format",
    ErrorCode.IMAGE_EXTRACTION_FAILED: "Failed to extract image from document",
    ErrorCode.STORAGE_ERROR: "Failed to store extracted content",
    ErrorCode.DATABASE_ERROR: "Database operation failed during extraction",
    ErrorCode.UNKNOWN_ERROR: "An unexpected error occurred during extraction",
}


class ExtractionError(Exception):
    """
    Base exception for all DOCX extraction failures
    
    Provides structured error information for:
    - API error responses (user_message)
    - Debugging/logging (technical_details, stack_trace)
    - Error categorization (error_code)
    - Exception chaining (original_exception)
    
    Example usage:
        try:
            parser.validate_docx(file_path)
        except ValueError as e:
            raise ExtractionError(
                error_code=ErrorCode.DOCX_INVALID_FORMAT,
                technical_details=f"Invalid ZIP structure: {file_path}",
                original_exception=e
            ) from e
    """
    
    def __init__(
        self,
        error_code: ErrorCode,
        user_message: str | None = None,
        technical_details: str | None = None,
        original_exception: Exception | None = None,
        stack_trace: str | None = None,
        **extra_context: Any
    ):
        """
        Initialize extraction error with structured context
        
        Args:
            error_code: Standardized error code from ErrorCode enum
            user_message: User-facing error message (defaults to ERROR_MESSAGES lookup)
            technical_details: Detailed technical context for debugging
            original_exception: Original exception if this is a wrapped error
            stack_trace: Full stack trace (auto-captured if not provided)
            **extra_context: Additional context (file_path, block_id, etc.)
        """
        self.error_code = error_code
        self.user_message = user_message or ERROR_MESSAGES.get(error_code, "An error occurred")
        self.technical_details = technical_details or str(original_exception) if original_exception else None
        self.original_exception = original_exception
        self.stack_trace = stack_trace
        self.extra_context = extra_context
        
        # Exception message shown in logs/tracebacks
        super().__init__(f"[{error_code.value}] {self.user_message}")
    
    def to_dict(self) -> dict[str, Any]:
        """
        Convert to dictionary for JSON serialization in API responses
        
        Returns user-safe error information (excludes stack traces and technical details)
        """
        return {
            "error_code": self.error_code.value,
            "message": self.user_message,
            **self.extra_context
        }
    
    def to_detailed_dict(self) -> dict[str, Any]:
        """
        Convert to detailed dictionary for logging/debugging
        
        Returns complete error context including technical details and stack traces
        """
        return {
            "error_code": self.error_code.value,
            "user_message": self.user_message,
            "technical_details": self.technical_details,
            "original_exception": str(self.original_exception) if self.original_exception else None,
            "original_exception_type": type(self.original_exception).__name__ if self.original_exception else None,
            "stack_trace": self.stack_trace,
            **self.extra_context
        }


# Convenience exception subclasses for common error categories
class ValidationError(ExtractionError):
    """File validation failures (invalid format, corrupted, too large)"""
    pass


class TimeoutError(ExtractionError):
    """Extraction timeout (5 minute limit exceeded)"""
    def __init__(self, **kwargs):
        super().__init__(error_code=ErrorCode.EXTRACTION_TIMEOUT, **kwargs)


class ConversionError(ExtractionError):
    """Content conversion failures (OMML to LaTeX, image formats)"""
    pass


class StorageError(ExtractionError):
    """Storage operation failures (S3/MinIO upload, database write)"""
    def __init__(self, **kwargs):
        super().__init__(error_code=ErrorCode.STORAGE_ERROR, **kwargs)
