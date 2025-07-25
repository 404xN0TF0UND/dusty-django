from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Chore, Achievement, Profile
from django.utils import timezone
from django.db import models

MILESTONES = [1, 10, 50, 100, 500]
STREAK_MILESTONES = [2, 5, 7, 30, 100]
SPEED_MILESTONES = [5, 10]  # 5 chores in under 1 hour, 10 in under 2 hours
VARIETY_MILESTONES = [5, 10]  # 5 and 10 unique categories

@receiver(post_save, sender=Chore)
def check_completion_milestones(sender, instance, created, **kwargs):
    # Only check when a chore is marked complete
    if instance.completed_at and instance.assignee:
        user = instance.assignee
        profile = Profile.objects.get(user=user)
        completed_chores = Chore.objects.filter(assignee=user, completed_at__isnull=False)
        completed_count = completed_chores.count()
        # --- Streak logic ---
        today = instance.completed_at.date()
        # Find the most recent previous completion (excluding this one)
        prev = completed_chores.exclude(id=instance.id).order_by('-completed_at').first()
        prev_date = prev.completed_at.date() if prev else None
        if prev_date == today:
            # Already completed a chore today, streak unchanged
            pass
        elif prev_date == today - timezone.timedelta(days=1):
            # Consecutive day
            profile.current_streak += 1
        else:
            # Streak broken or first completion
            profile.current_streak = 1
        if profile.current_streak > profile.longest_streak:
            profile.longest_streak = profile.current_streak
        profile.save()
        # Unlock streak achievements
        for milestone in STREAK_MILESTONES:
            if profile.current_streak >= milestone:
                title = f"{milestone}-Day Streak"
                description = f"Completed chores {milestone} days in a row!"
                icon = "🔥"
                category = "streak"
                rarity = "common" if milestone <= 5 else "rare" if milestone <= 7 else "epic" if milestone <= 30 else "legendary"
                ach, created_ach = Achievement.objects.get_or_create(
                    user=user,
                    title=title,
                    defaults={
                        'description': description,
                        'icon': icon,
                        'category': category,
                        'requirement': milestone,
                        'progress': milestone,
                        'completed': True,
                        'completed_at': timezone.now(),
                        'rarity': rarity,
                        'points': milestone * 20,
                    }
                )
                if not created_ach and not ach.completed:
                    ach.completed = True
                    ach.completed_at = timezone.now()
                    ach.progress = milestone
                    ach.save()
        for milestone in MILESTONES:
            if completed_count >= milestone:
                title = f"{milestone} Chores Completed"
                description = f"Completed {milestone} chores!"
                icon = "🏅"
                category = "completion"
                rarity = "common" if milestone <= 10 else "rare" if milestone <= 50 else "epic" if milestone <= 100 else "legendary"
                # Check if already unlocked
                ach, created_ach = Achievement.objects.get_or_create(
                    user=user,
                    title=title,
                    defaults={
                        'description': description,
                        'icon': icon,
                        'category': category,
                        'requirement': milestone,
                        'progress': milestone,
                        'completed': True,
                        'completed_at': timezone.now(),
                        'rarity': rarity,
                        'points': milestone * 10,
                    }
                )
                if not created_ach and not ach.completed:
                    ach.completed = True
                    ach.completed_at = timezone.now()
                    ach.progress = milestone
                    ach.save()
        # --- Speed Achievements ---
        for milestone, hours in zip(SPEED_MILESTONES, [1, 2]):
            recent_chores = completed_chores.order_by('-completed_at')[:milestone]
            recent_chores_list = list(recent_chores)
            if len(recent_chores_list) == milestone:
                time_span = (recent_chores_list[0].completed_at - recent_chores_list[-1].completed_at).total_seconds() / 3600.0
                if time_span <= hours:
                    title = 'Speed Demon' if milestone == 5 else 'Lightning Fast'
                    description = f'Complete {milestone} chores in under {hours} hour{"s" if hours > 1 else ""}'
                    icon = '⚡' if milestone == 5 else '⚡⚡'
                    category = 'speed'
                    rarity = 'rare' if milestone == 5 else 'epic'
                    ach, created_ach = Achievement.objects.get_or_create(
                        user=user,
                        title=title,
                        defaults={
                            'description': description,
                            'icon': icon,
                            'category': category,
                            'requirement': milestone,
                            'progress': milestone,
                            'completed': True,
                            'completed_at': timezone.now(),
                            'rarity': rarity,
                            'points': milestone * 15,
                        }
                    )
                    if not created_ach and not ach.completed:
                        ach.completed = True
                        ach.completed_at = timezone.now()
                        ach.progress = milestone
                        ach.save()
        # --- Variety Achievements ---
        categories = set(completed_chores.values_list('category', flat=True))
        for milestone in VARIETY_MILESTONES:
            if len(categories) >= milestone:
                title = 'Variety Explorer' if milestone == 5 else 'Category Master'
                description = f'Complete chores in {milestone} different categories'
                icon = '🌈' if milestone == 5 else '🎨'
                category = 'variety'
                rarity = 'common' if milestone == 5 else 'rare'
                ach, created_ach = Achievement.objects.get_or_create(
                    user=user,
                    title=title,
                    defaults={
                        'description': description,
                        'icon': icon,
                        'category': category,
                        'requirement': milestone,
                        'progress': milestone,
                        'completed': True,
                        'completed_at': timezone.now(),
                        'rarity': rarity,
                        'points': milestone * 10,
                    }
                )
                if not created_ach and not ach.completed:
                    ach.completed = True
                    ach.completed_at = timezone.now()
                    ach.progress = milestone
                    ach.save()
        # --- Special/Fun Achievements ---
        # Perfect Week: complete at least 1 chore every day for 7 days
        week_start = instance.completed_at - timezone.timedelta(days=instance.completed_at.weekday())
        week_days = [week_start + timezone.timedelta(days=i) for i in range(7)]
        days_with_chores = set(
            c.completed_at.date() for c in completed_chores
            if c.completed_at.date() >= week_start.date() and c.completed_at.date() <= (week_start + timezone.timedelta(days=6)).date()
        )
        if len(days_with_chores) == 7:
            title = 'Perfect Week'
            description = 'Complete at least one chore every day for a week.'
            icon = '✨'
            category = 'special'
            rarity = 'epic'
            ach, created_ach = Achievement.objects.get_or_create(
                user=user,
                title=title,
                defaults={
                    'description': description,
                    'icon': icon,
                    'category': category,
                    'requirement': 1,
                    'progress': 1,
                    'completed': True,
                    'completed_at': timezone.now(),
                    'rarity': rarity,
                    'points': 200,
                }
            )
            if not created_ach and not ach.completed:
                ach.completed = True
                ach.completed_at = timezone.now()
                ach.progress = 1
                ach.save()
        # Early Bird: 5 chores before 9am
        early_bird_count = completed_chores.filter(completed_at__hour__lt=9).count()
        if early_bird_count >= 5:
            title = 'Early Bird'
            description = 'Complete 5 chores before 9 AM.'
            icon = '🌅'
            category = 'special'
            rarity = 'rare'
            ach, created_ach = Achievement.objects.get_or_create(
                user=user,
                title=title,
                defaults={
                    'description': description,
                    'icon': icon,
                    'category': category,
                    'requirement': 5,
                    'progress': 5,
                    'completed': True,
                    'completed_at': timezone.now(),
                    'rarity': rarity,
                    'points': 75,
                }
            )
            if not created_ach and not ach.completed:
                ach.completed = True
                ach.completed_at = timezone.now()
                ach.progress = 5
                ach.save()
        # Night Owl: 5 chores after 8pm
        night_owl_count = completed_chores.filter(completed_at__hour__gte=20).count()
        if night_owl_count >= 5:
            title = 'Night Owl'
            description = 'Complete 5 chores after 8 PM.'
            icon = '🦉'
            category = 'special'
            rarity = 'rare'
            ach, created_ach = Achievement.objects.get_or_create(
                user=user,
                title=title,
                defaults={
                    'description': description,
                    'icon': icon,
                    'category': category,
                    'requirement': 5,
                    'progress': 5,
                    'completed': True,
                    'completed_at': timezone.now(),
                    'rarity': rarity,
                    'points': 75,
                }
            )
            if not created_ach and not ach.completed:
                ach.completed = True
                ach.completed_at = timezone.now()
                ach.progress = 5
                ach.save()
        # Weekend Warrior: 10 chores on weekends
        weekend_count = completed_chores.filter(completed_at__week_day__in=[1, 7]).count()  # 1=Sunday, 7=Saturday
        if weekend_count >= 10:
            title = 'Weekend Warrior'
            description = 'Complete 10 chores on weekends.'
            icon = '🏖️'
            category = 'special'
            rarity = 'common'
            ach, created_ach = Achievement.objects.get_or_create(
                user=user,
                title=title,
                defaults={
                    'description': description,
                    'icon': icon,
                    'category': category,
                    'requirement': 10,
                    'progress': 10,
                    'completed': True,
                    'completed_at': timezone.now(),
                    'rarity': rarity,
                    'points': 50,
                }
            )
            if not created_ach and not ach.completed:
                ach.completed = True
                ach.completed_at = timezone.now()
                ach.progress = 10
                ach.save()
        # Overdue Hero: complete an overdue chore
        overdue_hero = completed_chores.filter(due_date__lt=models.F('completed_at')).exists()
        if overdue_hero:
            title = 'Overdue Hero'
            description = 'Complete an overdue chore.'
            icon = '🦸'
            category = 'special'
            rarity = 'rare'
            ach, created_ach = Achievement.objects.get_or_create(
                user=user,
                title=title,
                defaults={
                    'description': description,
                    'icon': icon,
                    'category': category,
                    'requirement': 1,
                    'progress': 1,
                    'completed': True,
                    'completed_at': timezone.now(),
                    'rarity': rarity,
                    'points': 100,
                }
            )
            if not created_ach and not ach.completed:
                ach.completed = True
                ach.completed_at = timezone.now()
                ach.progress = 1
                ach.save() 