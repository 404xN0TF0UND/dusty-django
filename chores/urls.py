from rest_framework import routers
from .views import ChoreViewSet, AchievementViewSet, ProfileViewSet, UserViewSet, PushSubscriptionViewSet
from django.urls import path, include

router = routers.DefaultRouter()
router.register(r'chores', ChoreViewSet)
router.register(r'achievements', AchievementViewSet)
router.register(r'profiles', ProfileViewSet)
router.register(r'users', UserViewSet)
router.register(r'push-subscriptions', PushSubscriptionViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 