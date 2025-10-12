# backend/courses/serializers.py
from rest_framework import serializers
from .models import Course, Video, Quiz, Question, QuizAttempt, StudentAnswer, StudentProgress

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
    current_user_progress = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = '__all__'

    def get_current_user_progress(self, obj):
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return {'video_completed': False, 'all_quizzes_passed': False, 'last_watched_time': 0.0}
        try:
            progress = StudentProgress.objects.get(student=request.user, video=obj)
            return StudentProgressSerializer(progress).data
        except StudentProgress.DoesNotExist:
            return {'video_completed': False, 'all_quizzes_passed': False, 'last_watched_time': 0.0}

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

class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = ['video_completed', 'all_quizzes_passed', 'last_watched_time', 'updated_at']