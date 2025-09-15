# backend/courses/serializers.py
from rest_framework import serializers
from .models import Course, Video, Quiz, Question, QuizAttempt, StudentAnswer

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
    quizzes = QuizSerializer(many=True, read_only=True) # <-- This is the key line
    class Meta:
        model = Video
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    videos = VideoSerializer(many=True, read_only=True)

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'videos']

        
class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = '__all__'

class QuizAttemptSerializer(serializers.ModelSerializer):
    student_answers = StudentAnswerSerializer(many=True, read_only=True)
    class Meta:
        model = QuizAttempt
        fields = '__all__'
