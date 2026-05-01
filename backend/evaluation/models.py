from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from users.models import Student, User
from internships.models import SupervisorAssignment

class WeeklyReport(models.Model):
    report_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='weekly_reports')
    week_number = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(52)])
    title = models.CharField(max_length=255)
    content = models.TextField()
    tasks_completed = models.TextField()
    challenges_faced = models.TextField(blank=True, null=True)
    lessons_learned = models.TextField(blank=True, null=True)
    submitted_date = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=50, default='pending', choices=(
        ('pending', 'Pending Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
        ('revision', 'Revision Requested'),
    ))
    supervisor_feedback = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'weekly_reports'
        unique_together = ['student', 'week_number']
    
    def __str__(self):
        return f"Week {self.week_number} - {self.student.university_id}"

class AIEvaluation(models.Model):
    ai_eval_id = models.AutoField(primary_key=True)
    report = models.OneToOneField(WeeklyReport, on_delete=models.CASCADE, related_name='ai_evaluation')
    clarity_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    completeness_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    relevance_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    grammar_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    overall_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    feedback_summary = models.TextField()
    confidence_level = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(1.0)])
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'ai_evaluations'
    
    def __str__(self):
        return f"AI Evaluation - {self.report}"

class SupervisorEvaluation(models.Model):
    eval_id = models.AutoField(primary_key=True)
    report = models.OneToOneField(WeeklyReport, on_delete=models.CASCADE, related_name='supervisor_evaluation')
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='evaluations')
    technical_skill = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    communication = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    teamwork = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    initiative = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    overall_performance = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    final_score = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(10.0)])
    remarks = models.TextField(blank=True, null=True)
    evaluation_date = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'supervisor_evaluations'
    
    def __str__(self):
        return f"Supervisor Evaluation - {self.report}"
