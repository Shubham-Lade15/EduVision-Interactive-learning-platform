# backend/courses/serializers.py
from rest_framework import serializers
from .models import Course, Video, Quiz, Question

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = '__all__'

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = '__all__'

class VideoSerializer(serializers.ModelSerializer):
    quizzes = QuizSerializer(many=True, read_only=True)

    class Meta:
        model = Video
        fields = '__all__' # Includes all fields from the Video model

class CourseSerializer(serializers.ModelSerializer):
    videos = VideoSerializer(many=True, read_only=True) # Nested serializer to show videos in course list

    class Meta:
        model = Course
        fields = '__all__' # Includes all fields from the Course model