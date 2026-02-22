import boto3
from botocore.exceptions import NoCredentialsError
from fastapi import UploadFile
from app.core.config import settings
import uuid

class S3Client:
    def __init__(self):
        self.s3 = boto3.client(
            's3',
            endpoint_url=settings.S3_ENDPOINT_URL,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION
        )
        self.bucket = settings.S3_BUCKET

    async def upload_file(self, file: UploadFile) -> str:
        """
        Uploads a file to S3 and returns the public URL.
        """
        file_extension = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_extension}"
        
        try:
            self.s3.upload_fileobj(
                file.file,
                self.bucket,
                file_name,
                ExtraArgs={'ACL': 'public-read', 'ContentType': file.content_type}
            )
            return f"{settings.S3_ENDPOINT_URL}/{self.bucket}/{file_name}"
        except (NoCredentialsError, Exception) as e:
            print(f"S3 Upload Error: {e}")
            raise e

    def create_multipart_upload(self, file_name: str, content_type: str) -> str:
        try:
            response = self.s3.create_multipart_upload(
                Bucket=self.bucket,
                Key=file_name,
                ContentType=content_type,
                ACL='public-read'
            )
            return response['UploadId']
        except Exception as e:
            print(f"S3 Init Error: {e}")
            raise e

    def upload_part(self, file_name: str, upload_id: str, part_number: int, body: bytes) -> str:
        try:
            response = self.s3.upload_part(
                Bucket=self.bucket,
                Key=file_name,
                PartNumber=part_number,
                UploadId=upload_id,
                Body=body
            )
            return response['ETag']
        except Exception as e:
            print(f"S3 Part Error: {e}")
            raise e

    def complete_multipart_upload(self, file_name: str, upload_id: str, parts: list) -> str:
        try:
            self.s3.complete_multipart_upload(
                Bucket=self.bucket,
                Key=file_name,
                UploadId=upload_id,
                MultipartUpload={'Parts': parts}
            )
            return f"{settings.S3_ENDPOINT_URL}/{self.bucket}/{file_name}"
        except Exception as e:
            print(f"S3 Complete Error: {e}")
            raise e

s3_client = S3Client()
