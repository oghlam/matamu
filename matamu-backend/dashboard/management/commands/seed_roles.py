"""Seed role groups for operator dashboard RBAC.

Roles:
  Operator    — view dashboard + acknowledge/resolve follow-ups.
  Supervisor  — Operator rights + accept/reject IQE queue + delete records.
  Admin       — superuser: everything + user/group CRUD via /admin/.

Usage:  python manage.py seed_roles
Idempotent — safe to re-run.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, Permission


ROLE_PERMS = {
    "Operator": [
        "view_observation", "change_observation",
        "view_followup", "add_followup", "change_followup",
    ],
    "Supervisor": [
        "view_observation", "change_observation", "delete_observation",
        "can_moderate_iqe",
        "view_followup", "add_followup", "change_followup", "delete_followup",
    ],
}


class Command(BaseCommand):
    help = "Create Operator/Supervisor groups with dashboard permissions"

    def handle(self, *args, **kwargs):
        for role, codenames in ROLE_PERMS.items():
            group, _ = Group.objects.get_or_create(name=role)
            perms = Permission.objects.filter(codename__in=codenames)
            group.permissions.set(perms)
            found = set(perms.values_list("codename", flat=True))
            missing = set(codenames) - found
            self.stdout.write(
                f"{role}: {len(found)} permissions"
                + (f" (missing: {sorted(missing)})" if missing else "")
            )
        self.stdout.write(self.style.SUCCESS("Roles seeded. Assign users via /admin/auth/user/"))
