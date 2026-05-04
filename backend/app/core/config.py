from typing import Optional
from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # 🔹 Basic App Config
    PROJECT_NAME: str = "Educational Publishing Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(..., alias="SECRET_KEY")
    ENCRYPTION_KEY: str = Field(..., alias="ENCRYPTION_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    FRONTEND_HOST: str = "http://localhost:3000"

    # 🔹 CORS
    BACKEND_CORS_ORIGINS: str = ""

    # 🔹 MongoDB
    MONGO_URL: str = Field(..., validation_alias="MONGO_URI")
    DB_NAME: str = "book_publisher"

    # 🔹 Redis / Celery (Optional but safe)
    REDIS_PASSWORD: Optional[str] = None
    CELERY_BROKER_URL: Optional[str] = None

    # 🔹 Mongo Root Password (Optional)
    MONGO_ROOT_PASSWORD: Optional[str] = None

    # 🔹 AWS / S3 (Wasabi)
    S3_ENDPOINT_URL: str = "https://s3.wasabisys.com"
    S3_BUCKET: str = "edu-publishing-bucket"
    AWS_ACCESS_KEY_ID: str = Field(..., alias="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(..., alias="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = "us-east-1"

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"   # ✅ IMPORTANT FIX (prevents crash)


# ✅ Create settings instance
settings = Settings()
