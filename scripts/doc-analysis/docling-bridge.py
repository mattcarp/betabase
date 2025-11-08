#!/usr/bin/env python3
"""
Docling Bridge - Python script to parse documents using Docling
Outputs structured JSON for Node.js consumption
"""

import sys
import json
import argparse
from pathlib import Path
from docling.document_converter import DocumentConverter
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions
from docling.backend.pypdfium2_backend import PyPdfiumDocumentBackend

def parse_document(file_path: str) -> dict:
    """
    Parse a document using Docling and return structured data
    
    Args:
        file_path: Path to the document to parse
        
    Returns:
        Dictionary containing parsed document data
    """
    try:
        # Initialize document converter with options
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False  # Disable OCR for speed
        pipeline_options.do_table_structure = True
        
        converter = DocumentConverter(
            allowed_formats=[
                InputFormat.PDF,
                InputFormat.DOCX,
                InputFormat.PPTX,
                InputFormat.HTML,
                InputFormat.MD,
            ]
        )
        
        # Convert document
        result = converter.convert(file_path)
        
        if not result.document:
            return {
                "success": False,
                "error": "Failed to convert document",
                "file_path": file_path
            }
        
        doc = result.document
        
        # Extract structured content
        extracted_data = {
            "success": True,
            "file_path": file_path,
            "title": getattr(doc, 'name', '') or Path(file_path).stem,
            "metadata": {
                "pages": getattr(doc, 'page_count', 0),
                "has_tables": bool(getattr(doc, 'tables', [])),
                "has_images": bool(getattr(doc, 'pictures', [])),
            },
            "content": {
                "text": doc.export_to_markdown() if hasattr(doc, 'export_to_markdown') else str(doc),
                "headings": extract_headings(doc),
                "tables": extract_tables(doc),
                "sections": extract_sections(doc),
            },
            "stats": {
                "char_count": len(str(doc)),
                "word_count": len(str(doc).split()),
            }
        }
        
        return extracted_data
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "error_type": type(e).__name__,
            "file_path": file_path
        }

def extract_headings(doc) -> list:
    """Extract headings from document"""
    headings = []
    try:
        # Try to get headings from document structure
        if hasattr(doc, 'headings'):
            for heading in doc.headings:
                headings.append({
                    "level": getattr(heading, 'level', 1),
                    "text": str(heading.text) if hasattr(heading, 'text') else str(heading)
                })
        elif hasattr(doc, 'texts'):
            # Fallback: parse from text content
            for text in doc.texts:
                text_str = str(text)
                if text_str.startswith('#'):
                    level = len(text_str) - len(text_str.lstrip('#'))
                    headings.append({
                        "level": min(level, 6),
                        "text": text_str.lstrip('#').strip()
                    })
    except Exception as e:
        print(f"Warning: Could not extract headings: {e}", file=sys.stderr)
    
    return headings

def extract_tables(doc) -> list:
    """Extract tables from document"""
    tables = []
    try:
        if hasattr(doc, 'tables'):
            for table in doc.tables[:5]:  # Limit to first 5 tables
                tables.append({
                    "rows": getattr(table, 'num_rows', 0),
                    "cols": getattr(table, 'num_cols', 0),
                    "data": str(table)[:500]  # First 500 chars
                })
    except Exception as e:
        print(f"Warning: Could not extract tables: {e}", file=sys.stderr)
    
    return tables

def extract_sections(doc) -> list:
    """Extract sections from document"""
    sections = []
    try:
        # Get markdown export and split into sections
        if hasattr(doc, 'export_to_markdown'):
            markdown = doc.export_to_markdown()
            current_section = {"heading": "Introduction", "content": ""}
            
            for line in markdown.split('\n'):
                if line.startswith('#'):
                    # Save previous section
                    if current_section["content"].strip():
                        sections.append(current_section)
                    # Start new section
                    current_section = {
                        "heading": line.lstrip('#').strip(),
                        "content": ""
                    }
                else:
                    current_section["content"] += line + "\n"
            
            # Add last section
            if current_section["content"].strip():
                sections.append(current_section)
                
    except Exception as e:
        print(f"Warning: Could not extract sections: {e}", file=sys.stderr)
    
    return sections

def main():
    parser = argparse.ArgumentParser(description='Parse documents using Docling')
    parser.add_argument('file_path', help='Path to document to parse')
    parser.add_argument('--output', help='Output JSON file (default: stdout)')
    
    args = parser.parse_args()
    
    # Parse document
    result = parse_document(args.file_path)
    
    # Output JSON
    json_output = json.dumps(result, indent=2, ensure_ascii=False)
    
    if args.output:
        Path(args.output).write_text(json_output, encoding='utf-8')
    else:
        print(json_output)

if __name__ == '__main__':
    main()

