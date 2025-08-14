# backend/courses/views.py
import whisper
import os
import nltk  
import json
import traceback
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import JSONField 

from .models import Course, Video
from .serializers import CourseSerializer, VideoSerializer

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
        try:
            video = get_object_or_404(Video, pk=pk)
            video_path = video.video_file.path

            if not os.path.exists(video_path):
                return Response({'error': 'Video file not found on server.'}, status=status.HTTP_404_NOT_FOUND)

            model = whisper.load_model("tiny")
            result = model.transcribe(video_path)
            
            video.transcript = result["text"]
            video.save()
            
            return Response({'status': 'Transcription successful!', 'transcript': result["text"]})
        except Exception as e:
            traceback.print_exc()
            return Response({'error': f'Transcription failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=True, methods=['post'], url_path='segment')
    def segment_video(self, request, pk=None):
        try:
            video = get_object_or_404(Video, pk=pk)

            if not video.transcript:
                return Response({'error': 'Transcript not found. Please transcribe the video first.'}, status=status.HTTP_400_BAD_REQUEST)

            # Use NLTK to split the transcript into sentences
            sentences = nltk.sent_tokenize(video.transcript)
            
            segments_data = []
            sentences_per_segment = 5  # Simple heuristic: 5 sentences per segment
            
            for i in range(0, len(sentences), sentences_per_segment):
                segment_text = ' '.join(sentences[i:i + sentences_per_segment])
                
                segment = {
                    'start_index': i,
                    'end_index': i + sentences_per_segment,
                    'text': segment_text,
                }
                segments_data.append(segment)

            video.segments = json.dumps(segments_data)
            video.save()
            
            return Response({'status': 'Segmentation successful!', 'segments': segments_data})
        except Exception as e:
            traceback.print_exc()
            return Response({'error': f'Segmentation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)