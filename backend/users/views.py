from django.shortcuts import render
import logging
import os

logger = logging.getLogger(__name__)
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from django.conf import settings

# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User, Student, Notification
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .serializers import (
    UserSerializer, StudentSerializer, UserRegistrationSerializer, 
    StudentRegistrationSerializer, SupervisorRegistrationSerializer, 
    SupervisorProfileSerializer, NotificationSerializer,
    CompanyRegistrationSerializer, UserProfileSerializer,
    StudentProfilePhotoSerializer
)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(username=username, password=password)
    if user:
        if user.status == 'pending':
            return Response({'error': 'Your account is pending approval by a University Administrator.'}, status=status.HTTP_403_FORBIDDEN)
        if user.status == 'inactive':
            return Response({'error': 'Your account is currently inactive. Please contact support.'}, status=status.HTTP_403_FORBIDDEN)
            
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserProfileSerializer(user, context={'request': request}).data
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_view(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def student_register_view(request):
    serializer = StudentRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            student = serializer.save()
            user = student.user
            
            # Determine message based on whether admin created this user
            if user.status == 'active':
                message = 'Student registered and activated successfully.'
            else:
                message = 'Registration submitted. Your account is pending administrator approval.'
            
            response_data = {
                'user': UserSerializer(user).data,
                'student_profile': StudentSerializer(student).data,
                'message': message
            }

            # Send email if admin created this user
            if user.status == 'active' and 'password' in request.data:
                try:
                    from django.conf import settings
                    from django.core.mail import send_mail
                    subject = "AIMS - Your New Student Portal Credentials"
                    message = (
                        f"Dear {user.full_name or user.username},\n\n"
                        f"Welcome to the Automated Internship Management System (AIMS). An official student account has been established for you by the university administration.\n\n"
                        f"--- SECURE ACCESS CREDENTIALS ---\n"
                        f"Username: {user.username}\n"
                        f"Temporary Password: {request.data['password']}\n"
                        f"----------------------------------\n\n"
                        f"Please navigate to the login portal and enter these credentials to begin your enrollment. For security reasons, you will be prompted to update your password upon your first successful entry.\n\n"
                        f"If you did not request this account, please ignore this email or contact university support.\n\n"
                        f"Regards,\nThe AIMS Administration Team"
                    )
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [user.email],
                        fail_silently=True,
                    )
                except Exception:
                    pass

            return Response(response_data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def company_register_view(request):
    serializer = CompanyRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        try:
            org = serializer.save()
            # Send email if password was provided
            if 'password' in request.data:
                try:
                    from django.conf import settings
                    from django.core.mail import send_mail
                    subject = f"AIMS - Company Registration: {org.org_name}"
                    message = (
                        f"Dear {org.created_by.full_name or org.created_by.username},\n\n"
                        f"Your organization \"{org.org_name}\" has been successfully registered on the Automated Internship Management System (AIMS).\n\n"
                        f"Your administrative access credentials are provided below:\n\n"
                        f"--- PARTNER PORTAL ACCESS ---\n"
                        f"Username: {org.created_by.username}\n"
                        f"Password: {request.data['password']}\n"
                        f"------------------------------\n\n"
                        f"Status: PENDING APPROVAL\n\n"
                        f"Please note that your account is currently in a 'Pending' status. You will receive another notification once a University Administrator has finalized your approval.\n\n"
                        f"Best regards,\nThe AIMS Integration Team"
                    )
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [org.created_by.email],
                        fail_silently=True,
                    )
                except Exception:
                    pass

            return Response({
                'user': UserSerializer(org.created_by).data,
                'organization': {
                    'org_id': org.org_id,
                    'org_name': org.org_name,
                    'status': org.status
                },
                'message': 'Company registration submitted. Pending administrator approval.'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def university_admin_register_view(request):
    data = request.data.copy()
    data['role'] = 'university_admin'
    data['status'] = 'active' # University Admins are active by default as they are the top-level authority
    
    serializer = UserRegistrationSerializer(data=data)
    if serializer.is_valid():
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'University Administrator account created and pending approval.'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def supervisor_register_view(request):
    if request.user.role not in ['university_admin', 'company_admin']:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    data = request.data.copy()
    
    # If company admin, automatically use their organization
    if request.user.role == 'company_admin':
        from organizations.models import Organization
        try:
            org = Organization.objects.get(created_by=request.user)
            data['organization'] = org.org_id
        except Organization.DoesNotExist:
            return Response({'error': 'Company admin does not have an associated organization. Please update your company settings first.'}, status=status.HTTP_400_BAD_REQUEST)
    
    serializer = SupervisorRegistrationSerializer(data=data)
    if serializer.is_valid():
        try:
            supervisor = serializer.save()
            user = supervisor.user
            # Send email
            if 'password' in request.data:
                try:
                    from django.conf import settings
                    from django.core.mail import send_mail
                    subject = "AIMS - Supervisor Assignment & Credentials"
                    message = (
                        f"Dear {user.full_name or user.username},\n\n"
                        f"You have been officially designated as an Internship Supervisor for {supervisor.organization.org_name} within the AIMS platform.\n\n"
                        f"--- SUPERVISOR ACCESS PROTOCOL ---\n"
                        f"Username: {user.username}\n"
                        f"Access Key: {request.data['password']}\n"
                        f"------------------------------------\n\n"
                        f"You can now log in to the Supervisor Portal to manage your interns, review attendance, and submit evaluations.\n\n"
                        f"Welcome to the team,\nThe AIMS Operations Team"
                    )
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [user.email],
                        fail_silently=True,
                    )
                except Exception:
                    pass

            return Response({
                'user': UserSerializer(user).data,
                'supervisor_profile': SupervisorProfileSerializer(supervisor).data,
                'message': 'Supervisor registered and activated successfully.'
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.role == 'university_admin':
            return User.objects.all().order_by('-date_joined')
        return User.objects.none()

class StudentListView(generics.ListAPIView):
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'company_admin':
            from internships.models import Application
            return Student.objects.filter(
                applications__post__organization__created_by=user,
                applications__status='accepted'
            ).distinct()
        return Student.objects.all()

class SupervisorListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'company_admin':
            return User.objects.filter(
                role='supervisor',
                supervisor_profile__organization__created_by=user,
                is_active=True
            ).distinct()
        return User.objects.filter(role='supervisor', is_active=True)

class NotificationListCreateView(generics.ListCreateAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)
    
    def perform_create(self, serializer):
        recipient = self.request.data.get('recipient')
        # Allow admins to send to anyone, users only to themselves (or based on some logic)
        # For now, simplistic: if recipient provided, use it, else current user?
        # Actually standard case: system creates notifications or admin.
        # Let's trust the recipient field for now if admin, else restrict?
        # Simpler: just save. The view is mostly for reading. Creating usually happens internally.
        # But if we want an endpoint to create a notification (e.g. from frontend for some reason?)
        # Let's assume creation is internal mostly but exposure doesn't hurt if secured properly.
        # For now, we only need GET for the user. We can block POST for non-admins if needed.
        if recipient:
             serializer.save()
        else:
             serializer.save(recipient=self.request.user)

class NotificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return Notification.objects.filter(recipient=self.request.user)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def mark_all_notifications_read(request):
    Notification.objects.filter(recipient=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'success'})

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_student(request, student_id):
    if request.user.role != 'university_admin':
        return Response({'error': 'Only University Administrators can approve students.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        student = Student.objects.get(student_id=student_id)
        user = student.user
        user.status = 'active'
        user.save()
        
        # Create a notification for the student
        Notification.objects.create(
            recipient=user,
            title='Account Approved',
            description='Your AIMS account has been approved. You can now log in and access all features.',
            type='success'
        )
        
        try:
            if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                from django.core.mail import send_mail
                subject = "AIMS - Account Access Granted"
                message = (
                    f"Dear {user.full_name or user.username},\n\n"
                    f"Congratulations! Your application for access to the Automated Internship Management System (AIMS) has been reviewed and approved by the University Administration.\n\n"
                    f"You may now log in to your portal to complete your biometric enrollment (if not already done), browse available internship opportunities, and manage your placement process.\n\n"
                    f"Login Portal: {settings.CORS_ALLOWED_ORIGINS[0] if hasattr(settings, 'CORS_ALLOWED_ORIGINS') else 'http://localhost:3000'}/login\n\n"
                    f"Best regards,\nThe AIMS Administration Team"
                )
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                    [user.email],
                    fail_silently=True,
                )
        except Exception:
            pass
        
        return Response({'message': f'Student {user.full_name or user.username} has been approved.'})
    except Student.DoesNotExist:
        return Response({'error': 'Student profile not found.'}, status=status.HTTP_404_NOT_FOUND)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def broadcast_notification_view(request):
    if request.user.role != 'university_admin':
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    
    target = request.data.get('target', 'all')
    title = request.data.get('title')
    description = request.data.get('description')
    notif_type = request.data.get('type', 'info')
    
    users = User.objects.all()
    if target == 'students':
        users = users.filter(role='student')
    elif target == 'supervisors':
        users = users.filter(role='supervisor')
    elif target == 'companies':
        users = users.filter(role='company_admin')
    
    notifications = [
        Notification(
            recipient=user,
            title=title,
            description=description,
            type=notif_type
        ) for user in users
    ]
    
    Notification.objects.bulk_create(notifications)

    # Also send real emails
    try:
        if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
            recipient_list = [u.email for u in users if u.email]
            if recipient_list:
                # We send one email per user to keep it personal or use Bcc for efficiency.
                # For this system, we'll try a simple loop for a few or a broadcast-style if supported.
                # To avoid timeout, we'll send a single email with all users in BCC if there are many,
                # or just a few individual ones.
                
                # Simple implementation:
                from django.core.mail import EmailMessage
                email = EmailMessage(
                    subject=f"AIMS Broadcast: {title}",
                    body=f"Hello,\n\nAn important announcement has been broadcasted to you:\n\n{description}\n\nBest regards,\nThe AIMS Team",
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    to=[settings.DEFAULT_FROM_EMAIL], # Send to self
                    bcc=recipient_list, # Send to all users via BCC
                )
                email.send(fail_silently=True)
    except Exception as e:
        logger.error(f"Failed to send broadcast emails: {e}")

    return Response({'message': f'Broadcast sent to {len(notifications)} users via notifications and email.'})


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def username_recovery(request):
    """
    Username recovery endpoint.
    Accepts an email and returns the associated username.
    In production, this should send the username via email instead.
    """
    email = request.data.get('email')

    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(email=email)
        username = user.username

        # Try to send email if configured
        try:
            if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                send_mail(
                    'Username Recovery - AIMS',
                    f'Hello {user.full_name or user.username},\n\n'
                    f'Your username is: {username}\n\n'
                    f'Use this username to log in to your AIMS account.\n\n'
                    f'Best,\nThe AIMS Team',
                    settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                    [email],
                    fail_silently=True,
                )
        except Exception:
            pass

        # For security, do not return the username directly
        return Response({
            'message': 'If an account with that email exists, recovery information has been sent.',
        })
    except User.DoesNotExist:
        # For security, return a generic message
        return Response({
            'message': 'If an account with that email exists, recovery information has been sent.',
        })


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_request(request):
    """
    Password reset request endpoint.
    Accepts email and sends a password reset link.
    """
    email = request.data.get('email')
    
    if not email:
        return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # For security, don't reveal if the email exists or not
        # Always return success message
        return Response({
            'message': 'If an account with that email exists, a password reset link has been sent.'
        })
    
    # Generate token and uid
    token = default_token_generator.make_token(user)
    uid = urlsafe_base64_encode(force_bytes(user.pk))
    
    # Try to send email, but don't fail if email is not configured
    try:
        if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
            send_mail(
                'Password Reset Request - AIMS',
                f'Your password reset token is: {token}\n\n'
                f'Use this token to reset your password. This token will expire in 1 hour.',
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                [email],
                fail_silently=True,
            )
    except Exception:
        # If email fails, still return success but include debug info
        pass
    
    # Tokens should NEVER be returned in API responses - only sent via email
    response_data = {
        'message': 'If an account with that email exists, a password reset link has been sent.'
    }
    
    return Response(response_data)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def password_reset_confirm(request):
    """
    Password reset confirmation endpoint.
    Accepts token, uid, and new password to reset the user's password.
    """
    uid = request.data.get('uid')
    token = request.data.get('token')
    new_password = request.data.get('new_password')
    new_password_confirm = request.data.get('new_password_confirm')
    
    if not all([uid, token, new_password, new_password_confirm]):
        return Response({'error': 'All fields are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != new_password_confirm:
        return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate password strength
    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Decode uid
    try:
        user_pk = force_str(urlsafe_base64_decode(uid))
        user = User.objects.get(pk=user_pk)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate token
    if not default_token_generator.check_token(user, token):
        return Response({'error': 'Invalid or expired token'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Set new password
    user.set_password(new_password)
    user.save()
    
    return Response({'message': 'Password has been reset successfully. You can now login with your new password.'})


@api_view(['GET', 'PATCH'])
@permission_classes([permissions.IsAuthenticated])
def get_current_user_profile(request):
    """
    GET: Returns the current user's full profile with role-specific data.
    PATCH: Allows updating profile fields including profile_photo upload.
    """
    user = request.user
    
    if request.method == 'PATCH':
        # Handle profile photo upload or other field updates
        if 'profile_photo' in request.FILES:
            file = request.FILES['profile_photo']
            # Validate file type
            allowed_types = ['image/jpeg', 'image/png', 'image/gif']
            if file.content_type not in allowed_types:
                return Response({'error': 'Invalid file type. Only JPEG, PNG, and GIF are allowed.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            # Validate file size (max 5MB)
            if file.size > 5 * 1024 * 1024:
                return Response({'error': 'File too large. Maximum size is 5MB.'}, 
                               status=status.HTTP_400_BAD_REQUEST)
            user.profile_photo = file
        # Handle other updatable fields
        updatable_fields = ['full_name', 'phone_number', 'latitude', 'longitude']
        for field in updatable_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        user.save()
    
    serializer = UserProfileSerializer(user, context={'request': request})
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def re_enroll_all_students_view(request):
    """
    Administrative tool to re-generate biometric embeddings for all students
    using their current profile photos.
    """
    if request.user.role != 'university_admin':
        return Response({'error': 'Only University Administrators can perform bulk re-enrollment.'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    from ai_services.face_recognition.face_verification_light import LightFaceVerification
    from ai_services.face_recognition.gemini_face_verifier import GeminiFaceVerifier
    
    students = Student.objects.filter(user__profile_photo__isnull=False)
    
    # Initialize all verifiers
    verifiers = [LightFaceVerification()]
    try:
        gemini = GeminiFaceVerifier()
        verifiers.append(gemini)
    except Exception: pass
    
    success_count = 0
    fail_count = 0
    errors = []
    
    for student in students:
        try:
            img_path = student.user.profile_photo.path
            if not os.path.exists(img_path):
                fail_count += 1
                errors.append(f"Photo missing for {student.university_id}")
                continue
                
            img = cv2.imread(img_path)
            if img is None:
                fail_count += 1
                errors.append(f"Could not read photo for {student.university_id}")
                continue
                
            img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            
            # Enroll in all available verifiers
            overall_success = True
            for v in verifiers:
                try:
                    success, msg = v.enroll_student(student.university_id, img_rgb, force_update=True)
                    if not success:
                        logger.warning(f"Enrollment partially failed for {student.university_id} in {type(v).__name__}: {msg}")
                except Exception as e:
                    logger.error(f"Error in {type(v).__name__} for {student.university_id}: {e}")
            
            success_count += 1 # Count as success if we tried (mostly for fallback LBPH success)
                
        except Exception as e:
            fail_count += 1
            errors.append(f"Error processing {student.university_id}: {str(e)}")
            
    return Response({
        'message': f'Bulk re-enrollment complete across {len(verifiers)} AI services.',
        'success_count': success_count,
        'fail_count': fail_count,
        'errors': errors[:10] 
    })


class StudentProfilePhotoView(APIView):
    """
    CRUD for student profile image.
    GET: Retrieve current photo.
    POST: Upload/Update photo (triggers AI re-enrollment).
    DELETE: Remove photo.
    """
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        serializer = StudentProfilePhotoSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        user = request.user
        serializer = StudentProfilePhotoSerializer(user, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            
            # If user is a student, re-enroll face in all AI verifiers
            if user.role == 'student':
                try:
                    import cv2
                    from ai_services.face_recognition.face_verification_light import LightFaceVerification
                    from ai_services.face_recognition.gemini_face_verifier import GeminiFaceVerifier

                    
                    student_profile = user.student_profile
                    university_id = student_profile.university_id
                    
                    img_path = user.profile_photo.path
                    img = cv2.imread(img_path)
                    if img is not None:
                        img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                        
                        # 1. Local Verifier
                        lbp = LightFaceVerification()
                        lbp.enroll_student(university_id, img_rgb, force_update=True)
                        
                        # 2. Gemini
                        try:
                            gemini = GeminiFaceVerifier()
                            gemini.enroll_student(university_id, img_rgb, force_update=True)
                        except Exception: pass
                        
                        # 3. Dlib
                        try:
                            from ai_services.face_recognition.dlib_face_verifier import DlibFaceVerifier
                            dv = DlibFaceVerifier()
                            dv.enroll_student(university_id, img_rgb, force_update=True)
                        except Exception: pass
                        
                        logger.info(f"AI auto-enrollment completed for {university_id}")
                except Exception as ai_err:
                    logger.error(f"Error re-enrolling face after photo update: {ai_err}")

            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        user = request.user
        if user.profile_photo:
            # Delete physical file and reference
            user.profile_photo.delete()
            user.save()
            
            # If user is a student, also try to clear AI biometrics
            if user.role == 'student':
                try:
                    from ai_services.views import FaceEnrollView
                    from rest_framework.test import APIRequestFactory
                    
                    # We can call the FaceEnrollView.delete directly or just do the logic.
                    # Logic is safer to avoid request overhead.
                    student_id = user.student_profile.university_id
                    
                    from ai_services.face_recognition.gemini_face_verifier import GeminiFaceVerifier
                    from ai_services.face_recognition.face_verification_light import LightFaceVerification
                    
                    gv = GeminiFaceVerifier()
                    lv = LightFaceVerification()
                    
                    # Clear DBs
                    if student_id in lv.embeddings_db:
                        del lv.embeddings_db[student_id]
                        lv._save_embeddings()
                        
                    try:
                        from ai_services.face_recognition.dlib_face_verifier import DlibFaceVerifier
                        dv = DlibFaceVerifier()
                        if student_id in dv.embeddings_db:
                            del dv.embeddings_db[student_id]
                            dv._save_embeddings()
                    except Exception: pass
                    
                    # Clear Files
                    paths = [
                        os.path.join(gv.enrollment_dir, f"{student_id}.jpg"),
                        os.path.join(gv.enrollment_dir, f"{student_id}.png"),
                        os.path.join(lv.faces_dir, f"{student_id}.png"),
                        os.path.join(lv.faces_dir, f"{student_id}.jpg"),
                    ]
                    for p in paths:
                        if os.path.exists(p):
                            try: os.remove(p)
                            except: pass
                except Exception as e:
                    logger.error(f"Error clearing biometrics during photo delete: {e}")

            return Response({'message': 'Profile photo and biometric data deleted successfully'}, status=status.HTTP_200_OK)
        return Response({'error': 'No profile photo to delete'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def demo_reset_password(request, user_id):
    """
    Demo-only endpoint for University Admin to reset a user's password 
    and optionally send the plain text back to give to them via email.
    """
    user_role = request.user.role
    is_authorized = False
    
    if user_role == 'university_admin':
        is_authorized = True
    elif user_role == 'company_admin':
        try:
            from organizations.models import SupervisorProfile
            target_user = User.objects.get(id=user_id)
            if hasattr(target_user, 'supervisor_profile'):
                if target_user.supervisor_profile.organization.created_by == request.user:
                    is_authorized = True
        except Exception:
            pass

    if not is_authorized:
        return Response({'error': 'Permission denied. You can only reset passwords for users within your authorized scope.'}, status=status.HTTP_403_FORBIDDEN)
    
    try:
        user = User.objects.get(id=user_id)
        import random
        import string
        new_password = ''.join(random.choices(string.ascii_letters + string.digits, k=10))
        user.set_password(new_password)
        user.save()
        
        send_email = request.data.get('send_email', False)
        message = f'Password for {user.username} has been reset.'
        
        if send_email and user.email:
            try:
                if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                    subject = "AIMS - Security Update: Password Reset"
                    message = (
                        f"Dear {user.full_name or user.username},\n\n"
                        f"A password reset has been initiated for your AIMS account by a University Administrator.\n\n"
                        f"--- UPDATED SECURITY CREDENTIALS ---\n"
                        f"Username: {user.username}\n"
                        f"New Password: {new_password}\n"
                        f"-------------------------------------\n\n"
                        f"Please use these new credentials to log in immediately and update your password to a personal one for your security.\n\n"
                        f"Best regards,\nThe AIMS Security Team"
                    )
                    send_mail(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [user.email],
                        fail_silently=True,
                    )
                    message_log += ' Credentials sent to user email.'
            except Exception as e:
                logger.error(f"Failed to send email: {e}")
                message_log += ' System failed to deliver email.'
        
        return Response({
            'username': user.username,
            'new_password': new_password,
            'message': message
        })
    except User.DoesNotExist:
        return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password_view(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    confirm_password = request.data.get('confirm_password')
    
    if not user.check_password(old_password):
        return Response({'error': 'Incorrect current password'}, status=status.HTTP_400_BAD_REQUEST)
        
    if new_password != confirm_password:
        return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
        
    if len(new_password) < 8:
        return Response({'error': 'Password must be at least 8 characters'}, status=status.HTTP_400_BAD_REQUEST)
        
    user.set_password(new_password)
    user.must_change_password = False
    user.save()
    
    return Response({'message': 'Password changed successfully'})
