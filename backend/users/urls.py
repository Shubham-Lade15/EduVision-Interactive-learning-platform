from django.urls import path
from .views import UserRegistrationView, CustomLoginView, CurrentUserView, LogoutView
from . import views

urlpatterns = [
    path('register/', UserRegistrationView.as_view(), name='user-register'),
    path('login/', CustomLoginView.as_view(), name='user-login'),
    path('logout/', LogoutView.as_view(), name='user-logout'),
    path("profile/", views.profile_view, name="profile_view"),
    path("profile/update/", views.profile_update, name="profile_update"),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]