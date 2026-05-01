"""
AI Services Package
Provides face recognition and NLP evaluation for AIMS
"""

__version__ = "1.0.0"
__author__ = "AIMS Project Team"

import logging
logger = logging.getLogger(__name__)

# Import main classes with fallback handling
AI_FULL_VERSION = True

try:
    from .face_recognition.dlib_face_verifier import DlibFaceVerifier as FaceVerification
    HAS_LOCAL_AI = True
except Exception:
    try:
        from .face_recognition.gemini_face_verifier import GeminiFaceVerifier as FaceVerification
        HAS_LOCAL_AI = False
    except Exception:
        try:
            from .face_recognition.face_verification_light import LightFaceVerification as FaceVerification
            HAS_LOCAL_AI = False
        except Exception:
            FaceVerification = None
            HAS_LOCAL_AI = False

try:
    from .nlp_evaluation.gemini_evaluator import AdvancedReportEvaluator
except Exception:
    AdvancedReportEvaluator = None

try:
    from .human_review.supervisor_review import SupervisorReview
except Exception:
    SupervisorReview = None

def get_face_verifier():
    # 1. High-Precision Local (Dlib/FaceRecognition)
    try:
        from .face_recognition.dlib_face_verifier import DlibFaceVerifier
        return DlibFaceVerifier(distance_threshold=0.55)
    except Exception:
        # 2. Multimodal Cloud (Gemini)
        try:
            from .face_recognition.gemini_face_verifier import GeminiFaceVerifier
            return GeminiFaceVerifier(distance_threshold=0.6)
        except Exception:
            # 3. Fast Local Fallback (Haarcascade/LBPH)
            try:
                from .face_recognition.face_verification_light import LightFaceVerification
                return LightFaceVerification()
            except Exception:
                return None

def get_report_evaluator():
    from .nlp_evaluation.gemini_evaluator import AdvancedReportEvaluator
    return AdvancedReportEvaluator()

__all__ = [
    'FaceVerification', 'AdvancedReportEvaluator', 'SupervisorReview',
    'get_face_verifier', 'get_report_evaluator', 'AI_FULL_VERSION'
]
