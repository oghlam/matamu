"""
URL configuration for matamu_backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.contrib import admin
from django.http import JsonResponse
from django.shortcuts import redirect
from django.urls import include, path, re_path
from django.views.static import serve

from api.api import api as ninja_api
from api.overpass_proxy import overpass_proxy


def health(_request):
    return JsonResponse({"status": "ok", "service": "matamu-backend"})


urlpatterns = [
    path("", lambda r: redirect("dashboard:overview")),
    path("admin/", admin.site.urls),
    path("health", health),
    path("api/overpass", overpass_proxy),
    path("api/", ninja_api.urls),
    path("dashboard/", include("dashboard.urls")),
]

# Serve evidence photos in all envs (demo has no separate media server;
# static() helper returns [] when DEBUG=False, so wire serve directly.
# ponytail: Django-served media is enough, use S3+CDN when traffic grows).
urlpatterns += [re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT})]
