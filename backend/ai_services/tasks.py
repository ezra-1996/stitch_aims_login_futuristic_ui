from celery import shared_task
import logging
import os
from django.utils import timezone

logger = logging.getLogger(__name__)

@shared_task
def evaluate_report_async(report_id, task_description=""):
    """
    Async task to evaluate a weekly report using AI and save to database.
    """
    from evaluation.models import WeeklyReport, AIEvaluation
    from ai_services import get_report_evaluator
    
    try:
        report = WeeklyReport.objects.get(report_id=report_id)
        logger.info(f"Starting async evaluation for report {report_id}")
        
        # Initialize evaluator (uses factory — falls back to light version if SBERT unavailable)
        evaluator = get_report_evaluator()
        
        # Combine content fields for evaluation
        report_text = f"{report.title}\n{report.content}\n{report.tasks_completed}"
        
        # Run AI Evaluation (The heavy part)
        evaluation_result = evaluator.evaluate_report(report_text, task_description)
        
        # Map AI results to AIEvaluation model scores (SBERT 0-1 mapped to 0-10)
        scores = evaluation_result.get('score_breakdown', {})
        
        # Create or update AI Evaluation
        ai_eval, created = AIEvaluation.objects.update_or_create(
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
        
        logger.info(f"Completed and saved async evaluation for report {report_id}")
        return {"status": "success", "report_id": report_id, "ai_eval_id": ai_eval.ai_eval_id}
        
    except WeeklyReport.DoesNotExist:
        logger.error(f"Report {report_id} not found for async evaluation")
        return {"status": "error", "message": "Report not found"}
    except Exception as e:
        logger.error(f"Async evaluation failed for report {report_id}: {str(e)}")
        return {"status": "error", "message": str(e)}

@shared_task
def process_face_verification_async(attendance_id, student_id, image_path):
    """
    Async task for intensive face verification.
    """
    from attendance.models import Attendance
    import cv2
    
    try:
        attendance = Attendance.objects.get(attendance_id=attendance_id)
        logger.info(f"Starting async face verification for attendance {attendance_id}")
        
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image at {image_path}")
        
        # Convert to RGB as expected by verifier
        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        
        from ai_services import get_face_verifier
        verifier = get_face_verifier()
        verified, confidence, details = verifier.verify_student(student_id, img_rgb)
        
        # Update attendance record based on result
        if verified:
            attendance.status = 'present'
            attendance.verification_method = 'face_gps'
            attendance.notes = f"AI Verified (Confidence: {confidence:.2f})"
        else:
            attendance.status = 'absent'
            attendance.verification_method = 'failed'
            attendance.notes = f"AI Verification Failed: {details} (Confidence: {confidence:.2f})"
            
        attendance.save()
        
        # Clean up temporary image file if needed
        # if os.path.exists(image_path): os.remove(image_path)
        
        return {"status": "success", "verified": verified, "confidence": confidence}
        
    except Exception as e:
        logger.error(f"Async face verification failed: {str(e)}")
        return {"status": "error", "message": str(e)}
