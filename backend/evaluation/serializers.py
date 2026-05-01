from rest_framework import serializers
from .models import WeeklyReport, AIEvaluation, SupervisorEvaluation

class WeeklyReportSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    grade = serializers.FloatField(source='supervisor_evaluation.final_score', read_only=True)
    ai_score = serializers.FloatField(source='ai_evaluation.overall_score', read_only=True)
    
    class Meta:
        model = WeeklyReport
        fields = '__all__'
        read_only_fields = ['report_id', 'submitted_date', 'student']

class AIEvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIEvaluation
        fields = '__all__'
        read_only_fields = ['ai_eval_id', 'created_at']

class SupervisorEvaluationSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source='supervisor.full_name', read_only=True)
    
    class Meta:
        model = SupervisorEvaluation
        fields = '__all__'
        read_only_fields = ['eval_id', 'evaluation_date']
