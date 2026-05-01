from rest_framework import serializers
from .models import Organization, InternshipPost, SupervisorProfile

class SupervisorSimpleSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user.full_name', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = SupervisorProfile
        fields = ['id', 'username', 'full_name', 'email', 'department', 'job_title']

class OrganizationSerializer(serializers.ModelSerializer):
    supervisors = SupervisorSimpleSerializer(many=True, read_only=True)
    
    class Meta:
        model = Organization
        fields = '__all__'
        read_only_fields = ['org_id', 'status', 'created_by', 'created_at', 'updated_at']

class InternshipPostSerializer(serializers.ModelSerializer):
    organization_name = serializers.CharField(source='organization.org_name', read_only=True)
    organization_address = serializers.CharField(source='organization.address', read_only=True)
    organization_industry = serializers.CharField(source='organization.industry', read_only=True)
    organization = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all(), required=False)
    
    class Meta:
        model = InternshipPost
        fields = '__all__'
        read_only_fields = ['post_id', 'created_at', 'updated_at']
