"""S3-backed file storage for uploaded note documents and generated audio.

Reuses the AWS account already configured for audio.py's podcast uploads,
so notes don't need a second cloud storage provider (e.g. Firebase).
"""
import logging
from typing import Optional

import boto3
from botocore.exceptions import ClientError, NoCredentialsError

from core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    def __init__(self):
        self.bucket = settings.AWS_S3_BUCKET
        self.client = None
        if settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY and self.bucket:
            try:
                self.client = boto3.client(
                    "s3",
                    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                    region_name=settings.AWS_REGION,
                )
            except Exception as e:
                logger.warning(f"Failed to initialize S3 client, file storage disabled: {e}")
        else:
            logger.warning("AWS credentials not configured, file storage disabled")

    def _check_configured(self):
        if not self.client:
            raise RuntimeError("File storage is not configured (missing AWS credentials)")

    async def upload_bytes(self, file_bytes: bytes, key: str, content_type: Optional[str] = None) -> str:
        """Upload bytes to S3 under `key`, returning the key for later retrieval."""
        self._check_configured()
        extra_args = {"ContentType": content_type} if content_type else {}
        self.client.put_object(Bucket=self.bucket, Key=key, Body=file_bytes, **extra_args)
        return key

    async def download_file(self, key: str) -> bytes:
        """Return the raw bytes stored at `key`."""
        self._check_configured()
        response = self.client.get_object(Bucket=self.bucket, Key=key)
        return response["Body"].read()

    async def delete_file(self, key: str):
        self._check_configured()
        self.client.delete_object(Bucket=self.bucket, Key=key)

    async def get_file_info(self, key: str) -> Optional[dict]:
        """Return basic metadata if the file exists, else None."""
        self._check_configured()
        try:
            response = self.client.head_object(Bucket=self.bucket, Key=key)
            return {"size": response.get("ContentLength"), "content_type": response.get("ContentType")}
        except ClientError as e:
            if e.response["Error"]["Code"] in ("404", "NoSuchKey"):
                return None
            raise


storage_service = StorageService()
