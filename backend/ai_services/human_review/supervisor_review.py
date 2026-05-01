"""
Human-in-the-loop system for AI evaluation review
Now persists review history to the database via SupervisorEvaluation model.
"""

import logging
from typing import Dict, Any, List
from datetime import datetime

logger = logging.getLogger(__name__)

class SupervisorReview:
    """
    Human review system for AI-generated evaluations.
    Review history is persisted to the database via the SupervisorEvaluation model.
    """
    
    def __init__(self):
        pass
    
    def review_evaluation(self, 
                         ai_result: Dict, 
                         supervisor_id: str,
                         final_score: float = None,
                         approved: bool = None,
                         supervisor_notes: str = "") -> Dict[str, Any]:
        """
        Supervisor review of evaluation
        """
        if final_score is None:
            final_score = ai_result.get('ai_score', 0.5)
        
        if approved is None:
            approved = True
        
        review_record = {
            'timestamp': datetime.now().isoformat(),
            'supervisor_id': supervisor_id,
            'ai_score': ai_result.get('ai_score', 0.5),
            'final_score': final_score,
            'approved': approved,
            'supervisor_notes': supervisor_notes,
            'score_adjustment': final_score - ai_result.get('ai_score', 0.5)
        }
        
        # Persist to database
        try:
            from evaluation.models import SupervisorEvaluation, WeeklyReport
            from users.models import User
            
            report_id = ai_result.get('report_id')
            if report_id:
                report = WeeklyReport.objects.get(report_id=report_id)
                supervisor = User.objects.get(pk=supervisor_id)
                SupervisorEvaluation.objects.update_or_create(
                    report=report,
                    defaults={
                        'supervisor': supervisor,
                        'technical_skill': final_score,
                        'communication': final_score,
                        'teamwork': final_score,
                        'initiative': final_score,
                        'overall_performance': final_score,
                        'final_score': final_score,
                        'remarks': supervisor_notes,
                    }
                )
                logger.info(f"Review persisted to DB for report {report_id}")
        except Exception as e:
            logger.warning(f"Could not persist review to DB: {e}. Record kept in-memory only.")
        
        final_result = {
            **ai_result,
            'final_score': final_score,
            'approved': approved,
            'supervisor_review': review_record,
            'review_timestamp': review_record['timestamp']
        }
        
        logger.info(f"Supervisor review completed")
        return final_result
    
    def get_review_history(self, student_id: str = None) -> List[Dict]:
        """
        Get review history from the database.
        """
        try:
            from evaluation.models import SupervisorEvaluation
            
            qs = SupervisorEvaluation.objects.all().order_by('-evaluation_date')
            if student_id:
                qs = qs.filter(report__student__university_id=student_id)
            
            return [
                {
                    'eval_id': e.eval_id,
                    'report_id': e.report_id,
                    'supervisor_id': e.supervisor_id,
                    'final_score': e.final_score,
                    'remarks': e.remarks,
                    'timestamp': e.evaluation_date.isoformat()
                }
                for e in qs[:50]
            ]
        except Exception as e:
            logger.warning(f"Could not fetch review history from DB: {e}")
            return []
