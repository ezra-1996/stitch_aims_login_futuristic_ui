import os
import django
from django.utils import timezone

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import Student, User
from internships.models import StudentTask
from evaluation.models import WeeklyReport

def seed():
    try:
        # Get Student 4 and their Supervisor
        student = Student.objects.get(user__username='student_4')
        # Based on reseed.py, company_2 supervisor is supervisor_2_1
        supervisor = User.objects.get(username='supervisor_2_1')

        print(f"--- Seeding Demo Task & Report for {student.user.full_name} ---")

        # 1. Create Task (Assigned by Supervisor)
        task, created = StudentTask.objects.get_or_create(
            student=student,
            title="Develop Frontend Dashboard Components",
            defaults={
                'supervisor': supervisor,
                'description': "Create a set of reusable UI components for the student dashboard. Include Recharts charts and glassmorphism styling.",
                'status': 'in_progress',
                'due_date': timezone.now().date() + timezone.timedelta(days=7)
            }
        )
        if created:
            print(f"[+] Task created: {task.title}")
        else:
            print(f"[!] Task already exists: {task.title}")

        # 2. Create High Quality Report (Submitted by Student)
        report, created = WeeklyReport.objects.get_or_create(
            student=student,
            week_number=3,
            defaults={
                'title': "Week 3: Dashboard UI Implementation",
                'content': "This week, I successfully developed the core components for the Student Dashboard. I focused on creating a cohesive user experience using the project's futuristic glassmorphism theme. I implemented the Performance Chart using Recharts to visualize attendance trends and report scores. Additionally, I built a responsive Notification system that fetches real-time updates from the backend via WebSockets.",
                'tasks_completed': "1. Researched and integrated Recharts for data visualization.\n2. Developed the PerformanceChart and AttendanceCard components in React.\n3. Applied CSS Backdrop-filter for the glassmorphism effect.\n4. Integrated frontend with the /api/student/stats/ endpoint.",
                'challenges_faced': "Encountered an issue with chart responsiveness on mobile devices. I resolved this by using the ResponsiveContainer wrapper from Recharts.",
                'lessons_learned': "Deepened my understanding of SVG-based charting and React optimization techniques.",
                'status': 'pending'
            }
        )
        if created:
            print(f"[+] Report created: {report.title}")
        else:
            print(f"[!] Report already exists: {report.title}")

        print("\nSuccess! You can now login as 'supervisor_2_1' to evaluate this report.")
        
    except Student.DoesNotExist:
        print("Error: Student 'student_4' not found. Please run 'python reseed.py' first.")
    except User.DoesNotExist:
        print("Error: Supervisor 'supervisor_2_1' not found. Please run 'python reseed.py' first.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    seed()
