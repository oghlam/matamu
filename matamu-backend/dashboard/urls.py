from django.urls import path
from . import views

app_name = "dashboard"

urlpatterns = [
    path("", views.overview, name="overview"),
    path("observations/", views.observations, name="observations"),
    path("observations/<int:pk>/delete/", views.observation_delete, name="observation_delete"),
    path("iqe/", views.iqe_queue, name="iqe"),
    path("iqe/<int:pk>/action/", views.iqe_action, name="iqe_action"),
    path("followup/", views.followup, name="followup"),
    path("followup/<int:pk>/action/", views.followup_action, name="followup_action"),
    path("agentic/", views.agentic_traces, name="agentic"),
]
