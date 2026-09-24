"""Auto-login for matamu-dash subdomain (demo convenience).

If Host is matamu-dash.* then treat request as admin without password.
Production: remove or guard with DEMO_DASH_BYPASS env.
"""
from django.contrib.auth import get_user_model


class DashAutoLoginMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # only for dash subdomain and unauthenticated requests
        host = request.get_host().split(":")[0].lower()
        if host.startswith("matamu-dash.") and not request.user.is_authenticated:
            try:
                User = get_user_model()
                user = User.objects.filter(username="admin", is_active=True).first()
                if user:
                    request.user = user
            except Exception:
                pass
        return self.get_response(request)
