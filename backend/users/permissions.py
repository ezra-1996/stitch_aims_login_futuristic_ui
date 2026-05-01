from rest_framework import permissions

class IsUniversityAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'university_admin'

class IsCompanyAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'company_admin'

class IsSupervisor(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'supervisor'

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'student'
