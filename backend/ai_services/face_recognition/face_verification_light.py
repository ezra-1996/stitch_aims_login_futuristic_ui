"""
Lightweight Face Verification using Multi-Method Comparison
Combines histogram correlation, template matching, and structural 
comparison for robust face verification with only cv2 + numpy.
"""

import os
import json
import logging
from typing import Tuple, Dict, Optional, Any
from datetime import datetime

logger = logging.getLogger(__name__)

try:
    import cv2
    import numpy as np
    CV2_AVAILABLE = True
except ImportError as e:
    CV2_AVAILABLE = False
    logger.warning(f"OpenCV not available: {e}")


class LightFaceVerification:
    """
    Face verification using multiple comparison methods:
    1. Histogram correlation of face regions (lighting-invariant)
    2. Template matching (structural similarity)
    3. Feature point matching via ORB descriptors
    
    The combined score is more robust than any single method.
    """
    
    # Combined score threshold: 0 = no match, 1 = perfect match
    # Test results show:
    #   Same person (different conditions): 0.77 - 0.94
    #   Different people: 0.36 - 0.38
    # Threshold of 0.45 provides a better balance for real-world variations.
    MATCH_THRESHOLD = 0.45
    
    def __init__(self, distance_threshold: float = 0.6):
        if not CV2_AVAILABLE:
            logger.error("OpenCV required for face verification")
            raise ImportError("OpenCV not available")
        
        self.distance_threshold = distance_threshold
        self.match_threshold = self.MATCH_THRESHOLD
        self.embeddings_db = {}
        
        # Store in media/ai/ to keep out of git
        try:
            from django.conf import settings
            ai_dir = os.path.join(settings.MEDIA_ROOT, 'ai')
        except Exception:
            ai_dir = os.path.join(
                os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
                'media', 'ai',
            )
        os.makedirs(ai_dir, exist_ok=True)
        self.embeddings_file = os.path.join(ai_dir, "face_embeddings.json")
        self.faces_dir = os.path.join(ai_dir, "enrolled_faces")
        os.makedirs(self.faces_dir, exist_ok=True)
        
        # Migrate old file from project root if it exists
        old_file = "face_embeddings.json"
        if os.path.exists(old_file) and not os.path.exists(self.embeddings_file):
            import shutil
            shutil.move(old_file, self.embeddings_file)
            logger.info(f"Migrated embeddings from {old_file} to {self.embeddings_file}")
        
        # Load face detector
        # Load detectors
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        self.eye_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_eye.xml')
        
        # Load ORB for secondary feature matching
        self.orb = cv2.ORB_create(nfeatures=500)
        self.bf_matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        
        self._load_embeddings()
        logger.info("Multi-method face verification initialized")
    
    # ------------------------------------------------------------------ IO
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
    
    # ---------------------------------------------------------- face helpers
    def capture_face_image(self, camera_index: int = 0) -> Optional[Any]:
        """Capture face image"""
        try:
            cap = cv2.VideoCapture(camera_index)
            if not cap.isOpened():
                return None
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            ret, frame = cap.read()
            cap.release()
            return frame if ret else None
        except Exception as e:
            logger.error(f"Camera error: {e}")
            return None
    
    def _extract_face_gray(self, image: Any) -> Optional[Any]:
        """Detect the largest face and return it as an equalised 200x200
        grayscale crop. Accepts RGB, BGR, or grayscale input."""
        try:
            if len(image.shape) == 2:
                gray = image
            elif image.shape[2] == 3:
                gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
            else:
                gray = image
            
            faces = self.face_cascade.detectMultiScale(
                gray, scaleFactor=1.1, minNeighbors=5, minSize=(60, 60),
            )
            
            if len(faces) > 0:
                areas = [w * h for (x, y, w, h) in faces]
                idx = int(np.argmax(areas))
                x, y, w, h = faces[idx]
                face_roi = gray[y:y+h, x:x+w]

                # --- NEW: Eye Alignment ---
                eyes = self.eye_cascade.detectMultiScale(face_roi, scaleFactor=1.1, minNeighbors=10)
                if len(eyes) >= 2:
                    # Sort by x coordinate
                    eyes = sorted(eyes, key=lambda x: x[0])
                    left_eye = (eyes[0][0] + eyes[0][2]//2, eyes[0][1] + eyes[0][3]//2)
                    right_eye = (eyes[1][0] + eyes[1][2]//2, eyes[1][1] + eyes[1][3]//2)
                    
                    # Calculate angle
                    dy = right_eye[1] - left_eye[1]
                    dx = right_eye[0] - left_eye[0]
                    angle = np.degrees(np.arctan2(dy, dx))
                    
                    # Rotate face
                    center = (float(w // 2), float(h // 2))
                    M = cv2.getRotationMatrix2D(center, float(angle), 1.0)
                    face_roi = cv2.warpAffine(face_roi, M, (w, h), flags=cv2.INTER_CUBIC)

                # Use CLAHE instead of global equalization for better local contrast
                clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
                face_eq = clahe.apply(face_roi)
                
                # Higher quality resize (INTER_AREA for downscaling, INTER_CUBIC for upscaling)
                interp = cv2.INTER_AREA if w > 200 else cv2.INTER_CUBIC
                return cv2.resize(face_eq, (200, 200), interpolation=interp)
            return None
        except Exception as e:
            logger.error(f"Face detection error: {e}")
            return None
    
    def detect_face_features(self, image: Any) -> Optional[Any]:
        """Extract basic face features. Kept for legacy callers."""
        face = self._extract_face_gray(image)
        if face is not None:
            return face.flatten().astype(np.float32) / 255.0
        return None
    
    # ------------------------------------------------- comparison methods
    def _histogram_similarity(self, face1: Any, face2: Any) -> float:
        """Compare histogram distributions of face sub-regions.
        Returns 0..1 where 1 = identical distribution."""
        scores = []
        h, w = face1.shape
        # Divide face into 4x4 grid and compare each cell's histogram
        grid = 4
        cell_h, cell_w = h // grid, w // grid
        for gy in range(grid):
            for gx in range(grid):
                r1 = face1[gy*cell_h:(gy+1)*cell_h, gx*cell_w:(gx+1)*cell_w]
                r2 = face2[gy*cell_h:(gy+1)*cell_h, gx*cell_w:(gx+1)*cell_w]
                h1 = cv2.calcHist([r1], [0], None, [64], [0, 256])
                h2 = cv2.calcHist([r2], [0], None, [64], [0, 256])
                cv2.normalize(h1, h1)
                cv2.normalize(h2, h2)
                score = cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL)
                scores.append(max(0.0, score))  # correlation can be negative
        
        return float(np.mean(scores))
    
    def _template_similarity(self, face1: Any, face2: Any) -> float:
        """Normalised cross-correlation template matching.
        Allows for small translations by searching in a padded area.
        Returns 0..1 where 1 = perfect structural match."""
        # Pad face1 (enrolled) to allow face2 (live) to shift slightly
        pad = 10
        face1_padded = cv2.copyMakeBorder(
            face1, pad, pad, pad, pad, cv2.BORDER_REPLICATE
        )
        result = cv2.matchTemplate(face1_padded, face2, cv2.TM_CCOEFF_NORMED)
        _, max_val, _, _ = cv2.minMaxLoc(result)
        return float(max(0.0, max_val))
    
    def _orb_similarity(self, face1: Any, face2: Any) -> float:
        """Compare ORB keypoint descriptors between two faces.
        Returns 0..1 based on the ratio of good matches."""
        try:
            kp1, des1 = self.orb.detectAndCompute(face1, None)
            kp2, des2 = self.orb.detectAndCompute(face2, None)
            
            if des1 is None or des2 is None or len(des1) < 5 or len(des2) < 5:
                return 0.0
            
            matches = self.bf_matcher.match(des1, des2)
            if len(matches) == 0:
                return 0.0
            
            # Sort by distance and take the best matches
            matches = sorted(matches, key=lambda m: m.distance)
            
            # Count "good" matches (distance < 50 out of max 256 for HAMMING)
            good = [m for m in matches if m.distance < 50]
            
            # Score = ratio of good matches to total possible
            max_possible = min(len(des1), len(des2))
            score = len(good) / max_possible if max_possible > 0 else 0.0
            
            return min(1.0, score)
        except Exception as e:
            logger.debug(f"ORB matching error: {e}")
            return 0.0
    
    def _compute_similarity(self, face1: Any, face2: Any) -> Tuple[float, Dict]:
        """Compute combined similarity score from multiple methods.
        Returns (score 0..1, details dict)."""
        hist_grid_score = self._histogram_similarity(face1, face2)
        
        # Global histogram (more shift-invariant than grid)
        h1 = cv2.calcHist([face1], [0], None, [128], [0, 256])
        h2 = cv2.calcHist([face2], [0], None, [128], [0, 256])
        cv2.normalize(h1, h1)
        cv2.normalize(h2, h2)
        hist_global_score = max(0.0, float(cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL)))
        
        # Combined histogram score
        hist_score = 0.7 * hist_grid_score + 0.3 * hist_global_score
        
        tmpl_score = self._template_similarity(face1, face2)
        orb_score = self._orb_similarity(face1, face2)
        
        # Weighted combination
        combined = (
            0.50 * hist_score +
            0.35 * tmpl_score +
            0.15 * orb_score
        )
        
        details = {
            "histogram_grid": round(hist_grid_score, 4),
            "histogram_global": round(hist_global_score, 4),
            "template_score": round(tmpl_score, 4),
            "orb_score": round(orb_score, 4),
            "combined_score": round(combined, 4),
        }
        
        return combined, details
    
    # -------------------------------------------------------------- enroll
    def enroll_student(self, student_id: str, image: Any,
                       force_update: bool = False) -> Tuple[bool, str]:
        """Enroll student face - saves the face image for later comparison."""
        if student_id in self.embeddings_db and not force_update:
            return False, "Already enrolled. Use force_update to re-enroll."
        
        face_gray = self._extract_face_gray(image)
        if face_gray is None:
            return False, "No face detected"
        
        # Save face image to disk for comparison during verification
        safe_id = str(student_id).replace('/', '_').replace('\\', '_')
        face_path = os.path.join(self.faces_dir, f"{safe_id}.png")
        cv2.imwrite(face_path, face_gray)
        
        is_update = student_id in self.embeddings_db
        self.embeddings_db[student_id] = {
            'face_file': face_path,
            # Keep legacy 'features' for backward compat
            'features': (face_gray.flatten().astype(np.float32) / 255.0).tolist(),
            'enrollment_date': datetime.now().isoformat(),
            'updated': is_update,
        }
        
        self._save_embeddings()
        logger.info(f"Enrolled {student_id} (multi-method verification)")
        return True, "Face updated successfully" if is_update else "Enrolled successfully"
    
    # -------------------------------------------------------------- verify
    def verify_student(self, student_id: str, image: Any) -> Tuple[bool, float, Dict[str, Any]]:
        """Verify student using multi-method face comparison.
        Auto-enrolls from profile photo if not yet enrolled."""
        
        if student_id not in self.embeddings_db:
            auto_enrolled = self._auto_enroll_from_profile(student_id)
            if not auto_enrolled:
                return False, 0.0, {
                    "error": "Not enrolled. Please enroll your face first or upload a profile photo."
                }
        
        stored = self.embeddings_db[student_id]
        
        # Load the enrolled face image
        face_path = stored.get('face_file')
        if not face_path or not os.path.exists(face_path):
            # Try re-enrolling from profile photo
            logger.info(f"Enrolled face file missing for {student_id}, re-enrolling")
            re_enrolled = self._auto_enroll_from_profile(student_id)
            if not re_enrolled:
                return False, 0.0, {
                    "error": "Enrolled face file missing. Please re-enroll or upload a profile photo."
                }
            stored = self.embeddings_db[student_id]
            face_path = stored.get('face_file')
        
        # Ensure path is valid even if DB was migrated or student ID had slashes
        if face_path and not os.path.exists(face_path):
             safe_id = str(student_id).replace('/', '_').replace('\\', '_')
             face_path = os.path.join(self.faces_dir, f"{safe_id}.png")
             if not os.path.exists(face_path):
                  face_path = stored.get('face_file') # Revert to original for error message
        
        
        enrolled_face = cv2.imread(face_path, cv2.IMREAD_GRAYSCALE)
        if enrolled_face is None:
            return False, 0.0, {"error": "Could not read enrolled face image."}
        enrolled_face = cv2.resize(enrolled_face, (200, 200))
        
        # Extract face from the live camera image
        live_face = self._extract_face_gray(image)
        if live_face is None:
            return False, 0.0, {"error": "No face detected in camera image"}
        
        # Multi-method comparison
        score, method_details = self._compute_similarity(enrolled_face, live_face)
        
        verified = score >= self.match_threshold
        
        details = {
            **method_details,
            "threshold": self.match_threshold,
            "method": "multi_method",
            "timestamp": datetime.now().isoformat(),
        }
        
        if not verified:
            details["reason"] = (
                f"Face does not match enrolled student (Score {score:.3f}). "
                f"Tip: If you recently updated the app, please re-enroll your face "
                f"to update your biometric signature."
            )
        
        logger.info(
            f"Verify {student_id}: match={verified}, score={score:.4f}, "
            f"hist_g={method_details['histogram_grid']}, "
            f"tmpl={method_details['template_score']}"
        )
        
        return verified, score, details
    
    # ------------------------------------------------ auto-enroll fallback
    def _auto_enroll_from_profile(self, student_id: str) -> bool:
        """Try to auto-enroll a student using their profile photo."""
        try:
            import os
            from django.conf import settings
            from users.models import Student
            
            student = Student.objects.get(university_id=student_id)
            if not student.user.profile_photo:
                logger.info(f"No profile photo for {student_id}")
                return False
            
            photo_path = os.path.join(settings.MEDIA_ROOT, student.user.profile_photo.name)
            if not os.path.exists(photo_path):
                logger.info(f"Profile photo file missing for {student_id}: {photo_path}")
                return False
            
            # Read image and extract features
            img = cv2.imread(photo_path)
            if img is None:
                logger.error(f"Could not read profile photo for {student_id}")
                return False
            
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            success, msg = self.enroll_student(student_id, img_rgb, force_update=True)
            logger.info(f"Auto-enroll from profile photo for {student_id}: {success} - {msg}")
            return success
        except Exception as e:
            logger.error(f"Auto-enroll failed for {student_id}: {e}")
            return False


# Factory function to handle dependency issues
def create_face_verifier():
    """Create face verifier with fallback"""
    try:
        from ai_services.face_recognition.face_verification import FaceVerification
        return FaceVerification()
    except ImportError:
        logger.warning("Using lightweight face verifier (full version not available)")
        return LightFaceVerification()
