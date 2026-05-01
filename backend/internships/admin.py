from django.contrib import admin
from .models import Application, SupervisorAssignment

@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ['student', 'post', 'status', 'applied_date']

@admin.register(SupervisorAssignment)
class SupervisorAssignmentAdmin(admin.ModelAdmin):
    list_display = ['supervisor', 'student', 'organization', 'assigned_date', 'is_active']
