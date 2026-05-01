from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Application, SupervisorAssignment, StudentTask
from .serializers import ApplicationSerializer, SupervisorAssignmentSerializer, StudentTaskSerializer
from users.models import Student

class ApplicationListCreateView(generics.ListCreateAPIView):
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            try:
                student = Student.objects.get(user=user)
                return Application.objects.filter(student=student)
            except Student.DoesNotExist:
                return Application.objects.none()
        if user.role == 'company_admin':
            return Application.objects.filter(post__organization__created_by=user)
        elif user.role in ['supervisor', 'university_admin']:
            # University admin sees all. Supervisor might need specific logic, keeping as all for now or restrict?
            # Supervisors usually deal with assigned students, not raw applications.
            # But let's leave it open for uni admin.
            return Application.objects.all()
        return Application.objects.none()
    
    def perform_create(self, serializer):
        if self.request.user.role == 'student':
            try:
                student = Student.objects.get(user=self.request.user)
                serializer.save(student=student)
            except Student.DoesNotExist:
                raise serializers.ValidationError("Student profile not found")

class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Application.objects.all()
    serializer_class = ApplicationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save()
        status = instance.status
        
        from users.models import Notification
        
        # Handle SupervisorAssignment creation on Acceptance
        if status == 'accepted':
            from .models import SupervisorAssignment
            # Create or update assignment
            assignment, created = SupervisorAssignment.objects.get_or_create(
                student=instance.student,
                organization=instance.post.organization,
                defaults={'is_active': True}
            )
            
            # Auto-assign supervisor if exactly one exists
            org = instance.post.organization
            supervisors = org.supervisors.all()
            if supervisors.count() == 1:
                if not assignment.supervisor:
                    assignment.supervisor = supervisors.first().user
                    assignment.save()
            
            # Notify Uni Admin about the new placement
            from users.models import User
            User.notify_university_admins(
                title="Student Placement Confirmed",
                description=f"Student {instance.student.user.full_name} has accepted an offer from {org.org_name}. Please set their internship timeline.",
                type='success',
                action_link='/admin/dashboard?tab=students'
            )

        # Notify Student if status is 'offered' or 'rejected'
        if status in ['offered', 'rejected']:
            Notification.objects.create(
                recipient=instance.student.user,
                title=f"Application Status Update: {instance.post.title}",
                description=f"Your application status has been updated to: {status.upper()}.",
                type='success' if status == 'offered' else 'error',
                action_link='/my-applications'
            )
            
            try:
                from django.conf import settings
                if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                    from django.core.mail import send_mail
                    send_mail(
                        f'AIMS - Application {status.capitalize()}',
                        f'Hello {instance.student.user.full_name or instance.student.user.username},\n\nYour application for "{instance.post.title}" has been {status.upper()}.\n\nLog in to AIMS to view details.\n\nBest,\nThe AIMS Team',
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [instance.student.user.email],
                        fail_silently=True,
                    )
            except Exception:
                pass
            
        # Notify Company Admin if status is 'accepted' or 'declined' (by student)
        if status in ['accepted', 'declined']:
            # Find company admin (creator of org)
            company_admin = instance.post.organization.created_by
            Notification.objects.create(
                recipient=company_admin,
                title=f"Offer Response: {instance.student.user.full_name}",
                description=f"Student has {status.upper()} the offer for {instance.post.title}.",
                type='success' if status == 'accepted' else 'warning',
                action_link='/company-dashboard'
            )
            try:
                from django.conf import settings
                if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                    from django.core.mail import send_mail
                    send_mail(
                        f'AIMS - Offer {status.title()}',
                        f'Hello {company_admin.full_name or company_admin.username},\n\nThe student {instance.student.user.full_name} has {status.upper()} your offer for "{instance.post.title}".\n\nLog in to AIMS to view details.\n\nBest,\nThe AIMS Team',
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [company_admin.email],
                        fail_silently=True,
                    )
            except Exception:
                pass


class SupervisorAssignmentListCreateView(generics.ListCreateAPIView):
    serializer_class = SupervisorAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = SupervisorAssignment.objects.filter(is_active=True)
        if user.role == 'supervisor':
            return qs.filter(supervisor=user)
        if user.role == 'company_admin':
            return qs.filter(organization__created_by=user)
        if user.role == 'student':
            return qs.filter(student__user=user)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role not in ['company_admin', 'university_admin']:
            raise serializers.ValidationError("Only Company or University Admins can assign supervisors.")
        
        # If company admin, ensure they own the organization
        if user.role == 'company_admin':
            org = serializer.validated_data.get('organization')
            if org.created_by != user:
                raise serializers.ValidationError("You can only assign supervisors for your own organization.")
        
        serializer.save()

class SupervisorAssignmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = SupervisorAssignment.objects.all()
    serializer_class = SupervisorAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]


class StudentTaskListCreateView(generics.ListCreateAPIView):
    serializer_class = StudentTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'supervisor':
            return StudentTask.objects.filter(supervisor=user).order_by('-created_at')
        if user.role == 'student':
            try:
                student = Student.objects.get(user=user)
                return StudentTask.objects.filter(student=student).order_by('-created_at')
            except Student.DoesNotExist:
                return StudentTask.objects.none()
        # admins/company can view all tasks
        if user.role in ['company_admin', 'university_admin']:
            return StudentTask.objects.all().order_by('-created_at')
        return StudentTask.objects.none()

    def perform_create(self, serializer):
        # Only supervisors can assign tasks
        if self.request.user.role != 'supervisor':
            raise serializers.ValidationError("Only supervisors can assign tasks")
        task = serializer.save(supervisor=self.request.user)
        
        # Notify Uni Admin
        from users.models import User
        User.notify_university_admins(
            title="New Task Assigned",
            description=f"Supervisor {self.request.user.full_name} assigned task '{task.title}' to student {task.student.user.full_name}.",
            type='info',
            action_link=None
        )


class StudentTaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = StudentTask.objects.all()
    serializer_class = StudentTaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_update(self, serializer):
        instance = serializer.save()
        if self.request.user.role == 'supervisor':
            from users.models import User
            User.notify_university_admins(
                title="Task Modified",
                description=f"Supervisor {self.request.user.full_name} updated task '{instance.title}' for student {instance.student.user.full_name}.",
                type='warning'
            )

    def perform_destroy(self, instance):
        title = instance.title
        student_name = instance.student.user.full_name
        instance.delete()
        if self.request.user.role == 'supervisor':
            from users.models import User
            User.notify_university_admins(
                title="Task Deleted",
                description=f"Supervisor {self.request.user.full_name} deleted task '{title}' assigned to {student_name}.",
                type='error'
            )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_application_view(request, application_id):
    try:
        application = Application.objects.get(application_id=application_id)
        if request.user.role == 'company_admin':
            application.status = 'accepted'
            application.save()
            
            org = application.post.organization
            supervisors = org.supervisors.all()
            
            # Auto-assign if exactly one supervisor exists
            if supervisors.count() == 1:
                supervisor_user = supervisors.first().user
                from internships.models import SupervisorAssignment
                SupervisorAssignment.objects.get_or_create(
                    student=application.student,
                    organization=org,
                    defaults={'supervisor': supervisor_user, 'is_active': True}
                )

            # Send Notification and Email
            from users.models import Notification
            Notification.objects.create(
                recipient=application.student.user,
                title=f"Application Approved: {application.post.title}",
                description=f"Your application for {application.post.title} has been ACCEPTED by the company.",
                type='success',
                action_link='/my-applications'
            )
            
            try:
                from django.conf import settings
                if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                    from django.core.mail import send_mail
                    send_mail(
                        'AIMS - Application Approved',
                        f'Hello {application.student.user.full_name or application.student.user.username},\n\nCongratulations! Your application for "{application.post.title}" has been ACCEPTED by the company.\n\nLog in to AIMS to view the details and your next steps.\n\nBest,\nThe AIMS Team',
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [application.student.user.email],
                        fail_silently=True,
                    )
            except Exception:
                pass
                
            return Response({'message': 'Application accepted successfully'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except Application.DoesNotExist:
        return Response({'error': 'Application not found'}, status=status.HTTP_404_NOT_FOUND)
