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
from rest_framework import viewsets, status, permissions, views
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action, permission_classes, api_view, parser_classes, authentication_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.conf import settings
from django.db.models import JSONField, Avg
from .serializers import CourseSerializer, VideoSerializer, QuizSerializer, QuizAttemptSerializer, ReviewSerializer, EnrollmentSerializer
from .models import Course, Video, Quiz, Question, QuizAttempt, StudentAnswer, Enrollment, Review, StudentProgress
import google.generativeai as genai
from sentence_transformers import SentenceTransformer
model_st = SentenceTransformer('all-MiniLM-L6-v2') 
from users.permissions import IsTutor
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

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

class TutorCourseViewSet(viewsets.ModelViewSet):
    """
    ViewSet specifically for Tutors to manage and view only their courses.
    """
    serializer_class = CourseSerializer 
    permission_classes = [IsTutor] # Only Tutors can access this ViewSet

    def get_queryset(self):
        # Filter the courses to show only those created by the requesting tutor
        return Course.objects.filter(tutor=self.request.user).order_by('id') 
    
    def perform_create(self, serializer):
        # Automatically assign the logged-in tutor as the course creator
        serializer.save(tutor=self.request.user)

    @action(detail=True, methods=['post'], url_path='publish', permission_classes=[permissions.IsAuthenticated])
    def publish(self, request, pk=None):
        course = self.get_object()

        # Only the course owner can publish
        if course.tutor != request.user:
            return Response({"error": "You do not have permission to publish this course."},
                            status=status.HTTP_403_FORBIDDEN)

        course.is_published = True
        course.save()
        return Response({
            "status": "Course successfully published.",
            "is_published": True,
            "course_id": course.id
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='unpublish', permission_classes=[permissions.IsAuthenticated])
    def unpublish(self, request, pk=None):
        course = self.get_object()

        # Only the course owner can unpublish
        if course.tutor != request.user:
            return Response({"error": "You do not have permission to unpublish this course."},
                            status=status.HTTP_403_FORBIDDEN)

        course.is_published = False
        course.save()
        return Response({
            "status": "Course successfully unpublished.",
            "is_published": False,
            "course_id": course.id
        }, status=status.HTTP_200_OK)

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    def perform_create(self, serializer):
        if not self.request.user.is_authenticated or self.request.user.role != 'tutor':
            # This handles cases where permission classes might be bypassed or misconfigured
            raise permissions.PermissionDenied("Only tutors can create courses.")

        # Inject the currently logged-in user into the validated data before saving
        serializer.save(tutor=self.request.user)

    def get_queryset(self):
        from django.db.models import Q
        user = self.request.user

        # Base queryset (all courses)
        queryset = Course.objects.all().order_by('id')

        # --- VISIBILITY RULES ---
        if user.is_authenticated:
            # Tutors: See all published courses + their own (even if unpublished)
            if user.role == 'tutor':
                queryset = queryset.filter(Q(tutor=user) | Q(is_published=True))
            # Students: See only published courses
            elif user.role == 'student':
                queryset = queryset.filter(is_published=True)
            # Admins: See everything
            elif user.is_staff:
                queryset = Course.objects.all()
        else:
            # Guests: See only published courses
            queryset = queryset.filter(is_published=True)

        # --- SEARCH LOGIC (TITLE ONLY) ---
        search_query = (
            self.request.query_params.get('search')
            or self.request.query_params.get('search_title')
        )
        if search_query:
            search_query = search_query.strip().lower()
            queryset = queryset.filter(
                Q(title__iexact=search_query)
                | Q(title__istartswith=search_query)
                | Q(title__icontains=search_query)
            ).distinct()

        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.AllowAny]
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsTutor]  # tutors can delete
        else:
            permission_classes = [permissions.IsAuthenticated]
        return [permission() for permission in permission_classes]

    # Ensure my_courses passes the context required for progress_percentage
    @action(detail=False, methods=['get'], url_path='my-courses')
    @permission_classes([permissions.IsAuthenticated]) # Only logged-in users can see their courses [cite: 3617]
    def my_courses(self, request):
        if request.user.role != 'student':
            return Response(
                {'error': 'This endpoint is for enrolled students only.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # 1. Get all Enrollment records for the current user
        enrolled_courses_qs = Course.objects.filter(
            enrollments__student=request.user
        ).order_by('id')

        # 2. Serialize the courses
        # Pass the request context. This will trigger the new get_progress_percentage 
        # method in CourseSerializer for each course.
        serializer = CourseSerializer(
            enrolled_courses_qs,
            many=True,
            context={'request': request} # CRITICAL: Pass context to enable SerializerMethodFields
        )

        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='enroll')
    @permission_classes([permissions.IsAuthenticated])
    def enroll(self, request, pk=None):
        course = get_object_or_404(Course, pk=pk)
        student = request.user

        if not hasattr(student, 'role') or student.role != 'student':
            return Response(
                {'error': 'Only students are permitted to enroll in courses.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        # Course must be published to allow enrollment
        if not course.is_published:
            return Response(
                {'error': 'This course is not published yet. You cannot enroll.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            enrollment, created = Enrollment.objects.get_or_create(
                student=student, 
                course=course
            )
            if created:
                return Response(
                    {'status': f'Successfully enrolled in {course.title}!', 
                    'course_id': course.id}, 
                    status=status.HTTP_201_CREATED
                )
            else:
                return Response(
                    {'status': f'Already enrolled in {course.title}.'}, 
                    status=status.HTTP_200_OK
                )

        except Exception as e:
            return Response(
                {'error': f'Enrollment failed: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def retrieve(self, request, *args, **kwargs):
        course = self.get_object()
        user = request.user

        # ---- CASE 1: Guest user ----
        if not user.is_authenticated:
            # Guests can view only published course info (no videos)
            if not course.is_published:
                return Response({'error': 'This course is not yet published.'}, status=403)
            serializer = self.get_serializer(course)
            data = serializer.data
            data['videos'] = []  # Hide videos for guests
            return Response(data)

        # ---- CASE 2: Tutor ----
        if hasattr(user, 'role') and user.role == 'tutor':
            # Tutors can always access their own courses (even unpublished)
            if course.tutor == user:
                return super().retrieve(request, *args, **kwargs)
            else:
                # Other tutors: only published info
                if not course.is_published:
                    return Response({'error': 'This course is not yet published.'}, status=403)
                serializer = self.get_serializer(course)
                data = serializer.data
                data['videos'] = []
                return Response(data)

        # ---- CASE 3: Student ----
        if hasattr(user, 'role') and user.role == 'student':
            is_enrolled = Enrollment.objects.filter(student=user, course=course).exists()
            if is_enrolled:
                # Enrolled students see full course (with videos)
                return super().retrieve(request, *args, **kwargs)
            else:
               # 🔥 Not enrolled? Allow viewing info (CourseInfoPage)
                if course.is_published:
                    serializer = self.get_serializer(course)
                    data = serializer.data
                    data['videos'] = []  # Hide videos for not-enrolled students
                    return Response(data)
                else:
                    return Response({'error': 'This course is not published yet.'}, status=403)

        # Default fallback
        return Response({'error': 'Unauthorized access.'}, status=403)

class EnrollmentViewSet(viewsets.ReadOnlyModelViewSet):
        queryset = Enrollment.objects.all().select_related("student", "course")
        serializer_class = EnrollmentSerializer
        permission_classes = [permissions.IsAuthenticated]

        def list(self, request, *args, **kwargs):
            user = request.user
            if user.role == "tutor":
                # Return only enrollments from tutor’s own courses
                return Response([
                    {
                        "id": e.id,
                        "student_username": e.student.username,
                        "course": e.course.id,
                        "course_title": e.course.title,
                        "enrollment_date": e.enrollment_date,
                    }
                    for e in self.queryset.filter(course__tutor=user)
                ])
            elif user.role == "student":
                # Student can view their own enrollments
                return Response([
                    {
                        "id": e.id,
                        "course": e.course.id,
                        "course_title": e.course.title,
                        "enrollment_date": e.enrollment_date,
                    }
                    for e in self.queryset.filter(student=user)
                ])
            return Response([])


class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all().order_by('id') 
    serializer_class = VideoSerializer

    # NEW ACTION: To record video completion from the frontend
    @action(detail=True, methods=['post'], url_path='record-progress')
    @permission_classes([permissions.IsAuthenticated])
    def record_progress(self, request, pk=None):
        video = self.get_object()
        student = request.user
        
        # Check if user is a student (redundant if permissions are right, but safe)
        if not hasattr(student, 'role') or student.role != 'student':
            raise PermissionDenied("Only students can record progress.")
        
        completed = request.data.get('completed', False)
        last_time = request.data.get('last_watched_time', None)

        # Get or create the progress record
        progress, _ = StudentProgress.objects.get_or_create(student=student, video=video)
        
        # Update completion status
        if completed:
            progress.video_completed = True
        
        # Update last watched time if provided and a valid number
        if last_time is not None:
            try:
                progress.last_watched_time = float(last_time)
            except:
                pass # Ignore if cast to float fails

        progress.save()
        
        # Return the updated progress state
        serializer = StudentProgressSerializer(progress)
        return Response({'status': 'progress recorded', 'progress': serializer.data}, status=status.HTTP_200_OK)


    def perform_create(self, serializer):
        # Automatically attach the logged-in tutor as the uploader
        user = self.request.user
        if user.role != 'tutor':
            raise PermissionDenied("Only tutors can upload videos.")
        serializer.save(tutor=user)
    
    # NEW: Pass request to serializer context for fetching user progress
    def get_serializer_context(self):
        return {'request': self.request} 

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            permission_classes = [permissions.IsAuthenticated] # Changed from AllowAny for progress tracking
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
        
# ---------------- PROGRESS TRACKING VIEWSET ----------------
class StudentProgressViewSet(viewsets.GenericViewSet):
    """
    API for students to update their progress on a video.
    """
    queryset = StudentProgress.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    # POST /api/progress/track/
    @action(detail=False, methods=['post'], url_path='track')
    def track_progress(self, request):
        # Feature 6: Ensure progress persists (get_or_create handles initial status)
        student = request.user
        video_id = request.data.get('video_id')
        current_time = float(request.data.get('current_time', 0.0))
        duration = float(request.data.get('duration', 0.0))

        if not video_id:
            return Response({"error": "Video ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        video = get_object_or_404(Video, pk=video_id)

        # Feature 2/5: Logic to determine completion (95% watched)
        is_completed = (current_time / duration) >= 0.95 if duration > 0 else False
        
        # Use existing utility logic to check enrollment before saving progress
        if not Enrollment.objects.filter(student=student, course=video.course).exists():
            raise PermissionDenied("You must be enrolled to track progress for this video.")

        progress, created = StudentProgress.objects.get_or_create(
            student=student,
            video=video,
            defaults={'last_watched_time': current_time, 'is_completed': is_completed}
        )
        
        # Feature 6: Update progress if new time is greater, or set completion status
        if current_time > progress.last_watched_time:
            progress.last_watched_time = current_time
        
        if is_completed and not progress.is_completed:
            progress.is_completed = True
            # Feature 5: A notification or check here could be added for unlocking notes
            # However, notes are gated on the *front end* by a simple check of is_completed
            
        progress.save()

        # Recalculate and return full course progress (optional, good for client update)
        course_serializer = CourseSerializer(
            video.course, 
            context={'request': request}
        )
        
        return Response({
            "status": "Progress updated",
            "is_completed": progress.is_completed,
            "last_watched_time": progress.last_watched_time,
            "course_progress_percentage": course_serializer.data['progress_percentage']
        }, status=status.HTTP_200_OK)

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
            
            # --- (1) Calculate Score and Create Attempt ---
            quiz_attempt = QuizAttempt.objects.create(student=student, quiz=quiz)
            score = 0
            quiz_questions = quiz.questions.all()

            for submitted_answer in submitted_answers:
                question_id = submitted_answer.get('question_id')
                # CRITICAL: Frontend sends the FULL selected option text
                selected_option = submitted_answer.get('selected_option_text') 
                
                try:
                    question = quiz_questions.get(id=question_id)
                except Question.DoesNotExist:
                    continue

                # Load choices for robust validation
                try:
                    # Note: question.choices is stored as a JSON string of a list
                    choices_list = json.loads(question.choices)
                except json.JSONDecodeError:
                    choices_list = []
                    
                # Use the robust comparison function (defined later/already exists)
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
            
            # Pass/fail rule: Must get at least 1 correct answer (or adjust as needed, e.g., all correct)
            is_passed = (score == len(quiz_questions)) if len(quiz_questions) > 0 else (score > 0)
            quiz_attempt.score = score
            quiz_attempt.passed = is_passed
            quiz_attempt.save()

            # --- (2) Check/Update StudentProgress Status ---
            all_quizzes_passed_status = False
            video = quiz.video # Get the associated video
            
            # Find all UNIQUE quizzes for this video that the student has passed at least once.
            passed_quizzes_count = QuizAttempt.objects.filter(
                quiz__video=video,        
                student=student,          
                passed=True               
            ).values('quiz').distinct().count()

            total_quizzes_count = video.quizzes.count()
            
            # Set status to True only if the passed count equals the total count
            if total_quizzes_count > 0 and passed_quizzes_count == total_quizzes_count:
                all_quizzes_passed_status = True

            # Update or create the StudentProgress record
            progress, _ = StudentProgress.objects.get_or_create(
                student=student,
                video=video,
                # Ensure existing video_completed status is kept if already set
                defaults={'all_quizzes_passed': all_quizzes_passed_status, 'video_completed': False} 
            )
            progress.all_quizzes_passed = all_quizzes_passed_status
            progress.save()

            # --- (3) Return Response ---
            return Response({
                'status': 'Quiz submitted successfully',
                'score': score,
                'total_questions': len(quiz_questions),
                'passed': is_passed,
                'all_quizzes_passed': all_quizzes_passed_status # Return the FINAL video quiz status
            }, status=status.HTTP_200_OK)

        except Exception as e:
            traceback.print_exc()
            return Response(
                {'error': f'Quiz submission failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
@api_view(['POST'])
@authentication_classes([TokenAuthentication])
@permission_classes([permissions.IsAuthenticated, IsTutor])
@parser_classes([MultiPartParser, FormParser])
def video_upload_view(request):
    print("=== video_upload_view called ===")
    print("Request user:", request.user)

    title = request.data.get('title')
    course_id = request.data.get('course')
    video_file = request.data.get('video_file')

    if not course_id:
        return Response({'error': 'Course ID is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        course = Course.objects.get(id=course_id)
    except Course.DoesNotExist:
        return Response({'error': 'Invalid Course ID.'}, status=status.HTTP_404_NOT_FOUND)

    video = Video.objects.create(
        course=course,
        tutor=request.user,
        title=title,
        video_file=video_file
    )

    return Response({'message': 'Video uploaded successfully!', 'video_id': video.id})


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

class ReviewViewSet(viewsets.ModelViewSet):
    """
    Handles creating and listing reviews for courses.
    - POST is used by authenticated students to submit a review.
    - GET is used to list reviews for a course.
    """
    queryset = Review.objects.all().order_by('-created_at')
    serializer_class = ReviewSerializer
    
    def get_permissions(self):
        # Allow ALL users to retrieve general list/detail (standard DRF behavior)
        if self.action in ['list', 'retrieve', 'reviews_by_course']: # <--- CRITICAL: Add 'reviews_by_course'
            permission_classes = [permissions.AllowAny] 
        # Allow creating (POST) only by authenticated users (students)
        elif self.action == 'create':
            # This check ensures only authenticated users can post reviews
            permission_classes = [permissions.IsAuthenticated]
        # Restrict management to Admin/Tutor
        else:
            permission_classes = [permissions.IsAdminUser] 
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        if self.request.user.role != 'student':
            # Use the correctly imported exception
            raise PermissionDenied("Only students can submit reviews.")
            
        # Check if the user is already enrolled in the course (optional but good security)
        # enrollment_exists = Enrollment.objects.filter(student=self.request.user, course=self.request.data.get('course')).exists()
        # if not enrollment_exists:
        #     raise permissions.PermissionDenied("You must be enrolled to review this course.")

        # Save the review, automatically setting the student field
        serializer.save(student=self.request.user)

    # NEW ACTION: List reviews for a specific course (e.g., /api/reviews/by_course/?course_id=1)
    @action(detail=False, methods=['get'], url_path='by_course')
    def reviews_by_course(self, request):
        course_id = request.query_params.get('course_id')
        if not course_id:
            return Response({'error': 'A course_id parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Filter and order by newest
        reviews = self.queryset.filter(course_id=course_id)
        
        # Calculate the average rating for the course
        avg_rating = reviews.aggregate(Avg('rating'))['rating__avg']
        
        # Paginate and serialize the review objects
        page = self.paginate_queryset(reviews)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'average_rating': round(avg_rating, 1) if avg_rating else 0.0,
                'total_reviews': reviews.count(),
                'reviews': serializer.data
            })
            
        serializer = self.get_serializer(reviews, many=True)
        return Response({
            'average_rating': round(avg_rating, 1) if avg_rating else 0.0,
            'total_reviews': reviews.count(),
            'reviews': serializer.data
        })

class AnalyticsView(views.APIView):
    # Permission: Only Tutors (who often act as Admins in dev) can view this data
    permission_classes = [IsTutor] 

    def get(self, request, *args, **kwargs):
        # 1. User Counts
        total_users = User.objects.count()
        total_students = User.objects.filter(role='student').count()
        total_tutors = User.objects.filter(role='tutor').count()

        # 2. Course Counts
        total_courses = Course.objects.count()
        published_courses = Course.objects.filter(is_published=True).count()
        total_enrollments = Enrollment.objects.count()

        # 3. Tutor-Specific Course Count (For Instructor Dashboard)
        tutor_courses = Course.objects.filter(tutor=request.user).count()

        return Response({
            'user_stats': {
                'total_users': total_users,
                'total_students': total_students,
                'total_tutors': total_tutors,
            },
            'course_stats': {
                'total_courses': total_courses,
                'published_courses': published_courses,
                'tutor_courses': tutor_courses,
                'total_enrollments': total_enrollments,
            }
        }, status=status.HTTP_200_OK)