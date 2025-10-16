# backend/courses/admin.py
from django.contrib import admin
from .models import Course, Video, Quiz, Question, Enrollment

admin.site.register(Course)
admin.site.register(Video)
admin.site.register(Quiz)
admin.site.register(Question)
admin.site.register(Enrollment)