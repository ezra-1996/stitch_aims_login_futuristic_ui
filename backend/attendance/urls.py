from django.urls import path
from .views import AttendanceListCreateView, AttendanceDetailView, student_attendance_summary, ai_mark_attendance

urlpatterns = [
    path('attendance/', AttendanceListCreateView.as_view(), name='attendance-list'),
    path('attendance/<int:pk>/', AttendanceDetailView.as_view(), name='attendance-detail'),
    path('students/<int:student_id>/attendance-summary/', student_attendance_summary, name='student-attendance-summary'),
    path('mark-ai/', ai_mark_attendance, name='ai-mark-attendance'),
]
