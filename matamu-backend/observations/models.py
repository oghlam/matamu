from django.db import models

class Observation(models.Model):
    STATUS_CHOICES = [
        ("pending_verification", "Pending Verification"),
        ("published", "Published"),
        ("acknowledged", "Acknowledged"),
        ("resolved", "Resolved"),
    ]
    # ponytail: lat/lng Float locally, PointField only if USE_POSTGIS=1 on EC2
    lat = models.FloatField()
    lng = models.FloatField()
    detected_class = models.CharField(max_length=32)  # pothole etc
    confidence = models.FloatField()
    bbox = models.JSONField(default=dict)  # {x,y,w,h}
    severity = models.CharField(max_length=16, default="medium")  # low/medium/high
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending_verification")
    trust_score = models.FloatField(default=0.0)
    evidence_url = models.URLField(max_length=500, blank=True, default="")
    summary = models.TextField(blank=True, default="")
    location_label = models.CharField(max_length=255, blank=True, default="")
    all_detections = models.JSONField(default=list)  # [{class, confidence, bbox}]
    faces_blurred = models.IntegerField(default=0)
    typesafe_eval = models.JSONField(default=dict, blank=True)  # TypeSafe AI structured eval
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.detected_class} {self.trust_score:.2f} {self.status}"

class FollowUp(models.Model):
    observation = models.ForeignKey(Observation, on_delete=models.CASCADE, related_name="followups")
    status = models.CharField(max_length=20, default="acknowledged")
    created_at = models.DateTimeField(auto_now_add=True)
