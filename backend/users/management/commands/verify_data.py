from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from users.models import Student
from organizations.models import Organization, InternshipPost, SupervisorProfile
from internships.models import Application, SupervisorAssignment

User = get_user_model()

class Command(BaseCommand):
    help = 'Verify the seeded data.'

    def handle(self, *args, **options):
        # Users - Note: counts might be higher if previous data existed, so checking >= expected
        u_admin_count = User.objects.filter(role='university_admin').count()
        c_admin_count = User.objects.filter(role='company_admin').count()
        sup_count = User.objects.filter(role='supervisor').count()
        stu_count = User.objects.filter(role='student').count()
        
        self.stdout.write(f'University Admins: {u_admin_count} (Expected >= 1)')
        self.stdout.write(f'Company Admins: {c_admin_count} (Expected >= 3)')
        self.stdout.write(f'Supervisors: {sup_count} (Expected >= 3)')
        self.stdout.write(f'Students: {stu_count} (Expected >= 5)')

        # Organizations
        org_count = Organization.objects.count()
        self.stdout.write(f'Organizations: {org_count} (Expected >= 3)')

        # Supervisor Profiles
        sup_prof_count = SupervisorProfile.objects.count()
        self.stdout.write(f'Supervisor Profiles: {sup_prof_count} (Expected >= 3)')

        # Applications
        app_count = Application.objects.count()
        self.stdout.write(f'Applications: {app_count} (Expected >= 5)')

        # Assignments
        assign_count = SupervisorAssignment.objects.count()
        self.stdout.write(f'Supervisor Assignments: {assign_count} (Expected >= 3)')

        # Specific Checks
        try:
            s1 = User.objects.get(username='student_1')
            a1 = Application.objects.filter(student=s1.student_profile).first()
            if a1:
                self.stdout.write(f'Ezra Eshetu (student_1) status: {a1.status} (Expected accepted)')
            else:
                self.stdout.write('Ezra Eshetu (student_1) has no application')
        except Exception as e:
            self.stdout.write(f'Error checking Ezra Eshetu: {e}')

        try:
            s2 = User.objects.get(username='student_2')
            a2 = Application.objects.filter(student=s2.student_profile).first()
            if a2:
                self.stdout.write(f'Elham Gugsa (student_2) status: {a2.status} (Expected accepted)')
            else:
                self.stdout.write('Elham Gugsa (student_2) has no application')
        except Exception as e:
            self.stdout.write(f'Error checking Elham Gugsa: {e}')

        try:
            s3 = User.objects.get(username='student_3')
            a3 = Application.objects.filter(student=s3.student_profile).first()
            if a3:
                self.stdout.write(f'Ermias Mesfin (student_3) status: {a3.status} (Expected accepted)')
            else:
                self.stdout.write('Ermias Mesfin (student_3) has no application')
        except Exception as e:
            self.stdout.write(f'Error checking Ermias Mesfin: {e}')

        try:
            s4 = User.objects.get(username='student_4')
            a4 = Application.objects.filter(student=s4.student_profile).first()
            if a4:
                self.stdout.write(f'Fiyameta Sintayehu (student_4) status: {a4.status} (Expected None)')
            else:
                self.stdout.write('Fiyameta Sintayehu (student_4) is neutral (no application) - OK')
        except Exception as e:
            self.stdout.write(f'Error checking Fiyameta Sintayehu: {e}')

        try:
            s5 = User.objects.get(username='student_5')
            a5 = Application.objects.filter(student=s5.student_profile).first()
            if a5:
                self.stdout.write(f'Surafel Markos (student_5) status: {a5.status} (Expected None)')
            else:
                self.stdout.write('Surafel Markos (student_5) is neutral (no application) - OK')
        except Exception as e:
            self.stdout.write(f'Error checking Surafel Markos: {e}')
