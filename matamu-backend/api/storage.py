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
    """Upload file to S3, return https URL.

    Falls back to local MEDIA storage (/media/...) when S3 is unavailable,
    so evidence photos still display in dev/demo.
    """
    file_path = Path(file_path)
    key = f"{prefix}/{uuid.uuid4().hex}_{file_path.name}"

    client = _s3()
    if client is None:
        return _local_fallback(file_path, key)

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
        return _local_fallback(file_path, key)


def delete_evidence(url: str) -> bool:
    """Remove an evidence file previously returned by upload_evidence.

    Handles local /media/... files and best-effort S3 keys. Returns True
    if a file was actually removed. Never raises — maintenance delete
    must not fail just because the file is already gone.
    """
    if not url or url.startswith("mock://"):
        return False
    try:
        if url.startswith("/media/"):
            from django.conf import settings

            target = Path(settings.MEDIA_ROOT) / url[len("/media/"):]
            # stay inside MEDIA_ROOT
            if Path(settings.MEDIA_ROOT) not in target.resolve().parents and target.resolve() != Path(settings.MEDIA_ROOT):
                logger.warning("evidence delete refused (outside MEDIA_ROOT): %s", url)
                return False
            if target.is_file():
                target.unlink()
                logger.info("evidence deleted locally %s", target)
                return True
            return False
        if url.startswith("http") and f"{S3_BUCKET}." in url:
            client = _s3()
            if client is None:
                return False
            key = url.split(f"{S3_BUCKET}.s3.{S3_REGION}.amazonaws.com/", 1)[-1]
            client.delete_object(Bucket=S3_BUCKET, Key=key)
            logger.info("evidence deleted from s3 %s", key)
            return True
    except Exception as e:
        logger.warning("evidence delete failed (%s) — %s", url, e)
    return False


def downscale_image(file_path: str | Path, max_dim: int = 1280) -> None:
    """Shrink a photo so its longest side is <= max_dim (in place, JPEG).

    Capture calls this BEFORE CV runs, so YOLO bboxes, SFace blur, and the
    stored evidence all see the same pixels — overlay math stays valid.
    A 4032px phone photo becomes ~300KB instead of ~4MB. Skips small
    images. Never raises (falls back to the original on any error).
    """
    try:
        from PIL import Image, ImageOps

        p = Path(file_path)
        img = ImageOps.exif_transpose(Image.open(p))
        if max(img.size) <= max_dim:
            return
        img = img.convert("RGB")
        img.thumbnail((max_dim, max_dim), Image.LANCZOS)
        img.save(p, "JPEG", quality=82)
        logger.info("downscaled %s to %s", p.name, img.size)
    except Exception as e:
        logger.warning("downscale skipped (%s) — using original", e)


def _local_fallback(file_path: Path, key: str) -> str:
    """Save evidence under MEDIA_ROOT and return a /media/ URL (dev/demo)."""
    import shutil
    from django.conf import settings

    dest = Path(settings.MEDIA_ROOT) / key
    try:
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(file_path), str(dest))
        logger.info("s3: no credentials — saved locally %s", dest)
        return f"/media/{key}"
    except Exception as e:
        logger.error("local evidence save failed — %s", e)
        return f"mock://upload-failed/{key}"
