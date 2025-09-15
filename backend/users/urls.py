from django.urls import path
from .views import UserRegistrationView, CustomLoginView, CurrentUserView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', CustomLoginView.as_view(), name='user-login'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]