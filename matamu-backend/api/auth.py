"""Google OAuth ID-token verification for PWA reporters.

Flow: PWA (Google Identity Services) -> ID token (JWT) -> this verifier.
No sessions, no redirects — stateless, fits the Ninja API.

BYPASS_AUTH=1 in .env skips real verification for local dev
(returns a fixed dev identity). Never enable in production.
"""
import os
import logging

logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
BYPASS_AUTH = os.getenv("BYPASS_AUTH", "") == "1"


def verify_google_token(id_token_str: str) -> tuple[str, str, str]:
    """Verify a Google ID token. Returns (sub, email, name).

    Raises ValueError on any failure (missing/invalid/unverified).
    """
    if BYPASS_AUTH:
        # Dev only: accept exactly 'dev', reject everything else (incl. empty)
        # so the auth-required path stays testable without Google.
        if id_token_str == "dev":
            return ("dev-bypass-sub", "dev@local.test", "Dev Tester")
        raise ValueError("invalid id_token — sign in with Google first")

    if not id_token_str:
        raise ValueError("missing id_token — sign in with Google first")
    if not GOOGLE_CLIENT_ID:
        raise ValueError("server misconfigured: GOOGLE_CLIENT_ID not set")

    from google.oauth2 import id_token as google_id_token
    from google.auth.transport import requests as google_requests

    try:
        info = google_id_token.verify_oauth2_token(
            id_token_str, google_requests.Request(), GOOGLE_CLIENT_ID
        )
    except Exception as e:
        logger.warning("google token verify failed: %s", e)
        raise ValueError("invalid or expired Google token — please sign in again")

    if not info.get("email_verified"):
        raise ValueError("Google email not verified")

    sub = info.get("sub", "")
    if not sub:
        raise ValueError("Google token has no subject")
    return (sub, info.get("email", ""), info.get("name", ""))
