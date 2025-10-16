from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator

User = get_user_model()

# --- 1. Generic User Serializer (For GET /me/, PATCH /me/) ---
class UserSerializer(serializers.ModelSerializer):
    # Ensure email is unique and required for profile updates/retrieval
    email = serializers.EmailField(required=True)
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    
    class Meta:
        model = User
        fields = [
            'id', 
            'username', 
            'email',         
            'first_name',    
            'last_name',     
            'password', 
            'role'
        ]
        # Password should only be writable (used for creating/updating, never retrieved)
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = self.Meta.model(**validated_data)
        
        if password is not None:
            user.set_password(password)
            
        user.save()
        return user
    
    def update(self, instance, validated_data):
        # Handles updating all user fields, including password hashing if present
        password = validated_data.pop('password', None)
        if password:
            instance.set_password(password)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        return instance


# --- 2. Registration Serializer (Specific for /register/) ---
class UserRegistrationSerializer(UserSerializer): # Inherit fields from UserSerializer
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + ['password2']
        # Ensure username and email have unique validators
        extra_kwargs = {
            'password': {'write_only': True},
            'password2': {'write_only': True},
            'username': {'validators': [UniqueValidator(queryset=User.objects.all())]},
            'email': {'validators': [UniqueValidator(queryset=User.objects.all())]}
        }

    def validate(self, attrs):
        # Mismatch check
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password2": "Password fields didn't match."})
        
        # Password strength check
        try:
            validate_password(attrs['password'], user=User(**attrs))
        except serializers.ValidationError as e:
            raise serializers.ValidationError({"password": list(e.messages)})
        
        # Remove password2 before creation
        attrs.pop('password2')
        return attrs

    def create(self, validated_data):
        # Delegate creation to the base UserSerializer logic
        return super().create(validated_data)
