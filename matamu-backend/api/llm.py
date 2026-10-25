"""Amazon Nova integration via LiteLLM or AWS Bedrock direct.

Three modes are supported:
  1. LITELLM_BASE_URL set → OpenAI-compatible LiteLLM proxy
  2. AWS credentials available → Bedrock Converse API directly
  3. otherwise → heuristic fallback for local development

Nova Lite handles summaries and deduplication; Nova Pro handles multimodal
severity assessment.
"""
import os
import logging
import base64

logger = logging.getLogger(__name__)

LITELLM_BASE_URL = os.getenv("LITELLM_BASE_URL", "")
LITELLM_API_KEY = os.getenv("LITELLM_API_KEY", "sk-local")
# Backward-compatible variable names; values now point exclusively to Amazon Nova.
SUMMARY_MODEL = os.getenv("SUMMARY_MODEL", os.getenv("HAIKU_MODEL", "amazon.nova-lite-v1:0"))
SEVERITY_MODEL = os.getenv(
    "SEVERITY_MODEL",
    os.getenv("SONNET_MODEL", os.getenv("GEMINI_MODEL", "amazon.nova-pro-v1:0")),
)
HAIKU_MODEL = SUMMARY_MODEL
SONNET_MODEL = SEVERITY_MODEL

_BEDROCK_SUMMARY_ID = os.getenv("BEDROCK_SUMMARY_ID", SUMMARY_MODEL)
_BEDROCK_SEVERITY_ID = os.getenv("BEDROCK_SEVERITY_ID", SEVERITY_MODEL)
_BEDROCK_SUMMARY_REGION = os.getenv("BEDROCK_SUMMARY_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
_BEDROCK_SEVERITY_REGION = os.getenv("BEDROCK_SEVERITY_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))


def _resolve_bedrock_model(model_id: str) -> str:
    """Return a Nova model ID; reject legacy Claude IDs instead of silently using them."""
    if "claude" in model_id.lower() or "anthropic." in model_id.lower():
        logger.warning("Legacy Claude model configured (%s); using Amazon Nova fallback", model_id)
        return "amazon.nova-lite-v1:0"
    return model_id


def _client():
    """Return OpenAI-compatible client pointed at LiteLLM proxy."""
    try:
        from openai import OpenAI
        return OpenAI(base_url=LITELLM_BASE_URL + "/v1", api_key=LITELLM_API_KEY)
    except Exception:
        return None


def _bedrock_converse(model_id: str, region: str, prompt: str, img_bytes: bytes | None = None, max_tokens: int = 80) -> str | None:
    """Try Bedrock Converse API directly via boto3. Returns text or None on failure."""
    try:
        import boto3
        client = boto3.client("bedrock-runtime", region_name=region)
        content = [{"text": prompt}]
        if img_bytes:
            # Bedrock expects raw bytes, detect format from header
            fmt = "jpeg"
            if img_bytes[:4] == b"\x89PNG":
                fmt = "png"
            content.append({"image": {"format": fmt, "source": {"bytes": img_bytes}}})
        resp = client.converse(
            modelId=model_id,
            messages=[{"role": "user", "content": content}],
            inferenceConfig={"maxTokens": max_tokens, "temperature": 0.2},
        )
        return resp["output"]["message"]["content"][0]["text"].strip()
    except Exception as e:
        logger.warning("bedrock converse %s failed: %s", model_id, e)
        return None


def haiku_summary(detected_class: str, confidence: float, severity: str, location: str = "") -> str:
    """Amazon Nova Lite: one-sentence condition summary from detection results."""
    prompt = (
        f"Summarize the road condition in 1 English sentence (max 20 words). "
        f"Detection: {detected_class}, confidence: {confidence:.0%}, severity: {severity}. "
        f"Location: {location or 'unknown'}."
    )
    # 1. LiteLLM proxy (local WSL)
    if LITELLM_BASE_URL:
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
            logger.warning("haiku_summary via litellm failed: %s", e)
    # 2. Bedrock direct (EC2)
    bedrock_id = _resolve_bedrock_model(_BEDROCK_SUMMARY_ID)
    text = _bedrock_converse(bedrock_id, _BEDROCK_SUMMARY_REGION, prompt, max_tokens=60)
    if text:
        return text
    # 3. mock
    logger.info("haiku_summary using mock")
    return f"Detected {detected_class} with {confidence:.0%} confidence, {severity} severity."


def gemini_severity(detected_class: str, confidence: float, img_bytes: bytes = None) -> dict:
    """Backward-compat alias — use sonnet_severity()."""
    return sonnet_severity(detected_class, confidence, img_bytes)


def sonnet_severity(detected_class: str, confidence: float, img_bytes: bytes = None) -> dict:
    """Amazon Nova Pro: multimodal severity assessment.

    Returns {"severity": "low|medium|high", "reasoning": str}
    """
    text_prompt = (
        f"You are a road infrastructure analyst. "
        f"Detection: {detected_class} (confidence {confidence:.0%}). "
        f"Decide severity: low/medium/high with a one-sentence reason. "
        f"Answer in JSON: {{\"severity\": \"...\", \"reasoning\": \"...\"}}"
    )
    # 1. LiteLLM proxy (supports image via OpenAI image_url)
    if LITELLM_BASE_URL:
        try:
            import json
            messages = [{"role": "user", "content": [{"type": "text", "text": text_prompt}]}]
            if img_bytes:
                b64 = base64.b64encode(img_bytes).decode()
                messages[0]["content"].append({
                    "type": "image_url",
                    "image_url": {"url": f"data:image/jpeg;base64,{b64}"},
                })
            client = _client()
            resp = client.chat.completions.create(
                model=SONNET_MODEL,
                messages=messages,
                max_tokens=80,
                timeout=15,
            )
            raw = resp.choices[0].message.content.strip()
            if raw.startswith("```"):
                raw = raw.split("```")[1].lstrip("json").strip()
            return json.loads(raw)
        except Exception as e:
            logger.warning("sonnet_severity via litellm failed: %s", e)
    # 2. Bedrock direct (EC2) — multimodal via converse
    bedrock_id = _resolve_bedrock_model(_BEDROCK_SEVERITY_ID)
    raw = _bedrock_converse(bedrock_id, _BEDROCK_SEVERITY_REGION, text_prompt, img_bytes=img_bytes, max_tokens=80)
    if raw:
        try:
            import json
            if raw.startswith("```"):
                raw = raw.split("```")[1].lstrip("json").strip()
            return json.loads(raw)
        except Exception as e:
            logger.warning("sonnet bedrock json parse failed: %s raw=%s", e, raw[:200])
            # fall through to heuristic but try to extract severity keyword
            low = raw.lower()
            sev = "high" if "high" in low else ("low" if "low" in low else "medium")
            return {"severity": sev, "reasoning": raw[:200]}
    # 3. heuristic
    sev = "high" if confidence >= 0.75 else ("medium" if confidence >= 0.5 else "low")
    return {"severity": sev, "reasoning": f"Mock: confidence {confidence:.0%} → {sev}"}


def haiku_dedup_hint(detected_class: str, nearby_count: int, location: str = "") -> str:
    """Amazon Nova Lite: dedup hint when 3+ reports are in the same area."""
    if nearby_count < 3:
        return ""
    prompt = (
        f"There are {nearby_count} {detected_class} reports within a 50m radius at {location or 'this area'}. "
        f"Write 1 English sentence (max 15 words) as a duplication warning for the operator."
    )
    if LITELLM_BASE_URL:
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
            logger.warning("haiku_dedup_hint via litellm failed: %s", e)
    text = _bedrock_converse(_resolve_bedrock_model(_BEDROCK_SUMMARY_ID), _BEDROCK_SUMMARY_REGION, prompt, max_tokens=40)
    if text:
        return text
    return f"{nearby_count} existing {detected_class} reports in this area."
