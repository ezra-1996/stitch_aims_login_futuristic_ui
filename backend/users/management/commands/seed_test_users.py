# Create Test Users for AIMS System
# Run: python manage.py seed_test_users

from django.core.management.base import BaseCommand
from users.models import User, Student


class Command(BaseCommand):
    help = 'Create test users matching the credentials shown on the Login page.'

    def handle(self, *args, **options):
        users_data = [
            {
                'username': 'student123',
                'email': 'student@aims.edu',
                'password': 'student123',
                'full_name': 'ABEBE KEBEDE',
                'role': 'student',
                'status': 'active',
                'phone_number': '+251912345678',
            },
            {
                'username': 'supervisor',
                'email': 'supervisor@aims.edu',
                'password': 'supervisor123',
                'full_name': 'Dr. Abebe Kebede',
                'role': 'supervisor',
                'status': 'active',
                'phone_number': '+251911111111',
            },
            {
                'username': 'company',
                'email': 'company@aims.com',
                'password': 'company123',
                'full_name': 'Ethio Telecom Admin',
                'role': 'company_admin',
                'status': 'active',
                'phone_number': '+251922222222',
            },
            {
                'username': 'admin',
                'email': 'admin@aims.edu',
                'password': 'admin123',
                'full_name': 'JU Admin',
                'role': 'university_admin',
                'status': 'active',
                'phone_number': '+251933333333',
                'is_staff': True,
                'is_superuser': True,
            },
        ]

        for user_data in users_data:
            username = user_data['username']
            if User.objects.filter(username=username).exists():
                self.stdout.write(self.style.WARNING(f"User '{username}' already exists, skipping."))
                continue

            user = User.objects.create(
                username=user_data['username'],
                email=user_data['email'],
                full_name=user_data['full_name'],
                role=user_data['role'],
                status=user_data['status'],
                phone_number=user_data['phone_number'],
                is_staff=user_data.get('is_staff', False),
                is_superuser=user_data.get('is_superuser', False),
                is_active=True,
            )
            user.set_password(user_data['password'])
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Created user: {username} ({user_data['role']})"))

            if user_data['role'] == 'student':
                Student.objects.get_or_create(
                    user=user,
                    defaults={
                        'university_id': 'JU/0001/2024',
                        'department': 'Software Engineering',
                        'year': 4,
                        'gpa': 3.5,
                    },
                )
                self.stdout.write(self.style.SUCCESS(f"  Created student profile for {username}"))

        self.stdout.write(self.style.SUCCESS("\nTest users ready. Use Login page credentials (e.g. student123 / student123)."))
