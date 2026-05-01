import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

try:
    user = User.objects.get(username='company_1')
    user.set_password('company123')
    user.save()
    print("SUCCESS: Password for company_1 has been reset to company123")
except User.DoesNotExist:
    print("ERROR: User company_1 does not exist")
