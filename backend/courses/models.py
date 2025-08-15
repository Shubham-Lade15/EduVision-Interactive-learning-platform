# backend/courses/models.py
from django.db import models
from django.db.models import JSONField

class Course(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    # You might want to link this to a User (Instructor) later:
    # instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')

    #def __str__(self):
     #   return self.title

class Video(models.Model):
    course = models.ForeignKey(Course, related_name='videos', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    # This is where the video file will be stored. You might need to configure MEDIA_ROOT in settings.py
    video_file = models.FileField(upload_to='videos/')
    duration_seconds = models.IntegerField(null=True, blank=True) # Will populate later
    order = models.IntegerField(default=0) # For ordering videos in a course
    transcript = models.TextField(blank=True, null=True)
    segments = JSONField(blank=True, null=True)

    class Meta:
        ordering = ['order'] # Order videos by 'order' field

    def __str__(self):
        return f"{self.course.title} - {self.title}"
    
class Quiz(models.Model):
    video = models.ForeignKey(
        'Video', 
        related_name='quizzes', 
        on_delete=models.CASCADE
    )
    segment_index = models.IntegerField(
        help_text="The index of the video segment this quiz is for."
    )

    def __str__(self):
        return f"Quiz for {self.video.title} (Segment {self.segment_index})"

class Question(models.Model):
    quiz = models.ForeignKey(
        Quiz, 
        related_name='questions', 
        on_delete=models.CASCADE
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