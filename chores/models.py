from django.db import models
from django.contrib.auth.models import User
from pywebpush import webpush, WebPushException
from django.conf import settings
import json

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    display_name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=[('admin', 'Admin'), ('member', 'Member')], default='member')
    avatar_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login_at = models.DateTimeField(blank=True, null=True)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)

    def __str__(self):
        return self.display_name

class Chore(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=500, blank=True)
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='chores')
    due_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_recurring = models.BooleanField(default=False)
    recurrence_pattern = models.CharField(max_length=10, blank=True, choices=[('daily', 'Daily'), ('weekly', 'Weekly'), ('monthly', 'Monthly')])
    priority = models.CharField(max_length=10, choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')], default='medium')
    category = models.CharField(max_length=50, blank=True)
    dependencies = models.ManyToManyField('self', blank=True, symmetrical=False)
    blocks_others = models.BooleanField(default=False)

    def __str__(self):
        return self.title

class Achievement(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='achievements')
    title = models.CharField(max_length=100)
    description = models.TextField()
    icon = models.CharField(max_length=10)
    category = models.CharField(max_length=20, choices=[('completion', 'Completion'), ('streak', 'Streak'), ('speed', 'Speed'), ('variety', 'Variety'), ('special', 'Special')])
    requirement = models.IntegerField()
    progress = models.IntegerField(default=0)
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    rarity = models.CharField(max_length=10, choices=[('common', 'Common'), ('rare', 'Rare'), ('epic', 'Epic'), ('legendary', 'Legendary')], default='common')
    points = models.IntegerField(default=0)

    def __str__(self):
        return f"{self.title} ({self.user.username})"

class PushSubscription(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='push_subscriptions')
    endpoint = models.TextField()
    p256dh = models.CharField(max_length=255)
    auth = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"PushSubscription for {self.user.username} ({self.endpoint[:30]}...)"

# Utility function to send a web push notification

def send_web_push(subscription, payload):
    try:
        webpush(
            subscription_info={
                "endpoint": subscription.endpoint,
                "keys": {
                    "p256dh": subscription.p256dh,
                    "auth": subscription.auth,
                },
            },
            data=json.dumps(payload),
            vapid_private_key=getattr(settings, 'VAPID_PRIVATE_KEY', None),
            vapid_claims={
                "sub": "mailto:admin@example.com"
            },
        )
    except WebPushException as ex:
        print(f"Web push failed: {ex}")
