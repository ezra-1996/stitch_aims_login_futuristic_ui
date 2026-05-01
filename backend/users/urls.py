from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (login_view, register_view, student_register_view, company_register_view, 
                    university_admin_register_view, supervisor_register_view, UserListView, 
                    StudentListView, SupervisorListView, NotificationListCreateView, 
                    NotificationDetailView, mark_all_notifications_read, approve_student, 
                    broadcast_notification_view, password_reset_request, password_reset_confirm,
                    get_current_user_profile, username_recovery, StudentProfilePhotoView,
                    re_enroll_all_students_view, demo_reset_password, change_password_view)

urlpatterns = [
    path('login/', login_view, name='login'),
    path('register/', register_view, name='register'),
    path('register/student/', student_register_view, name='student-register'),
    path('register/company/', company_register_view, name='company-register'),
    path('register/university-admin/', university_admin_register_view, name='university-admin-register'),
    path('register/supervisor/', supervisor_register_view, name='supervisor-register'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/me/', get_current_user_profile, name='current-user-profile'),
    path('users/profile-photo/', StudentProfilePhotoView.as_view(), name='student-profile-photo'),
    path('users/re-enroll-all/', re_enroll_all_students_view, name='re-enroll-all-students'),
    path('students/', StudentListView.as_view(), name='student-list'),
    path('supervisors/', SupervisorListView.as_view(), name='supervisor-list'),
    path('notifications/', NotificationListCreateView.as_view(), name='notifications-list'),
    path('notifications/<int:pk>/', NotificationDetailView.as_view(), name='notifications-detail'),
    path('notifications/mark-read/', mark_all_notifications_read, name='notifications-mark-read'),
    path('notifications/broadcast/', broadcast_notification_view, name='notifications-broadcast'),
    path('students/<int:student_id>/approve/', approve_student, name='student-approve'),
    path('users/<int:user_id>/demo-reset-password/', demo_reset_password, name='demo-reset-password'),
    path('change-password/', change_password_view, name='change-password'),
    
    # Password reset endpoints
    path('password-reset/', password_reset_request, name='password-reset-request'),
    path('password-reset/confirm/', password_reset_confirm, name='password-reset-confirm'),

    # Username recovery
    path('username-recovery/', username_recovery, name='username-recovery'),
]
