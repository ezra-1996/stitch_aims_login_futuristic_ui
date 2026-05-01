from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Student

@admin.register(User)
class CustomUserAdmin(admin.ModelAdmin):
    model = User
    list_display = ['username', 'email', 'full_name', 'role', 'status', 'is_active', 'date_joined']
    list_filter = ['role', 'status', 'is_active', 'date_joined']
    search_fields = ['username', 'email', 'full_name']
    
    # Custom fieldsets for our User model
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'email', 'phone_number')}),
        ('AIMS Info', {'fields': ('role', 'status')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )
    
    # Fields for adding new users
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'full_name', 'password1', 'password2', 'role', 'status'),
        }),
    )
    
    ordering = ('username',)

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ['university_id', 'user', 'department', 'year', 'created_at']
    list_filter = ['department', 'year']
    search_fields = ['university_id', 'user__username', 'user__full_name']
