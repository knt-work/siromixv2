"""
Mock pipeline stages for MVP (T047).

Each stage simulates processing with sleep delays and returns structured data.
Future versions will implement actual DOCX parsing and AI-powered transformations.
"""

import asyncio
import random
from typing import Dict, Any


async def extract_docx(
    task_id: str,
    simulate_failure: bool = False
) -> Dict[str, Any]:
    """
    Mock stage 1: Extract document structure from DOCX.
    
    In production: Parse DOCX file, extract questions/options/answers.
    MVP: Simulates extraction with random delay.
    
    Args:
        task_id: UUID of the task being processed
        simulate_failure: If True, raise an exception to simulate failure
        
    Returns:
        Dict with mock extraction results
        
    Raises:
        Exception: If simulate_failure is True
    """
    # Simulate processing time (3-5 seconds)
    delay = random.uniform(3.0, 5.0)
    await asyncio.sleep(delay)
    
    if simulate_failure:
        raise Exception("Simulated failure in extract_docx stage")
    
    # Mock extraction result
    return {
        "blocks_extracted": 0,  # MVP: no actual extraction
        "duration_ms": int(delay * 1000),
        "stage": "extract_docx",
        "status": "completed"
    }


async def ai_understanding(
    task_id: str,
    simulate_failure: bool = False
) -> Dict[str, Any]:
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
    simulate_failure: bool = False
) -> Dict[str, Any]:
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
    simulate_failure: bool = False
) -> Dict[str, Any]:
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
    simulate_failure: bool = False
) -> Dict[str, Any]:
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
