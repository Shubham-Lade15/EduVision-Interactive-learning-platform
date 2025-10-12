
# backend/courses/models.py
from django.db import models
from django.db.models import JSONField

from django.contrib.auth import get_user_model

User = get_user_model()


class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    tutor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses', default=1)

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

# backend/courses/models.py (add near other models)
class StudentProgress(models.Model):
    student = models.ForeignKey(User, on_delete=models.CASCADE, related_name='progresses')
    video = models.ForeignKey('Video', on_delete=models.CASCADE, related_name='progresses')
    video_completed = models.BooleanField(default=False)
    all_quizzes_passed = models.BooleanField(default=False)
    last_watched_time = models.FloatField(default=0.0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'video')

    def __str__(self):
        return f"Progress: {self.student.username} - {self.video.title}"
