
# backend/courses/models.py
from django.db import models
from django.db.models import JSONField

from django.contrib.auth import get_user_model

User = get_user_model()

RATING_CHOICES = [
    (i / 10.0, f"{i / 10.0:.1f}") for i in range(5, 51, 5) 
]

class Course(models.Model):
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name="courses")
    title = models.CharField(max_length=255)
    description = models.TextField()
    language = models.CharField(max_length=50, default="English")
    duration_hours = models.FloatField(default=0)
    about = models.TextField(blank=True, null=True, help_text="What will you learn in this course?")
    skills_gained = models.TextField(blank=True, null=True, help_text="Skills you’ll gain from this course.")
    outcome = models.TextField(blank=True, null=True, help_text="Expected outcome after completing this course.")
    is_published = models.BooleanField(default=False)
   

class Video(models.Model):
    course = models.ForeignKey(Course, related_name='videos', on_delete=models.CASCADE)
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='videos', default=1)
    title = models.CharField(max_length=255)
    video_file = models.FileField(upload_to='videos/')
    # Add other fields here like quizzes, notes, etc.
    transcript = models.TextField(blank=True, null=True)
    notes = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.title

    class Meta:
        ordering = ['id']

class Quiz(models.Model):
    video = models.ForeignKey(
        'Video', related_name='quizzes', on_delete=models.CASCADE
    )
    segment_index = models.IntegerField(
        help_text="The index of the video segment this quiz is for."
    )
    segment_end_time = models.FloatField(
        default=0.0,
        help_text="The timestamp in seconds when this quiz should appear."
    )

    def __str__(self):
        return f"Quiz for {self.video.title} (Segment {self.segment_index})"


class Question(models.Model):
    quiz = models.ForeignKey(
        Quiz, related_name='questions', on_delete=models.CASCADE
    )
    question_text = models.TextField()
    choices = JSONField(
        help_text="JSON array of choices, e.g., ['A', 'B', 'C']"
    )
    correct_answer = models.CharField(
        max_length=255,
        help_text="The correct answer from the choices"
    )

    def __str__(self):
        return f"Question {self.id}: {self.question_text[:50]}..."
    
class QuizAttempt(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    quiz = models.ForeignKey('Quiz', on_delete=models.CASCADE, related_name='attempts')
    score = models.IntegerField(default=0)
    passed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Attempt by {self.student.username} on {self.quiz.video.title} Quiz"

class StudentAnswer(models.Model):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='student_answers', null=True)
    question = models.ForeignKey('Question', on_delete=models.CASCADE, null=True)
    selected_option = models.CharField(max_length=255, null=True, blank=True)
    is_correct = models.BooleanField(default=False)

class StudentProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progresses')
    video = models.ForeignKey('Video', on_delete=models.CASCADE, related_name='progresses')
    video_completed = models.BooleanField(default=False)
    all_quizzes_passed = models.BooleanField(default=False)
    notes_unlocked = models.BooleanField(default=False)
    last_watched_time = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'video')

    def __str__(self):
        return f"Progress: {self.student.username} - {self.video.title}"

class Enrollment(models.Model):
    student = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='enrollments'
    )
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE, 
        related_name='enrollments'
    )
    enrollment_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Ensures a student can enroll in the same course only once
        unique_together = ('student', 'course') 

    def __str__(self):
        return f"{self.student.username} enrolled in {self.course.title}"

class Review(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_left',
        verbose_name='Reviewer'
    )
    course = models.ForeignKey(
        'Course',
        on_delete=models.CASCADE,
        related_name='reviews',
        verbose_name='Course Reviewed'
    )
    # Rating field (e.g., 1 to 5 stars)
    rating = models.FloatField(
        choices=RATING_CHOICES, 
        default=5.0
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # Ensures a student can review the same course only once
        unique_together = ('student', 'course')
        ordering = ['-created_at'] # Show newest reviews first

    def __str__(self):
        return f"Review by {self.student.username} for {self.course.title} ({self.rating} stars)"