from django.urls import path
from .views import (ApplicationListCreateView, ApplicationDetailView,
                   SupervisorAssignmentListCreateView, SupervisorAssignmentDetailView,
                   StudentTaskListCreateView, StudentTaskDetailView,
                   approve_application_view)

urlpatterns = [
    path('applications/', ApplicationListCreateView.as_view(), name='application-list'),
    path('applications/<int:pk>/', ApplicationDetailView.as_view(), name='application-detail'),
    path('applications/<int:application_id>/approve/', approve_application_view, name='approve-application'),
    path('supervisor-assignments/', SupervisorAssignmentListCreateView.as_view(), name='supervisor-assignment-list'),
    path('supervisor-assignments/<int:pk>/', SupervisorAssignmentDetailView.as_view(), name='supervisor-assignment-detail'),
    path('tasks/', StudentTaskListCreateView.as_view(), name='task-list'),
    path('tasks/<int:pk>/', StudentTaskDetailView.as_view(), name='task-detail'),
]
