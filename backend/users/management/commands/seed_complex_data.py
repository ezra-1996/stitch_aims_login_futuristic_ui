from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Student
from organizations.models import Organization, InternshipPost, SupervisorProfile
from internships.models import Application, SupervisorAssignment
from django.utils import timezone
import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with specific users and relationships for testing.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding data...')
        
        # 1. University Admin
        uni_admin, created = User.objects.get_or_create(username='uni_admin', defaults={
            'email': 'admin@university.edu',
            'role': 'university_admin',
            'full_name': 'University Administrator',
            'status': 'active',
            'is_staff': True,
            'is_superuser': True
        })
        if created:
            uni_admin.set_password('password123')
            uni_admin.save()
            self.stdout.write(self.style.SUCCESS('Created University Admin'))
        else:
             self.stdout.write('University Admin already exists')

        # 2. Companies
        companies = []
        company_names = ['TechCorp', 'GALACTICOS TECHNOLOGY', 'DataSystems']
        
        # Default Coords (Jimma University area)
        DEFAULT_LAT = 7.675100
        DEFAULT_LON = 36.836600
        
        for i, name in enumerate(company_names, 1):
            username = f'company_{i}'
            email = f'admin@company{i}.com'
            user, created = User.objects.get_or_create(username=username, defaults={
                'email': email,
                'role': 'company_admin',
                'status': 'active',
                'full_name': f'{name} Admin'
            })
            if created:
                user.set_password('password123')
                user.save()
            else:
                user.full_name = f'{name} Admin'
                user.save()
            
            org, created = Organization.objects.get_or_create(org_name=name, defaults={
                'created_by': user,
                'status': 'approved',
                'description': f'Leading company in {name} industry.',
                'address': f'123 {name} Blvd',
                'contact_email': email,
                'contact_phone': '555-0100',
                'latitude': DEFAULT_LAT,
                'longitude': DEFAULT_LON
            })
            
            # Update org name if it already exists but name changed
            if not created and org.org_name != name:
                org.org_name = name
                org.save()
            
            # Ensure GPS is set even if Org already exists
            if not created and (org.latitude is None or org.longitude is None):
                org.latitude = DEFAULT_LAT
                org.longitude = DEFAULT_LON
                org.save()
                self.stdout.write(self.style.SUCCESS(f'Updated GPS for {name}'))
            
            companies.append((user, org))
            self.stdout.write(self.style.SUCCESS(f'Processed Company: {name}'))

        # 3. Supervisors
        supervisors_flat = []
        company_sups_config = {
            1: [{"name": "Supervisor 1", "username": "supervisor_1"}],
            2: [
                {"name": "Kaleab Ismael", "username": "kaleab_i"},
                {"name": "Oliyad Bulto", "username": "oliyad_b"}
            ],
            3: [{"name": "Supervisor 3", "username": "supervisor_3"}],
        }

        for i, (comp_user, org) in enumerate(companies, 1):
            sups_to_create = company_sups_config.get(i, [])
            for sup_data in sups_to_create:
                username = sup_data["username"]
                email = f'{username}@aims.com'
                user, created = User.objects.get_or_create(username=username, defaults={
                    'email': email,
                    'role': 'supervisor',
                    'status': 'active',
                    'full_name': sup_data["name"]
                })
                if created:
                    user.set_password('password123')
                    user.save()
                else:
                    user.full_name = sup_data["name"]
                    user.save()
                
                SupervisorProfile.objects.get_or_create(user=user, defaults={
                    'organization': org,
                    'department': 'Engineering',
                    'job_title': 'Senior Engineer'
                })
                supervisors_flat.append(user)
                self.stdout.write(self.style.SUCCESS(f'Processed Supervisor: {username} ({sup_data["name"]}) for {org.org_name}'))

        # 4. Students
        students_data = [
            {"name": "Ezra Eshetu", "id": "Ru 0775/15"},
            {"name": "Elham Gugsa", "id": "Ru 0695/15"},
            {"name": "Ermias Mesfin", "id": "Ru 0739/15"},
            {"name": "Fiyameta Sintayehu", "id": "Ru 0856/15"},
            {"name": "Surafel Markos", "id": "Ru 1949/15"},
        ]
        
        students = []
        for i, data in enumerate(students_data, 1):
            username = f'student_{i}'
            email = f'student{i}@university.edu'
            user, created = User.objects.get_or_create(username=username, defaults={
                'email': email,
                'role': 'student',
                'status': 'active',
                'full_name': data["name"]
            })
            if created:
                user.set_password('password123')
                user.save()
            else:
                user.full_name = data["name"]
                user.save()
            
            student_profile, s_created = Student.objects.get_or_create(user=user, defaults={
                'university_id': data["id"],
                'department': 'Computer Science',
                'year': 3,
                'gpa': 3.5
            })
            if not s_created:
                student_profile.university_id = data["id"]
                student_profile.save()

            students.append(student_profile)
            self.stdout.write(self.style.SUCCESS(f'Processed Student: {username} ({data["name"]})'))

        # Internship Posts (needed for application)
        posts = []
        for _, org in companies:
            post, _ = InternshipPost.objects.get_or_create(
                organization=org,
                title=f'Software Intern at {org.org_name}',
                defaults={
                    'description': 'Great internship opportunity.',
                    'requirements': 'Python, React',
                    'application_deadline': timezone.now().date() + datetime.timedelta(days=30),
                    'capacity': 5,
                    'is_active': True
                }
            )
            posts.append(post)

        # Assignments
        # Student 1 -> Company 1 (Accepted)
        self.assign_student(students[0], companies[0][1], supervisors_flat[0], posts[0], 'accepted')
        
        # Student 2 -> Company 2 (Accepted) - Assigned to Kaleab Ismael
        self.assign_student(students[1], companies[1][1], supervisors_flat[1], posts[1], 'accepted')

        # Student 3 -> Company 3 (Accepted)
        self.assign_student(students[2], companies[2][1], supervisors_flat[3], posts[2], 'accepted')

        # Student 4 & 5 -> Neutral (No applications)
        deleted_count, _ = Application.objects.filter(student__in=[students[3], students[4]]).delete()
        if deleted_count:
            self.stdout.write(self.style.SUCCESS(f'Removed {deleted_count} applications for students 4 and 5 to make them neutral.'))
        else:
            self.stdout.write('Students 4 and 5 are neutral (no applications).')

    def assign_student(self, student, org, supervisor, post, status):
        # Create Application
        app, created = Application.objects.get_or_create(student=student, post=post, defaults={
            'status': status,
            'cover_letter': 'I am very interested.',
            'applied_date': timezone.now()
        })
        if not created and app.status != status:
            app.status = status
            app.save()
        
        # Create Supervisor Assignment if accepted
        if status == 'accepted':
            # Check if assignment already exists
            if not hasattr(student, 'supervisor_assignment'):
                SupervisorAssignment.objects.create(
                    student=student,
                    supervisor=supervisor,
                    organization=org,
                    is_active=True,
                    assigned_date=timezone.now().date()
                )
                self.stdout.write(self.style.SUCCESS(f'Assigned {student.user.username} to {org.org_name}'))
            else:
                self.stdout.write(f'Student {student.user.username} already assigned.')

    def create_application(self, student, post, status):
         app, created = Application.objects.get_or_create(student=student, post=post, defaults={
            'status': status,
            'cover_letter': 'Please consider me.',
            'applied_date': timezone.now()
        })
         if not created and app.status != status:
             app.status = status
             app.save()
         self.stdout.write(self.style.SUCCESS(f'Processed Application for {student.user.username}: {status}'))
