# backend/courses/admin.py
from django.contrib import admin
from .models import Course, Video, Quiz, Question

admin.site.register(Course)
admin.site.register(Video)
admin.site.register(Quiz)
admin.site.register(Question)