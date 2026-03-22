"""
MathConverter - OMML to LaTeX conversion with failsafe preservation

Implements Phase 6 (US4) math equation extraction:
- Extract OMML (Office Math Markup Language) XML from documents
- Convert OMML to LaTeX representation
- Preserve original OMML on all conversions (failsafe)
- Handle conversion failures gracefully

Architecture: Two-phase approach
1. Parse OMML XML using lxml
2. Convert to LaTeX using pattern-based transformation
3. On failure: preserve OMML with conversion_failed=true

Success target: 90% LaTeX conversion rate (SC-006)
Constitution Principle V: Always preserve source OMML (provenance)
"""

from typing import Dict, List, Any
from lxml import etree
import re
import logging

logger = logging.getLogger(__name__)

# OMML namespace
OMML_NS = "http://schemas.openxmlformats.org/officeDocument/2006/math"
OMML_PREFIX = "{" + OMML_NS + "}"


class MathConverter:
    """Converts Office Math Markup Language (OMML) to LaTeX"""
    
    def __init__(self):
        """Initialize math converter"""
        self.omml_namespace = {"m": OMML_NS}
    
    def extract_omml_elements(self, xml_content: str) -> List[str]:
        """
        Extract OMML math elements from XML content
        
        Args:
            xml_content: XML string containing OMML elements
            
        Returns:
            List of OMML XML strings
        """
        try:
            root = etree.fromstring(xml_content.encode('utf-8'))
            
            # Check if root itself is oMath element
            if root.tag == f"{OMML_PREFIX}oMath":
                return [xml_content]
            
            # Otherwise, find all oMath elements within
            omml_elements = root.xpath('.//m:oMath', namespaces=self.omml_namespace)
            
            # Convert back to strings
            return [etree.tostring(elem, encoding='unicode') for elem in omml_elements]
            
        except Exception as e:
            logger.warning(f"Failed to extract OMML elements: {e}")
            return []
    
    def convert_omml_to_latex(
        self, 
        omml_xml: str, 
        is_display: bool = False
    ) -> Dict[str, Any]:
        """
        Convert OMML XML to LaTeX representation
        
        Args:
            omml_xml: OMML XML string
            is_display: True for display-mode equations (centered, large)
                       False for inline equations (within text)
        
        Returns:
            Dictionary with:
                - success: bool - True if conversion succeeded
                - latex: str | None - LaTeX representation (None if failed)
                - omml: str - Original OMML (always preserved)
                - conversion_failed: bool - True if conversion failed
                - conversion_error: str | None - Error message if failed
        """
        result = {
            "success": False,
            "latex": None,
            "omml": omml_xml,
            "conversion_failed": True,
            "conversion_error": None
        }
        
        try:
            # Parse OMML XML
            root = etree.fromstring(omml_xml.encode('utf-8'))
            
            # Convert OMML to LaTeX
            latex = self._convert_element(root)
            
            # Handle empty results
            if not latex or latex.strip() == "":
                result["success"] = True
                result["latex"] = ""
                result["conversion_failed"] = False
                return result
            
            # Add display mode delimiters if needed
            if is_display:
                latex = f"$${latex}$$"
            else:
                latex = f"${latex}$"
            
            result["success"] = True
            result["latex"] = latex
            result["conversion_failed"] = False
            result["conversion_error"] = None
            
        except etree.XMLSyntaxError as e:
            result["conversion_error"] = f"XML parsing error: {str(e)}"
            logger.warning(f"OMML XML parsing failed: {e}")
            
        except Exception as e:
            result["conversion_error"] = f"Conversion error: {str(e)}"
            logger.warning(f"OMML to LaTeX conversion failed: {e}")
        
        return result
    
    def _convert_element(self, element: etree._Element) -> str:
        """
        Convert OMML element to LaTeX recursively
        
        Args:
            element: lxml Element representing OMML node
            
        Returns:
            LaTeX string representation
        """
        tag = element.tag.replace(OMML_PREFIX, "")
        
        # Handle different OMML elements
        if tag == "oMath":
            # Root math element - process children
            return self._convert_children(element)
        
        elif tag == "oMathPara":
            # Display-mode math paragraph
            return self._convert_children(element)
        
        elif tag == "r":
            # Math run (text container)
            return self._convert_children(element)
        
        elif tag == "t":
            # Text element
            text = element.text or ""
            return self._escape_latex_text(text)
        
        elif tag == "f":
            # Fraction: \frac{numerator}{denominator}
            return self._convert_fraction(element)
        
        elif tag == "sSup":
            # Superscript: base^{sup}
            return self._convert_superscript(element)
        
        elif tag == "sSub":
            # Subscript: base_{sub}
            return self._convert_subscript(element)
        
        elif tag == "rad":
            # Radical (square root): \sqrt{content}
            return self._convert_radical(element)
        
        elif tag in ["num", "den", "e", "sup", "sub", "deg"]:
            # Container elements - process children
            return self._convert_children(element)
        
        elif tag in ["fPr", "radPr", "rPr"]:
            # Property elements - skip
            return ""
        
        else:
            # Unknown element - process children as fallback
            logger.debug(f"Unknown OMML element: {tag}")
            return self._convert_children(element)
    
    def _convert_children(self, element: etree._Element) -> str:
        """Convert all child elements and concatenate results"""
        result = ""
        for child in element:
            result += self._convert_element(child)
        return result
    
    def _convert_fraction(self, element: etree._Element) -> str:
        """Convert OMML fraction to LaTeX \\frac{num}{den}"""
        try:
            num_elem = element.find(f"{OMML_PREFIX}num", namespaces=self.omml_namespace)
            den_elem = element.find(f"{OMML_PREFIX}den", namespaces=self.omml_namespace)
            
            if num_elem is None or den_elem is None:
                return ""
            
            numerator = self._convert_element(num_elem)
            denominator = self._convert_element(den_elem)
            
            return f"\\frac{{{numerator}}}{{{denominator}}}"
        
        except Exception as e:
            logger.warning(f"Fraction conversion failed: {e}")
            return ""
    
    def _convert_superscript(self, element: etree._Element) -> str:
        """Convert OMML superscript to LaTeX base^{sup}"""
        try:
            base_elem = element.find(f"{OMML_PREFIX}e", namespaces=self.omml_namespace)
            sup_elem = element.find(f"{OMML_PREFIX}sup", namespaces=self.omml_namespace)
            
            if base_elem is None or sup_elem is None:
                return ""
            
            base = self._convert_element(base_elem)
            superscript = self._convert_element(sup_elem)
            
            return f"{base}^{{{superscript}}}"
        
        except Exception as e:
            logger.warning(f"Superscript conversion failed: {e}")
            return ""
    
    def _convert_subscript(self, element: etree._Element) -> str:
        """Convert OMML subscript to LaTeX base_{sub}"""
        try:
            base_elem = element.find(f"{OMML_PREFIX}e", namespaces=self.omml_namespace)
            sub_elem = element.find(f"{OMML_PREFIX}sub", namespaces=self.omml_namespace)
            
            if base_elem is None or sub_elem is None:
                return ""
            
            base = self._convert_element(base_elem)
            subscript = self._convert_element(sub_elem)
            
            return f"{base}_{{{subscript}}}"
        
        except Exception as e:
            logger.warning(f"Subscript conversion failed: {e}")
            return ""
    
    def _convert_radical(self, element: etree._Element) -> str:
        """Convert OMML radical to LaTeX \\sqrt{content}"""
        try:
            # Check for degree (nth root)
            deg_elem = element.find(f"{OMML_PREFIX}deg", namespaces=self.omml_namespace)
            e_elem = element.find(f"{OMML_PREFIX}e", namespaces=self.omml_namespace)
            
            if e_elem is None:
                return ""
            
            content = self._convert_element(e_elem)
            
            # nth root: \sqrt[n]{content}
            if deg_elem is not None and deg_elem.text:
                degree = self._convert_element(deg_elem)
                if degree:
                    return f"\\sqrt[{degree}]{{{content}}}"
            
            # Square root: \sqrt{content}
            return f"\\sqrt{{{content}}}"
        
        except Exception as e:
            logger.warning(f"Radical conversion failed: {e}")
            return ""
    
    def _escape_latex_text(self, text: str) -> str:
        """
        Escape special LaTeX characters and convert symbols
        
        Args:
            text: Raw text from OMML
            
        Returns:
            LaTeX-escaped text with converted symbols
        """
        # Symbol mappings (Unicode → LaTeX)
        symbol_map = {
            "±": "\\pm ",
            "∓": "\\mp ",
            "×": "\\times ",
            "÷": "\\div ",
            "∞": "\\infty ",
            "≠": "\\neq ",
            "≤": "\\leq ",
            "≥": "\\geq ",
            "∈": "\\in ",
            "∉": "\\notin ",
            "∪": "\\cup ",
            "∩": "\\cap ",
            "∫": "\\int ",
            "∑": "\\sum ",
            "∏": "\\prod ",
            "√": "\\sqrt ",
            "π": "\\pi ",
            "θ": "\\theta ",
            "α": "\\alpha ",
            "β": "\\beta ",
            "γ": "\\gamma ",
            "δ": "\\delta ",
            "∂": "\\partial ",
        }
        
        # Replace Unicode symbols with LaTeX commands
        for unicode_char, latex_cmd in symbol_map.items():
            text = text.replace(unicode_char, latex_cmd)
        
        # Escape special LaTeX characters
        # Note: Don't escape {, }, ^, _ as they may be part of LaTeX syntax
        escape_chars = {
            "#": "\\#",
            "$": "\\$",
            "%": "\\%",
            "&": "\\&",
            "~": "\\~",
            "\\": "\\textbackslash ",
        }
        
        for char, escaped in escape_chars.items():
            text = text.replace(char, escaped)
        
        return text
