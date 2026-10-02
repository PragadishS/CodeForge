from django.contrib.auth import get_user_model 
from rest_framework import serializers 

from .models import Profile 

User = get_user_model()

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta: 
        model = User
        fields = ("username", "email", "password")

    def create(self, validated_data):
        return User.objects.create_user(username=validated_data["username"],email=validated_data["email"],password=validated_data["password"])

class MeSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Profile
        fields = ("username", "email", "role", "total_score", "current_streak", "longest_streak", "last_active_date")