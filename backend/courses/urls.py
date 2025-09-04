from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, VideoViewSet, QuizViewSet

router = DefaultRouter()
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'videos', VideoViewSet, basename='video')
router.register(r'quizzes', QuizViewSet, basename='quiz') 

urlpatterns = [
    path('', include(router.urls)),
]