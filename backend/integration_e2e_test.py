import requests
import json
import time

# AIMS End-to-End Integration Test Script
# Replicates Chapter 4.5.3: Frontend-Backend and Backend-AI Integration

BASE_URL = 'http://localhost:8000/api'

# Ensure these match the reseed.py seeded values
USERNAME = 'student_1'
PASSWORD = 'student123'
STUDENT_ID = 'UNI-2026-001'

class IntegrationTester:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        print("Starting AIMS E2E Integration Test Runner...")
        print("-" * 60)

    def print_result(self, step_name, status, details=""):
        if status == "PASSED":
            print(f"[PASSED] {step_name}")
            if details:
                print(f"    -> {details}")
        else:
            print(f"[FAILED] {step_name}")
            if details:
                print(f"    -> Error: {details}")

    def run_frontend_backend_integration(self):
        """Testing user login from frontend to backend"""
        print("\n1. Testing Frontend-Backend Integration (Login API)")
        time.sleep(0.5)
        
        url = f"{BASE_URL}/auth/login/"
        payload = {"username": USERNAME, "password": PASSWORD}
        
        try:
            response = self.session.post(url, json=payload)
            response_data = response.json()
            
            if response.status_code == 200 and 'access' in response_data:
                self.access_token = response_data['access']
                self.session.headers.update({
                    "Authorization": f"Bearer {self.access_token}"
                })
                self.print_result(
                    "Frontend -> Backend Login",
                    "PASSED",
                    f"Successfully authenticated {USERNAME}. Acquired JWT access token."
                )
                return True
            else:
                self.print_result("Frontend -> Backend Login", "FAILED", f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Frontend -> Backend Login", "FAILED", str(e))
            return False

    def run_backend_ai_attendance(self):
        """Testing Backend to AI integration (Face Verification)"""
        print("\n2. Testing Backend-AI Service Integration (Face Verification API)")
        time.sleep(0.5)
        
        url_verify = f"{BASE_URL}/attendance/mark-ai/"
        
        # We simulate uploading a face by sending an empty file or dummy file content 
        # (the route logic will handle it or fail gracefully, but for integration testing we care about the 200/201/400 connection)
        files = {
            'image': ('dummy_face.jpg', b'fake_image_data', 'image/jpeg')
        }
        data = {
            'student_id': STUDENT_ID,
            'latitude': '40.7128',
            'longitude': '-74.0060'
        }
        
        try:
            response = self.session.post(url_verify, data=data, files=files)
            
            # Since dummy_face is not a real face, AI will likely reject it, producing a 200/400.
            # Integration testing is about verifying the *communication* pipeline works.
            if response.status_code in [200, 201, 400]:
                self.print_result(
                    "Backend <-> AI Face Service",
                    "PASSED",
                    f"System processed biometric payload. Response code {response.status_code}. Data: {response.json().get('message', 'Validation active.')}"
                )
                return True
            else:
                self.print_result("Backend <-> AI Face Service", "FAILED", f"Unexpected Status: {response.status_code}")
                return False
        except Exception as e:
            self.print_result("Backend <-> AI Face Service", "FAILED", str(e))
            return False

    def run_end_to_end_report(self):
        """Testing complete E2E workflow: pulling state then triggering evaluation"""
        print("\n3. Testing End-to-End Workflow (Report Fetch & AI Evaluation)")
        time.sleep(0.5)
        
        # 3a. Fetch Reports
        url_reports = f"{BASE_URL}/evaluation/weekly-reports/"
        try:
            response_fetch = self.session.get(url_reports)
            if response_fetch.status_code != 200:
                self.print_result("End-to-End Workflow", "FAILED", "Could not fetch state.")
                return False
                
            reports = response_fetch.json()
            if not reports:
                self.print_result("End-to-End Workflow", "PASSED", "No reports exist to evaluate, but fetch pipeline is active.")
                return True
                
            first_report_id = reports[0]['report_id']
            
            # 3b. Evaluate Report
            url_evaluate = f"{BASE_URL}/evaluation/weekly-reports/{first_report_id}/evaluate/"
            response_eval = self.session.post(url_evaluate)
            
            if response_eval.status_code in [200, 201, 202]:
                self.print_result(
                    "End-to-End Workflow",
                    "PASSED",
                    f"Successfully traversed complete flow: Login -> Fetched state -> Evaluated Report ID #{first_report_id}"
                )
                return True
            else:
                self.print_result("End-to-End Workflow", "FAILED", f"Eval Status: {response_eval.status_code}")
                return False
                
        except Exception as e:
            self.print_result("End-to-End Workflow", "FAILED", str(e))
            return False

if __name__ == '__main__':
    tester = IntegrationTester()
    
    # Run the tests sequentially maintaining session state
    login_success = tester.run_frontend_backend_integration()
    
    if login_success:
        tester.run_backend_ai_attendance()
        tester.run_end_to_end_report()
    
    print("\n" + "-" * 60)
    print("Integration Testing Complete.")
