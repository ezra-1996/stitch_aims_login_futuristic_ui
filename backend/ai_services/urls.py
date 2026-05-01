from django.urls import path
from .views import FaceEnrollView, FaceVerifyView, ReportEvaluateView, ReportEvaluateAsyncView

urlpatterns = [
    path('face/enroll/', FaceEnrollView.as_view(), name='face-enroll'),
    path('face/verify/', FaceVerifyView.as_view(), name='face-verify'),
    path('report/evaluate/', ReportEvaluateView.as_view(), name='report-evaluate'),
    path('report/evaluate/async/', ReportEvaluateAsyncView.as_view(), name='report-evaluate-async'),
]
