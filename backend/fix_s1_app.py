import os
import django
from datetime import date

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import Student, User
from internships.models import Application
from organizations.models import InternshipPost, Organization

print("Starting fix process...")
try:
    s1 = Student.objects.get(user__username='student_1')
    post = InternshipPost.objects.first()
    
    if not post:
        print("No InternshipPost found to link to. Seeding dummy post...")
        org = Organization.objects.first()
        if not org:
            admin_user = User.objects.filter(role='company_admin').first() or User.objects.create(username='dummy_admin', role='company_admin')
            org = Organization.objects.create(
                org_name="Test Org", 
                address="123", 
                contact_email="a@a.com",
                contact_phone="123",
                created_by=admin_user
            )
        post = InternshipPost.objects.create(
            organization=org, 
            title="Software Intern",
            description="Fixing bugs.",
            requirements="Python",
            application_deadline=date.today()
        )
        print("Created dummy post.")

    app, created = Application.objects.get_or_create(
        student=s1,
        post=post,
    )
    app.status = 'accepted'
    app.save()
    print('Created/Updated dummy Application for student_1. Status:', app.status)
except Exception as e:
    import traceback
    traceback.print_exc()
    print('Failed:', e)
