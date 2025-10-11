from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, VideoViewSet, QuizViewSet, video_upload_view, code_execute_view

# Create a router instance
router = DefaultRouter()
# Register our viewsets with the router
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'videos', VideoViewSet, basename='video')
router.register(r'quizzes', QuizViewSet, basename='quiz')

urlpatterns = [
    path('videos/upload/', video_upload_view, name='video-upload'),
    path('code/execute/', code_execute_view, name='code-execute'),
    path('', include(router.urls)),
]
