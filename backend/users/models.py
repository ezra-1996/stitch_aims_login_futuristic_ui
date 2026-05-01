from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

class CustomUserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not username:
            raise ValueError('The Username must be set')
        if not email:
            raise ValueError('The Email must be set')
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'university_admin')
        return self.create_user(username, email, password, **extra_fields)

class User(AbstractBaseUser):
    USER_ROLES = (
        ('student', 'Student'),
        ('company_admin', 'Company Administrator'),
        ('supervisor', 'Supervisor'),
        ('university_admin', 'University Administrator'),
    )
    
    STATUS_CHOICES = (
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('pending', 'Pending Approval'),
    )
    
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255, blank=True, null=True)
    role = models.CharField(max_length=50, choices=USER_ROLES, default='student')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)
    date_joined = models.DateTimeField(default=timezone.now)
    last_login = models.DateTimeField(null=True, blank=True)
    must_change_password = models.BooleanField(default=False)
    
    # GPS Location for registration/workplace
    latitude = models.FloatField(null=True, blank=True)
    longitude = models.FloatField(null=True, blank=True)
    
    # Profile Photo
    profile_photo = models.ImageField(upload_to='profile_photos/', null=True, blank=True)
    
    objects = CustomUserManager()
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    class Meta:
        db_table = 'users'
    
    def __str__(self):
        return f"{self.username} ({self.role})"
    
    def has_perm(self, perm, obj=None):
        return self.is_superuser
    
    def has_module_perms(self, app_label):
        return self.is_superuser

    @staticmethod
    def notify_university_admins(title, description, type='info', action_link=None):
        """Helper to broadcast notifications to all University Administrators"""
        admins = User.objects.filter(role='university_admin')
        for admin in admins:
            Notification.objects.create(
                recipient=admin,
                title=title,
                description=description,
                type=type,
                action_link=action_link
            )

class Student(models.Model):
    student_id = models.AutoField(primary_key=True)
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    university_id = models.CharField(max_length=255, unique=True)
    department = models.CharField(max_length=255)
    year = models.IntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    gpa = models.FloatField(validators=[MinValueValidator(0.0), MaxValueValidator(4.0)], null=True, blank=True)
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'students'
    
    def __str__(self):
        return f"{self.university_id} - {self.user.username}"

class Notification(models.Model):
    TYPE_CHOICES = (
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
    )
    
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    description = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    action_link = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']
        db_table = 'notifications'
    
    def __str__(self):
        return f"{self.title} - {self.recipient.username}"
