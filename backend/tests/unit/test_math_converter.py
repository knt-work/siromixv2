"""
Unit tests for MathConverter (Phase 6 - US4)

Tests MUST be written FIRST and FAIL before implementation (TDD).

Test Coverage:
- T077: Extract OMML XML from document
- T078: Convert simple OMML equation to LaTeX
- T079: Convert complex nested OMML to LaTeX
- T080: Handle OMML conversion failure (preserve OMML, set conversion_failed=true)
- T081: Detect inline vs display-mode equations
"""

import pytest
from pathlib import Path

from app.core.math_converter import MathConverter


# Fixture paths
FIXTURES_DIR = Path(__file__).parent.parent / "fixtures" / "sample_exams"
WITH_MATH_DOCX = FIXTURES_DIR / "with_math.docx"


class TestMathConversion:
    """Test OMML to LaTeX conversion"""
    
    def test_extract_omml_xml_from_document(self):
        """T077: Extract OMML XML fragments from document"""
        converter = MathConverter()
        
        # Sample OMML XML (simple fraction: x/2)
        omml_fraction = '''
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
            <m:f>
                <m:num><m:r><m:t>x</m:t></m:r></m:num>
                <m:den><m:r><m:t>2</m:t></m:r></m:den>
            </m:f>
        </m:oMath>
        '''
        
        # Extract should preserve XML structure
        extracted = converter.extract_omml_elements(omml_fraction)
        assert len(extracted) == 1
        assert "oMath" in extracted[0]
        assert "x" in extracted[0]
        assert "2" in extracted[0]
    
    def test_convert_simple_omml_equation_to_latex(self):
        """T078: Convert simple OMML equation to LaTeX"""
        converter = MathConverter()
        
        # Simple fraction OMML: x/2 → \\frac{x}{2}
        omml_fraction = '''
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
            <m:f>
                <m:num><m:r><m:t>x</m:t></m:r></m:num>
                <m:den><m:r><m:t>2</m:t></m:r></m:den>
            </m:f>
        </m:oMath>
        '''
        
        result = converter.convert_omml_to_latex(omml_fraction)
        
        assert result["success"] is True
        assert result["latex"] is not None
        assert "frac" in result["latex"]  # Should contain LaTeX fraction
        assert "x" in result["latex"]
        assert "2" in result["latex"]
        assert result["omml"] == omml_fraction  # Original preserved
        assert result["conversion_failed"] is False
    
    def test_convert_complex_nested_omml_to_latex(self):
        """T079: Convert complex nested OMML with superscript and radicals"""
        converter = MathConverter()
        
        # Quadratic formula: x = (-b ± √(b²-4ac)) / 2a
        omml_quadratic = '''
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
            <m:r><m:t>x</m:t></m:r>
            <m:r><m:t>=</m:t></m:r>
            <m:f>
                <m:num>
                    <m:r><m:t>-b</m:t></m:r>
                    <m:r><m:t>±</m:t></m:r>
                    <m:rad>
                        <m:radPr/>
                        <m:deg/>
                        <m:e>
                            <m:sSup>
                                <m:e><m:r><m:t>b</m:t></m:r></m:e>
                                <m:sup><m:r><m:t>2</m:t></m:r></m:sup>
                            </m:sSup>
                            <m:r><m:t>-4ac</m:t></m:r>
                        </m:e>
                    </m:rad>
                </m:num>
                <m:den><m:r><m:t>2a</m:t></m:r></m:den>
            </m:f>
        </m:oMath>
        '''
        
        result = converter.convert_omml_to_latex(omml_quadratic)
        
        assert result["success"] is True
        assert result["latex"] is not None
        # Should contain LaTeX elements for fraction, superscript, radical
        latex = result["latex"]
        assert "frac" in latex or "/" in latex
        assert "sqrt" in latex or "²" in latex
        assert "pm" in latex or "±" in latex
    
    def test_handle_omml_conversion_failure_preserves_omml(self):
        """T080: Handle malformed/unsupported OMML gracefully"""
        converter = MathConverter()
        
        # Malformed OMML (missing closing tags)
        malformed_omml = '''
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
            <m:f>
                <m:num><m:r><m:t>x</m:t></m:r>
        '''
        
        result = converter.convert_omml_to_latex(malformed_omml)
        
        # Conversion should fail gracefully
        assert result["success"] is False
        assert result["conversion_failed"] is True
        assert result["latex"] is None
        assert result["omml"] == malformed_omml  # Original preserved
        assert result["conversion_error"] is not None  # Error message present
        assert isinstance(result["conversion_error"], str)
    
    def test_detect_inline_vs_display_mode_equations(self):
        """T081: Detect inline vs display-mode equations from context"""
        converter = MathConverter()
        
        # Inline math (typically smaller, within text)
        inline_omml = '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"><m:r><m:t>x=2</m:t></m:r></m:oMath>'
        
        # Display math (typically centered, larger)
        display_omml = '''
        <m:oMathPara xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
            <m:oMath>
                <m:f>
                    <m:num><m:r><m:t>x</m:t></m:r></m:num>
                    <m:den><m:r><m:t>2</m:t></m:r></m:den>
                </m:f>
            </m:oMath>
        </m:oMathPara>
        '''
        
        inline_result = converter.convert_omml_to_latex(inline_omml, is_display=False)
        display_result = converter.convert_omml_to_latex(display_omml, is_display=True)
        
        # LaTeX output may differ based on display mode
        # Inline: $...$  or \(...\)
        # Display: $$...$$ or \[...\] or equation environment
        assert inline_result["success"] is True
        assert display_result["success"] is True
        
        # Both should have LaTeX output
        assert inline_result["latex"] is not None
        assert display_result["latex"] is not None
    
    def test_convert_empty_omml_returns_empty_latex(self):
        """Edge case: Empty OMML should return empty LaTeX"""
        converter = MathConverter()
        
        empty_omml = '<m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math"></m:oMath>'
        
        result = converter.convert_omml_to_latex(empty_omml)
        
        # Should succeed but produce empty/minimal LaTeX
        assert result["success"] is True
        assert result["latex"] == "" or result["latex"] is None
        assert result["conversion_failed"] is False
    
    def test_convert_text_only_omml_to_latex(self):
        """Simple case: OMML containing only plain text"""
        converter = MathConverter()
        
        # OMML with just text (no operators)
        text_omml = '''
        <m:oMath xmlns:m="http://schemas.openxmlformats.org/officeDocument/2006/math">
            <m:r><m:t>E=mc²</m:t></m:r>
        </m:oMath>
        '''
        
        result = converter.convert_omml_to_latex(text_omml)
        
        assert result["success"] is True
        assert result["latex"] is not None
        assert "E" in result["latex"]
        assert "mc" in result["latex"]
