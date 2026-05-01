import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import User

def check():
    users = User.objects.filter(role='student')
    for u in users:
        print(f"User: {u.username} | Photo: {u.profile_photo.name if u.profile_photo else 'None'}")

if __name__ == '__main__':
    check()
