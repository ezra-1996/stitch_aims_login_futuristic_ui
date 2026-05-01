from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from .views import HomepageView, APIRootView, APIDocsView

urlpatterns = [
    # Home and API endpoints
    path('', HomepageView.as_view(), name='homepage'),
    path('api/', APIRootView.as_view(), name='api-root'),
    path('api/docs/', APIDocsView.as_view(), name='api-docs'),
    
    # Admin interface
    path('admin/', admin.site.urls),
    
    # App endpoints

    path('api/auth/', include('users.urls')),
    path('api/organizations/', include('organizations.urls')),
    path('api/internships/', include('internships.urls')),
    path('api/attendance/', include('attendance.urls')),
    path('api/evaluation/', include('evaluation.urls')),
    path('api/ai/', include('ai_services.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
