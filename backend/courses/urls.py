# backend/courses/urls.py
from django.urls import path
from .views import CourseListCreateView, CourseDetailView # Import your views

urlpatterns = [
    # Path for /api/courses/ (lists all courses, allows creating new course)
    path('', CourseListCreateView.as_view(), name='course-list-create'),
    # Path for /api/courses/<id>/ (gets, updates, or deletes a specific course)
    path('<int:pk>/', CourseDetailView.as_view(), name='course-detail'),
]