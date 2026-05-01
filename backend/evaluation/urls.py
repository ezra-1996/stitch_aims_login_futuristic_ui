from django.urls import path
from . import views

urlpatterns = [
    path('weekly-reports/', views.WeeklyReportListCreateView.as_view(), name='weekly-report-list'),
    path('weekly-reports/<int:pk>/', views.WeeklyReportDetailView.as_view(), name='weekly-report-detail'),
    path('weekly-reports/<int:report_id>/evaluate/', views.trigger_report_evaluation, name='evaluate-report-ai'),
    path('weekly-reports/<int:report_id>/ai-evaluation/', views.get_ai_evaluation, name='get-ai-evaluation'),
    path('weekly-reports/<int:report_id>/supervisor-evaluation/', views.get_supervisor_evaluation, name='get-supervisor-evaluation'),
    path('ai-evaluations/', views.AIEvaluationCreateView.as_view(), name='ai-evaluation-list'),
    path('supervisor-evaluations/', views.SupervisorEvaluationCreateView.as_view(), name='supervisor-evaluation-list'),
    path('supervisor-evaluations/<int:pk>/', views.SupervisorEvaluationDetailView.as_view(), name='supervisor-evaluation-detail'),
]
