from django.db import models
from django.utils import timezone
from users.models import User

class Organization(models.Model):
    STATUS_CHOICES = (
        ('approved', 'Approved'),
        ('pending', 'Pending'),
        ('rejected', 'Rejected'),
    )
    
    org_id = models.AutoField(primary_key=True)
    org_name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    address = models.TextField()
    contact_email = models.EmailField()
    contact_phone = models.CharField(max_length=20)
    website = models.URLField(blank=True, null=True)
    industry = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_organizations')
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'organizations'
    
    def __str__(self):
        return self.org_name

class InternshipPost(models.Model):
    post_id = models.AutoField(primary_key=True)
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='internship_posts')
    title = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField()
    duration_months = models.IntegerField(default=3)
    capacity = models.IntegerField(default=1)
    is_active = models.BooleanField(default=True)
    application_deadline = models.DateField()
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'internship_posts'
    
    def __str__(self):
        return f"{self.title} - {self.organization.org_name}"

class SupervisorProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='supervisor_profile')
    organization = models.ForeignKey(Organization, on_delete=models.CASCADE, related_name='supervisors')
    department = models.CharField(max_length=255, blank=True, null=True)
    job_title = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'supervisor_profiles'
    
    def __str__(self):
        return f"{self.user.full_name} - {self.organization.org_name}"
