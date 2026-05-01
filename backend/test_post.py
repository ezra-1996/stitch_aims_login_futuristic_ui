import os, django
import requests
import json
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AIMS.settings')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization

if __name__ == '__main__':
    User = get_user_model()
    company = User.objects.get(username='company_1')
    org = Organization.objects.filter(created_by=company).first()

    try:
        # 1. Login to get token
        res = requests.post('http://localhost:8000/api/auth/login/', json={'username': 'company_1', 'password': 'company123'})
        token = res.json().get('access')
        
        # 2. Post internship
        post_data = {
            'organization': org.org_id,
            'title': 'API Test Internship',
            'description': 'Description',
            'requirements': 'Requirements',
            'duration_months': 3,
            'capacity': 1,
            'application_deadline': '2026-05-15',
            'is_active': True
        }
        
        post_res = requests.post(
            'http://localhost:8000/api/organizations/internship-posts/', 
            headers={'Authorization': f'Bearer {token}'},
            json=post_data
        )
        
        print(f"POST Response Status: {post_res.status_code}")
        print(f"POST Response Body: {post_res.text}")
        
        # 3. Check active internships
        get_res = requests.get('http://localhost:8000/api/organizations/active-internships/')
        print(f"GET Response Status: {get_res.status_code}")
        
    except Exception as e:
        print("Error:", str(e))
