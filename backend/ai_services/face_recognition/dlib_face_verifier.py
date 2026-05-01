import os
import json
import logging
import numpy as np
from typing import Tuple, Dict, Any, Optional
from datetime import datetime
import cv2

try:
    import face_recognition
    DLIB_AVAILABLE = True
except ImportError:
    DLIB_AVAILABLE = False

try:
    from django.conf import settings
    HAS_DJANGO = True
except ImportError:
    HAS_DJANGO = False

logger = logging.getLogger(__name__)

class DlibFaceVerifier:
    """
    High-precision local face verification using dlib-based embeddings.
    Extracts a 128-dimensional face encoding and compares using Euclidean distance.
    Uses jittering during enrollment for a more robust "golden signature".
    """
    
    def __init__(self, distance_threshold: float = 0.55):
        self.distance_threshold = distance_threshold
        self.embeddings_db = {}
        
        # Directory for embeddings and enrolled faces
        try:
            from django.conf import settings
            ai_dir = os.path.join(settings.MEDIA_ROOT, 'ai')
        except Exception:
            ai_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                'media', 'ai'
            )
        
        self.enrollment_dir = os.path.join(ai_dir, 'enrollments_dlib')
        os.makedirs(self.enrollment_dir, exist_ok=True)
        
        self.embeddings_file = os.path.join(ai_dir, "face_embeddings_dlib.json")
        self._load_embeddings()
        
        if DLIB_AVAILABLE:
            logger.info("Dlib Face Verifier (face_recognition) initialized")
        else:
            logger.error("face_recognition library not found! DlibFaceVerifier will fail.")

    def _load_embeddings(self):
        """Load embeddings from JSON database"""
        try:
            if os.path.exists(self.embeddings_file):
                with open(self.embeddings_file, 'r') as f:
                    self.embeddings_db = json.load(f)
                logger.info(f"Loaded {len(self.embeddings_db)} local dlib embeddings")
        except Exception as e:
            logger.warning(f"Could not load dlib embeddings: {e}")

    def _save_embeddings(self):
        """Save embeddings to JSON database"""
        try:
            with open(self.embeddings_file, 'w') as f:
                json.dump(self.embeddings_db, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save dlib embeddings: {e}")

    def enroll_student(self, student_id: str, image: Any, force_update: bool = False) -> Tuple[bool, str]:
        """Extract and save face encoding for a student."""
        if not DLIB_AVAILABLE:
            return False, "Dlib library not available"

        if student_id in self.embeddings_db and not force_update:
            return False, "Already enrolled. Use force_update to re-enroll."

        try:
            # face_recognition expects RGB
            if len(image.shape) == 3 and image.shape[2] == 3:
                # Assuming it's already RGB (Standard in your tasks.py)
                rgb_img = image
            else:
                # Grayscale or other - convert to RGB
                rgb_img = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

            # Find face encodings with jittering for high accuracy enrollment
            # num_jitters=10 makes the signature much more robust to small angle changes
            encodings = face_recognition.face_encodings(rgb_img, num_jitters=10, model="large")
            
            if not encodings:
                return False, "No face detected in the image"
            
            # Take the average encoding (if multiple faces, take the first one)
            encoding = encodings[0]
            
            self.embeddings_db[student_id] = {
                'encoding': encoding.tolist(),
                'enrollment_date': datetime.now().isoformat(),
                'method': 'dlib_resnet'
            }
            
            self._save_embeddings()
            
            # Also save a crop for visual reference if needed
            face_locations = face_recognition.face_locations(rgb_img)
            if face_locations:
                top, right, bottom, left = face_locations[0]
                face_crop = rgb_img[top:bottom, left:right]
                # Convert back to BGR for saving with cv2
                bgr_crop = cv2.cvtColor(face_crop, cv2.COLOR_RGB2BGR)
                safe_id = str(student_id).replace('/', '_').replace('\\', '_')
                crop_path = os.path.join(self.enrollment_dir, f"{safe_id}.jpg")
                cv2.imwrite(crop_path, bgr_crop)

            return True, "Enrolled successfully"
        except Exception as e:
            logger.error(f"Dlib enrollment error for {student_id}: {e}")
            return False, f"Enrollment failed: {str(e)}"

    def verify_student(self, student_id: str, image: Any) -> Tuple[bool, float, Dict[str, Any]]:
        """Verify live image against stored dlib encoding."""
        if not DLIB_AVAILABLE:
            return False, 0.0, {"error": "Dlib library not available"}

        if student_id not in self.embeddings_db:
            # Fallback: check if we can auto-enroll from profile photo
            logger.info(f"Student {student_id} not in dlib DB, checking profile fallback...")
            success = self._auto_enroll_from_profile(student_id)
            if not success:
                return False, 0.0, {"error": "Not enrolled. Please enroll your face first."}

        try:
            stored_encoding = np.array(self.embeddings_db[student_id]['encoding'])
            
            # Process live image
            if len(image.shape) == 3 and image.shape[2] == 3:
                rgb_img = image
            else:
                rgb_img = cv2.cvtColor(image, cv2.COLOR_GRAY2RGB)

            live_encodings = face_recognition.face_encodings(rgb_img)
            
            if not live_encodings:
                return False, 0.0, {"error": "No face detected in camera capture"}
            
            live_encoding = live_encodings[0]
            
            # Calculate distance (Euclidean)
            # face_recognition.face_distance returns an array of distances
            distance = face_recognition.face_distance([stored_encoding], live_encoding)[0]
            
            # Lower distance means higher similarity. Default threshold is 0.6.
            # We use a slightly stricter 0.5 as default.
            verified = bool(distance <= self.distance_threshold)
            
            # Convert distance to a confidence score (0.0 to 1.0)
            # Threshold 0.55 means ~50% confidence. Distance 0.0 means 100% confidence.
            confidence = max(0.0, min(1.0, 1.0 - (distance / 1.1)))
            similarity_pct = round(confidence * 100, 1)
            
            details = {
                "method": "dlib_encodings",
                "distance": round(float(distance), 4),
                "threshold": self.distance_threshold,
                "similarity_percent": similarity_pct,
                "timestamp": datetime.now().isoformat()
            }
            
            if verified:
                details["reason"] = f"Neural match confirmed with {similarity_pct}% confidence."
            else:
                details["reason"] = (
                    f"Identity mismatch. Similarity ({similarity_pct}%) is below "
                    f"the security threshold. (Distance: {distance:.3f})"
                )
                
            return verified, confidence, details

        except Exception as e:
            logger.error(f"Dlib verification error for {student_id}: {e}")
            return False, 0.0, {"error": f"Verification failed: {str(e)}"}

    def _auto_enroll_from_profile(self, student_id: str) -> bool:
        """Fallback to profile photo for auto-enrollment if Django is available."""
        if not HAS_DJANGO:
            return False
            
        try:
            from users.models import Student
            from django.conf import settings
            
            student = Student.objects.get(university_id=student_id)
            if not student.user.profile_photo:
                return False
                
            photo_path = os.path.join(settings.MEDIA_ROOT, student.user.profile_photo.name)
            if not os.path.exists(photo_path):
                return False
                
            img = cv2.imread(photo_path)
            if img is None:
                return False
            
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            success, _ = self.enroll_student(student_id, img_rgb, force_update=True)
            return success
        except Exception as e:
            logger.error(f"Auto-enroll fallback failed: {e}")
            return False
