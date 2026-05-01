import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("\n--- ALL DB USERS ---")
print(f"{'Username':<20} | {'Role':<15} | {'Email':<25} | {'Password Status'}")
print("-" * 80)
for u in User.objects.all():
    role = getattr(u, 'role', 'N/A')
    # Show that it is hashed
    pw_status = "Hashed (pbkdf2)" if u.password and u.password.startswith("pbkdf2") else "Other Hash"
    print(f"{u.username:<20} | {str(role):<15} | {u.email:<25} | {pw_status}")
print("--------------------\n")
