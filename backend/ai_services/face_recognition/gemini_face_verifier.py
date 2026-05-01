import os
import json
import logging
from typing import Tuple, Dict, Any, Optional
from datetime import datetime
import cv2
import numpy as np
from PIL import Image

try:
    import google.genai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False

from decouple import config
from django.conf import settings

logger = logging.getLogger(__name__)

GEMINI_API_KEY = config('GEMINI_API_KEY', default=None)

if GEMINI_API_KEY:
    if not HAS_GENAI:
        logger.warning("GEMINI_API_KEY set but google.genai SDK import failed; face verification will fall back.")
else:
    logger.warning("GEMINI_API_KEY not found! Face verification will fall back.")

class GeminiFaceVerifier:
    """
    State-of-the-art multimodal face verification using Gemini 1.5 Flash Vision.
    Compares highly descriptive facial attributes and geometry between 
    a previously enrolled image and a live camera capture.
    """
    
    def __init__(self, distance_threshold: float = 0.6):
        self.distance_threshold = distance_threshold
        
        # Directory for enrolled face images
        try:
            self.enrollment_dir = os.path.join(settings.MEDIA_ROOT, 'ai', 'enrollments')
        except Exception:
            self.enrollment_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 
                'media', 'ai', 'enrollments'
            )
        os.makedirs(self.enrollment_dir, exist_ok=True)
        
        self.client = None
        self.model = None
        
        if GEMINI_API_KEY:
            if HAS_GENAI:
                self.client = genai.Client(api_key=GEMINI_API_KEY)
                self.model_name = 'gemini-2.0-flash'
            
        logger.info("Gemini Face Verifier initialized")
    
    def _array_to_pil(self, image: Any) -> Image.Image:
        """Helper to convert numpy arrays from cv2 into PIL Image for Gemini."""
        # Check if already a PIL Image
        if isinstance(image, Image.Image):
            return image
        
        if len(image.shape) == 2:
            return Image.fromarray(image).convert("RGB")
        elif image.shape[2] == 3:
            # Assumes RGB (it's converted in tasks.py from BGR to RGB)
            return Image.fromarray(image)
        return Image.fromarray(image)
        
    def enroll_student(self, student_id: str, image: Any, force_update: bool = False) -> Tuple[bool, str]:
        """Save user's enrollment face image dynamically."""
        safe_id = str(student_id).replace('/', '_').replace('\\', '_')
        path = os.path.join(self.enrollment_dir, f"{safe_id}.jpg")
        
        if os.path.exists(path) and not force_update:
            return False, "Already enrolled. Use force_update to re-enroll."
            
        try:
            pil_img = self._array_to_pil(image)
            pil_img.save(path)
            
            is_update = force_update and os.path.exists(path)
            return True, "Face updated successfully" if is_update else "Enrolled successfully"
        except Exception as e:
            logger.error(f"Failed to enroll student face: {e}")
            return False, "Failed to save face image"

    def verify_student(self, student_id: str, image: Any) -> Tuple[bool, float, Dict[str, Any]]:
        """Verify student using Gemini Multimodal reasoning."""
        safe_id = str(student_id).replace('/', '_').replace('\\', '_')
        path = os.path.join(self.enrollment_dir, f"{safe_id}.jpg")
        
        if not os.path.exists(path):
            # Fallback: check if the student has a profile photo in their User account
            try:
                from users.models import Student
                student = Student.objects.get(university_id=student_id)
                if student.user.profile_photo and os.path.exists(student.user.profile_photo.path):
                    path = student.user.profile_photo.path
                    logger.info(f"Using profile photo fallback for {student_id}")
                else:
                    return False, 0.0, {"error": "Not enrolled. Please enroll your face first or upload a profile photo."}
            except Exception as e:
                logger.error(f"Fallback check failed for {student_id}: {e}")
                return False, 0.0, {"error": "Not enrolled. Please enroll your face first."}
            
        if not self.model and not self.client:
            return False, 0.0, {"error": "Gemini API key is not configured or SDK is unavailable!"}
        
        try:
            enrolled_img = Image.open(path)
            current_img = self._array_to_pil(image)

            prompt = '''
You are an expert biometric security system. You are given two images:
Image 1: Enrolled ID photo (reference).
Image 2: Live camera capture (candidate).

Analyze if these images represent the same individual. 
- Focus on permanent facial geometry (bone structure, eye distance, ear position, nose bridge).
- Be tolerant of variations in lighting, background, hair style, or the presence of glasses/accessories.
- Evaluate the similarity on a scale from 0.0 to 1.0.

Output a pure JSON object:
{
  "is_same_person": true/false,
  "confidence_score": 0.0 to 1.0,
  "reason": "Short explanation of the match/mismatch."
}
No markdown, just the JSON dictionary.
'''
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=[prompt, enrolled_img, current_img]
            )
            result_text = response.text.strip()
            
            # Clean possible markdown format
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.startswith("```"):
                result_text = result_text[3:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]
                
            result_json = json.loads(result_text.strip())
            
            is_same = bool(result_json.get('is_same_person', False))
            confidence = float(result_json.get('confidence_score', 0.0))
            reason = result_json.get('reason', '')
            
            details = {
                "method": "gemini_multimodal",
                "timestamp": datetime.now().isoformat(),
                "reason": reason
            }
            
            if is_same and confidence >= self.distance_threshold:
                return True, confidence, details
            else:
                return False, confidence, details
                
        except Exception as e:
            logger.error(f"Gemini face verification error: {e}")
            return False, 0.0, {"error": f"Verification failed: {str(e)}"}
