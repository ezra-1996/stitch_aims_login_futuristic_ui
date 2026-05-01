from django.contrib import admin
from .models import WeeklyReport, AIEvaluation, SupervisorEvaluation

@admin.register(WeeklyReport)
class WeeklyReportAdmin(admin.ModelAdmin):
    list_display = ['student', 'week_number', 'title', 'submitted_date']

@admin.register(AIEvaluation)
class AIEvaluationAdmin(admin.ModelAdmin):
    list_display = ['report', 'overall_score', 'confidence_level', 'created_at']

@admin.register(SupervisorEvaluation)
class SupervisorEvaluationAdmin(admin.ModelAdmin):
    list_display = ['report', 'supervisor', 'final_score', 'evaluation_date']
