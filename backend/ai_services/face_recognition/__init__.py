"""
Face Recognition Module
"""

try:
    from .face_verification import FaceVerification
    HAS_FULL_FACE_RECOGNITION = True
except Exception:
    HAS_FULL_FACE_RECOGNITION = False

from .face_verification_light import LightFaceVerification

__all__ = ['FaceVerification', 'LightFaceVerification', 'HAS_FULL_FACE_RECOGNITION']
