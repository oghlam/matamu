from django.contrib import admin
from .models import Observation, FollowUp

class FollowUpInline(admin.TabularInline):
    model = FollowUp
    extra = 0

@admin.register(Observation)
class ObservationAdmin(admin.ModelAdmin):
    list_display = ("id", "detected_class", "severity", "status", "trust_score",
                    "confidence", "faces_blurred", "location_label", "lat", "lng", "created_at")
    list_filter = ("detected_class", "severity", "status")
    search_fields = ("summary", "location_label")
    readonly_fields = ("all_detections", "trust_score", "confidence", "faces_blurred", "evidence_url")
    date_hierarchy = "created_at"
    list_per_page = 25
    inlines = [FollowUpInline]
    actions = ["mark_published", "mark_pending"]

    @admin.action(description="Mark published")
    def mark_published(self, request, qs):
        qs.update(status="published")
    @admin.action(description="Mark pending_verification")
    def mark_pending(self, request, qs):
        qs.update(status="pending_verification")
