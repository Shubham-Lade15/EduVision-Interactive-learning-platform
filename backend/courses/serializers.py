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
    passed_quiz_ids = serializers.SerializerMethodField()
    current_user_progress = serializers.SerializerMethodField()

    def get_passed_quiz_ids(self, obj):
        user = self.context["request"].user
        if user.is_anonymous:
            return []
        return list(
            QuizAttempt.objects.filter(
                student=user, quiz__video=obj, passed=True
            ).values_list("quiz_id", flat=True)
        )

    def get_current_user_progress(self, obj):
        user = self.context.get('request').user
        if user.is_authenticated and user.role == 'student':
            progress, _ = StudentProgress.objects.get_or_create(student=user, video=obj)
            return {
                'video_completed': progress.video_completed,
                'all_quizzes_passed': progress.all_quizzes_passed
            }
        return {'video_completed': False, 'all_quizzes_passed': False}


    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "video_file",
            "quizzes",
            "passed_quiz_ids",          # 🆕
            "current_user_progress",    # 🆕
        ]

class CourseSerializer(serializers.ModelSerializer):
    tutor_username = serializers.ReadOnlyField(source='tutor.username')
    videos = serializers.SerializerMethodField()
    # # New optional metadata fields
    # about = serializers.CharField(required=False, allow_blank=True)
    # skills_gained = serializers.CharField(required=False, allow_blank=True)
    # outcome = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Course
        fields = [
            'id', 
            'title', 
            'description', 
            'tutor_username',
            # 'short_description', 
            'duration_hours', 
            'language', 
            'is_published', 
            'videos',
            'about',
            'skills_gained',
            'outcome',
        ]
        read_only_fields = ['tutor']
        
    def get_videos(self, obj):
        # Return course videos only if the request user is authorized (enrolled or tutor)
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return []  # Guests can’t access videos

        # Tutors can always access their own videos
        if hasattr(user, 'role') and user.role == 'tutor' and obj.tutor == user:
            videos = obj.videos.all().order_by('id')
            return VideoSerializer(videos, many=True, context=self.context).data

        # Students can access videos only if enrolled
        is_enrolled = obj.enrollments.filter(student=user).exists()
        if is_enrolled:
            videos = obj.videos.all().order_by('id')
            return VideoSerializer(videos, many=True, context=self.context).data

        # Otherwise block access
        return []



        
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
