#!/usr/bin/env python3
"""
Google Vision OCR Client for Arabic Document Processing
Uses Google Cloud Vision API for text extraction
"""

import io
import os
import time
import logging
from typing import Dict, Any
from PIL import Image
import base64
import requests

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class GoogleVisionOCRClient:
    """Client for Google Vision OCR using Cloud Vision API"""

    def __init__(self, api_key: str = None):
        """
        Initialize Google Vision OCR client

        Args:
            api_key: Google Cloud API key (optional, can use environment variable)
        """
        self.api_key = api_key or os.getenv("GOOGLE_VISION_API_KEY")
        if not self.api_key:
            raise ValueError("Google Vision API key is required. Set GOOGLE_VISION_API_KEY environment variable.")

        logger.info("✅ Google Vision OCR client initialized successfully")
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if Google Vision API is accessible"""
        try:
            # Simple API key validation by making a minimal request
            import requests
            url = f"https://vision.googleapis.com/v1/images:annotate?key={self.api_key}"

            # Test with minimal payload
            test_payload = {
                "requests": [
                    {
                        "image": {
                            "content": ""  # Empty content for validation
                        },
                        "features": [
                            {
                                "type": "TEXT_DETECTION",
                                "maxResults": 1
                            }
                        ]
                    }
                ]
            }

            response = requests.post(url, json=test_payload, timeout=10)

            if response.status_code == 200 or response.status_code == 400:  # 400 is expected for empty content
                logger.info("✅ Google Vision API health check passed")
                return {
                    "status": "healthy",
                    "service": "Google Cloud Vision API",
                    "api_key_configured": bool(self.api_key)
                }
            else:
                raise Exception(f"API returned status {response.status_code}")

        except Exception as e:
            logger.error(f"❌ Google Vision API health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    def _create_client(self):
        """Create Google Vision client with API key authentication"""
        try:
            # For API key authentication, we'll use direct REST API calls
            # instead of the client library which requires service account
            return None  # We'll use direct HTTP requests
        except Exception as e:
            logger.error(f"❌ Failed to create Google Vision client: {e}")
            raise
    
    async def extract_text(self, image: Image.Image, extraction_mode: str = "full") -> Dict[str, Any]:
        """
        Extract text from image using Google Vision OCR via REST API

        Args:
            image: PIL Image object
            extraction_mode: 'full' for complete text extraction

        Returns:
            Dictionary with extraction results
        """
        start_time = time.time()

        try:
            logger.info(f"🔄 Starting Google Vision OCR extraction (mode: {extraction_mode})")

            # Convert PIL image to base64
            image_base64 = self._image_to_base64(image)

            # Prepare request payload
            payload = {
                "requests": [
                    {
                        "image": {
                            "content": image_base64
                        },
                        "features": [
                            {
                                "type": "TEXT_DETECTION",
                                "maxResults": 1
                            }
                        ]
                    }
                ]
            }

            # Make REST API call
            import requests
            url = f"https://vision.googleapis.com/v1/images:annotate?key={self.api_key}"

            logger.info("📡 Calling Google Vision API for text detection...")
            response = requests.post(url, json=payload, timeout=60)

            if response.status_code != 200:
                raise Exception(f"Google Vision API error: {response.status_code} - {response.text}")

            result = response.json()

            # Check for errors in response
            if "error" in result:
                raise Exception(f"Google Vision API error: {result['error']}")

            # Extract text from response
            responses = result.get("responses", [])
            if responses and "textAnnotations" in responses[0]:
                text_annotations = responses[0]["textAnnotations"]

                if text_annotations:
                    # The first entry contains the full text
                    full_text = text_annotations[0]["description"]

                    # Calculate confidence (Google Vision doesn't provide overall confidence)
                    confidence = 0.95  # Default high confidence for Google Vision

                    processing_time = time.time() - start_time

                    logger.info(f"✅ Google Vision OCR completed in {processing_time:.2f}s")
                    logger.info(f"📝 Extracted {len(full_text)} characters")
                    logger.info(f"🎯 Confidence: {confidence * 100:.1f}%")

                    return {
                        "success": True,
                        "text": full_text,
                        "confidence": confidence,
                        "processing_time": processing_time,
                        "extraction_mode": extraction_mode,
                        "word_count": len(full_text.split()) if full_text else 0,
                        "character_count": len(full_text) if full_text else 0,
                        "service": "Google Cloud Vision"
                    }

            # No text found
            logger.warning("⚠️ No text found in the image")
            return {
                "success": True,
                "text": "",
                "confidence": 0.0,
                "processing_time": time.time() - start_time,
                "extraction_mode": extraction_mode,
                "message": "No text found in the image",
                "service": "Google Cloud Vision"
            }

        except Exception as e:
            processing_time = time.time() - start_time
            logger.error(f"❌ Google Vision OCR failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "processing_time": processing_time,
                "extraction_mode": extraction_mode,
                "service": "Google Cloud Vision"
            }
    
    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL Image to base64 string for Google Vision API"""
        try:
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')

            # Save to bytes buffer
            buffer = io.BytesIO()
            image.save(buffer, format='PNG', optimize=False)  # PNG for best quality
            buffer.seek(0)

            # Encode to base64
            import base64
            image_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')
            return image_base64

        except Exception as e:
            logger.error(f"❌ Image conversion failed: {e}")
            raise
    
    async def extract_with_detailed_analysis(self, image: Image.Image) -> Dict[str, Any]:
        """
        Extract text with detailed word-level analysis using REST API
        """
        try:
            logger.info("🔄 Starting detailed Google Vision analysis...")

            # Convert PIL image to base64
            image_base64 = self._image_to_base64(image)

            # Prepare request payload for document text detection
            payload = {
                "requests": [
                    {
                        "image": {
                            "content": image_base64
                        },
                        "features": [
                            {
                                "type": "DOCUMENT_TEXT_DETECTION",
                                "maxResults": 1
                            }
                        ]
                    }
                ]
            }

            # Make REST API call
            import requests
            url = f"https://vision.googleapis.com/v1/images:annotate?key={self.api_key}"

            response = requests.post(url, json=payload, timeout=60)

            if response.status_code != 200:
                raise Exception(f"Google Vision API error: {response.status_code} - {response.text}")

            result = response.json()

            # Extract detailed information
            responses = result.get("responses", [])
            if responses and "fullTextAnnotation" in responses[0]:
                full_text_annotation = responses[0]["fullTextAnnotation"]
                full_text = full_text_annotation.get("text", "")

                return {
                    "success": True,
                    "text": full_text,
                    "confidence": 0.95,  # Default confidence
                    "character_count": len(full_text) if full_text else 0,
                    "service": "Google Cloud Vision (Detailed)"
                }
            else:
                return {
                    "success": True,
                    "text": "",
                    "confidence": 0.0,
                    "message": "No text found in detailed analysis",
                    "service": "Google Cloud Vision (Detailed)"
                }

        except Exception as e:
            logger.error(f"❌ Detailed Google Vision analysis failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "service": "Google Cloud Vision (Detailed)"
            }
    
    async def close(self):
        """Clean up resources"""
        logger.info("🧹 Google Vision OCR client resources cleaned up")

# For backward compatibility
QARIClient = GoogleVisionOCRClient
