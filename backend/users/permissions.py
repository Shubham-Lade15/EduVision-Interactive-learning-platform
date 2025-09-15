from rest_framework import permissions

class IsTutor(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user and request.user.is_authenticated:
            return request.user.role == 'tutor'
        return False