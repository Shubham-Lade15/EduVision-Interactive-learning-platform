from rest_framework import generics, permissions, status, views
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, get_user_model
from .models import User
from .serializers import UserSerializer
from rest_framework.decorators import api_view, permission_classes, parser_classes
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

User = get_user_model()

@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def profile_view(request):
    """
    Fetch the current logged-in user's profile.
    """
    user = request.user
    serializer = UserSerializer(user, context={"request": request})
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def profile_update(request):
    user = request.user
    serializer = UserSerializer(user, data=request.data, partial=True, context={'request': request})

    
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # 🔍 Handle username uniqueness and email format errors explicitly
    errors = serializer.errors

    if "username" in errors:
        if any("unique" in str(e).lower() for e in errors["username"]):
            return Response(
                {"username": ["This username is already taken. Please choose another one."]},
                status=status.HTTP_400_BAD_REQUEST
            )

    if "email" in errors:
        if any("valid" in str(e).lower() for e in errors["email"]):
            return Response(
                {"email": ["Email is invalid. Please enter a valid email."]},
                status=status.HTTP_400_BAD_REQUEST
            )

    return Response(errors, status=status.HTTP_400_BAD_REQUEST)


class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.AllowAny]

class CustomLoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        # Use Django's built-in authenticate function
        user = authenticate(request, username=username, password=password)

        if user is not None:
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'username': user.username,
                'role': user.role
            }, status=status.HTTP_200_OK)
        else:
            return Response({'detail': 'Login failed. Please check your credentials.'}, status=status.HTTP_400_BAD_REQUEST)

class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    
    # Handles GET /api/users/me/
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    # Handles PUT/PATCH /api/users/me/ for profile updates (name, password, etc.)
    def put(self, request):
        return self.update(request, partial=False)

    def patch(self, request):
        return self.update(request, partial=True)

    def update(self, request, partial=False):
        # We pass the instance (the current user) to the serializer for update
        serializer = UserSerializer(
            request.user, 
            data=request.data, 
            partial=partial, 
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        # NOTE: UserSerializer's update() method must handle password hashing if included in data.
        self.perform_update(serializer) 
        
        return Response(serializer.data)

    def perform_update(self, serializer):
        serializer.save()
        # Logic to update password if needed is handled inside UserSerializer.update()

class LogoutView(views.APIView):
    permission_classes = [IsAuthenticated] # User must be authenticated to log out

    def post(self, request):
        try:
            # Delete the user's authentication token from the database
            Token.objects.filter(user=request.user).delete()
            return Response(
                {"detail": "Successfully logged out."}, 
                status=status.HTTP_200_OK
            )
        except Exception as e:
            return Response(
                {"detail": f"Logout failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )