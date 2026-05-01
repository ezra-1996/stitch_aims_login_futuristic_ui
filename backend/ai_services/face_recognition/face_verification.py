"""
Face Recognition Module with NumPy Compatibility
"""

import logging
import os
import json
from typing import Tuple, Dict, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

# Handle imports with compatibility
try:
    import numpy as np
    NUMPY_AVAILABLE = True
except ImportError as e:
    NUMPY_AVAILABLE = False
    logger.error(f"NumPy not available: {e}")

try:
    import cv2
    CV2_AVAILABLE = True
except (ImportError, AttributeError) as e:
    CV2_AVAILABLE = False
    logger.warning(f"OpenCV not available: {e}")

try:
    from deepface import DeepFace
    DEEPFACE_AVAILABLE = True
except ImportError as e:
    DEEPFACE_AVAILABLE = False
    logger.warning(f"DeepFace not available: {e}")

class FaceVerification:
    """
    Face verification system with compatibility handling
    """
    
    def __init__(self, model_name: str = "Facenet", distance_threshold: float = 0.4):
        if not all([NUMPY_AVAILABLE, CV2_AVAILABLE, DEEPFACE_AVAILABLE]):
            missing = []
            if not NUMPY_AVAILABLE: missing.append("NumPy")
            if not CV2_AVAILABLE: missing.append("OpenCV")
            if not DEEPFACE_AVAILABLE: missing.append("DeepFace")
            logger.error(f"Missing dependencies: {', '.join(missing)}")
            raise ImportError(f"Required dependencies missing: {', '.join(missing)}")
        
        self.model_name = model_name
        self.distance_threshold = distance_threshold
        self.embeddings_db = {}
        self.embeddings_file = "face_embeddings.json"
        
        # Available models
        self.available_models = ["VGG-Face", "Facenet", "OpenFace", "DeepFace", "DeepID", "ArcFace"]
        
        if model_name not in self.available_models:
            logger.warning(f"Model {model_name} not available. Using Facenet.")
            self.model_name = "Facenet"
        
        self._load_embeddings()
        logger.info(f"Face verification initialized with {model_name}")
    
    def _load_embeddings(self):
        """Load embeddings from file"""
        try:
            if os.path.exists(self.embeddings_file):
                with open(self.embeddings_file, 'r') as f:
                    self.embeddings_db = json.load(f)
                logger.info(f"Loaded {len(self.embeddings_db)} embeddings")
        except Exception as e:
            logger.warning(f"Could not load embeddings: {e}")
    
    def _save_embeddings(self):
        """Save embeddings to file"""
        try:
            with open(self.embeddings_file, 'w') as f:
                json.dump(self.embeddings_db, f, indent=2)
        except Exception as e:
            logger.error(f"Could not save embeddings: {e}")
    
    def capture_face_image(self, camera_index: int = 0) -> Optional[Any]:
        """Capture face image"""
        try:
            cap = cv2.VideoCapture(camera_index)
            if not cap.isOpened():
                logger.error(f"Cannot access camera {camera_index}")
                return None
            
            # Set camera properties
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            
            ret, frame = cap.read()
            cap.release()
            
            if ret:
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                return rgb_frame
            return None
                
        except Exception as e:
            logger.error(f"Camera error: {e}")
            return None
    
    def extract_face_embedding(self, image: Any) -> Optional[Any]:
        """Extract face embedding"""
        try:
            result = DeepFace.represent(
                img_path=image,
                model_name=self.model_name,
                enforce_detection=True,
                detector_backend="opencv"
            )
            
            if result:
                embedding = np.array(result[0]['embedding'])
                return embedding
            return None
                
        except Exception as e:
            logger.error(f"Face extraction error: {e}")
            return None
    
    def enroll_student(self, student_id: str, image: Any) -> Tuple[bool, str]:
        """Enroll student"""
        if student_id in self.embeddings_db:
            return False, "Student already enrolled"
        
        embedding = self.extract_face_embedding(image)
        if embedding is None:
            return False, "Face extraction failed"
        
        self.embeddings_db[student_id] = {
            'embedding': embedding.tolist(),
            'enrollment_date': datetime.now().isoformat()
        }
        
        self._save_embeddings()
        logger.info(f"Enrolled {student_id}")
        return True, "Enrollment successful"
    
    def verify_student(self, student_id: str, image: Any) -> Tuple[bool, float, Dict[str, Any]]:
        """Verify student"""
        if student_id not in self.embeddings_db:
            return False, 0.0, {"error": "Student not enrolled"}
        
        current_embedding = self.extract_face_embedding(image)
        if current_embedding is None:
            return False, 0.0, {"error": "No face detected"}
        
        try:
            result = DeepFace.verify(
                img1_path=current_embedding,
                img2_path=np.array(self.embeddings_db[student_id]['embedding']),
                model_name=self.model_name,
                detector_backend="skip",
                distance_metric="cosine"
            )
            
            verified = result.get('verified', False)
            distance = float(result.get('distance', 1.0))
            
            # Respect configured threshold for verification
            verified = verified and (distance <= self.distance_threshold)
            confidence = max(0.0, min(1.0, 1.0 - distance))
            
            details = {
                "distance": distance,
                "threshold": self.distance_threshold,
                "model": self.model_name,
                "timestamp": datetime.now().isoformat()
            }
            
            return verified, confidence, details
            
        except Exception as e:
            logger.error(f"Verification error: {e}")
            # Fallback calculation
            stored = np.array(self.embeddings_db[student_id]['embedding'])
            distance = self._cosine_distance(stored, current_embedding)
            verified = distance <= self.distance_threshold
            confidence = max(0.0, min(1.0, 1.0 - distance))
            
            details = {
                "distance": distance,
                "threshold": self.distance_threshold,
                "method": "fallback",
                "timestamp": datetime.now().isoformat()
            }
            
            return verified, confidence, details
    
    def _cosine_distance(self, emb1: Any, emb2: Any) -> float:
        """Calculate cosine distance"""
        emb1_norm = emb1 / np.linalg.norm(emb1)
        emb2_norm = emb2 / np.linalg.norm(emb2)
        similarity = np.dot(emb1_norm, emb2_norm)
        return max(0.0, 1.0 - similarity)
