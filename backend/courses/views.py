# backend/courses/views.py
from rest_framework import generics
from .models import Course, Video
from .serializers import CourseSerializer, VideoSerializer

# API view to list all courses and create new ones
class CourseListCreateView(generics.ListCreateAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

# API view to retrieve, update, or delete a single course
class CourseDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer