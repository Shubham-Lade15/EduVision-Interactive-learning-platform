# backend/core_project/urls.py
from django.contrib import admin
from django.urls import path, include # Make sure include is imported
from django.conf import settings # Import settings
from django.conf.urls.static import static # Import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')), # For DRF login/logout in browser
    path('api/courses/', include('courses.urls')), # We'll create this soon
    # path('api/users/', include('users.urls')), # If you make user-specific APIs later
]

# ONLY serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)