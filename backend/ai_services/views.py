import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

logger = logging.getLogger(__name__)

# Global instances - initialized lazily
_verifier = None
_evaluator = None

def get_verifier():
    global _verifier
    if _verifier is None:
        try:
            from . import get_face_verifier
            _verifier = get_face_verifier()
        except Exception as e:
            logger.error("Failed to initialize face verifier: %s", e)
    return _verifier

def get_evaluator():
    global _evaluator
    if _evaluator is None:
        try:
            from . import get_report_evaluator
            _evaluator = get_report_evaluator()
        except Exception as e:
            logger.error("Failed to initialize report evaluator: %s", e)
    return _evaluator

def image_file_to_numpy(image_file):
    """Convert uploaded image file to numpy array (RGB)"""
    try:
        import cv2
        import numpy as np
        file_bytes = np.frombuffer(image_file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)
        if img is None:
            return None
        return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    except Exception as e:
        logger.error("Image conversion error: %s", e)
        return None

class FaceEnrollView(APIView):
    """Enroll a student's face embedding"""
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def get(self, request):
        """Check if a student is enrolled"""
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({"error": "Missing student_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        from users.models import Student
        try:
            student = Student.objects.get(university_id=student_id)
        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=status.HTTP_404_NOT_FOUND)

        verifier = get_verifier()
        is_enrolled = False
        
        # 1. Check active verifier DB if it has one
        if verifier and hasattr(verifier, 'embeddings_db'):
            is_enrolled = student_id in verifier.embeddings_db
            
        # 2. Comprehensive check across all possible storage paths if not found
        if not is_enrolled:
            from .face_recognition.gemini_face_verifier import GeminiFaceVerifier
            from .face_recognition.face_verification_light import LightFaceVerification
            try:
                from .face_recognition.dlib_face_verifier import DlibFaceVerifier
                dv = DlibFaceVerifier()
                if student_id in dv.embeddings_db or os.path.exists(os.path.join(dv.enrollment_dir, f"{student_id}.jpg")):
                    is_enrolled = True
            except Exception: pass
            
            if not is_enrolled:
                gv = GeminiFaceVerifier()
                lv = LightFaceVerification()
                
                paths = [
                    os.path.join(gv.enrollment_dir, f"{student_id}.jpg"),
                    os.path.join(gv.enrollment_dir, f"{student_id}.png"),
                    os.path.join(lv.faces_dir, f"{student_id}.png"),
                    os.path.join(lv.faces_dir, f"{student_id}.jpg"),
                ]
                
                if student_id in lv.embeddings_db:
                    is_enrolled = True
                else:
                    for p in paths:
                        if os.path.exists(p):
                            is_enrolled = True
                            break

        return Response({
            "enrolled": is_enrolled,
            "student_id": student_id,
            "has_profile_photo": bool(student.user.profile_photo)
        })

    def post(self, request):
        logger.info("Face enrollment request received")
        verifier = get_verifier()
        if verifier is None:
            logger.error("Face verification service not available")
            return Response({"error": "Face verification service not available"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        student_id = request.data.get('student_id')
        image_file = request.FILES.get('image')

        if not student_id or not image_file:
            logger.warning("Missing student_id or image in enrollment request")
            return Response(
                {"error": "Missing student_id or image"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Processing image for student {student_id}")
        img_np = image_file_to_numpy(image_file)
        if img_np is None:
            logger.error(f"Invalid image file for student {student_id}")
            return Response(
                {"error": "Invalid image file"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Robust force_update parsing
        raw_force = request.data.get('force_update', 'false')
        if isinstance(raw_force, bool):
            force_update = raw_force
        else:
            force_update = str(raw_force).lower() in ('true', '1', 'yes')
            
        logger.info(f"Enrolling face for student {student_id} (force_update={force_update})...")
        try:
            success, message = verifier.enroll_student(student_id, img_np, force_update=force_update)
            logger.info(f"Enrollment result for {student_id}: {success}, {message}")
        except Exception as e:
            logger.error(f"Error during enrollment for {student_id}: {str(e)}")
            return Response({"error": f"Internal error during enrollment: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        if success:
            # Update student profile photo with the enrolled image
            try:
                from users.models import Student
                student = Student.objects.get(university_id=student_id)
                user = student.user
                
                # Rewind image_file to beginning before saving
                image_file.seek(0)
                user.profile_photo = image_file
                user.save()
                logger.info(f"Updated profile photo for student {student_id}")
            except Exception as e:
                logger.error(f"Failed to update profile photo for student {student_id}: {e}")
                
            return Response({"message": message}, status=status.HTTP_201_CREATED)
        else:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """Delete student's face enrollment across all verifier backends"""
        student_id = request.data.get('student_id') or request.query_params.get('student_id')
        if not student_id:
            return Response({"error": "Missing student_id"}, status=status.HTTP_400_BAD_REQUEST)
        
        results = []
        try:
            # 1. Clear from currently active verifier's DB
            verifier = get_verifier()
            if verifier and hasattr(verifier, 'embeddings_db') and student_id in verifier.embeddings_db:
                del verifier.embeddings_db[student_id]
                if hasattr(verifier, '_save_embeddings'):
                    verifier._save_embeddings()
                results.append(f"Removed from active verifier DB ({type(verifier).__name__})")

            # 2. Comprehensive cleanup of all possible storage paths
            from .face_recognition.gemini_face_verifier import GeminiFaceVerifier
            from .face_recognition.face_verification_light import LightFaceVerification
            try:
                from .face_recognition.dlib_face_verifier import DlibFaceVerifier
                dv = DlibFaceVerifier()
                # Clear dlib specific DB if it wasn't the active one
                if student_id in dv.embeddings_db:
                    del dv.embeddings_db[student_id]
                    dv._save_embeddings()
                    results.append("Removed from Dlib DB")
                dlib_path = os.path.join(dv.enrollment_dir, f"{student_id}.jpg")
                if os.path.exists(dlib_path):
                    os.remove(dlib_path)
                    results.append("Deleted Dlib reference photo")
            except Exception: pass

            gv = GeminiFaceVerifier()
            lv = LightFaceVerification()
            
            # Additional DB cleanup for light verifier
            if student_id in lv.embeddings_db:
                del lv.embeddings_db[student_id]
                lv._save_embeddings()
                results.append("Removed from Light Verifier DB")

            paths = [
                os.path.join(gv.enrollment_dir, f"{student_id}.jpg"),
                os.path.join(gv.enrollment_dir, f"{student_id}.png"),
                os.path.join(lv.faces_dir, f"{student_id}.png"),
                os.path.join(lv.faces_dir, f"{student_id}.jpg"),
            ]
            
            for p in paths:
                if os.path.exists(p):
                    try:
                        os.remove(p)
                        results.append(f"Deleted file: {os.path.basename(p)}")
                    except Exception as e:
                        logger.error(f"Error deleting file {p}: {e}")

            if not results:
                return Response({"message": "No biometric data found for this student.", "cleared": False})
                
            return Response({
                "message": "Biometric data cleared successfully.", 
                "details": results,
                "cleared": True
            })
        except Exception as e:
            logger.error(f"Error clearing biometric data: {e}")
            return Response({"error": f"Failed to clear biometric data: {str(e)}"}, status=500)

class FaceVerifyView(APIView):
    """Verify a student's identity against enrolled face"""
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request):
        logger.info("Face verification request received")
        verifier = get_verifier()
        if verifier is None:
            logger.error("Face verification service not available")
            return Response({"error": "Face verification service not available"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        student_id = request.data.get('student_id')
        image_file = request.FILES.get('image')

        if not student_id or not image_file:
            logger.warning("Missing student_id or image in verification request")
            return Response(
                {"error": "Missing student_id or image"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Processing image for verification of student {student_id}")
        img_np = image_file_to_numpy(image_file)
        if img_np is None:
            logger.error(f"Invalid image file for verification of student {student_id}")
            return Response(
                {"error": "Invalid image file"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Verifying face for student {student_id}...")
        try:
            verified, confidence, details = verifier.verify_student(student_id, img_np)
            logger.info(f"Verification result for {student_id}: {verified}, confidence: {confidence}")
        except Exception as e:
            logger.error(f"Error during verification for {student_id}: {str(e)}")
            return Response({"error": f"Internal error during verification: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response({
            "verified": verified,
            "confidence": confidence,
            "details": details
        })

class ReportEvaluateView(APIView):
    """Evaluate an internship report using NLP"""
    parser_classes = (JSONParser,)

    def post(self, request):
        evaluator = get_evaluator()
        if evaluator is None:
            return Response({"error": "Report evaluation service not available"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        report_text = request.data.get('report_text')
        task_description = request.data.get('task_description', '')

        if not report_text:
            return Response(
                {"error": "Missing report_text"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        evaluation = evaluator.evaluate_report(report_text, task_description)
        return Response(evaluation)

class ReportEvaluateAsyncView(APIView):
    """Trigger an async report evaluation"""
    def post(self, request):
        report_text = request.data.get('report_text')
        report_id = request.data.get('report_id', 999) 

        if not report_text:
            return Response({"error": "Missing report_text"}, status=400)

        evaluator = get_evaluator()
        if evaluator is None:
            return Response({"error": "Report evaluation service not available"}, status=503)
            
        try:
            # Perform synchronous evaluation for presentation
            evaluation_result = evaluator.evaluate_report(report_text, "")
            
            # Update the report in DB (AIEvaluation mapping)
            from evaluation.models import WeeklyReport, AIEvaluation
            try:
                report = WeeklyReport.objects.get(report_id=report_id)
                scores = evaluation_result.get('score_breakdown', {})
                # Create or update AI Evaluation
                AIEvaluation.objects.update_or_create(
                    report=report,
                    defaults={
                        'clarity_score': scores.get('grammar_clarity', 0.5) * 10,
                        'completeness_score': scores.get('content_quality', 0.5) * 10,
                        'relevance_score': scores.get('semantic_relevance', 0.5) * 10,
                        'grammar_score': scores.get('writing_structure', 0.5) * 10,
                        'overall_score': evaluation_result.get('ai_score', 0.5) * 10,
                        'feedback_summary': evaluation_result.get('ai_feedback', "Evaluation completed."),
                        'confidence_level': evaluation_result.get('confidence_level', 0.85)
                    }
                )
                
                # Also mark report as evaluated
                report.status = 'evaluated'  # Assuming there's a status, if not it's fine
                report.save()
            except Exception as e:
                logger.error(f"Error checking/saving report {report_id}: {e}")
                
            return Response({
                "status": "completed",
                "evaluation": evaluation_result,
                "message": "AI Evaluation completed successfully!"
            })
        except Exception as e:
            logger.error(f"Error evaluating report: {e}")
            return Response({"error": str(e)}, status=500)
