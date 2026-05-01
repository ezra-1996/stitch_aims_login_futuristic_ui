import os
import django
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Student
from organizations.models import Organization, InternshipPost, SupervisorProfile
from internships.models import Application, SupervisorAssignment
from attendance.models import Attendance
from evaluation.models import WeeklyReport

User = get_user_model()

def reset_db():
    print("--- Restoring Full Database & Integrating Defense Workflow ---")
    
    # 1. Delete all except uni_admin
    User.objects.exclude(username='uni_admin').delete()
    Organization.objects.all().delete()
    Application.objects.all().delete()
    SupervisorAssignment.objects.all().delete()
    Attendance.objects.all().delete()
    print("Cleaned existing data (except uni_admin).")
    
    # 2. Create 10 students
    students_data = [
        {"name": "Ezra Eshetu", "id": "Ru 0775/15"},
        {"name": "Elham Gugsa", "id": "Ru 0695/15"},
        {"name": "Ermias Mesfin", "id": "Ru 0739/15"},
        {"name": "Fiyameta Sintayehu", "id": "Ru 0856/15"},
        {"name": "Surafel Markos", "id": "Ru 1949/15"},
    ]
    
    for i in range(1, 11):
        username = f'student_{i}'
        name = students_data[i-1]["name"] if i <= 5 else f'Student Name {i}'
        uni_id = students_data[i-1]["id"] if i <= 5 else f'UNI-2026-{i:03d}'
        
        # KEY DEFENSE LOGIC: Student 4 and 5 start as PENDING for the workflow demo
        status = 'pending' if i in [4, 5] else 'active'
        
        user = User.objects.create(
            username=username,
            email=f'{username}@university.edu',
            role='student',
            status=status,
            full_name=name
        )
        user.set_password('student123')
        user.save()
        
        Student.objects.create(
            user=user,
            university_id=uni_id,
            department='Information Science',
            year=4 if i > 5 else 3
        )
    print("Restored 10 student accounts. (Student 4 & 5 set to PENDING for defense).")
    
    # 3. Create 4 companies
    for i in range(1, 5):
        company_username = f'company_{i}'
        company_user = User.objects.create(
            username=company_username,
            email=f'{company_username}@aims.com',
            role='company_admin',
            status='active',
            full_name=f'Company {i} Admin'
        )
        company_user.set_password('company123')
        company_user.save()
        
        # Create an Organization for each company
        org = Organization.objects.create(
            org_name=f"Enterprise {i} Solutions",
            description=f"Innovation sector {i}",
            address=f"{i}23 Tech St, Addis Ababa",
            contact_email=f"hr@enterprise{i}.com",
            contact_phone=f"+25191100000{i}",
            status="approved",
            latitude=9.0227 + (i * 0.001),
            longitude=38.7469 + (i * 0.001),
            created_by=company_user
        )

        # 4. Create 2 supervisors in each company
        for j in range(1, 3):
            sup_username = f'supervisor_{i}_{j}'
            sup_user = User.objects.create(
                username=sup_username,
                email=f'{sup_username}@aims.com',
                role='supervisor',
                status='active',
                full_name=f'Supervisor {j} at Company {i}'
            )
            sup_user.set_password('supervisor123')
            sup_user.save()
            
            SupervisorProfile.objects.create(
                user=sup_user,
                organization=org
            )

    # 5. Populate Student 1 with an active internship to show "Populated Data"
    print("Seeding active internship for Student 1...")
    comp1_org = Organization.objects.get(org_name="Enterprise 1 Solutions")
    post1 = InternshipPost.objects.create(
        organization=comp1_org,
        title="Software Engineer Intern",
        description="Develop core features.",
        requirements="Python, React",
        application_deadline=timezone.now().date() + timedelta(days=30),
    )
    
    student_1 = Student.objects.get(user__username='student_1')
    sup1 = User.objects.get(username='supervisor_1_1')
    
    Application.objects.create(student=student_1, post=post1, status='accepted')
    SupervisorAssignment.objects.create(
        student=student_1,
        supervisor=sup1,
        organization=comp1_org,
        start_date=timezone.now().date() - timedelta(days=5),
        end_date=timezone.now().date() + timedelta(days=85),
        is_active=True
    )
    
    # 6. Add some attendance for Student 1
    for d in range(3):
        att_date = timezone.now().date() - timedelta(days=d)
        Attendance.objects.create(
            student=student_1,
            date=att_date,
            check_in_time=timezone.now() - timedelta(days=d, hours=8),
            verification_method='face_gps',
            status='present',
            notes="Regular work day"
        )

    print("\nSUCCESS: All previous data restored and integrated with defense workflow.")
    print("--------------------------------------------------")
    print("POPULATION: 10 Students, 4 Companies, 8 Supervisors")
    print("DEFENSE READY: Student 4 & 5 are PENDING for your demo.")
    print("SYSTEM HEALTH: Student 1 has active records for visual charts.")
    print("--------------------------------------------------")

if __name__ == '__main__':
    reset_db()
