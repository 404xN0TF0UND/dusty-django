from django.test import TestCase
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from chores.models import Profile, Chore
from django.utils import timezone

# Create your tests here.

class Command(BaseCommand):
    help = 'Simulate and unlock all badge types for a user.'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username to simulate badges for')

    def handle(self, *args, **options):
        username = options['username']
        try:
            user = User.objects.get(username=username)
            profile = Profile.objects.get(user=user)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} does not exist.'))
            return
        except Profile.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'Profile for {username} does not exist.'))
            return
        now = timezone.now()
        # --- Completion Milestones ---
        for i in range(1, 501):
            completed_at = now - timezone.timedelta(days=500 - i)
            Chore.objects.create(
                title=f'Completion Chore {i}',
                assignee=user,
                completed_at=completed_at,
                created_at=completed_at,
                updated_at=completed_at,
                category='general'
            )
        # --- Streaks: 100-day streak ---
        for i in range(100):
            completed_at = now - timezone.timedelta(days=100 - i)
            Chore.objects.create(
                title=f'Streak Chore {i+1}',
                assignee=user,
                completed_at=completed_at,
                created_at=completed_at,
                updated_at=completed_at,
                category='general'
            )
        # --- Speed: 10 chores in under 2 hours ---
        for i in range(10):
            completed_at = now - timezone.timedelta(hours=2 - (i * 0.2))
            Chore.objects.create(
                title=f'Speed Chore {i+1}',
                assignee=user,
                completed_at=completed_at,
                created_at=completed_at,
                updated_at=completed_at,
                category='general'
            )
        # --- Variety: 10 unique categories ---
        for i in range(10):
            completed_at = now - timezone.timedelta(days=10 - i)
            Chore.objects.create(
                title=f'Variety Chore {i+1}',
                assignee=user,
                completed_at=completed_at,
                created_at=completed_at,
                updated_at=completed_at,
                category=f'cat{i+1}'
            )
        # --- Special: Early Bird, Night Owl, Weekend Warrior, Overdue Hero, Perfect Week ---
        # Early Bird: 5 chores before 9am
        for i in range(5):
            dt = now.replace(hour=8, minute=0, second=0, microsecond=0) - timezone.timedelta(days=i)
            Chore.objects.create(
                title=f'Early Bird Chore {i+1}',
                assignee=user,
                completed_at=dt,
                created_at=dt,
                updated_at=dt,
                category='special'
            )
        # Night Owl: 5 chores after 8pm
        for i in range(5):
            dt = now.replace(hour=21, minute=0, second=0, microsecond=0) - timezone.timedelta(days=i)
            Chore.objects.create(
                title=f'Night Owl Chore {i+1}',
                assignee=user,
                completed_at=dt,
                created_at=dt,
                updated_at=dt,
                category='special'
            )
        # Weekend Warrior: 10 chores on weekends
        for i in range(10):
            # Saturday (6) or Sunday (7)
            day = 6 if i % 2 == 0 else 7
            dt = now - timezone.timedelta(days=(now.weekday() - day + i))
            Chore.objects.create(
                title=f'Weekend Warrior Chore {i+1}',
                assignee=user,
                completed_at=dt,
                created_at=dt,
                updated_at=dt,
                category='special'
            )
        # Overdue Hero: 1 overdue chore
        dt = now - timezone.timedelta(days=2)
        Chore.objects.create(
            title='Overdue Hero Chore',
            assignee=user,
            completed_at=now,
            created_at=dt,
            updated_at=now,
            due_date=dt,
            category='special'
        )
        self.stdout.write(self.style.SUCCESS(f'Simulated all badge types for {username}.'))
