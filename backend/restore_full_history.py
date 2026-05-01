import os
import django
import shutil
from datetime import date, timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from django.contrib.auth import get_user_model
from users.models import Student
from organizations.models import Organization, SupervisorProfile
from internships.models import Application, SupervisorAssignment, StudentTask, InternshipPost
from attendance.models import Attendance
from evaluation.models import WeeklyReport
from django.conf import settings

User = get_user_model()

def main():
    print("--- Restoring Full Attendance History & Biometric Photos ---")
    
    students = list(Student.objects.all())
    orgs = list(Organization.objects.all())
    
    if not students or not orgs:
        print("Error: No students or organizations found. Please run reseed.py first.")
        return

    # Clear history data before re-seeding
    print("Clearing existing history data...")
    Attendance.objects.all().delete()
    WeeklyReport.objects.all().delete()
    StudentTask.objects.all().delete()
    SupervisorAssignment.objects.all().delete()
    Application.objects.all().delete()

    # Directories for photos
    enrolled_dir = os.path.join(settings.BASE_DIR, 'media', 'ai', 'enrolled_faces')
    profile_dir = os.path.join(settings.MEDIA_ROOT, 'profile_photos')
    os.makedirs(profile_dir, exist_ok=True)

    for i, student in enumerate(students):
        user = student.user
        uni_id = student.university_id
        
        # Update Department
        student.department = 'Information Science'
        student.save()
        
        # 1. Restore Enrollment Photo
        print(f"Processing student: {user.username} ({uni_id})")
        
        # Sanitize ID for filename matching
        safe_id = uni_id.replace('/', '_').replace('\\', '_')
        photo_match = None
        
        if os.path.exists(enrolled_dir):
            for f in os.listdir(enrolled_dir):
                if safe_id.lower() in f.lower().replace('/', '_'):
                    photo_match = os.path.join(enrolled_dir, f)
                    break
        
        if photo_match:
            dest_filename = f"{user.username}_profile{os.path.splitext(photo_match)[1]}"
            dest_path = os.path.join(profile_dir, dest_filename)
            shutil.copy2(photo_match, dest_path)
            user.profile_photo = f'profile_photos/{dest_filename}'
            user.save()
            print(f"  -> Linked enrollment photo: {dest_filename}")
        else:
            # Try to assign a generic face photo from the profile_photos pool if it's one of the "lost" ones
            generic_faces = [f for f in os.listdir(profile_dir) if f.startswith('face') and f.endswith(('.jpg', '.png'))]
            if generic_faces:
                # Use i as an index to pick a unique generic face
                generic_photo = generic_faces[i % len(generic_faces)]
                user.profile_photo = f'profile_photos/{generic_photo}'
                user.save()
                print(f"  -> Assigned generic face photo: {generic_photo}")
            else:
                print(f"  -> No photos available for {user.username}")

        # 2. Assign to Internship (Required for Attendance)
        org = orgs[i % len(orgs)]
        sup_prof = SupervisorProfile.objects.filter(organization=org).first()
        if not sup_prof: continue
        supervisor = sup_prof.user

        # Create Post and Application
        post, _ = InternshipPost.objects.get_or_create(
            organization=org,
            title=f"General Internship - {org.org_name}",
            defaults={
                'description': "Full scale internship program.",
                'requirements': "Dedication and skill.",
                'application_deadline': date.today() + timedelta(days=60)
            }
        )
        
        Application.objects.create(student=student, post=post, status='accepted')
        
        # Create Assignment (Timeline)
        # Note: We set the timeline for ALL students now to restore history
        assignment = SupervisorAssignment.objects.create(
            student=student,
            supervisor=supervisor,
            organization=org,
            start_date=date.today() - timedelta(days=20),
            end_date=date.today() + timedelta(days=70),
            is_active=True
        )

        # 3. Restore Attendance History (Last 10 Days)
        print(f"  -> Seeding 10 days of attendance history...")
        for d in range(10):
            att_date = timezone.now().date() - timedelta(days=d)
            if att_date.weekday() >= 5: continue # Skip weekends
            
            # Mix of present and late
            status_choice = 'present' if d % 5 != 0 else 'late'
            
            Attendance.objects.create(
                student=student,
                date=att_date,
                check_in_time=timezone.now() - timedelta(days=d, hours=8, minutes=random_minutes(d)),
                verification_method='face_gps',
                status=status_choice,
                notes="AI Verified Enrollment"
            )

        # 4. Restore Weekly Reports
        print(f"  -> Seeding weekly reports...")
        for w in range(1, 3):
            WeeklyReport.objects.create(
                student=student,
                week_number=w,
                title=f"Progress Report - Week {w}",
                content=f"Systematic integration and testing completed for module {w}.",
                tasks_completed="API integration, UI testing.",
                challenges_faced="Network latency issues.",
                lessons_learned="Optimized database queries.",
                status='approved' if w == 1 else 'pending',
                supervisor_feedback="Excellent progress." if w == 1 else ""
            )

        # 5. Restore Tasks
        StudentTask.objects.create(
            supervisor=supervisor,
            student=student,
            title="Biometric System Validation",
            description="Perform cross-device testing of the face recognition module.",
            due_date=date.today() + timedelta(days=5),
            status='in_progress'
        )

    print("\nRESTORATION COMPLETE!")
    print(f"Restored history for {len(students)} students.")
    print(f"Linked photos and generated 10-day attendance matrix.")

def random_minutes(seed):
    import random
    random.seed(seed)
    return random.randint(0, 45)

if __name__ == '__main__':
    main()
