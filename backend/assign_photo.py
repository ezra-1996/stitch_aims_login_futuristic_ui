import os
import django
import shutil
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import User
from django.conf import settings

def assign_photo(username, photo_path):
    try:
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        print(f"User '{username}' not found.")
        return

    # Ensure target directory exists
    target_dir = os.path.join(settings.MEDIA_ROOT, 'profile_photos')
    os.makedirs(target_dir, exist_ok=True)

    # Copy the image to media dir
    ext = os.path.splitext(photo_path)[1]
    filename = f"{username}_profile{ext}"
    target_path = os.path.join(target_dir, filename)
    shutil.copy2(photo_path, target_path)

    # Assign relative path to user
    user.profile_photo = f'profile_photos/{filename}'
    user.save()
    print(f"Assigned photo to {username}: profile_photos/{filename}")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python assign_photo.py <username> <photo_path>")
    else:
        assign_photo(sys.argv[1], sys.argv[2])
