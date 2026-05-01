from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Q
from .models import Organization, InternshipPost
from .serializers import OrganizationSerializer, InternshipPostSerializer

class OrganizationListCreateView(generics.ListCreateAPIView):
    serializer_class = OrganizationSerializer
    
    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated:
            if user.role == 'company_admin':
                 return Organization.objects.filter(created_by=user)
        return Organization.objects.all()
    
    def get_permissions(self):
        if self.request.method == 'POST':
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

class OrganizationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Organization.objects.all()
    serializer_class = OrganizationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'company_admin':
            return Organization.objects.filter(created_by=user)
        return Organization.objects.all()

class InternshipPostListCreateView(generics.ListCreateAPIView):
    queryset = InternshipPost.objects.filter(is_active=True)
    serializer_class = InternshipPostSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def perform_create(self, serializer):
        if 'organization' not in self.request.data:
            user = self.request.user
            if user.role == 'company_admin':
                org = Organization.objects.filter(created_by=user).first()
                if org:
                    serializer.save(organization=org)
                    return
            # For non-company admins or if no org is found, use the standard save 
            # which will likely fail with a validation error if not provided
            serializer.save()
        else:
            serializer.save()

class InternshipPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = InternshipPost.objects.all()
    serializer_class = InternshipPostSerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def active_internships_view(request):
    # Only show internships from approved organizations that are marked as active
    internships = InternshipPost.objects.filter(
        is_active=True, 
        organization__status='approved'
    ).order_by('-created_at')
    serializer = InternshipPostSerializer(internships, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def approve_organization_view(request, org_id):
    try:
        org = Organization.objects.get(org_id=org_id)
        if request.user.role == 'university_admin':
            org.status = 'approved'
            org.save()
            
            # Activate the company admin user
            admin_user = org.created_by
            if admin_user.status == 'pending':
                admin_user.status = 'active'
                admin_user.save()
            
            # Create a notification
            from users.models import Notification
            Notification.objects.create(
                recipient=admin_user,
                title='Organization Approved',
                description=f'Your organization, {org.org_name}, has been approved. You can now post internships.',
                type='success'
            )
            
            # Send email
            from django.conf import settings
            try:
                if hasattr(settings, 'EMAIL_BACKEND') and settings.EMAIL_BACKEND:
                    from django.core.mail import send_mail
                    send_mail(
                        'AIMS - Organization Approved',
                        f'Hello {admin_user.full_name or admin_user.username},\n\n'
                        f'Your organization "{org.org_name}" has been successfully approved by the University Administrator.\n\n'
                        f'Your Admin Credentials:\n'
                        f'Username: {admin_user.username}\n\n'
                        f'You can now log in and post internships for students to apply.\n\n'
                        f'Best regards,\nThe AIMS Team',
                        settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@aims.edu',
                        [admin_user.email, org.contact_email] if admin_user.email != org.contact_email else [admin_user.email],
                        fail_silently=True,
                    )
            except Exception:
                pass
                
            return Response({'message': 'Organization approved successfully'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except Organization.DoesNotExist:
        return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def reject_organization_view(request, org_id):
    try:
        org = Organization.objects.get(org_id=org_id)
        if request.user.role == 'university_admin':
            org.status = 'rejected'
            org.save()
            return Response({'message': 'Organization rejected successfully'})
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
    except Organization.DoesNotExist:
        return Response({'error': 'Organization not found'}, status=status.HTTP_404_NOT_FOUND)
