import os
import django
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Student
from organizations.models import Organization, SupervisorProfile
from internships.models import Application, SupervisorAssignment, StudentTask
from attendance.models import Attendance
from evaluation.models import WeeklyReport

User = get_user_model()

def main():
    print("--- Seeding Defense Workflow Data ---")

    # 1. Clear Data (Keeping uni_admin)
    print("Cleaning existing data...")
    User.objects.exclude(username='uni_admin').delete()
    Organization.objects.all().delete()
    # Note: Cascading deletes should handle most, but let's be sure
    Application.objects.all().delete()
    SupervisorAssignment.objects.all().delete()
    Attendance.objects.all().delete()

    # 2. Create Student 4 (Pending)
    print("Creating Student 4 (Pending)...")
    user4 = User.objects.create(
        username='student_4',
        email='student4@university.edu',
        role='student',
        status='pending',
        full_name='Student Four'
    )
    user4.set_password('student123')
    user4.save()
    Student.objects.create(
        user=user4,
        university_id='JU/0004/2024',
        department='Software Engineering',
        year=4
    )

    # 3. Create Student 5 (Pending)
    print("Creating Student 5 (Pending)...")
    user5 = User.objects.create(
        username='student_5',
        email='student5@university.edu',
        role='student',
        status='pending',
        full_name='Student Five'
    )
    user5.set_password('student123')
    user5.save()
    Student.objects.create(
        user=user5,
        university_id='JU/0005/2024',
        department='Computer Science',
        year=4
    )

    # 4. Create Company 2 (Active)
    print("Creating Company 2 (Active)...")
    company2_user = User.objects.create(
        username='company_2',
        email='hr@company2.com',
        role='company_admin',
        status='active',
        full_name='Company Two Admin'
    )
    company2_user.set_password('company123')
    company2_user.save()

    org2 = Organization.objects.create(
        org_name="Global Tech Solutions",
        description="Innovation in Every Byte.",
        address="Bole Road, Addis Ababa",
        contact_email="hr@globaltech.com",
        contact_phone="+251911223344",
        status="approved",
        latitude=9.0227,
        longitude=38.7469,
        created_by=company2_user
    )

    # 5. Create a Supervisor for Company 2
    print("Creating Supervisor for Company 2...")
    sup2_user = User.objects.create(
        username='supervisor_2_1',
        email='sup@company2.com',
        role='supervisor',
        status='active',
        full_name='Supervisor at Company 2'
    )
    sup2_user.set_password('supervisor123')
    sup2_user.save()

    SupervisorProfile.objects.create(
        user=sup2_user,
        organization=org2
    )

    print("\nDefense Setup Complete!")
    print("--------------------------------------------------")
    print("Student 4: student_4 / student123 (PENDING)")
    print("Student 5: student_5 / student123 (PENDING)")
    print("Company 2: company_2 / company123 (ACTIVE)")
    print("Supervisor: supervisor_2_1 / supervisor123 (ACTIVE)")
    print("Admin: uni_admin (Use existing credentials)")
    print("--------------------------------------------------")

if __name__ == '__main__':
    main()
