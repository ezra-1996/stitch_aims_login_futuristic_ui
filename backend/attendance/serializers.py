from rest_framework import serializers
from .models import Attendance

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.user.full_name', read_only=True)
    university_id = serializers.CharField(source='student.university_id', read_only=True)
    
    class Meta:
        model = Attendance
        fields = '__all__'
        read_only_fields = ['attendance_id', 'created_at', 'updated_at', 'student']
        extra_kwargs = {
            'check_in_time': {'required': False},
            'verification_method': {'required': False},
        }
