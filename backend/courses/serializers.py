# backend/courses/serializers.py
from rest_framework import serializers
from .models import Course, Video, Quiz, Question, QuizAttempt, StudentAnswer, StudentProgress, Enrollment, Review 

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
        if request and request.user.is_authenticated and request.user.role == 'student':
            progress, created = StudentProgress.objects.get_or_create(
                student=request.user,
                video=obj
            )
            return StudentProgressSerializer(progress).data
        return None # Return None if user is not a student or not authenticated

class CourseSerializer(serializers.ModelSerializer):
    # CRITICAL: Read-only field to display the tutor's username/name
    tutor_username = serializers.ReadOnlyField(source='tutor.username')

    videos = serializers.SerializerMethodField()
    
    class Meta:
        model = Course
        fields = [
            'id', 
            'title', 
            'description', 
            'tutor_username',       # New read-only field
            # NEW METADATA FIELDS:
            'short_description', 
            'duration_hours', 
            'language', 
            'is_published', 
            'videos'
        ]
        # Make the actual tutor ID read-only so it's set by perform_create in views.py
        read_only_fields = ['tutor'] # Prevents the client from setting the tutor ID manually

        
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

class EnrollmentSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source='course.title')
    student_username = serializers.ReadOnlyField(source='student.username')
    
    class Meta:
        model = Enrollment
        # Expose course and student IDs, date, and the read-only titles
        fields = ['id', 'student', 'course', 'enrollment_date', 'course_title', 'student_username']
        read_only_fields = ['student', 'enrollment_date'] # Student is set automatically on enrollment

class ReviewSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')
    
    class Meta:
        model = Review
        fields = ['id', 'student', 'course', 'student_username', 'rating', 'comment', 'created_at']
        read_only_fields = ['student', 'created_at']
        extra_kwargs = {
            'course': {'write_only': True} # Course ID is submitted, not displayed for submission
        }
