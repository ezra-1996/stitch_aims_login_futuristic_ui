from django.contrib import admin
from .models import Organization, InternshipPost

@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ['org_name', 'contact_email', 'industry', 'status', 'created_at']

@admin.register(InternshipPost)
class InternshipPostAdmin(admin.ModelAdmin):
    list_display = ['title', 'organization', 'duration_months', 'capacity', 'is_active']
