#!/usr/bin/env python3
"""
Document Processing Agent using Autogen + Groq Llama
Specialized for Arabic government document analysis
"""
import json
import time
import asyncio
from typing import Dict, Any, Optional
from PIL import Image
import requests

try:
    import autogen
    from autogen import AssistantAgent, UserProxyAgent, GroupChat, GroupChatManager
except ImportError:
    # Fallback if autogen is not available
    autogen = None
    AssistantAgent = None
    UserProxyAgent = None
    GroupChat = None
    GroupChatManager = None

class DocumentProcessingAgent:
    """Agent-based document processing using Autogen + Groq Llama"""
    
    def __init__(self, groq_api_key: str, qari_client=None):
        self.groq_api_key = groq_api_key
        self.qari_client = qari_client
        
        # Configure Groq LLM for Autogen
        self.llm_config = {
            "config_list": [
                {
                    "model": "llama3-70b-8192",
                    "api_key": groq_api_key,
                    "base_url": "https://api.groq.com/openai/v1",
                    "api_type": "openai"
                }
            ],
            "temperature": 0.1,
            "max_tokens": 2000,
            "timeout": 60
        }
        
        # Initialize agents
        self._setup_agents()
    
    def _setup_agents(self):
        """Setup Autogen agents for document processing"""
        
        # OCR Specialist Agent
        self.ocr_agent = AssistantAgent(
            name="OCR_Specialist",
            system_message="""أنت خبير في استخراج النصوص العربية من الوثائق الحكومية. 
            مهمتك هي تحليل النص المستخرج من OCR وتنظيفه وتحسينه.
            
            قم بما يلي:
            1. تنظيف النص من الأخطاء الشائعة في OCR
            2. تصحيح الأخطاء الإملائية البسيطة
            3. تنظيم النص بشكل منطقي
            4. الحفاظ على المعنى الأصلي
            
            أجب باللغة العربية فقط.""",
            llm_config=self.llm_config
        )
        
        # Entity Extraction Agent
        self.extraction_agent = AssistantAgent(
            name="Entity_Extractor",
            system_message="""أنت خبير في استخراج البيانات من الوثائق الحكومية العربية المكتوبة بخط اليد.

            قواعد الاستخراج الأساسية:
            1. عند استخراج كل قيمة، تجنب كتابة التسمية (مثل "الاسم") كقيمة للحقل
            2. ابحث دائماً عن النص الفريد أو المكتوب بخط اليد بجوار أو تحت التسمية، حتى لو كان غير واضح
            3. إذا لم يكن النص واضحاً بالكامل، استخرج ما تستطيع واملأ الباقي بـ "(يحتاج مراجعة)"
            4. إذا كان هناك أكثر من قيمة محتملة، اختر الأكثر تميزاً أو التي تبدو مكتوبة بخط اليد
            5. إذا وجدت تاريخاً أو رقم هوية حتى لو كان جزئياً، استخرجه كما هو
            6. لا تكرر النصوص في أكثر من حقل، ولا تترك أي حقل فارغاً إلا إذا استحال الاستنتاج
            7. لا تكرر القيم التي تظهر كـ "إفادة سكن" أو "وزارة الداخلية" في غير محلها

            استراتيجية الاستخراج:
            - ركز على النصوص الفريدة والمكتوبة بخط اليد
            - تجاهل التسميات المطبوعة والقوالب المتكررة
            - استخرج الأسماء الشخصية حتى لو كانت ناقصة (مثل "أحمد س" بدلاً من "غير متوفر")
            - استخرج التواريخ والأرقام حتى لو كانت جزئية
            - اربط كل حقل بالنص الأكثر منطقية وتميزاً

            يجب أن يكون الجواب JSON صِرف كما هو في المثال:
            {
                "رقم_المستند": "117-11-2018",
                "التاريخ": "11/11/2018",
                "نوع_الوثيقة": "إفادة سكن",
                "الجهة_الصادرة": "وزارة الداخلية والبلديات",
                "الاسم_الرئيسي": "محمد سليم (يحتاج مراجعة)",
                "المسؤول": "اسم مسؤول (يحتاج مراجعة)",
                "الموضوع": "إفادة سكن"
            }

            أجب بـ JSON صحيح فقط بدون أي نص إضافي.""",
            llm_config=self.llm_config
        )
        
        # Document Classifier Agent
        self.classifier_agent = AssistantAgent(
            name="Document_Classifier",
            system_message="""أنت خبير في تصنيف الوثائق العربية الحكومية.
            
            صنف الوثيقة إلى إحدى الفئات التالية:
            - شهادة_ملكية: شهادات ملكية العقارات والأراضي
            - خطاب_تحويل: خطابات نقل أو تحويل
            - نموذج_اعرف_عميلك: نماذج KYC والتحقق من الهوية
            - تقرير_مراجعة: تقارير المراجعة والتدقيق
            - إيصال_استلام: إيصالات الاستلام والتسليم
            - وثيقة_قانونية: العقود والاتفاقيات القانونية
            - معاملة_مالية: المعاملات المصرفية والمالية
            - خدمة_حكومية: طلبات الخدمات الحكومية
            - أخرى: أي نوع آخر
            
            قدم النتيجة بتنسيق JSON:
            {
                "نوع_الوثيقة": "التصنيف",
                "مستوى_الثقة": "عالي/متوسط/منخفض",
                "السبب": "سبب التصنيف",
                "خصائص_مميزة": ["قائمة بالخصائص المميزة"]
            }""",
            llm_config=self.llm_config
        )
        
        # Data Review Agent
        self.review_agent = AssistantAgent(
            name="Data_Reviewer",
            system_message="""أنت مراجع خبير للبيانات المستخرجة من الوثائق العربية المكتوبة بخط اليد.

            مهمتك الأساسية:
            1. مراجعة البيانات المستخرجة وتحسين جودتها مع التركيز على المحتوى المكتوب بخط اليد
            2. إزالة التسميات المطبوعة والقوالب المتكررة من القيم
            3. الحفاظ على المحتوى الفريد والمكتوب بخط اليد حتى لو كان ناقصاً
            4. إضافة علامات المراجعة للمحتوى غير الواضح
            5. تجنب ترك الحقول فارغة إلا إذا استحال الاستنتاج

            قواعد المراجعة المتقدمة:
            - احتفظ بالأسماء والتواريخ والأرقام حتى لو كانت جزئية
            - أزل التسميات مثل "الاسم:" من القيم واحتفظ بالمحتوى فقط
            - أضف "(يحتاج مراجعة)" للمحتوى غير الواضح
            - تجنب تكرار نفس القيمة في حقول مختلفة
            - ركز على استخراج المحتوى الفريد والمميز

            أجب بـ JSON صحيح فقط بدون أي نص إضافي.""",
            llm_config=self.llm_config
        )
        
        # User Proxy Agent (orchestrator)
        self.user_proxy = UserProxyAgent(
            name="Document_Processor",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=1,
            code_execution_config=False
        )
    
    async def process_document_page(self, image: Image.Image, page_number: int, filename: str) -> Dict[str, Any]:
        """Process a single document page through the complete pipeline"""
        
        start_time = time.time()
        result = {
            "page_number": page_number,
            "filename": filename,
            "success": False,
            "processing_time": 0,
            "ocr_result": {},
            "agent_result": {},
            "error": None
        }
        
        try:
            # Step 1: OCR with QARI
            print(f"🔄 Page {page_number}: Running OCR...")
            if self.qari_client:
                ocr_result = await self.qari_client.extract_text(image)
                result["ocr_result"] = ocr_result
                
                if not ocr_result.get("success"):
                    result["error"] = f"OCR failed: {ocr_result.get('error')}"
                    return result
                
                extracted_text = ocr_result.get("text", "")
            else:
                # Fallback: simulate OCR for testing
                extracted_text = "نص تجريبي للاختبار - يتم استخراج النص من الصورة هنا"
                result["ocr_result"] = {
                    "success": True,
                    "text": extracted_text,
                    "processing_time": 1.0
                }
            
            print(f"✅ Page {page_number}: OCR completed ({len(extracted_text)} chars)")
            
            # Step 2: Process with agents
            agent_result = await self.process_extracted_text(
                text=extracted_text,
                page_number=page_number,
                filename=filename
            )
            
            result["agent_result"] = agent_result
            result["success"] = agent_result.get("success", False)
            
        except Exception as e:
            result["error"] = str(e)
            print(f"❌ Page {page_number}: Processing failed - {e}")
        
        result["processing_time"] = time.time() - start_time
        return result
    
    async def process_extracted_text(self, text: str, page_number: int, filename: str) -> Dict[str, Any]:
        """Process extracted text using agent pipeline"""
        
        start_time = time.time()
        result = {
            "success": False,
            "processing_time": 0,
            "extracted_data": {},
            "classification": {},
            "quality_assessment": {},
            "error": None
        }
        
        try:
            print(f"🤖 Processing text with agents...")
            
            # Step 1: Clean and improve OCR text
            cleaned_text = await self._clean_ocr_text(text)
            
            # Step 2: Extract entities
            extracted_data = await self._extract_entities(cleaned_text)
            result["extracted_data"] = extracted_data

            # Step 3: Classify document
            classification = await self._classify_document(cleaned_text)
            result["classification"] = classification
            
            result["success"] = True
            print(f"✅ Agent processing completed")
            
        except Exception as e:
            result["error"] = str(e)
            print(f"❌ Agent processing failed: {e}")
        
        result["processing_time"] = time.time() - start_time
        return result
    
    async def _clean_ocr_text(self, text: str) -> str:
        """Clean OCR text using OCR specialist agent"""
        try:
            prompt = f"نظف وحسن النص التالي المستخرج من OCR:\n\n{text}"
            
            response = await self._call_groq_api(prompt, "OCR_Specialist")
            return response.get("content", text)
        except:
            return text  # Return original if cleaning fails
    
    async def _extract_entities(self, text: str) -> Dict[str, Any]:
        """Extract entities using extraction agent"""
        try:
            prompt = f"""استخرج أي معلومات مفيدة من النص التالي:

النص: {text}

ابحث عن أي شيء مفيد واستخرجه:
- أي أرقام أو أكواد (117-11-2018, DL-123, 123456)
- أي تواريخ (11/11/2018, 2018/11/11, 15-01-2024)
- أي أسماء (محمد, سليم, أحمد, علي)
- أي أماكن (طرابلس, بيروت, التبانة)
- أي مؤسسات (وزارة, إدارة, مكتب)
- أي أنواع وثائق (إفادة, رخصة, شهادة)

قواعد بسيطة:
1. إذا وجدت أي رقم أو كود → ضعه في رقم_المستند
2. إذا وجدت أي تاريخ → ضعه في التاريخ
3. إذا وجدت أي اسم شخص → ضعه في الاسم_الرئيسي
4. إذا وجدت أي مكان → ضعه في العنوان
5. إذا وجدت أي مؤسسة → ضعه في الجهة_الصادرة
6. إذا وجدت نوع وثيقة → ضعه في نوع_الوثيقة
7. إذا لم تجد شيء → اكتب "غير متوفر"

استخرج أي شيء تجده حتى لو كان غير مكتمل.

أجب بـ JSON فقط:
{{
    "رقم_المستند": "...",
    "التاريخ": "...",
    "نوع_الوثيقة": "...",
    "الجهة_الصادرة": "...",
    "الاسم_الرئيسي": "...",
    "المسؤول": "...",
    "الموضوع": "..."
}}"""

            response = await self._call_groq_api(prompt, "Entity_Extractor")
            content = response.get("content", "{}")

            # Clean the response to extract JSON only
            content = content.strip()

            # Try multiple patterns to extract JSON
            json_content = None

            # Pattern 1: ```json ... ```
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                if end != -1:
                    json_content = content[start:end].strip()

            # Pattern 2: ``` ... ``` (generic code block)
            elif "```" in content:
                start = content.find("```") + 3
                end = content.find("```", start)
                if end != -1:
                    json_content = content[start:end].strip()

            # Pattern 3: Look for { ... } pattern
            elif "{" in content and "}" in content:
                start = content.find("{")
                end = content.rfind("}") + 1
                if start != -1 and end > start:
                    json_content = content[start:end].strip()

            # Pattern 4: Use the whole content if it looks like JSON
            elif content.startswith("{") and content.endswith("}"):
                json_content = content
            else:
                json_content = content

            content = json_content

            # Try to parse JSON
            try:
                extracted_data = json.loads(content)
                # Ensure all expected fields are present
                default_fields = {
                    "رقم_المستند": "غير متوفر",
                    "التاريخ": "غير متوفر",
                    "نوع_الوثيقة": "غير محدد",
                    "الجهة_الصادرة": "غير متوفر",
                    "الاسم_الرئيسي": "غير متوفر",
                    "المسؤول": "غير متوفر",
                    "الموضوع": "غير محدد"
                }

                # Merge with defaults
                for key, default_value in default_fields.items():
                    if key not in extracted_data:
                        extracted_data[key] = default_value

                # Add review step to filter duplicates and nonsensical data
                reviewed_data = await self._review_extracted_data(extracted_data)
                return reviewed_data
            except Exception as json_error:
                print(f"JSON parsing error: {json_error}")
                print(f"Raw content: {content}")
                # If JSON parsing fails, return structured fallback
                return {
                    "رقم_المستند": "غير متوفر",
                    "التاريخ": "غير متوفر",
                    "نوع_الوثيقة": "غير محدد",
                    "الجهة_الصادرة": "غير متوفر",
                    "الاسم_الرئيسي": "غير متوفر",
                    "المسؤول": "غير متوفر",
                    "الموضوع": "غير محدد"
                }
        except Exception as e:
            print(f"Entity extraction error: {e}")
            return {"error": str(e)}

    async def _review_extracted_data(self, extracted_data: Dict[str, Any]) -> Dict[str, Any]:
        """Review and clean extracted data using review agent"""
        try:
            prompt = f"""راجع البيانات المستخرجة وحسّنها:

البيانات: {json.dumps(extracted_data, ensure_ascii=False, indent=2)}

قواعد بسيطة:
1. إذا وجدت تسمية مثل "الاسم:" في القيمة، أزلها واحتفظ بما بعدها
2. إذا كانت القيمة فارغة أو مجرد تسمية، ضع "غير متوفر"
3. احتفظ بجميع الأرقام والتواريخ والأسماء كما هي
4. لا تغيّر المحتوى المفيد

مثال:
قبل: {{"الاسم_الرئيسي": "الاسم: محمد سليم"}}
بعد: {{"الاسم_الرئيسي": "محمد سليم"}}

أعد البيانات المحسّنة بـ JSON فقط:"""

            response = await self._call_groq_api(prompt, "Data_Reviewer")
            content = response.get("content", "{}")

            # Clean and parse JSON
            content = content.strip()
            if "```json" in content:
                start = content.find("```json") + 7
                end = content.find("```", start)
                if end != -1:
                    content = content[start:end].strip()
            elif "{" in content and "}" in content:
                start = content.find("{")
                end = content.rfind("}") + 1
                content = content[start:end].strip()

            try:
                reviewed_data = json.loads(content)
                return reviewed_data
            except:
                # If review fails, return original data
                return extracted_data

        except Exception as e:
            print(f"Review error: {e}")
            return extracted_data
    
    async def _classify_document(self, text: str) -> Dict[str, Any]:
        """Classify document using classifier agent"""
        try:
            prompt = f"صنف الوثيقة التالية:\n\n{text}"
            
            response = await self._call_groq_api(prompt, "Document_Classifier")
            content = response.get("content", "{}")
            
            try:
                return json.loads(content)
            except:
                return {
                    "نوع_الوثيقة": "أخرى",
                    "مستوى_الثقة": "منخفض",
                    "السبب": "فشل في التحليل"
                }
        except Exception as e:
            return {"error": str(e)}
    
    async def _assess_quality(self, extracted_data: Dict, classification: Dict) -> Dict[str, Any]:
        """Assess quality using QA agent"""
        try:
            assessment_input = {
                "extracted_data": extracted_data,
                "classification": classification
            }
            
            prompt = f"راجع جودة الاستخراج التالي:\n\n{json.dumps(assessment_input, ensure_ascii=False, indent=2)}"
            
            response = await self._call_groq_api(prompt, "Quality_Assurance")
            content = response.get("content", "{}")
            
            try:
                return json.loads(content)
            except:
                return {
                    "تقييم_الجودة": "5",
                    "مستوى_الثقة": "متوسط",
                    "ملاحظات_إضافية": "تم التقييم الأساسي"
                }
        except Exception as e:
            return {"error": str(e)}
    
    async def _call_groq_api(self, prompt: str, agent_role: str) -> Dict[str, Any]:
        """Call Groq API directly"""
        try:
            url = "https://api.groq.com/openai/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.groq_api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": "llama3-70b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": 2000,
                "temperature": 0.1
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=60)
            
            if response.status_code == 200:
                result = response.json()
                return {
                    "success": True,
                    "content": result["choices"][0]["message"]["content"]
                }
            else:
                return {
                    "success": False,
                    "error": f"API Error {response.status_code}"
                }
                
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test Groq API connection"""
        try:
            test_prompt = "اختبار الاتصال - قل مرحبا"
            response = await self._call_groq_api(test_prompt, "test")
            
            return {
                "status": "healthy" if response.get("success") else "unhealthy",
                "response": response
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }
