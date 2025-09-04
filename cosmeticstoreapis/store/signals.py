from django.contrib.auth import get_user_model
from django.utils import timezone
from oauth2_provider.signals import app_authorized

def update_last_login(sender, request, token, **kwargs):
    user = token.user
    if user:
        user.last_login = timezone.now()
        user.save(update_fields=['last_login'])

app_authorized.connect(update_last_login)
