from django.shortcuts import render
from django.http import JsonResponse, HttpResponseRedirect
from django.views import View

class HomepageView(View):
    def get(self, request):
        # If browser requests HTML, redirect to admin
        # If API client requests JSON, return API info
        if 'application/json' in request.headers.get('Accept', ''):
            return JsonResponse({
                'message': 'Welcome to Automated Internship Management System (AIMS)',
                'version': '1.0.0',
                'system': 'Jimma University - Faculty of Computing and Informatics',
                'endpoints': {
                    'api_root': '/api/',
                    'api_docs': '/api/docs/',
                    'authentication': {
                        'register': '/api/auth/register/',
                        'login': '/api/auth/login/',
                        'token_refresh': '/api/auth/token/refresh/'
                    },
                    'organizations': {
                        'list_create': '/api/organizations/organizations/',
                        'active_internships': '/api/organizations/active-internships/'
                    },
                    'internships': {
                        'applications': '/api/internships/applications/'
                    },
                    'attendance': {
                        'attendance': '/api/attendance/attendance/'
                    },
                    'evaluation': {
                        'weekly_reports': '/api/evaluation/weekly-reports/'
                    }
                }
            })
        else:
            # Redirect browsers to admin interface
            return HttpResponseRedirect('/admin/')

class APIRootView(View):
    def get(self, request):
        return JsonResponse({
            'api_name': 'AIMS API',
            'version': '1.0.0',
            'description': 'Automated Internship Management System API',
            'endpoints': {
                'authentication': '/api/auth/',
                'organizations': '/api/organizations/',
                'internships': '/api/internships/',
                'attendance': '/api/attendance/',
                'evaluation': '/api/evaluation/',
                'documentation': '/api/docs/'
            }
        })

class APIDocsView(View):
    def get(self, request):
        return JsonResponse({
            'AIMS API Documentation': {
                'introduction': 'Automated Internship Management System for Jimma University',
                'authentication': {
                    'registration': {
                        'endpoint': 'POST /api/auth/register/',
                        'description': 'Register a new user',
                        'parameters': {
                            'username': 'string (required)',
                            'email': 'string (required)',
                            'full_name': 'string (required)',
                            'password': 'string (required)',
                            'password2': 'string (required)',
                            'role': 'student|company_admin|supervisor|university_admin',
                            'phone_number': 'string (optional)'
                        }
                    },
                    'login': {
                        'endpoint': 'POST /api/auth/login/',
                        'description': 'Login user and get JWT tokens',
                        'parameters': {
                            'username': 'string (required)',
                            'password': 'string (required)'
                        }
                    }
                },
                'organizations': {
                    'list_organizations': {
                        'endpoint': 'GET /api/organizations/organizations/',
                        'description': 'Get list of all organizations',
                        'authentication': 'Required'
                    },
                    'create_organization': {
                        'endpoint': 'POST /api/organizations/organizations/',
                        'description': 'Create a new organization',
                        'authentication': 'Required'
                    },
                    'active_internships': {
                        'endpoint': 'GET /api/organizations/active-internships/',
                        'description': 'Get list of active internship posts',
                        'authentication': 'Optional'
                    }
                },
                'testing': {
                    'note': 'Use the test script provided or Postman collection for testing',
                    'test_script': 'python test_fixed.py'
                }
            }
        })
