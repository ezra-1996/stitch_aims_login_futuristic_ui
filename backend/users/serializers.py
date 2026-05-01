from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from .models import User, Student, Notification
from organizations.models import Organization, SupervisorProfile

class UserSerializer(serializers.ModelSerializer):
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name', 'role', 'status', 'phone_number', 'date_joined', 'latitude', 'longitude', 'profile_photo_url', 'must_change_password']
        read_only_fields = ['id', 'date_joined']
    
    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            # Remove hardcoded fallback - let frontend handle missing request context
            return None
        return None


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for the current user's profile with role-specific data."""
    student_profile = serializers.SerializerMethodField()
    supervisor_profile = serializers.SerializerMethodField()
    organization = serializers.SerializerMethodField()
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'full_name', 'role', 'status', 
            'phone_number', 'date_joined', 'latitude', 'longitude',
            'student_profile', 'supervisor_profile', 'organization', 'profile_photo_url', 'must_change_password'
        ]
        read_only_fields = ['id', 'date_joined', 'role']
    
    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
            # Remove hardcoded fallback - let frontend handle missing request context
            return None
        return None
    
    def get_student_profile(self, obj):
        if obj.role == 'student':
            try:
                student = obj.student_profile
                return {
                    'student_id': student.student_id,
                    'university_id': student.university_id,
                    'department': student.department,
                    'year': student.year,
                    'gpa': student.gpa,
                    'created_at': student.created_at,
                }
            except Student.DoesNotExist:
                return None
        return None
    
    def get_supervisor_profile(self, obj):
        if obj.role == 'supervisor':
            try:
                supervisor = obj.supervisor_profile
                return {
                    'id': supervisor.id,
                    'department': supervisor.department,
                    'job_title': supervisor.job_title,
                    'organization_id': supervisor.organization.org_id if supervisor.organization else None,
                    'organization_name': supervisor.organization.org_name if supervisor.organization else None,
                    'created_at': supervisor.created_at,
                }
            except Exception:
                return None
        return None
    
    def get_organization(self, obj):
        if obj.role == 'company_admin':
            try:
                from organizations.models import Organization
                org = Organization.objects.get(created_by=obj)
                return {
                    'org_id': org.org_id,
                    'org_name': org.org_name,
                    'description': org.description,
                    'address': org.address,
                    'contact_email': org.contact_email,
                    'contact_phone': org.contact_phone,
                    'website': org.website,
                    'industry': org.industry,
                    'status': org.status,
                }
            except Exception:
                return None
        return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'recipient']

class StudentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Student
        fields = ['student_id', 'user', 'university_id', 'department', 'year', 'gpa', 'created_at']

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'full_name', 'password', 'password2', 'role', 'phone_number', 'latitude', 'longitude']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class StudentRegistrationSerializer(serializers.Serializer):
    # User fields
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True, required=False)
    
    # Student fields
    university_id = serializers.CharField(required=True)
    department = serializers.CharField(required=True)
    year = serializers.IntegerField(required=True)
    
    # Optional Organization Assignment (Uni Admin only)
    organization = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Check if admin created this user (auto-approve)
        admin_created = validated_data.pop('admin_created', False)
        organization_id = validated_data.pop('organization', None)
        
        # Extract user data
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'full_name': validated_data.pop('full_name'),
            'phone_number': validated_data.pop('phone_number', ''),
            'role': 'student',
            'status': 'active' if admin_created else 'pending',
            'latitude': validated_data.pop('latitude', None),
            'longitude': validated_data.pop('longitude', None)
        }
        validated_data.pop('password2')

        with transaction.atomic():
            # Create User
            user = User.objects.create_user(**user_data)
            if admin_created:
                user.must_change_password = True
                user.save()
            
            # Create Student Profile
            student = Student.objects.create(user=user, **validated_data)
            
            # Handle Organization Allocation if provided
            if organization_id:
                try:
                    from organizations.models import Organization
                    from internships.models import SupervisorAssignment
                    org = Organization.objects.get(org_id=organization_id)
                    SupervisorAssignment.objects.create(
                        student=student,
                        organization=org,
                        is_active=True
                    )
                except Exception as e:
                    # Log but don't fail registration
                    import logging
                    logging.getLogger(__name__).error(f"Failed to auto-assign student to org {organization_id}: {e}")
            
        return student


class SupervisorProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    organization_name = serializers.CharField(source='organization.org_name', read_only=True)
    
    class Meta:
        model = SupervisorProfile
        fields = ['id', 'user', 'user_details', 'organization', 'organization_name', 'department', 'job_title', 'created_at']

class SupervisorRegistrationSerializer(serializers.ModelSerializer):
    # User fields
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True, required=False)
    
    # Profile fields
    organization = serializers.PrimaryKeyRelatedField(queryset=Organization.objects.all(), required=False)
    department = serializers.CharField(required=False, allow_blank=True)
    job_title = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = SupervisorProfile
        fields = ['username', 'email', 'password', 'password2', 'full_name', 'phone_number', 'organization', 'department', 'job_title']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Extract user data
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'full_name': validated_data.pop('full_name'),
            'phone_number': validated_data.pop('phone_number', ''),
            'role': 'supervisor', 
            'must_change_password': True,
            'status': 'active'  # Supervisors are active by default since they are added by admins
        }
        validated_data.pop('password2')

        with transaction.atomic():
            # Create User
            user = User.objects.create_user(**user_data)
            
            # Create Supervisor Profile
            supervisor_profile = SupervisorProfile.objects.create(user=user, **validated_data)
            
        return supervisor_profile

class CompanyRegistrationSerializer(serializers.ModelSerializer):
    # User fields
    username = serializers.CharField(write_only=True)
    email = serializers.EmailField(write_only=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    full_name = serializers.CharField(write_only=True)
    phone_number = serializers.CharField(write_only=True, required=False)
    
    # Organization fields
    org_name = serializers.CharField(write_only=True)
    description = serializers.CharField(write_only=True, required=False, allow_blank=True)
    industry = serializers.CharField(write_only=True, required=False)
    website = serializers.URLField(write_only=True, required=False)
    address = serializers.CharField(write_only=True)
    
    # GPS Location
    latitude = serializers.FloatField(required=False)
    longitude = serializers.FloatField(required=False)
    
    # Admin-created flag (auto-approve)
    admin_created = serializers.BooleanField(required=False, default=False)

    class Meta:
        model = Organization
        fields = ['username', 'email', 'password', 'password2', 'full_name', 'phone_number', 
                  'org_name', 'description', 'industry', 'website', 'address', 'latitude', 'longitude', 'admin_created']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Password fields didn't match."})
        return attrs

    def create(self, validated_data):
        # Check if admin created this user (auto-approve)
        admin_created = validated_data.pop('admin_created', False)
        
        # Extract user data
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'password': validated_data.pop('password'),
            'full_name': validated_data.pop('full_name'),
            'phone_number': validated_data.pop('phone_number', ''),
            'role': 'company_admin', 'must_change_password': True if admin_created else False,
            'status': 'active' if admin_created else 'pending',
            'latitude': validated_data.get('latitude'),
            'longitude': validated_data.get('longitude')
        }
        validated_data.pop('password2')

        # Org data
        org_data = {
            'org_name': validated_data.pop('org_name'),
            'description': validated_data.pop('description', ''),
            'industry': validated_data.pop('industry', ''),
            'website': validated_data.pop('website', ''),
            'address': validated_data.pop('address'),
            'latitude': validated_data.pop('latitude', None),
            'longitude': validated_data.pop('longitude', None),
            'contact_email': user_data['email'],
            'contact_phone': user_data['phone_number'],
            'status': 'approved' if admin_created else 'pending'
        }

        with transaction.atomic():
            # Create User
            user = User.objects.create_user(**user_data)
            if admin_created:
                user.must_change_password = True
                user.save()
            
            # Create Organization
            org = Organization.objects.create(created_by=user, **org_data)
            
        return org
class StudentProfilePhotoSerializer(serializers.ModelSerializer):
    profile_photo_url = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['profile_photo', 'profile_photo_url']
        extra_kwargs = {
            'profile_photo': {'write_only': True, 'required': True}
        }
    
    def get_profile_photo_url(self, obj):
        if obj.profile_photo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_photo.url)
        return None
