from django.db import models
from django.utils import timezone
from users.models import Student, User

class Attendance(models.Model):
    STATUS_CHOICES = (
        ('present', 'Present'),
        ('absent', 'Absent'),
        ('late', 'Late'),
        ('excused', 'Excused'),
        ('pending', 'Pending Verification'),
    )
    
    VERIFICATION_CHOICES = (
        ('face_gps', 'Face + GPS Verified'),
        ('manual', 'Manually Verified'),
        ('failed', 'Verification Failed'),
        ('processing', 'AI Processing'),
    )
    
    attendance_id = models.AutoField(primary_key=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendance_records')
    date = models.DateField(default=timezone.now)
    check_in_time = models.DateTimeField()
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    gps_latitude = models.FloatField(null=True, blank=True)
    gps_longitude = models.FloatField(null=True, blank=True)
    verification_method = models.CharField(max_length=50, choices=VERIFICATION_CHOICES)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES)
    approved_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_attendances')
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'attendance'
        unique_together = ['student', 'date']
    
    def __str__(self):
        return f"{self.student.university_id} - {self.date}"
