# backend/courses/serializers.py
from rest_framework import serializers
from .models import Course, Video, Quiz, Question, QuizAttempt, StudentAnswer, Enrollment, Review, StudentProgress

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
    passed_quiz_ids = serializers.SerializerMethodField() # <--- NEW FIELD

    def get_passed_quiz_ids(self, obj):
        # NOTE: Keeping this logic as defined in the solution to the previous step.
        user = self.context.get("request", None).user if self.context.get("request") else None
        if not user or user.is_anonymous:
            return []
        return list(
            QuizAttempt.objects.filter(
                student=user, quiz__video=obj, passed=True
            ).values_list("quiz_id", flat=True).distinct() 
        )

        
    def get_current_user_progress(self, obj):
        # ... (Implementation from previous step, relies on StudentProgressSerializer) ...
        request = self.context.get('request')
        if request and request.user.is_authenticated and hasattr(request.user, 'role') and request.user.role == 'student':
            progress, created = StudentProgress.objects.get_or_create(
                student=request.user,
                video=obj,
            )
            return StudentProgressSerializer(progress).data
        return None

    class Meta:
        model = Video
        fields = [
            "id",
            "title",
            "video_file",
            "notes",
            "quizzes",
            "passed_quiz_ids",
            "current_user_progress", # <- ADD THIS FIELD
        ]

class CourseSerializer(serializers.ModelSerializer):
    tutor_username = serializers.ReadOnlyField(source='tutor.username')
    videos = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField() # <--- NEW FIELD (Feature 1/6)
    
    # ... (Meta class) ...
    class Meta:
        model = Course
        fields = [
            'id',
            'title',
            'description',
            'tutor_username',
            'duration_hours',
            'language',
            'is_published',
            'videos',
            'about',
            'skills_gained',
            'outcome',
            'progress_percentage', # <--- ADD FIELD
        ]
        read_only_fields = ['tutor']

    # NEW METHOD: Calculates total progress for the course (Feature 1, 2)
    def get_progress_percentage(self, obj):
        request = self.context.get('request')
        user = getattr(request, 'user', None)

        if not user or not user.is_authenticated or user.role != 'student':
            return 0 # Only calculate for logged-in students

        # Use the logic established in the frontend (2 points per video: watch + quizzes)
        videos = obj.videos.all()
        if not videos:
            return 0

        total_points = videos.count() * 2
        earned_points = 0

        for video in videos:
            # Need to fetch the progress instance manually, as nested serializer won't run here
            progress = StudentProgress.objects.filter(student=user, video=video).first()

            if progress:
                if progress.video_completed:
                    earned_points += 1
                if progress.all_quizzes_passed:
                    earned_points += 1
        
        return round((earned_points / total_points) * 100) if total_points > 0 else 0

    def get_videos(self, obj):
        # ... (Implementation remains the same - ensures correct video serialization with context) ...
        request = self.context.get('request')
        user = getattr(request, 'user', None)
        if not user or not user.is_authenticated:
            return [] 
        
        # Tutors see all videos
        if hasattr(user, 'role') and user.role == 'tutor' and obj.tutor == user:
            videos = obj.videos.all().order_by('id')
            return VideoSerializer(videos, many=True, context=self.context).data
        
        # Students see videos only if enrolled
        is_enrolled = obj.enrollments.filter(student=user).exists()
        if is_enrolled:
            videos = obj.videos.all().order_by('id')
            return VideoSerializer(videos, many=True, context=self.context).data
        
        return []

# NEW: StudentProgressSerializer (Add this near the end of the file, around line 3390)
class StudentProgressSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProgress
        fields = ['video_completed', 'all_quizzes_passed', 'last_watched_time', 'updated_at']

        
class StudentAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAnswer
        fields = '__all__'

class QuizAttemptSerializer(serializers.ModelSerializer):
    student_answers = StudentAnswerSerializer(many=True, read_only=True)
    class Meta:
        model = QuizAttempt
        fields = '__all__'

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
