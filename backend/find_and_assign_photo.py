import os
import django
import urllib.request

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from users.models import User
from django.conf import settings

def main():
    # The user uploaded a photo for student_1. We need to download or embed it.
    # Since we can't access browser uploads directly, we will create a placeholder
    # using the face_embeddings student_1 image if available, or create structured data.
    
    # First check if there's a face image already stored for student_1
    face_dir = os.path.join(settings.BASE_DIR, 'media', 'face_images')
    profile_dir = os.path.join(settings.MEDIA_ROOT, 'profile_photos')
    os.makedirs(profile_dir, exist_ok=True)
    
    # Look for any existing face image for student_1
    user = User.objects.filter(username='student_1').first()
    if not user:
        print("Ezra Eshetu (student_1) not found")
        return
    
    # Check face images folder
    candidate_photos = []
    if os.path.exists(face_dir):
        for f in os.listdir(face_dir):
            if 'student_1' in f.lower() or 'student1' in f.lower():
                candidate_photos.append(os.path.join(face_dir, f))
    
    if candidate_photos:
        import shutil
        src = candidate_photos[0]
        ext = os.path.splitext(src)[1]
        dst = os.path.join(profile_dir, f'student_1_profile{ext}')
        shutil.copy2(src, dst)
        user.profile_photo = f'profile_photos/student_1_profile{ext}'
        user.save()
        print(f"Assigned face image to Ezra Eshetu (student_1): {dst}")
    else:
        print("No face image found. Available face images:")
        if os.path.exists(face_dir):
            for f in os.listdir(face_dir)[:10]:
                print(f"  {f}")
        else:
            print("  No face_images directory found")
        print(f"\nMedia root: {settings.MEDIA_ROOT}")

if __name__ == '__main__':
    main()
