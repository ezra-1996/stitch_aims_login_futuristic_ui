from rest_framework import serializers
from .models import Application, SupervisorAssignment, StudentTask

class ApplicationSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    post_title = serializers.CharField(source='post.title', read_only=True)
    organization_name = serializers.CharField(source='post.organization.org_name', read_only=True)
    
    class Meta:
        model = Application
        fields = '__all__'
        read_only_fields = ['application_id', 'applied_date', 'student']

class SupervisorAssignmentSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.SerializerMethodField()
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    organization_name = serializers.CharField(source='organization.org_name', read_only=True)
    
    class Meta:
        model = SupervisorAssignment
        fields = '__all__'
        read_only_fields = ['assignment_id', 'assigned_date']

    def get_supervisor_name(self, obj):
        return obj.supervisor.full_name if obj.supervisor else "Unassigned"


class StudentTaskSerializer(serializers.ModelSerializer):
    supervisor_name = serializers.CharField(source='supervisor.full_name', read_only=True)
    student_university_id = serializers.CharField(source='student.university_id', read_only=True)

    class Meta:
        model = StudentTask
        fields = '__all__'
        read_only_fields = ['task_id', 'created_at', 'updated_at', 'supervisor']
