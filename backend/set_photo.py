import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import User

user = User.objects.get(username='student_1')
user.profile_photo = 'profile_photos/student_1_profile.png'
user.save()
print(f"Profile photo set for student_1: {user.profile_photo}")
print(f"URL will be: http://127.0.0.1:8000/media/profile_photos/student_1_profile.png")
