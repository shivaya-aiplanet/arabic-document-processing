#!/usr/bin/env python3
"""
QARI OCR Client for RunPod Integration
Handles communication with QARI model deployed on RunPod

✅ DEPLOYED API: https://45wteqoqo2wx3l-8000.proxy.runpod.net/
✅ STATUS: Healthy and Running
✅ GPU: NVIDIA A40 (44GB VRAM)
"""
import asyncio
import aiohttp
import base64
import time
from typing import Dict, Any, Optional
from PIL import Image
from io import BytesIO

class QARIClient:
    """Client for QARI OCR service on RunPod"""
    
    def __init__(self, runpod_url: str, timeout: int = 300):
        self.runpod_url = runpod_url.rstrip('/')
        self.timeout = timeout
        self.session = None
    
    async def _get_session(self):
        """Get or create aiohttp session"""
        if self.session is None or self.session.closed:
            self.session = aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout)
            )
        return self.session
    
    async def health_check(self) -> Dict[str, Any]:
        """Check if QARI service is healthy"""
        try:
            session = await self._get_session()
            
            async with session.get(f"{self.runpod_url}/health") as response:
                if response.status == 200:
                    data = await response.json()
                    return {
                        "status": "healthy",
                        "response": data
                    }
                else:
                    return {
                        "status": "unhealthy",
                        "error": f"HTTP {response.status}"
                    }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def extract_text(self, image: Image.Image) -> Dict[str, Any]:
        """Extract text from image using QARI OCR"""
        start_time = time.time()
        
        try:
            # Convert image to base64
            image_b64 = self._image_to_base64(image)
            
            session = await self._get_session()
            
            # Prepare form data for file upload
            buffer = BytesIO()
            image.save(buffer, format='PNG')
            buffer.seek(0)
            
            data = aiohttp.FormData()
            data.add_field('file', buffer, filename='image.png', content_type='image/png')
            
            # Send request to QARI service
            async with session.post(
                f"{self.runpod_url}/extract-text",
                data=data
            ) as response:
                
                processing_time = time.time() - start_time
                
                if response.status == 200:
                    result = await response.json()
                    
                    return {
                        "success": True,
                        "text": result.get("extracted_text", ""),
                        "processing_time": processing_time,
                        "confidence": result.get("confidence", 0.0),
                        "model_info": result.get("model_info", {}),
                        "error": None
                    }
                else:
                    error_text = await response.text()
                    return {
                        "success": False,
                        "text": "",
                        "processing_time": processing_time,
                        "error": f"HTTP {response.status}: {error_text}"
                    }
                    
        except asyncio.TimeoutError:
            return {
                "success": False,
                "text": "",
                "processing_time": time.time() - start_time,
                "error": "Request timeout"
            }
        except Exception as e:
            return {
                "success": False,
                "text": "",
                "processing_time": time.time() - start_time,
                "error": str(e)
            }
    
    def _image_to_base64(self, image: Image.Image) -> str:
        """Convert PIL image to base64 string"""
        buffer = BytesIO()
        image.save(buffer, format='PNG')
        image_bytes = buffer.getvalue()
        return base64.b64encode(image_bytes).decode('utf-8')
    
    async def close(self):
        """Close the aiohttp session"""
        if self.session and not self.session.closed:
            await self.session.close()
    
    def __del__(self):
        """Cleanup on deletion"""
        if hasattr(self, 'session') and self.session and not self.session.closed:
            # Note: This is not ideal for async cleanup, but serves as a fallback
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    loop.create_task(self.session.close())
            except:
                pass


class MockQARIClient(QARIClient):
    """Mock QARI client for testing without RunPod"""
    
    def __init__(self):
        super().__init__("http://mock-qari")
    
    async def health_check(self) -> Dict[str, Any]:
        """Mock health check"""
        return {
            "status": "healthy",
            "response": {"message": "Mock QARI service"}
        }
    
    async def extract_text(self, image: Image.Image) -> Dict[str, Any]:
        """Mock text extraction"""
        # Simulate processing time
        await asyncio.sleep(2)
        
        # Return mock Arabic text
        mock_text = """وزارة الداخلية
        المملكة العربية السعودية
        
        شهادة ملكية رقم: 123456
        التاريخ: 15 رجب 1445 هـ الموافق 25 يناير 2024 م
        
        يشهد هذا المستند أن السيد: أحمد محمد العلي
        الرقم الوطني: 1234567890
        
        هو المالك الشرعي للعقار الواقع في:
        الرياض - حي النخيل - شارع الملك فهد
        
        رقم الصك: 987654321
        المساحة: 500 متر مربع
        
        توقيع المسؤول: _______________
        ختم الوزارة"""
        
        return {
            "success": True,
            "text": mock_text,
            "processing_time": 2.0,
            "confidence": 0.95,
            "model_info": {"model": "Mock QARI v1.0"},
            "error": None
        }
