from django.urls import path
from .views import UserRegistrationView, CustomLoginView, CurrentUserView, LogoutView

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', CustomLoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]