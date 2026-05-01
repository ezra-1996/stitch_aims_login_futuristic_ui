import requests
import sys

url = "http://localhost:8000/api/auth/login/"
data = {"username": "uni_admin", "password": "admin123"}
try:
    response = requests.post(url, json=data)
    print(f"Status Code: {response.status_code}")
    print(response.text)
except Exception as e:
    print(f"Error: {e}")
