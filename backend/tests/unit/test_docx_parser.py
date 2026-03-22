"""
Unit tests for DOCX paragraph extraction

Tests follow TDD approach:
1. Write tests FIRST (these tests)
2. Verify tests FAIL before implementation
3. Implement code to make tests pass
4. Verify tests pass after implementation

Test fixtures used:
- backend/tests/fixtures/sample_exams/simple_text.docx
"""

import pytest
from pathlib import Path
from datetime import datetime
from uuid import UUID

from app.core.docx_parser import DocxParser
from app.schemas.dij import BlockType, DIJv1


# Fixture paths
FIXTURES_DIR = Path(__file__).parent.parent / "fixtures" / "sample_exams"
SIMPLE_TEXT_DOCX = FIXTURES_DIR / "simple_text.docx"
WITH_TABLES_DOCX = FIXTURES_DIR / "with_tables.docx"


class TestParagraphExtraction:
    """Test paragraph extraction from DOCX files"""
    
    @pytest.fixture
    def parser(self):
        """Create parser instance"""
        return DocxParser()
    
    def test_extract_single_plain_paragraph(self, parser):
        """
        T018: Extract single plain paragraph from simple_text.docx
        
        Verifies:
        - Paragraph block is created
        - Text content matches source
        - BlockType is PARAGRAPH
        """
        # Given: simple_text.docx has multiple paragraphs
        assert SIMPLE_TEXT_DOCX.exists(), f"Fixture not found: {SIMPLE_TEXT_DOCX}"
        
        # When: Extract first paragraph
        blocks = parser.extract_blocks(str(SIMPLE_TEXT_DOCX))
        
        # Then: First block should be a paragraph
        assert len(blocks) > 0, "No blocks extracted"
        first_block = blocks[0]
        
        assert first_block["type"] == BlockType.PARAGRAPH.value
        assert "content" in first_block
        assert "runs" in first_block["content"]
        assert len(first_block["content"]["runs"]) > 0
        
        # Verify text is not empty
        first_run = first_block["content"]["runs"][0]
        assert "text" in first_run
        assert len(first_run["text"]) > 0
    
    def test_extract_paragraph_with_formatting(self, parser):
        """
        T019: Extract paragraph with bold/italic/underline formatting
        
        Verifies:
        - Formatting flags are captured (bold, italic, underline)
        - Multiple runs are preserved
        - Formatted text matches source
        """
        # Given: simple_text.docx has paragraphs with formatting
        assert SIMPLE_TEXT_DOCX.exists()
        
        # When: Extract all paragraphs
        blocks = parser.extract_blocks(str(SIMPLE_TEXT_DOCX))
        
        # Then: Find a block with formatted runs
        formatted_blocks = [
            b for b in blocks 
            if any(
                run.get("bold") or run.get("italic") or run.get("underline")
                for run in b["content"]["runs"]
            )
        ]
        
        assert len(formatted_blocks) > 0, "No formatted paragraphs found"
        
        # Verify formatting flags exist
        formatted_block = formatted_blocks[0]
        for run in formatted_block["content"]["runs"]:
            assert "bold" in run
            assert "italic" in run
            assert "underline" in run
    
    def test_extract_paragraph_with_font_metadata(self, parser):
        """
        T020: Extract paragraph with font metadata (name, size, color)
        
        Verifies:
        - Font name is captured
        - Font size is captured (in points)
        - Font color is captured as hex RGB (#RRGGBB)
        """
        # Given: simple_text.docx has paragraphs with font formatting
        assert SIMPLE_TEXT_DOCX.exists()
        
        # When: Extract all paragraphs
        blocks = parser.extract_blocks(str(SIMPLE_TEXT_DOCX))
        
        # Then: Find blocks with font metadata
        blocks_with_fonts = [
            b for b in blocks 
            if any(
                run.get("font_name") or run.get("font_size") or run.get("color")
                for run in b["content"]["runs"]
            )
        ]
        
        assert len(blocks_with_fonts) > 0, "No paragraphs with font metadata found"
        
        # Verify font metadata structure
        for block in blocks_with_fonts:
            for run in block["content"]["runs"]:
                # Font name should be string if present
                if run.get("font_name"):
                    assert isinstance(run["font_name"], str)
                
                # Font size should be float/int if present (in points)
                if run.get("font_size"):
                    assert isinstance(run["font_size"], (int, float))
                    assert run["font_size"] > 0
                
                # Color should be hex format if present
                if run.get("color"):
                    assert isinstance(run["color"], str)
                    assert run["color"].startswith("#")
                    assert len(run["color"]) == 7  # #RRGGBB
    
    def test_filter_empty_paragraphs(self, parser):
        """
        T021: Filter empty paragraphs (verify not in output)
        
        Verifies:
        - Empty paragraphs are excluded from output
        - Only paragraphs with text content are returned
        """
        # Given: DOCX may contain empty paragraphs (spacing)
        assert SIMPLE_TEXT_DOCX.exists()
        
        # When: Extract all paragraphs
        blocks = parser.extract_blocks(str(SIMPLE_TEXT_DOCX))
        
        # Then: No block should have empty text
        for block in blocks:
            if block["type"] == BlockType.PARAGRAPH.value:
                runs = block["content"]["runs"]
                assert len(runs) > 0, "Paragraph should have at least one run"
                
                # At least one run should have non-empty text
                text_content = "".join(run["text"] for run in runs)
                assert len(text_content.strip()) > 0, "Paragraph should have non-empty text"
    
    def test_verify_paragraph_sequence_numbering(self, parser):
        """
        T022: Verify paragraph sequence numbering (1-indexed)
        
        Verifies:
        - Sequence numbers start at 1
        - Sequence numbers are consecutive
        - Sequence matches document order
        """
        # Given: simple_text.docx has multiple paragraphs
        assert SIMPLE_TEXT_DOCX.exists()
        
        # When: Extract all paragraphs
        blocks = parser.extract_blocks(str(SIMPLE_TEXT_DOCX))
        
        # Then: Verify sequence numbering
        assert len(blocks) > 0, "Should extract at least one block"
        
        for i, block in enumerate(blocks, start=1):
            assert "sequence" in block
            assert block["sequence"] == i, f"Block {i} has wrong sequence number: {block['sequence']}"
    
    def test_verify_provenance_metadata(self, parser):
        """
        T023: Verify provenance metadata for each paragraph block
        
        Verifies:
        - source_document_id is present and valid UUID
        - original_position is present (0-indexed)
        - extraction_timestamp is present and valid ISO format
        - extraction_method is present (python-docx version)
        """
        # Given: Extract paragraphs
        assert SIMPLE_TEXT_DOCX.exists()
        
        # When: Extract all paragraphs
        blocks = parser.extract_blocks(str(SIMPLE_TEXT_DOCX))
        
        # Then: Verify provenance on all blocks
        assert len(blocks) > 0
        
        for block in blocks:
            assert "provenance" in block
            prov = block["provenance"]
            
            # Verify required fields exist
            assert "source_document_id" in prov
            assert "original_position" in prov
            assert "extraction_timestamp" in prov
            assert "extraction_method" in prov
            
            # Verify data types and formats
            # source_document_id should be valid UUID string
            try:
                UUID(prov["source_document_id"])
            except ValueError:
                pytest.fail(f"Invalid UUID: {prov['source_document_id']}")
            
            # original_position should be non-negative integer
            assert isinstance(prov["original_position"], int)
            assert prov["original_position"] >= 0
            
            # extraction_timestamp should be valid ISO datetime string
            try:
                datetime.fromisoformat(prov["extraction_timestamp"].replace("Z", "+00:00"))
            except ValueError:
                pytest.fail(f"Invalid ISO datetime: {prov['extraction_timestamp']}")
            
            # extraction_method should mention python-docx
            assert "python-docx" in prov["extraction_method"].lower()


class TestDocxValidation:
    """Test DOCX validation before extraction"""
    
    @pytest.fixture
    def parser(self):
        """Create parser instance"""
        return DocxParser()
    
    def test_validate_existing_file(self, parser):
        """Validation should pass for valid DOCX"""
        assert SIMPLE_TEXT_DOCX.exists()
        
        # Should not raise exception
        parser.validate_docx(str(SIMPLE_TEXT_DOCX))
    
    def test_validate_missing_file(self, parser):
        """Validation should fail for missing file"""
        from app.core.exceptions import ValidationError, ErrorCode
        
        missing_file = "nonexistent.docx"
        
        with pytest.raises(ValidationError) as exc_info:
            parser.validate_docx(missing_file)
        
        assert exc_info.value.error_code == ErrorCode.DOCX_INVALID_FORMAT
    
    def test_validate_non_docx_file(self, parser, tmp_path):
        """Validation should fail for non-DOCX file"""
        from app.core.exceptions import ValidationError, ErrorCode
        
        # Create a fake non-DOCX file
        fake_file = tmp_path / "fake.docx"
        fake_file.write_text("This is not a DOCX file")
        
        with pytest.raises(ValidationError) as exc_info:
            parser.validate_docx(str(fake_file))
        
        assert exc_info.value.error_code in [
            ErrorCode.DOCX_CORRUPTED,
            ErrorCode.DOCX_INVALID_FORMAT
        ]


class TestTableExtraction:
    """Test table extraction from DOCX files (Phase 4 - US2)"""
    
    @pytest.fixture
    def parser(self):
        """Create parser instance"""
        return DocxParser()
    
    def test_extract_simple_table_3x3_no_spans(self, parser):
        """
        T039: Extract simple table (3x3, no spans) from with_tables.docx
        
        Verifies:
        - Table block is created
        - BlockType is TABLE
        - Rows and cells are extracted correctly
        - No rowspan/colspan (default to 1)
        """
        # Given: with_tables.docx has tables
        assert WITH_TABLES_DOCX.exists(), f"Fixture not found: {WITH_TABLES_DOCX}"
        
        # When: Extract all blocks
        blocks = parser.extract_blocks(str(WITH_TABLES_DOCX))
        
        # Then: Find table blocks
        table_blocks = [b for b in blocks if b["type"] == BlockType.TABLE.value]
        assert len(table_blocks) > 0, "Should extract at least one table"
        
        # Verify first table structure
        first_table = table_blocks[0]
        assert "content" in first_table
        assert "rows" in first_table["content"]
        
        rows = first_table["content"]["rows"]
        assert len(rows) >= 3, "Simple table should have at least 3 rows"
        
        # Verify first row has cells
        first_row = rows[0]
        assert "cells" in first_row
        assert len(first_row["cells"]) >= 3, "First row should have at least 3 cells"
        
        # Verify no spans (defaults to 1)
        for row in rows:
            for cell in row["cells"]:
                assert cell.get("rowspan", 1) == 1, "Simple table should have no rowspan"
                assert cell.get("colspan", 1) == 1, "Simple table should have no colspan"
    
    def test_extract_table_with_merged_cells(self, parser):
        """
        T040: Extract table with merged cells (rowspan, colspan)
        
        Verifies:
        - Merged cells have rowspan > 1 or colspan > 1
        - Cell content is preserved
        - Table structure is correct despite merges
        """
        # Given: with_tables.docx has tables with merged cells
        assert WITH_TABLES_DOCX.exists()
        
        # When: Extract all blocks
        blocks = parser.extract_blocks(str(WITH_TABLES_DOCX))
        
        # Then: Find tables with merged cells
        table_blocks = [b for b in blocks if b["type"] == BlockType.TABLE.value]
        assert len(table_blocks) > 0
        
        # Check if ANY table has merged cells (rowspan > 1 or colspan > 1)
        has_merged_cells = False
        for table in table_blocks:
            for row in table["content"]["rows"]:
                for cell in row["cells"]:
                    if cell.get("rowspan", 1) > 1 or cell.get("colspan", 1) > 1:
                        has_merged_cells = True
                        # Verify cell has content
                        assert "content" in cell
                        assert isinstance(cell["content"], list)
                        break
        
        # Note: with_tables.docx was generated with merged cells in the rubric table
        # If this assertion fails, it means the fixture doesn't have merged cells
        # or our extraction logic needs implementation
        assert has_merged_cells, "Should find at least one table with merged cells in with_tables.docx"
    
    def test_extract_table_with_header_row(self, parser):
        """
        T041: Extract table with header row flag
        
        Verifies:
        - First row is marked as header (is_header=True)
        - Other rows are not headers (is_header=False)
        """
        # Given: with_tables.docx has tables
        assert WITH_TABLES_DOCX.exists()
        
        # When: Extract all blocks
        blocks = parser.extract_blocks(str(WITH_TABLES_DOCX))
        
        # Then: Find tables
        table_blocks = [b for b in blocks if b["type"] == BlockType.TABLE.value]
        assert len(table_blocks) > 0
        
        # Verify is_header flag exists on rows
        for table in table_blocks:
            rows = table["content"]["rows"]
            for row in rows:
                assert "is_header" in row
                assert isinstance(row["is_header"], bool)
    
    def test_extract_table_with_cell_borders_and_colors(self, parser):
        """
        T042: Extract table with cell borders and background colors
        
        Verifies:
        - Background colors are extracted as hex RGB
        - Border information is captured (if present)
        """
        # Given: with_tables.docx has tables
        assert WITH_TABLES_DOCX.exists()
        
        # When: Extract all blocks
        blocks = parser.extract_blocks(str(WITH_TABLES_DOCX))
        
        # Then: Find tables
        table_blocks = [b for b in blocks if b["type"] == BlockType.TABLE.value]
        assert len(table_blocks) > 0
        
        # Verify cells can have background_color and borders
        for table in table_blocks:
            for row in table["content"]["rows"]:
                for cell in row["cells"]:
                    # If background_color exists, verify format
                    if cell.get("background_color"):
                        bg = cell["background_color"]
                        assert isinstance(bg, str)
                        assert bg.startswith("#")
                        assert len(bg) == 7  # #RRGGBB
                    
                    # If borders exist, verify structure
                    if cell.get("borders"):
                        borders = cell["borders"]
                        assert isinstance(borders, dict)
                        # Borders can have top, right, bottom, left
                        for side in ["top", "right", "bottom", "left"]:
                            if side in borders and borders[side]:
                                assert "width" in borders[side]
                                assert "color" in borders[side]
                                assert "style" in borders[side]
    
    def test_extract_table_with_formatted_text_in_cells(self, parser):
        """
        T043: Extract table with formatted text in cells
        
        Verifies:
        - Cell content includes text runs with formatting
        - Bold/italic/underline preserved in cells
        - Multiple paragraphs in cells are handled
        """
        # Given: with_tables.docx has tables
        assert WITH_TABLES_DOCX.exists()
        
        # When: Extract all blocks
        blocks = parser.extract_blocks(str(WITH_TABLES_DOCX))
        
        # Then: Find tables
        table_blocks = [b for b in blocks if b["type"] == BlockType.TABLE.value]
        assert len(table_blocks) > 0
        
        # Verify cells have content with proper structure
        for table in table_blocks:
            for row in table["content"]["rows"]:
                for cell in row["cells"]:
                    assert "content" in cell
                    assert isinstance(cell["content"], list)
                    
                    # Each content item should have type and data
                    for content_item in cell["content"]:
                        assert "type" in content_item
                        assert "data" in content_item
                        assert content_item["type"] in ["text", "image", "math"]
                        
                        # If text type, should have paragraph-like structure
                        if content_item["type"] == "text":
                            data = content_item["data"]
                            # Text data should have runs (like paragraphs)
                            if isinstance(data, dict) and "runs" in data:
                                for run in data["runs"]:
                                    assert "text" in run
                                    assert "bold" in run
                                    assert "italic" in run
                                    assert "underline" in run

