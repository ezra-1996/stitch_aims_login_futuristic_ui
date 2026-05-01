import os
import django
from datetime import date, timedelta
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import Student
from internships.models import SupervisorAssignment, StudentTask
from evaluation.models import WeeklyReport, AIEvaluation
from attendance.models import Attendance
from django.utils import timezone

def main():
    print("Resetting Ezra Eshetu (student_1) specifically to start TODAY...")
    try:
        s1 = Student.objects.get(user__username='student_1')
    except Student.DoesNotExist:
        print("Ezra Eshetu not found")
        return

    # Delete existing data for student 1
    StudentTask.objects.filter(student=s1).delete()
    Attendance.objects.filter(student=s1).delete()
    WeeklyReport.objects.filter(student=s1).delete()

    ass = SupervisorAssignment.objects.filter(student=s1).first()
    if ass:
        ass.start_date = date.today()
        ass.end_date = date.today() + timedelta(days=90)
        ass.save()
        print("Updated Ezra Eshetu's start_date to TODAY")
    else:
        print("Ezra Eshetu has no assignment yet!")

    # Add a task representing "weekly assigned task"
    if ass and ass.supervisor:
        StudentTask.objects.create(
            supervisor=ass.supervisor,
            student=s1,
            title="Integrate new API parameters",
            description="We have a new parameter structure required for the user endpoint. Please adapt the fetch logic.",
            due_date=date.today() + timedelta(days=4),
            status='pending'
        )
        print("Assigned a fresh weekly task and cleared old reports for Ezra Eshetu!")

if __name__ == '__main__':
    main()
