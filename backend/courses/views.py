# backend/courses/views.py
import whisper
import os
import nltk
import json
import traceback
import random
import numpy as np
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import JSONField
from .models import Course, Video, Quiz, Question
from .serializers import CourseSerializer, VideoSerializer
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
model_st = SentenceTransformer('all-MiniLM-L6-v2') 

# Initialize Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)
model_gemini = genai.GenerativeModel('models/gemini-1.5-flash')

# Load other NLP models once
model_st = SentenceTransformer('all-MiniLM-L6-v2')
nlp = nltk.data.load('tokenizers/punkt/english.pickle')


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer

    @action(detail=True, methods=['post'], url_path='transcribe')
    def transcribe_video(self, request, pk=None):
        try:
            video = get_object_or_404(Video, pk=pk)
            video_path = video.video_file.path

            if not os.path.exists(video_path):
                return Response(
                    {'error': 'Video file not found on server.'},
                    status=status.HTTP_404_NOT_FOUND
                )

            model_whisp = whisper.load_model("tiny")
            result = model_whisp.transcribe(video_path)

            # Save full transcript
            video.transcript = result["text"]

            # Save timestamped segments (index, start, end, text)
            whisper_segments = [
                {
                    "index": i,
                    "start": float(seg["start"]),
                    "end": float(seg["end"]),
                    "text": seg["text"],
                }
                for i, seg in enumerate(result.get("segments", []))
            ]
            video.segments = whisper_segments
            video.save()

            return Response({
                'status': 'Transcription successful!',
                'transcript': result["text"]
            })

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': f'Transcription failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # NEW API ACTION FOR SMART SEGMENTATION AND QUIZ GENERATION
    @action(detail=True, methods=['post'], url_path='generate-smart-content')
    def generate_smart_content(self, request, pk=None):
        try:
            video = get_object_or_404(Video, pk=pk)

            if not video.transcript:
                return Response(
                    {'error': 'Transcript not found. Please transcribe the video first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            transcript_text = video.transcript

            # Utility: split transcript if too long
            def chunk_text(text, max_chars=2000):
                words = text.split()
                chunks, chunk = [], []
                count = 0
                for word in words:
                    if count + len(word) + 1 > max_chars:
                        chunks.append(" ".join(chunk))
                        chunk, count = [], 0
                    chunk.append(word)
                    count += len(word) + 1
                if chunk:
                    chunks.append(" ".join(chunk))
                return chunks

            # Choose mode: one-pass vs chunked
            MAX_SAFE_LENGTH = 3000
            if len(transcript_text) <= MAX_SAFE_LENGTH:
                transcript_chunks = [transcript_text]  # one-pass mode
            else:
                transcript_chunks = chunk_text(transcript_text, max_chars=2000)

            all_segments, all_quizzes = [], []

            # Process each chunk
            for i, chunk in enumerate(transcript_chunks):
                prompt = (
                    f"Analyze the following transcript part (part {i+1}) and perform two tasks:\n\n"
                    f"1. Divide it into 1–3 logical segments. Each must have a title, summary text, start_time, and end_time (seconds).\n"
                    f"2. For each segment, generate ONE multiple-choice question with 4 choices.\n\n"
                    f"Return ONLY valid JSON with keys 'segments' and 'quizzes'.\n\n"
                    f"Transcript part:\n\"\"\"\n{chunk}\n\"\"\""
                )

                response = model_gemini.generate_content(prompt)
                response_text = response.text.strip().replace("```json", "").replace("```", "")

                try:
                    smart_content = json.loads(response_text)
                except json.JSONDecodeError:
                    return Response(
                        {'error': f'Gemini returned invalid JSON for chunk {i+1}: {response_text[:300]}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )

                all_segments.extend(smart_content.get("segments", []))
                all_quizzes.extend(smart_content.get("quizzes", []))

            # --- Save results into DB ---
            video.segments = all_segments  # JSONField, save Python list
            video.save()

            Quiz.objects.filter(video=video).delete()

            for index, quiz_data in enumerate(all_quizzes):
                seg_index = quiz_data.get("segment_index", index)
                seg = all_segments[seg_index] if seg_index < len(all_segments) else None
                end_time = seg.get("end_time", 0.0) if seg else 0.0

                quiz = Quiz.objects.create(
                    video=video,
                    segment_index=seg_index,
                    segment_end_time=end_time
                )

                # Safely extract fields from quiz_data
                q_text = quiz_data.get("question_text") or quiz_data.get("question") or ""
                choices = quiz_data.get("choices") or []
                correct = quiz_data.get("correct_answer") or quiz_data.get("answer") or ""

                if not q_text or not choices or not correct:
                    # Skip invalid quiz entry instead of crashing
                    continue

                Question.objects.create(
                    quiz=quiz,
                    question_text=q_text,
                    choices=json.dumps(choices),
                    correct_answer=correct,
                )


            return Response({
                'status': 'Smart content generation successful!',
                'segments_created': len(all_segments),
                'quizzes_created': len(all_quizzes)
            })

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': f'Smart content generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    @action(detail=True, methods=['post'], url_path='generate-notes')
    def generate_notes(self, request, pk=None):
        try:
            video = get_object_or_404(Video, pk=pk)

            if not video.transcript:
                return Response(
                    {'error': 'Transcript not found. Please transcribe the video first.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            prompt = (
                f"Create a set of detailed study notes from the following video transcript. "
                f"Structure the notes with clear headings and bullet points for easy reading. "
                f"Focus on the key concepts, definitions, and examples provided in the text.\n\n"
                f"Return the notes as a single, valid JSON object with a single key 'notes_content' "
                f"that contains the summary as a string formatted with markdown (e.g., # Heading, - Bullet point).\n\n"
                f"Transcription:\n\"\"\"\n{video.transcript}\n\"\"\""
            )

            response = model_gemini.generate_content(prompt)
            notes_text = response.text.strip().replace("```json\n", "").replace("```", "")
            
            notes_data = json.loads(notes_text)
            
            video.notes = notes_data['notes_content']
            video.save()
            
            return Response({
                'status': 'Notes generation successful!',
                'notes_length': len(notes_data['notes_content'])
            })
        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': f'Notes generation failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )