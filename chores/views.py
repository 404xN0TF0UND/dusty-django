from django.shortcuts import render
from rest_framework import viewsets, permissions
from django.contrib.auth.models import User
from .models import Chore, Achievement, Profile, PushSubscription
from .serializers import ChoreSerializer, AchievementSerializer, ProfileSerializer, UserSerializer, PushSubscriptionSerializer
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated

from rest_framework.parsers import JSONParser
from .models import send_web_push

# Create your views here.

class ChoreViewSet(viewsets.ModelViewSet):
    queryset = Chore.objects.all().order_by('-created_at')
    serializer_class = ChoreSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        chore = serializer.save()
        # Notify assignee if assigned
        if chore.assignee:
            payload = {
                'title': 'New Chore Assigned',
                'body': f'You have been assigned a new chore: {chore.title}',
                'tag': 'chore-assigned',
                'data': {'chore_id': chore.id}
            }
            for sub in chore.assignee.push_subscriptions.all():
                send_web_push(sub, payload)

    def perform_update(self, serializer):
        prev = Chore.objects.get(pk=serializer.instance.pk)
        chore = serializer.save()
        # If chore is now completed and was not completed before, notify all admins
        if chore.completed_at and not prev.completed_at:
            admins = User.objects.filter(profile__role='admin')
            payload = {
                'title': 'Chore Completed',
                'body': f'Chore "{chore.title}" was completed by {chore.assignee.display_name if chore.assignee else "someone"}.',
                'tag': 'chore-completed',
                'data': {'chore_id': chore.id}
            }
            for admin in admins:
                for sub in admin.push_subscriptions.all():
                    send_web_push(sub, payload)

class AchievementViewSet(viewsets.ModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

class ProfileViewSet(viewsets.ModelViewSet):
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        profile = self.get_queryset().filter(user=request.user).first()
        if profile:
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        return Response({'detail': 'Profile not found.'}, status=404)

    @action(detail=False, methods=['get'], url_path='leaderboard')
    def leaderboard(self, request):
        # Aggregate chores completed per user
        profiles = self.get_queryset()
        leaderboard = []
        for profile in profiles:
            user_chores = Chore.objects.filter(assignee=profile.user)
            completed_count = user_chores.filter(completed_at__isnull=False).count()
            # Placeholder for streak (to be implemented later)
            leaderboard.append({
                'user_id': profile.user.id,
                'username': profile.user.username,
                'display_name': profile.display_name,
                'completed_chores': completed_count,
                'streak': 0,  # To be implemented
            })
        # Sort by completed_chores descending
        leaderboard.sort(key=lambda x: x['completed_chores'], reverse=True)
        return Response(leaderboard)

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class PushSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = PushSubscription.objects.all()
    serializer_class = PushSubscriptionSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [JSONParser]

    def create(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        endpoint = data.get('endpoint')
        keys = data.get('keys', {})
        p256dh = keys.get('p256dh')
        auth = keys.get('auth')
        if not endpoint or not p256dh or not auth:
            return Response({'detail': 'Invalid subscription data.'}, status=status.HTTP_400_BAD_REQUEST)
        # Prevent duplicate subscriptions for the same endpoint
        sub, created = PushSubscription.objects.get_or_create(
            user=user,
            endpoint=endpoint,
            defaults={'p256dh': p256dh, 'auth': auth}
        )
        if not created:
            sub.p256dh = p256dh
            sub.auth = auth
            sub.save()
        serializer = self.get_serializer(sub)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
