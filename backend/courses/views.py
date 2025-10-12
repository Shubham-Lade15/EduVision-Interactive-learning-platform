# backend/courses/views.py
import base64
import whisper
import os
import nltk
import json
import traceback
import random
import numpy as np
import requests
import json
from rest_framework import viewsets, status, permissions
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action, permission_classes, api_view, parser_classes, authentication_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import JSONField
from .serializers import CourseSerializer, VideoSerializer, QuizSerializer, QuizAttemptSerializer
from .models import Course, Video, Quiz, Question, QuizAttempt, StudentAnswer, StudentProgress
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
model_st = SentenceTransformer('all-MiniLM-L6-v2') 
from users.permissions import IsTutor
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

from django.contrib.auth import get_user_model
User = get_user_model()

# Initialize Gemini API
genai.configure(api_key=settings.GEMINI_API_KEY)
model_gemini = genai.GenerativeModel('gemini-2.5-flash')

# Load other NLP models once
model_st = SentenceTransformer('all-MiniLM-L6-v2')
nlp = nltk.data.load('tokenizers/punkt/english.pickle')

# Define constants for the RapidAPI endpoint
# Base URL structure: https://{HOST}/submissions
RAPIDAPI_JUDGE0_URL = f"https://{settings.RAPIDAPI_JUDGE0_HOST}/submissions?base64_encoded=false&wait=true" 

# Helper function to map front-end language names to Judge0 Language IDs
# This map remains the same standard Judge0 ID map.
def get_judge0_language_id(language_name):
    language_map = {
        'python': 71,   # Python 3
        'javascript': 63, # NodeJS
        'java': 62,       # OpenJDK 13
        'cpp': 54,        # C++ (GCC 9.2.0)
        'c': 50,          # C (GCC 9.1.0)
        'sql': 82,        # SQL (SQLite 3.32.3)
    }
    return language_map.get(language_name.lower())


@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated])
def code_execute_view(request):
    code = request.data.get('code')
    language = request.data.get('language')

    if not code or not language:
        return Response({'error': 'Code and language are required.'}, status=status.HTTP_400_BAD_REQUEST)

    language_map = {
        'python': 71,
        'javascript': 63,
        'java': 62,
        'cpp': 54,
        'c': 50,
        'sql': 82
    }
    language_id = language_map.get(language.lower())
    if not language_id:
        return Response({'error': f"Language '{language}' is not supported."}, status=status.HTTP_400_BAD_REQUEST)

    payload = {
        "source_code": code,
        "language_id": language_id,
        "stdin": "",
    }

    headers = {
        'Content-Type': 'application/json',
        'x-rapidapi-host': settings.RAPIDAPI_JUDGE0_HOST,
        'x-rapidapi-key': settings.RAPIDAPI_JUDGE0_KEY
    }

    url = f"https://{settings.RAPIDAPI_JUDGE0_HOST}/submissions?base64_encoded=false&wait=true"

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=15)
        response.raise_for_status()
        result = response.json()

        output = result.get('stdout') or result.get('compile_output') or result.get('stderr') or "No output"
        status_desc = result.get('status', {}).get('description', 'Unknown')

        return Response({
            'status': status_desc,
            'output': output,
            'time': result.get('time'),
            'memory': result.get('memory')
        })

    except requests.exceptions.RequestException as e:
        return Response({'error': f"API request failed: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)


class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsTutor]
        return [permission() for permission in permission_classes]

class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all().order_by('id') 
    serializer_class = VideoSerializer
    
    # NEW: Pass request to serializer context for fetching user progress
    def get_serializer_context(self):
        return {'request': self.request} 

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'record_progress']:
            permission_classes = [permissions.IsAuthenticated] # Changed from AllowAny for progress tracking
        else:
            permission_classes = [IsTutor]
        return [permission() for permission in permission_classes]
    
    # NEW ACTION: To record video completion from the frontend
    @action(detail=True, methods=['post'], url_path='record-progress')
    @permission_classes([permissions.IsAuthenticated])
    def record_progress(self, request, pk=None):
        video = self.get_object()
        student = request.user
        completed = request.data.get('completed', False)
        last_time = request.data.get('last_watched_time', None)

        progress, _ = StudentProgress.objects.get_or_create(student=student, video=video)
        if completed:
            progress.video_completed = True
        if last_time is not None:
            try:
                progress.last_watched_time = float(last_time)
            except:
                pass
        progress.save()

        serializer = StudentProgressSerializer(progress)
        return Response({'status': 'progress recorded', 'progress': serializer.data}, status=status.HTTP_200_OK)

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
            video.segments = all_segments
            video.save()
            Quiz.objects.filter(video=video).delete()

            # --- NEW/UPDATED LOGIC HERE ---
            for index, quiz_data in enumerate(all_quizzes):
                seg_index = quiz_data.get("segment_index", index)
                seg = all_segments[seg_index] if seg_index < len(all_segments) else None
                end_time = seg.get("end_time", 0.0) if seg else 0.0
                
                quiz = Quiz.objects.create(
                    video=video,
                    segment_index=seg_index,
                    segment_end_time=end_time
                )

                q_text = quiz_data.get("question_text") or quiz_data.get("question") or ""
                choices_list = quiz_data.get("choices") or [] # This is the list of full text choices
                correct_key_or_text = quiz_data.get("correct_answer") or quiz_data.get("answer") or ""

                # CRITICAL FIX: Find the full correct text based on the choices list
                # Assumes choices_list is an array of strings (e.g., ["A) Choice 1", "B) Choice 2"])
                full_correct_answer = ""
                for choice_text in choices_list:
                    normalized_choice = choice_text.strip().upper()
                    # If the choice starts with the letter key OR matches the full text
                    if normalized_choice.startswith(correct_key_or_text.strip().upper()) or normalized_choice == correct_key_or_text.strip().upper():
                        full_correct_answer = choice_text
                        break

                if not q_text or not choices_list or not full_correct_answer:
                    # Skip invalid quiz entry instead of crashing
                    print(f"Skipping invalid quiz data: {quiz_data}")
                    quiz.delete() 
                    continue

                Question.objects.create(
                    quiz=quiz,
                    question_text=q_text,
                    # Ensure choices are stored as a JSON string (JSONField requires this handling)
                    choices=json.dumps(choices_list), 
                    # CRITICAL: Store the full choice string for later comparison
                    correct_answer=full_correct_answer.strip(), 
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
        
    # ... (all your existing code for CourseViewSet and VideoViewSet) ...

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer

    @action(detail=True, methods=['post'], url_path='submit')
    @permission_classes([permissions.IsAuthenticated])
    def submit_quiz(self, request, pk=None):
        try:
            quiz = self.get_object()
            student = request.user 
            submitted_answers = request.data.get('answers', [])
            
            # --- (1) Calculate Score (Your existing logic, adapted for authenticated user) ---
            quiz_attempt = QuizAttempt.objects.create(student=student, quiz=quiz)
            score = 0
            quiz_questions = quiz.questions.all()

            for submitted_answer in submitted_answers:
                question_id = submitted_answer.get('question_id')
                selected_option = submitted_answer.get('selected_option') # e.g., "B) FIFO..."

                try:
                    question = quiz_questions.get(id=question_id)
                except Question.DoesNotExist:
                    continue
                
                # Load choices for robust validation
                try:
                    # Assuming question.choices is a JSON string of a list (e.g., ["A) Choice 1", "B) Choice 2"])
                    choices_list = json.loads(question.choices)
                except json.JSONDecodeError:
                    choices_list = []

                # CRITICAL FIX: Use the robust comparison function
                is_correct = is_answer_correct(
                    stored_correct=question.correct_answer,
                    selected_option=selected_option,
                    choices_list=choices_list
                )
                
                if is_correct:
                    score += 1
                
                StudentAnswer.objects.create(
                    attempt=quiz_attempt, question=question, selected_option=selected_option, is_correct=is_correct
                )
            
            # Simple pass/fail rule: Must get at least 1 correct answer (or whatever logic you prefer)
            is_passed = (score > 0)
            quiz_attempt.score = score
            quiz_attempt.passed = is_passed
            quiz_attempt.save()

             # --- (2) NEW: Check/Update All Quizzes Passed Status (FIXED LOGIC) ---
            all_quizzes_passed_status = False
            if is_passed:
                video = quiz.video
                
                # FIX: Find all UNIQUE quizzes for this video that the student has passed at least once.
                # We use .values('quiz').distinct() to count unique quizzes that have a passing attempt.
                passed_quizzes_count = QuizAttempt.objects.filter(
                    quiz__video=video,        # Filter by video
                    student=student,          # Filter by current student
                    passed=True               # Filter for passing attempts
                ).values('quiz').distinct().count()
                
                total_quizzes_count = video.quizzes.count()

                # FIX: Only set status to True if the passed count equals the total count
                if passed_quizzes_count == total_quizzes_count:
                    all_quizzes_passed_status = True
                
                # Update or create the StudentProgress record
                progress, _ = StudentProgress.objects.get_or_create(
                    student=student, 
                    video=video,
                    # Ensure video_completed flag defaults to False if creating new record
                    defaults={'all_quizzes_passed': all_quizzes_passed_status} 
                )
                progress.all_quizzes_passed = all_quizzes_passed_status
                progress.save()

            # --- (3) Return Response (Ensure we return the final status) ---
            return Response({
                'status': 'Quiz submitted successfully',
                'score': score,
                'total_questions': len(quiz_questions),
                'passed': is_passed,
                'all_quizzes_passed': all_quizzes_passed_status # Return the FINAL status of all quizzes
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Quiz submission failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
@api_view(['POST'])
@authentication_classes([TokenAuthentication])  # optional (explicit)
@permission_classes([permissions.IsAuthenticated, IsTutor])
@parser_classes([MultiPartParser, FormParser])
def video_upload_view(request):
    print("=== video_upload_view called ===")
    print("Request user:", request.user)
    print("Is authenticated:", request.user.is_authenticated)
    print("User role:", getattr(request.user, "role", "N/A"))

    serializer = VideoSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save(tutor=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def normalize(text):
    if text is None:
        return ''
    # Convert to string, strip whitespace, and convert to lower for case-insensitive matching
    return str(text).strip().lower()

def is_answer_correct(stored_correct, selected_option, choices_list):
    """
    Checks if the selected option matches the stored correct answer, 
    handling potential mismatches like full text vs. single letter.
    
    stored_correct: The full correct answer text from the DB (e.g., "B) FIFO...")
    selected_option: The student's answer (e.g., "B) FIFO..." or "B")
    choices_list: The list of full choices from the Question model (e.g., ["A) ...", "B) ..."])
    """
    s_stored = normalize(stored_correct)
    s_selected = normalize(selected_option)

    # 1. Exact match (Covers case where frontend sends full text)
    if s_selected == s_stored:
        return True

    # 2. Match by Letter (Covers case where frontend sends only the letter, e.g., "b")
    # This assumes choices_list items are correctly prefixed (e.g., "A) ", "B) ")
    if len(s_selected) == 1 and s_selected.isalpha():
        letter = s_selected.upper()
        
        for choice_text in choices_list:
            if normalize(choice_text).startswith(letter.lower() + ')'):
                s_full_choice = normalize(choice_text)
                if s_full_choice == s_stored:
                    return True
    
    # NOTE: We skip the check where the DB might store only 'B', because we fixed 
    # the generation logic in Step 1 to store the full text.

    return False