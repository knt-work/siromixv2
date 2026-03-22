"""
Generate test fixture DOCX files for Feature 006 (DOCX Extraction Pipeline)

This script creates test DOCX files with various content types:
- simple_text.docx: Plain and formatted text paragraphs
- with_tables.docx: Tables with simple and merged cells
- with_images.docx: Embedded images (PNG, JPEG)
- with_math.docx: Math equations in OMML format

Run this script to regenerate fixtures:
    python backend/tests/fixtures/generate_fixtures.py
"""

from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from pathlib import Path
from PIL import Image
import io


def create_simple_text_fixture():
    """Create simple_text.docx with 5 paragraphs (plain and formatted)"""
    doc = Document()
    
    # Paragraph 1: Plain text
    p1 = doc.add_paragraph("This is a simple paragraph with plain text.")
    
    # Paragraph 2: Bold and italic
    p2 = doc.add_paragraph()
    p2.add_run("This paragraph has ").font.name = "Calibri"
    run_bold = p2.add_run("bold text")
    run_bold.bold = True
    run_bold.font.name = "Calibri"
    p2.add_run(" and ").font.name = "Calibri"
    run_italic = p2.add_run("italic text")
    run_italic.italic = True
    run_italic.font.name = "Calibri"
    p2.add_run(".").font.name = "Calibri"
    
    # Paragraph 3: Colored and sized text
    p3 = doc.add_paragraph()
    run_colored = p3.add_run("This text is colored red")
    run_colored.font.color.rgb = RGBColor(255, 0, 0)
    run_colored.font.size = Pt(14)
    run_colored.font.name = "Arial"
    p3.add_run(" and this is normal.").font.name = "Calibri"
    
    # Paragraph 4: Underlined text
    p4 = doc.add_paragraph()
    p4.add_run("This paragraph contains ").font.name = "Calibri"
    run_underline = p4.add_run("underlined text")
    run_underline.underline = True
    run_underline.font.name = "Calibri"
    p4.add_run(".").font.name = "Calibri"
    
    # Paragraph 5: Centered alignment with style
    p5 = doc.add_paragraph("This is a centered paragraph.")
    p5.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p5.style = 'Heading 1'
    
    # Empty paragraph (should be filtered)
    doc.add_paragraph("")
    
    output_path = Path(__file__).parent / "sample_exams" / "simple_text.docx"
    doc.save(output_path)
    print(f"✓ Created {output_path}")


def create_with_tables_fixture():
    """Create with_tables.docx with 2 tables (simple and merged cells)"""
    doc = Document()
    
    doc.add_paragraph("Exam Answer Key")
    
    # Table 1: Simple 3x3 table
    doc.add_paragraph("Table 1: Simple grade table")
    table1 = doc.add_table(rows=4, cols=3)
    # Use built-in table style or leave default
    try:
        table1.style = 'Table Grid'
    except KeyError:
        pass  # Use default style if 'Table Grid' not available
    
    # Header row
    header_cells = table1.rows[0].cells
    header_cells[0].text = "Student"
    header_cells[1].text = "Score"
    header_cells[2].text = "Grade"
    for cell in header_cells:
        cell.paragraphs[0].runs[0].bold = True
    
    # Data rows
    data = [
        ("Alice", "95", "A"),
        ("Bob", "87", "B"),
        ("Charlie", "92", "A")
    ]
    for i, (name, score, grade) in enumerate(data, 1):
        row = table1.rows[i]
        row.cells[0].text = name
        row.cells[1].text = score
        row.cells[2].text = grade
    
    doc.add_paragraph()
    
    # Table 2: Table with merged cells
    doc.add_paragraph("Table 2: Rubric with merged cells")
    table2 = doc.add_table(rows=3, cols=3)
    # Use built-in table style or leave default
    try:
        table2.style = 'Table Grid'
    except KeyError:
        pass  # Use default style if 'Table Grid' not available
    
    # Row 1: Merged header
    table2.rows[0].cells[0].text = "Criteria"
    table2.rows[0].cells[1].merge(table2.rows[0].cells[2])
    table2.rows[0].cells[1].text = "Points (Total: 100)"
    
    # Row 2
    table2.rows[1].cells[0].text = "Question 1"
    table2.rows[1].cells[1].text = "Correctness"
    table2.rows[1].cells[2].text = "50"
    
    # Row 3
    table2.rows[2].cells[0].text = "Question 2"
    table2.rows[2].cells[1].text = "Explanation"
    table2.rows[2].cells[2].text = "50"
    
    output_path = Path(__file__).parent / "sample_exams" / "with_tables.docx"
    doc.save(output_path)
    print(f"✓ Created {output_path}")


def create_with_images_fixture():
    """Create with_images.docx with 3 embedded images (PNG, JPEG)"""
    doc = Document()
    
    doc.add_paragraph("Biology Exam - Cell Division Diagrams")
    
    # Create sample PNG image
    png_img = Image.new('RGB', (200, 100), color='blue')
    png_buffer = io.BytesIO()
    png_img.save(png_buffer, format='PNG')
    png_buffer.seek(0)
    
    # Create sample JPEG image
    jpeg_img = Image.new('RGB', (200, 100), color='red')
    jpeg_buffer = io.BytesIO()
    jpeg_img.save(jpeg_buffer, format='JPEG')
    jpeg_buffer.seek(0)
    
    # Create another PNG
    png2_img = Image.new('RGB', (200, 100), color='green')
    png2_buffer = io.BytesIO()
    png2_img.save(png2_buffer, format='PNG')
    png2_buffer.seek(0)
    
    # Add images to document
    doc.add_paragraph("Figure 1: Cell structure diagram (PNG)")
    doc.add_picture(png_buffer, width=Inches(2.5))
    
    doc.add_paragraph("Figure 2: Mitosis phases (JPEG)")
    doc.add_picture(jpeg_buffer, width=Inches(2.5))
    
    doc.add_paragraph("Figure 3: DNA structure (PNG)")
    doc.add_picture(png2_buffer, width=Inches(2.5))
    
    output_path = Path(__file__).parent / "sample_exams" / "with_images.docx"
    doc.save(output_path)
    print(f"✓ Created {output_path}")


def create_with_math_fixture():
    """Create with_math.docx with 4 OMML equations
    
    Note: python-docx doesn't natively support adding OMML math equations,
    so we create a document with placeholders that explain the limitation.
    Manual creation in Microsoft Word is recommended for realistic test fixtures.
    """
    doc = Document()
    
    doc.add_paragraph("Physics Exam - Mathematical Equations")
    
    # Note: python-docx doesn't support creating OMML math directly
    # These are text placeholders - for real OMML, create manually in Word
    doc.add_paragraph("1. Quadratic formula (placeholder): x = (-b ± √(b² - 4ac)) / 2a")
    doc.add_paragraph("2. Pythagorean theorem (placeholder): a² + b² = c²")
    doc.add_paragraph("3. Derivative (placeholder): d/dx(x²) = 2x")
    doc.add_paragraph("4. Integral (placeholder): ∫ x dx = x²/2 + C")
    
    doc.add_paragraph("\nNOTE: This fixture contains text placeholders. For real OMML math equations, "
                     "open this file in Microsoft Word and insert equations using Insert > Equation.")
    
    output_path = Path(__file__).parent / "sample_exams" / "with_math.docx"
    doc.save(output_path)
    print(f"✓ Created {output_path} (contains placeholders - manually add OMML in Word)")


if __name__ == "__main__":
    print("Generating test fixture DOCX files...")
    create_simple_text_fixture()
    create_with_tables_fixture()
    create_with_images_fixture()
    create_with_math_fixture()
    print("\n✓ All fixtures generated successfully!")
    print("\nNOTE: with_math.docx requires manual OMML equation insertion in Microsoft Word")
    print("      for realistic testing. Open the file and use Insert > Equation.")
