from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CourseViewSet, VideoViewSet, QuizViewSet, video_upload_view, code_execute_view, TutorCourseViewSet, ReviewViewSet, AnalyticsView, EnrollmentViewSet

# Create a router instance
router = DefaultRouter()
# Register our viewsets with the router
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'videos', VideoViewSet, basename='video')
router.register(r'quizzes', QuizViewSet, basename='quiz')
router.register(r'reviews', ReviewViewSet, basename='review')
router.register(r'tutor/courses', TutorCourseViewSet, basename='tutor-course')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')

tutor_router = DefaultRouter()
tutor_router.register(r'courses', TutorCourseViewSet, basename='tutor-course')

urlpatterns = [
    path('videos/upload/', video_upload_view, name='video-upload'),
    path('code/execute/', code_execute_view, name='code-execute'),
    path('tutor/', include(tutor_router.urls)),
    path('tutor/analytics/', AnalyticsView.as_view(), name='tutor-analytics'),
    path('', include(router.urls)),
    
]
