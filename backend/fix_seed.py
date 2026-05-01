import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization, SupervisorProfile

User = get_user_model()

def fix_seeding():
    print("Fixing organizations and supervisor profiles...")
    for i in range(1, 5):
        try:
            admin = User.objects.get(username=f'company_{i}')
            # Create Organization for this company admin
            org_name = f"Tech Innovations {i}"
            org, created = Organization.objects.get_or_create(
                created_by=admin,
                defaults={
                    'org_name': org_name,
                    'address': f'{i}00 Silicon Valley Base',
                    'contact_email': admin.email,
                    'contact_phone': f'555-010{i}',
                    'status': 'approved'
                }
            )
            if created:
                print(f"Created organization {org.org_name} for {admin.username}.")
            else:
                print(f"Organization {org.org_name} already exists.")
            
            # Link supervisors to this organization
            for j in range(1, 3):
                sup = User.objects.get(username=f'supervisor_{i}_{j}')
                prof, p_created = SupervisorProfile.objects.get_or_create(
                    user=sup,
                    defaults={
                        'organization': org,
                        'department': 'Engineering',
                        'job_title': 'Senior Supervisor'
                    }
                )
                if p_created:
                    print(f"  -> Created SupervisorProfile linking {sup.username} to {org.org_name}")
        except User.DoesNotExist as e:
            print(f"User missing: {e}")

if __name__ == '__main__':
    fix_seeding()
