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
from .models import Course, Video, Quiz, Question, QuizAttempt, StudentAnswer
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
model_gemini = genai.GenerativeModel('models/gemini-1.5-flash')

# Load other NLP models once
model_st = SentenceTransformer('all-MiniLM-L6-v2')
nlp = nltk.data.load('tokenizers/punkt/english.pickle')


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
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        else:
            permission_classes = [IsTutor]
        return [permission() for permission in permission_classes]

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
        
    # ... (all your existing code for CourseViewSet and VideoViewSet) ...

class QuizViewSet(viewsets.ModelViewSet):
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    
    @action(detail=True, methods=['post'], url_path='submit')
    def submit_quiz(self, request, pk=None):
        try:
            quiz = self.get_object()
            student = User.objects.first()  # Assuming you've set up authentication

            # Receive answers from the request body
            submitted_answers = request.data.get('answers', [])
            
            # Create a QuizAttempt instance
            quiz_attempt = QuizAttempt.objects.create(
                student=student,
                quiz=quiz,
            )

            score = 0
            
            # Get the correct answers for this quiz's questions
            quiz_questions = quiz.questions.all()
            
            for submitted_answer in submitted_answers:
                question_id = submitted_answer.get('question_id')
                selected_option = submitted_answer.get('selected_option')
                
                # Find the corresponding question object
                try:
                    question = quiz_questions.get(id=question_id)
                except Question.DoesNotExist:
                    continue  # Skip if question not found
                
                # Check if the submitted answer is correct
                print(f"Submitted: '{selected_option}', Correct: '{question.correct_answer}'")
                print(f"Comparison after strip: '{selected_option.strip()}' == '{question.correct_answer.strip()}'")
                is_correct = (selected_option.strip() == question.correct_answer.strip())
                
                if is_correct:
                    score += 1
                
                # Save the student's answer
                StudentAnswer.objects.create(
                    attempt=quiz_attempt,
                    question=question,
                    selected_option=selected_option,
                    is_correct=is_correct
                )

            # Update the score and passing status
            quiz_attempt.score = score
            quiz_attempt.passed = (score > 0) # Simple pass/fail for now, can be changed later
            quiz_attempt.save()

            return Response({
                'status': 'Quiz submitted successfully',
                'score': score,
                'total_questions': len(quiz_questions),
                'passed': quiz_attempt.passed
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


# --- JUDGE0 LANGUAGE ID MAPPING ---
# These are the stable Language IDs for Judge0 CE v1.13.1
JUDGE0_LANG_MAP = {
    'python': 71,  # Python 3
    'javascript': 63, # Javascript (Node.js)
    'java': 62,    # Java
    'cpp': 52,     # C++ (GCC)
}

# --- JUDGE0 API CONFIGURATION ---
JUDGE0_API_URL = "https://ce.judge0.com/submissions"
BASE64_ENCODE_REQUIRED = True

@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([IsAuthenticated]) 
def run_code_view(request):
    """
    Handles code execution request by forwarding to the Judge0 API.
    """

     # JUDGE0 API CONFIGURATION (URL remains the same)
    JUDGE0_API_URL = "https://ce.judge0.com/submissions"
    
    # --- FIX: Define Query Parameters for Synchronous Execution ---
    JUDGE0_PARAMS = {
        'base64_encoded': 'true',  # Already set in the payload, but good to set here
        'fields': 'stdout,stderr,status_id,status,compile_output,time,memory', # Request specific fields
        'wait': 'true' # <-- THIS FORCES SYNCHRONOUS EXECUTION (Wait for result, not token)
    }

    code = request.data.get('code', '')
    language = request.data.get('language', 'python')

    if not code:
        return Response({'error': f"No code provided for {language}."}, status=status.HTTP_400_BAD_REQUEST)

    # Get the Judge0 ID, defaulting to Python if mapping fails
    language_id = JUDGE0_LANG_MAP.get(language, JUDGE0_LANG_MAP['python'])
    
    try:
        # Base64-encode the source code as required by Judge0 best practice
        encoded_code = base64.b64encode(code.encode('utf-8')).decode('utf-8')
    except Exception:
        return Response({'error': 'Failed to encode source code.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    try:
        # Judge0 synchronous submission payload
        payload = {
            "language_id": language_id,
            "source_code": encoded_code,
            "base64_encoded": BASE64_ENCODE_REQUIRED,
            "cpu_time_limit": 5, 
        }

        api_response = requests.post(
            JUDGE0_API_URL, 
            json=payload, 
            params=JUDGE0_PARAMS,
            timeout=10
        )

        # Check for non-200 status codes from Judge0 itself
        if api_response.status_code != status.HTTP_200_OK:
            error_message = api_response.json().get('error', api_response.text)
            return Response(
                {'error': f'Judge0 Execution API Error ({api_response.status_code}): {error_message}'},
                status=status.HTTP_502_BAD_GATEWAY # 502 indicates external server error
            )

        submission_result = api_response.json()
        
        # Judge0 output fields are Base64-encoded, so we must decode them
        def decode_output(encoded_str):
            if encoded_str and BASE64_ENCODE_REQUIRED:
                # The ignore handles cases where the API returns malformed Base64 
                return base64.b64decode(encoded_str).decode('utf-8', errors='ignore')
            return encoded_str if encoded_str else ""

        # Decode all relevant output fields
        status_description = submission_result.get('status', {}).get('description', 'Unknown Error')
        stdout = decode_output(submission_result.get('stdout'))
        stderr = decode_output(submission_result.get('stderr'))
        compile_output = decode_output(submission_result.get('compile_output'))
        
        # Determine the final output message for the frontend
        if status_description in ["Accepted", "Processing"]:
            final_output = stdout if stdout else "Execution finished with no output."
            final_status_code = status.HTTP_200_OK
        elif status_description == "Compilation Error":
            final_output = f"Compilation Error:\n{compile_output}"
            final_status_code = status.HTTP_400_BAD_REQUEST
        else:
            # Runtime Error, Time Limit Exceeded, Internal Error
            final_output = f"{status_description}\n{stderr}"
            final_status_code = status.HTTP_400_BAD_REQUEST

        return Response({
            'output': final_output,
            'status': status_description,
            'language': language,
            'runtime_details': f'Status: {status_description}',
            'time': submission_result.get('time'),
            'memory': submission_result.get('memory')
        }, status=final_status_code)

    except requests.exceptions.RequestException as e:
        # Handle network errors, timeouts, or DNS resolution failure
        return Response(
            {'error': f'Code execution failed: Network connection issue or timeout. ({e})'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )