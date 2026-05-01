from django.db import models
from django.utils import timezone
from users.models import User, Student
from organizations.models import Organization, InternshipPost

class Application(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('offered', 'Offered'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('declined', 'Declined'),
    )
    
    application_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='applications')
    post = models.ForeignKey(InternshipPost, on_delete=models.CASCADE, related_name='applications')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    applied_date = models.DateTimeField(default=timezone.now)
    cover_letter = models.TextField(blank=True, null=True)
    resume = models.FileField(upload_to='resumes/', blank=True, null=True)
    notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'applications'
        unique_together = ['student', 'post']
    
    def __str__(self):
        return f"{self.student.university_id} - {self.post.title}"

class SupervisorAssignment(models.Model):
    assignment_id = models.AutoField(primary_key=True)
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='supervisor_assignments', null=True, blank=True)
    student = models.OneToOneField(Student, on_delete=models.CASCADE, related_name='supervisor_assignment')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='supervisor_assignments')
    assigned_date = models.DateField(default=timezone.now)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        db_table = 'supervisor_assignments'
    
    def __str__(self):
        return f"{self.supervisor.username if self.supervisor else 'No Sup'} - {self.student.university_id}"


class StudentTask(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    )

    task_id = models.AutoField(primary_key=True)
    supervisor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_tasks'

    def __str__(self):
        return f"{self.title} - {self.student.university_id}"
