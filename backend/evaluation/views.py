from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import json
import logging

# Create your views here.
from rest_framework import generics, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import WeeklyReport, AIEvaluation, SupervisorEvaluation
from .serializers import WeeklyReportSerializer, AIEvaluationSerializer, SupervisorEvaluationSerializer
from users.models import Student

logger = logging.getLogger(__name__)



class WeeklyReportListCreateView(generics.ListCreateAPIView):
    serializer_class = WeeklyReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            try:
                student = Student.objects.get(user=user)
                return WeeklyReport.objects.filter(student=student)
            except Student.DoesNotExist:
                return WeeklyReport.objects.none()
        elif user.role == 'supervisor':
            return WeeklyReport.objects.filter(student__supervisor_assignment__supervisor=user, student__supervisor_assignment__is_active=True)
        elif user.role == 'company_admin':
            # Filter by students assigned to organizations created by this company admin
            return WeeklyReport.objects.filter(student__supervisor_assignment__organization__created_by=user)
        return WeeklyReport.objects.all()
    
    def perform_create(self, serializer):
        if self.request.user.role == 'student':
            try:
                student = Student.objects.get(user=self.request.user)
                report = serializer.save(student=student)
                
                # Try Celery async first; fall back to synchronous evaluation
                try:
                    from ai_services.tasks import evaluate_report_async
                    evaluate_report_async.delay(report.report_id)
                    logger.info(f"Triggered background AI evaluation for report {report.report_id}")
                except Exception as celery_err:
                    logger.warning(f"Celery unavailable ({celery_err}), running evaluation synchronously")
                    try:
                        from ai_services import get_report_evaluator
                        from evaluation.models import AIEvaluation
                        evaluator = get_report_evaluator()
                        report_text = f"{report.title}\n{report.content}\n{report.tasks_completed}"
                        result = evaluator.evaluate_report(report_text)
                        scores = result.get('score_breakdown', {})
                        AIEvaluation.objects.update_or_create(
                            report=report,
                            defaults={
                                'clarity_score': scores.get('grammar_clarity', scores.get('content_quality', 0.5)) * 10,
                                'completeness_score': scores.get('content_quality', scores.get('report_length', 0.5)) * 10,
                                'relevance_score': scores.get('semantic_relevance', scores.get('content_quality', 0.5)) * 10,
                                'grammar_score': scores.get('writing_structure', scores.get('report_length', 0.5)) * 10,
                                'overall_score': result.get('ai_score', 0.5) * 10,
                                'feedback_summary': result.get('ai_feedback', 'Evaluation completed.'),
                                'confidence_level': result.get('confidence_level', 0.8),
                            }
                        )
                        logger.info(f"Synchronous AI evaluation saved for report {report.report_id}")
                    except Exception as sync_err:
                        logger.error(f"Synchronous evaluation failed for report {report.report_id}: {sync_err}")

            except Student.DoesNotExist:
                raise serializers.ValidationError("Student profile not found")

class WeeklyReportDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = WeeklyReport.objects.all()
    serializer_class = WeeklyReportSerializer
    permission_classes = [permissions.IsAuthenticated]

class AIEvaluationCreateView(generics.CreateAPIView):
    queryset = AIEvaluation.objects.all()
    serializer_class = AIEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

class SupervisorEvaluationCreateView(generics.CreateAPIView):
    queryset = SupervisorEvaluation.objects.all()
    serializer_class = SupervisorEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        report_id = self.request.data.get('report')
        report = WeeklyReport.objects.get(report_id=report_id)
        
        # Use update_or_create to allow editing
        evaluation, created = SupervisorEvaluation.objects.update_or_create(
            report=report,
            defaults=serializer.validated_data
        )
        # We manually call save/update logic because update_or_create doesn't trigger the same as serializer.save() in some cases
        # But since we have the instance 'evaluation', we can proceed.
        # Actually, let's just use the evaluation object.
        
        # Determine status based on final_score (e.g. >= 50 is approved)
        # Or let the frontend pass 'remarks' or a specific status if needed. Assumed approved for now.
        if evaluation.final_score >= 5.0:
            report.status = 'approved'
        else:
            report.status = 'revision'
        report.save()
        
        # Notify the student
        from users.models import Notification, User
        Notification.objects.create(
            recipient=report.student.user,
            title=f"Report Evaluated: Week {report.week_number}",
            description=f"Your supervisor has evaluated your weekly report. Your score is {evaluation.final_score}/10.",
            type='success' if report.status == 'approved' else 'warning',
            action_link='/report-history'
        )

        # Notify Uni Admin
        from users.models import User
        supervisor_name = evaluation.supervisor.full_name if evaluation.supervisor else "A Supervisor"
        student_name = report.student.user.full_name or report.student.user.username
        
        User.notify_university_admins(
            title="Report Evaluated",
            description=f"Supervisor {supervisor_name} graded student {student_name}'s report for Week {report.week_number}. Score: {evaluation.final_score}/10.",
            type='info'
        )
        
        # Send Email
        try:
            from django.conf import settings
            if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                from django.core.mail import send_mail
                send_mail(
                    f'AIMS - Report Evaluated',
                    f'Hello {report.student.user.full_name or report.student.user.username},\n\nYour weekly report for Week {report.week_number} has been evaluated by your supervisor.\n\nFinal Score: {evaluation.final_score}/10\nStatus: {report.status.upper()}\n\nRemarks: {evaluation.remarks}\n\nLog in to AIMS to view more details.\n\nBest,\nThe AIMS Team',
                    settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                    [report.student.user.email],
                    fail_silently=True,
                )
        except Exception:
            pass

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def trigger_report_evaluation(request, report_id):
    """Manual trigger for background AI evaluation"""
    try:
        report = WeeklyReport.objects.get(report_id=report_id)
        try:
            from ai_services.tasks import evaluate_report_async
            evaluate_report_async.delay(report.report_id)
            return Response({'message': 'Background evaluation triggered'}, status=status.HTTP_202_ACCEPTED)
        except Exception as celery_err:
            logger.warning(f"Celery unavailable ({celery_err}), running evaluation synchronously")
            try:
                from ai_services import get_report_evaluator
                from evaluation.models import AIEvaluation
                evaluator = get_report_evaluator()
                report_text = f"{report.title}\n{report.content}\n{report.tasks_completed}"
                result = evaluator.evaluate_report(report_text)
                scores = result.get('score_breakdown', {})
                AIEvaluation.objects.update_or_create(
                    report=report,
                    defaults={
                        'clarity_score': scores.get('grammar_clarity', scores.get('content_quality', 0.5)) * 10,
                        'completeness_score': scores.get('content_quality', scores.get('report_length', 0.5)) * 10,
                        'relevance_score': scores.get('semantic_relevance', scores.get('content_quality', 0.5)) * 10,
                        'grammar_score': scores.get('writing_structure', scores.get('report_length', 0.5)) * 10,
                        'overall_score': result.get('ai_score', 0.5) * 10,
                        'feedback_summary': result.get('ai_feedback', 'Evaluation completed.'),
                        'confidence_level': result.get('confidence_level', 0.8),
                    }
                )
                return Response({'message': 'Synchronous evaluation completed'}, status=status.HTTP_200_OK)
            except Exception as sync_err:
                logger.error(f"Synchronous evaluation failed: {sync_err}")
                return Response({'error': 'Evaluation failed.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except WeeklyReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_ai_evaluation(request, report_id):
    """Get AI evaluation for a specific report"""
    try:
        report = WeeklyReport.objects.get(report_id=report_id)
        try:
            ai_eval = report.ai_evaluation
            serializer = AIEvaluationSerializer(ai_eval)
            return Response(serializer.data)
        except AIEvaluation.DoesNotExist:
            return Response({'error': 'AI evaluation not yet available'}, status=status.HTTP_404_NOT_FOUND)
    except WeeklyReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_supervisor_evaluation(request, report_id):
    """Get supervisor evaluation for a specific report"""
    try:
        report = WeeklyReport.objects.get(report_id=report_id)
        try:
            sup_eval = report.supervisor_evaluation
            serializer = SupervisorEvaluationSerializer(sup_eval)
            return Response(serializer.data)
        except SupervisorEvaluation.DoesNotExist:
            return Response({'error': 'Supervisor evaluation not yet available'}, status=status.HTTP_404_NOT_FOUND)
    except WeeklyReport.DoesNotExist:
        return Response({'error': 'Report not found'}, status=status.HTTP_404_NOT_FOUND)

class SupervisorEvaluationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SupervisorEvaluation.objects.all()
    serializer_class = SupervisorEvaluationSerializer
    permission_classes = [permissions.IsAuthenticated]
