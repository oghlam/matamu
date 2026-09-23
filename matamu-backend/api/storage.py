"""S3 evidence storage via boto3.

ponytail: returns mock URL jika S3 tidak terkonfigurasi (local dev).
Set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, S3_BUCKET in .env.
"""
import os
import logging
import uuid
from pathlib import Path

logger = logging.getLogger(__name__)

S3_BUCKET = os.getenv("S3_BUCKET", "matamu-evidence")
S3_REGION = os.getenv("AWS_DEFAULT_REGION", "ap-southeast-1")
_AWS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "")
_AWS_SECRET = os.getenv("AWS_SECRET_ACCESS_KEY", "")


def _s3():
    if not _AWS_KEY:
        return None
    try:
        import boto3
        return boto3.client(
            "s3",
            region_name=S3_REGION,
            aws_access_key_id=_AWS_KEY,
            aws_secret_access_key=_AWS_SECRET,
        )
    except Exception as e:
        logger.warning("s3: boto3 unavailable — %s", e)
        return None


def upload_evidence(file_path: str | Path, prefix: str = "evidence") -> str:
    """Upload file to S3, return https URL. Falls back to mock:// if S3 unavailable."""
    file_path = Path(file_path)
    key = f"{prefix}/{uuid.uuid4().hex}_{file_path.name}"

    client = _s3()
    if client is None:
        logger.info("s3: no credentials — mock URL for %s", file_path.name)
        return f"mock://matamu-evidence/{key}"

    try:
        client.upload_file(
            str(file_path),
            S3_BUCKET,
            key,
            ExtraArgs={"ContentType": "image/jpeg"},
        )
        return f"https://{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/{key}"
    except Exception as e:
        logger.error("s3: upload failed — %s", e)
        return f"mock://upload-failed/{key}"
