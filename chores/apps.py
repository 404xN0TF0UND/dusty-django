from django.apps import AppConfig


class ChoresConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chores'
    verbose_name = 'Chore Management'

    def ready(self):
        import chores.signals
