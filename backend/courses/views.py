# backend/courses/views.py
import whisper
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Course, Video
from .serializers import CourseSerializer, VideoSerializer
from django.shortcuts import get_object_or_404
from django.conf import settings
import os

# API view to list, retrieve, and update courses
class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer

# A view for video-specific actions
class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

    @action(detail=True, methods=['post'], url_path='transcribe')
    def transcribe_video(self, request, pk=None):
        video = get_object_or_404(Video, pk=pk)
        print(f"DEBUG: MEDIA_ROOT is: {settings.MEDIA_ROOT}")
        print(f"DEBUG: FileField name is: {video.video_file.name}")
        print(f"DEBUG: .path attribute is: {video.video_file.path}")
        # Use the .path attribute for the most reliable absolute file path
        video_path = video.video_file.path
        print(f"DEBUG: Using file path: {video_path}") # <-- Keep this print for verification
        FFMPEG_PATH = r"C:\ffmpeg\bin\ffmpeg.exe" 
        
        # Construct the absolute path to the video file
        # The path from models.FileField is relative to MEDIA_ROOT
        video_path = os.path.join(settings.MEDIA_ROOT, video.video_file.name)

        if not os.path.exists(video_path):
            return Response({'error': 'Video file not found on server.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            os.environ['PATH'] += os.pathsep + os.path.dirname(FFMPEG_PATH)
            # Load the Whisper model (we'll use 'base' for a good balance of speed and accuracy)
            model = whisper.load_model("base")
            # Transcribe the video (it returns a dictionary with the transcription text)
            result = model.transcribe(video_path)
            
            # Save the transcript to the video model
            video.transcript = result["text"]
            video.save()
            
            return Response({'status': 'Transcription successful!', 'transcript': result["text"]})

        except Exception as e:
            return Response({'error': f'Transcription failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)