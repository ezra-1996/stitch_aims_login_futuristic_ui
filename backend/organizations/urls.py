from django.urls import path
from .views import (OrganizationListCreateView, OrganizationDetailView,
                   InternshipPostListCreateView, InternshipPostDetailView,
                   active_internships_view, approve_organization_view, reject_organization_view)

urlpatterns = [
    path('organizations/', OrganizationListCreateView.as_view(), name='organization-list'),
    path('organizations/<int:pk>/', OrganizationDetailView.as_view(), name='organization-detail'),
    path('organizations/<int:org_id>/approve/', approve_organization_view, name='organization-approve'),
    path('organizations/<int:org_id>/reject/', reject_organization_view, name='organization-reject'),
    path('internship-posts/', InternshipPostListCreateView.as_view(), name='internship-post-list'),
    path('internship-posts/<int:pk>/', InternshipPostDetailView.as_view(), name='internship-post-detail'),
    path('active-internships/', active_internships_view, name='active-internships'),
]
