#!/usr/bin/env python3
"""
PDF to Image Converter
Converts PDF pages to images for OCR processing
"""
import fitz  # PyMuPDF
from PIL import Image
from typing import List
import io

class PDFConverter:
    """Convert PDF documents to images"""
    
    def __init__(self, dpi: int = 300, image_format: str = 'RGB'):
        self.dpi = dpi
        self.image_format = image_format
    
    def pdf_to_images(self, pdf_content: bytes) -> List[Image.Image]:
        """Convert PDF content to list of PIL Images"""
        images = []
        
        try:
            # Open PDF from bytes
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            
            print(f"📄 PDF has {pdf_document.page_count} pages")
            
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                
                # Convert page to image
                # Use matrix for high DPI
                mat = fitz.Matrix(self.dpi / 72, self.dpi / 72)
                pix = page.get_pixmap(matrix=mat)
                
                # Convert to PIL Image
                img_data = pix.tobytes("png")
                image = Image.open(io.BytesIO(img_data))
                
                # Ensure RGB format
                if image.mode != self.image_format:
                    image = image.convert(self.image_format)
                
                images.append(image)
                print(f"✅ Converted page {page_num + 1}: {image.size}")
            
            pdf_document.close()
            
        except Exception as e:
            print(f"❌ PDF conversion failed: {e}")
            raise Exception(f"Failed to convert PDF: {str(e)}")
        
        return images
    
    def pdf_page_to_image(self, pdf_content: bytes, page_number: int) -> Image.Image:
        """Convert specific PDF page to image"""
        try:
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            
            if page_number >= pdf_document.page_count:
                raise ValueError(f"Page {page_number} does not exist. PDF has {pdf_document.page_count} pages.")
            
            page = pdf_document[page_number]
            
            # Convert page to image
            mat = fitz.Matrix(self.dpi / 72, self.dpi / 72)
            pix = page.get_pixmap(matrix=mat)
            
            # Convert to PIL Image
            img_data = pix.tobytes("png")
            image = Image.open(io.BytesIO(img_data))
            
            # Ensure RGB format
            if image.mode != self.image_format:
                image = image.convert(self.image_format)
            
            pdf_document.close()
            
            return image
            
        except Exception as e:
            print(f"❌ PDF page conversion failed: {e}")
            raise Exception(f"Failed to convert PDF page {page_number}: {str(e)}")
    
    def get_pdf_info(self, pdf_content: bytes) -> dict:
        """Get PDF document information"""
        try:
            pdf_document = fitz.open(stream=pdf_content, filetype="pdf")
            
            info = {
                "page_count": pdf_document.page_count,
                "metadata": pdf_document.metadata,
                "is_encrypted": pdf_document.is_encrypted,
                "is_pdf": pdf_document.is_pdf,
                "page_sizes": []
            }
            
            # Get page sizes
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                rect = page.rect
                info["page_sizes"].append({
                    "page": page_num + 1,
                    "width": rect.width,
                    "height": rect.height
                })
            
            pdf_document.close()
            
            return info
            
        except Exception as e:
            print(f"❌ Failed to get PDF info: {e}")
            raise Exception(f"Failed to analyze PDF: {str(e)}")
    
    def optimize_image_for_ocr(self, image: Image.Image) -> Image.Image:
        """Optimize image for better OCR results"""
        try:
            # Convert to grayscale if needed for better OCR
            if image.mode == 'RGBA':
                # Create white background
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1])  # Use alpha channel as mask
                image = background
            
            # Ensure minimum size for OCR
            min_width, min_height = 800, 600
            if image.width < min_width or image.height < min_height:
                # Calculate scale factor
                scale_w = min_width / image.width if image.width < min_width else 1
                scale_h = min_height / image.height if image.height < min_height else 1
                scale = max(scale_w, scale_h)
                
                new_size = (int(image.width * scale), int(image.height * scale))
                image = image.resize(new_size, Image.Resampling.LANCZOS)
                print(f"🔍 Upscaled image to {new_size} for better OCR")
            
            return image
            
        except Exception as e:
            print(f"⚠️ Image optimization failed: {e}")
            return image  # Return original if optimization fails
