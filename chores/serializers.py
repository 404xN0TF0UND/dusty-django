from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Chore, Achievement, Profile, PushSubscription

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Profile
        fields = ['id', 'user', 'display_name', 'role', 'avatar_url', 'created_at', 'last_login_at', 'current_streak', 'longest_streak']

class ChoreSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    assignee_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), source='assignee', write_only=True, required=False, allow_null=True
    )
    dependencies = serializers.PrimaryKeyRelatedField(many=True, queryset=Chore.objects.all(), required=False)
    class Meta:
        model = Chore
        fields = ['id', 'title', 'description', 'assignee', 'assignee_id', 'due_date', 'completed_at', 'created_at', 'updated_at', 'is_recurring', 'recurrence_pattern', 'priority', 'category', 'dependencies', 'blocks_others']

class AchievementSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Achievement
        fields = ['id', 'user', 'title', 'description', 'icon', 'category', 'requirement', 'progress', 'completed', 'completed_at', 'rarity', 'points']

class PushSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PushSubscription
        fields = ['id', 'user', 'endpoint', 'p256dh', 'auth', 'created_at']
        read_only_fields = ['id', 'created_at', 'user'] 