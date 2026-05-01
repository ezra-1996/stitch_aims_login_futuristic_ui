import os
import django
from datetime import date, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import Student
from organizations.models import Organization, SupervisorProfile
from internships.models import SupervisorAssignment, StudentTask
from attendance.models import Attendance
from evaluation.models import WeeklyReport
from django.utils import timezone

def main():
    print("Seeding full E2E data for all students...")
    students = list(Student.objects.all())
    orgs = list(Organization.objects.all())

    if not students or not orgs:
        print("Missing students or organizations! Have you seeded them?")
        return

    # Clear old data
    print("Clearing old E2E data...")
    SupervisorAssignment.objects.all().delete()
    StudentTask.objects.all().delete()
    Attendance.objects.all().delete()
    WeeklyReport.objects.all().delete()

    print(f"Creating E2E paths for {len(students)} students across {len(orgs)} organizations...")

    for i, student in enumerate(students):
        # 1. Assignment
        org = orgs[i % len(orgs)]
        sup_prof = SupervisorProfile.objects.filter(organization=org).first()
        if not sup_prof:
            print(f"Skipping assignment for {student.user.username}: No supervisor in {org.org_name}")
            continue
        supervisor = sup_prof.user

        assignment, _ = SupervisorAssignment.objects.get_or_create(
            student=student,
            defaults={
                'supervisor': supervisor,
                'organization': org,
                'start_date': date.today() - timedelta(days=14),
                'end_date': date.today() + timedelta(days=76),
                'is_active': True
            }
        )

        # 2. Tasks
        StudentTask.objects.create(
            supervisor=supervisor,
            student=student,
            title="Setup development environment",
            description="Install required tools, set up VPN access, access source code.",
            due_date=date.today() + timedelta(days=3),
            status='in_progress'
        )
        StudentTask.objects.create(
            supervisor=supervisor,
            student=student,
            title="Complete Onboarding Module",
            description="Go through all introductory company modules.",
            due_date=date.today() - timedelta(days=1),
            status='done'
        )

        # 3. Attendance (Last 5 days)
        for d in range(5):
            att_date = timezone.now().date() - timedelta(days=d)
            # Skip weekends just visually
            if att_date.weekday() >= 5: continue
            
            Attendance.objects.create(
                student=student,
                date=att_date,
                check_in_time=timezone.now() - timedelta(days=d, hours=8),
                check_out_time=timezone.now() - timedelta(days=d, hours=0),
                verification_method='face_gps',
                status='present' if d % 4 != 0 else 'late',
                notes=f"Attended office at {org.org_name}"
            )

        # 4. Weekly Reports
        # Week 1 - Approved
        WeeklyReport.objects.create(
            student=student,
            week_number=1,
            title=f"Week 1 Report - Onboarding",
            content="Completed orientation and met with my supervisor.",
            tasks_completed="Setup workstation, got badges.",
            challenges_faced="VPN was dropping initially.",
            lessons_learned="Understood the tech stack foundation.",
            status='approved',
            supervisor_feedback="Good start!"
        )

        # Week 2 - Pending
        WeeklyReport.objects.create(
            student=student,
            week_number=2,
            title=f"Week 2 Report - Initial Ticket",
            content="Started working on my first jira ticket regarding UI updates.",
            tasks_completed="UI components implemented.",
            challenges_faced="CSS Grid compatibility issues.",
            lessons_learned="Always check browser compatibilities.",
            status='pending'
        )

        print(f"Seeded E2E setup for {student.user.username}")

    print("Success! The entire matrix is fully connected.")

if __name__ == '__main__':
    main()
