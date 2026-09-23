"""LLM integration via LiteLLM proxy (Haiku 4.5 + Gemini 3.7 Flash).

ponytail: try real LiteLLM, fallback to mock if unavailable (local dev without EC2).
Set LITELLM_BASE_URL + LITELLM_API_KEY in .env for real calls.
"""
import os
import logging
import base64

logger = logging.getLogger(__name__)

LITELLM_BASE_URL = os.getenv("LITELLM_BASE_URL", "")
LITELLM_API_KEY = os.getenv("LITELLM_API_KEY", "sk-local")
HAIKU_MODEL = os.getenv("HAIKU_MODEL", "bedrock-claude-haiku-4-5")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.7-flash")


def _client():
    """Return OpenAI-compatible client pointed at LiteLLM proxy."""
    try:
        from openai import OpenAI
        return OpenAI(base_url=LITELLM_BASE_URL + "/v1", api_key=LITELLM_API_KEY)
    except Exception:
        return None


def haiku_summary(detected_class: str, confidence: float, severity: str, location: str = "") -> str:
    """Haiku 4.5: one-sentence condition summary from detection results."""
    if not LITELLM_BASE_URL:
        # ponytail: mock when no proxy configured (local dev)
        return f"Terdeteksi {detected_class} dengan tingkat keyakinan {confidence:.0%}, tingkat keparahan {severity}."

    prompt = (
        f"Ringkas kondisi jalan dalam 1 kalimat bahasa Indonesia (max 20 kata). "
        f"Deteksi: {detected_class}, confidence: {confidence:.0%}, severity: {severity}. "
        f"Lokasi: {location or 'tidak diketahui'}."
    )
    try:
        client = _client()
        resp = client.chat.completions.create(
            model=HAIKU_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=60,
            timeout=10,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning("haiku_summary failed: %s — using mock", e)
        return f"Terdeteksi {detected_class} dengan tingkat keyakinan {confidence:.0%}, tingkat keparahan {severity}."


def gemini_severity(detected_class: str, confidence: float, img_bytes: bytes = None) -> dict:
    """Gemini 3.7 Flash: multimodal severity assessment.

    Returns {"severity": "low|medium|high", "reasoning": str}
    """
    if not LITELLM_BASE_URL:
        # ponytail: heuristic mock
        sev = "high" if confidence >= 0.75 else ("medium" if confidence >= 0.5 else "low")
        return {"severity": sev, "reasoning": f"Mock: confidence {confidence:.0%} → {sev}"}

    text_prompt = (
        f"Kamu adalah analis infrastruktur jalan. "
        f"Deteksi: {detected_class} (confidence {confidence:.0%}). "
        f"Tentukan severity: low/medium/high dan alasan singkat (1 kalimat). "
        f"Jawab JSON: {{\"severity\": \"...\", \"reasoning\": \"...\"}}"
    )
    messages = [{"role": "user", "content": [{"type": "text", "text": text_prompt}]}]

    if img_bytes:
        b64 = base64.b64encode(img_bytes).decode()
        messages[0]["content"].append({
            "type": "image_url",
            "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
        })

    try:
        import json
        client = _client()
        resp = client.chat.completions.create(
            model=GEMINI_MODEL,
            messages=messages,
            max_tokens=80,
            timeout=15,
        )
        raw = resp.choices[0].message.content.strip()
        # strip markdown fences if any
        if raw.startswith("```"):
            raw = raw.split("```")[1].lstrip("json").strip()
        return json.loads(raw)
    except Exception as e:
        logger.warning("gemini_severity failed: %s — using heuristic", e)
        sev = "high" if confidence >= 0.75 else ("medium" if confidence >= 0.5 else "low")
        return {"severity": sev, "reasoning": f"Fallback: confidence {confidence:.0%} → {sev}"}


def haiku_dedup_hint(detected_class: str, nearby_count: int, location: str = "") -> str:
    """Haiku 4.5: dedup hint when 3+ reports in same area."""
    if nearby_count < 3:
        return ""
    if not LITELLM_BASE_URL:
        return f"Sudah ada {nearby_count} laporan {detected_class} di area ini — kemungkinan lokasi yang sama."

    prompt = (
        f"Ada {nearby_count} laporan {detected_class} dalam radius 50m di {location or 'area ini'}. "
        f"Tulis 1 kalimat Indonesia (max 15 kata) sebagai peringatan duplikasi untuk operator."
    )
    try:
        client = _client()
        resp = client.chat.completions.create(
            model=HAIKU_MODEL,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=40,
            timeout=8,
        )
        return resp.choices[0].message.content.strip()
    except Exception as e:
        logger.warning("haiku_dedup_hint failed: %s", e)
        return f"Sudah ada {nearby_count} laporan {detected_class} di area ini."
