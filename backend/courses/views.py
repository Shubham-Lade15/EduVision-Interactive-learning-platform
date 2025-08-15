# backend/courses/views.py
import whisper
import os
import nltk
import json
import traceback
import random
import numpy as np # <-- NEW
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import JSONField
from .models import Course, Video, Quiz, Question
from .serializers import CourseSerializer, VideoSerializer
from sentence_transformers import SentenceTransformer # <-- NEW
from sklearn.metrics.pairwise import cosine_similarity # <-- NEW

# Load the Sentence-Transformer model once
model_st = SentenceTransformer('all-MiniLM-L6-v2')
nlp = nltk.data.load('tokenizers/punkt/english.pickle')

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


class VideoViewSet(viewsets.ModelViewSet):
    # ... (all other methods remain the same) ...

    @action(detail=True, methods=['post'], url_path='generate-quiz')
    def generate_quiz(self, request, pk=None):
        try:
            video = get_object_or_404(Video, pk=pk)
            
            if not video.segments:
                return Response({'error': 'Segments not found. Please segment the video first.'}, status=status.HTTP_400_BAD_REQUEST)
            
            segments = json.loads(video.segments)
            quiz_created = 0

            # Delete old quizzes first to prevent duplicates
            Quiz.objects.filter(video=video).delete()

            # --- NEW, LOGICAL QUIZ GENERATION LOGIC ---
            for index, segment in enumerate(segments):
                segment_text = segment['text']
                sentences_in_segment = nltk.sent_tokenize(segment_text)
                
                # Heuristic for a better question: find a sentence with a specific keyword
                key_sentence = None
                keywords_to_check = ['class', 'function', 'variable', 'object', 'array', 'list']
                
                for sentence in sentences_in_segment:
                    if any(keyword in sentence.lower() for keyword in keywords_to_check):
                        key_sentence = sentence
                        break
                
                if key_sentence:
                    # Create a simple question and options based on the key sentence
                    question_text = f"Based on this segment, what is the key idea about '{key_sentence.split()[0]}'? (Hint: '{key_sentence[:50]}...')"
                    
                    # Generate some choices (more sophisticated options would be better, but this is a start)
                    correct_answer = "A correct option related to the hint."
                    choices = [correct_answer, "An incorrect option", "Another incorrect option"]
                    random.shuffle(choices)

                    # Create a new quiz and question
                    quiz = Quiz.objects.create(video=video, segment_index=index)
                    Question.objects.create(
                        quiz=quiz,
                        question_text=question_text,
                        choices=json.dumps(choices),
                        correct_answer=correct_answer
                    )
                    quiz_created += 1

            return Response({'status': 'Quiz generation successful!', 'quizzes_created': quiz_created})

        except Exception as e:
            traceback.print_exc()
            return Response({'error': f'Quiz generation failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)