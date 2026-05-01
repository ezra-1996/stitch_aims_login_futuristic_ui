import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import Student
from organizations.models import Organization, SupervisorProfile
from internships.models import SupervisorAssignment

def seed_assignments():
    print("Seeding internship assignments for University Admin testing...")
    students = list(Student.objects.all()[:6])  # Take first 6 students
    orgs = list(Organization.objects.all())
    
    if not students:
        print("Error: No students found in database.")
        return
        
    if not orgs:
        print("Error: No organizations found in database.")
        return
        
    count = 0
    for i, student in enumerate(students):
        org = orgs[i % len(orgs)]
        sup_prof = SupervisorProfile.objects.filter(organization=org).first()
        
        if sup_prof:
            supervisor = sup_prof.user
            
            assignment, created = SupervisorAssignment.objects.get_or_create(
                student=student,
                defaults={
                    'supervisor': supervisor,
                    'organization': org,
                    'start_date': date.today(),
                    'end_date': date.today() + timedelta(days=90),
                    'is_active': True
                }
            )
            if created:
                print(f"Assigned: {student.user.full_name or student.user.username} -> {org.org_name}")
                count += 1
            else:
                print(f"Already assigned: {student.user.full_name or student.user.username}")
    
    print(f"\nDone! Created {count} simulated internship assignments.")

if __name__ == '__main__':
    seed_assignments()
