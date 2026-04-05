
from typing import List, Union
from pydantic import AnyHttpUrl, validator, Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Educational Publishing Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(..., alias="SECRET_KEY")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:4200", "http://localhost:3000", \
    # "http://localhost:8080", "https://localhost", "https://localhost:4200", \
    # Can be a single URL (string) or comma-separated URLs
    # Example: "https://example.com" or "https://example.com,https://another.com"
    BACKEND_CORS_ORIGINS: str = ""

    MONGO_URL: str = Field(
        ...,
        validation_alias="MONGO_URI",
        description="MongoDB connection string. Required."
    )
    DB_NAME: str = "book_publisher"


    
    
    # Storage (Wasabi/S3)
    S3_ENDPOINT_URL: str = "https://s3.wasabisys.com"
    S3_BUCKET: str = "edu-publishing-bucket"
    AWS_ACCESS_KEY_ID: str = Field(..., alias="AWS_ACCESS_KEY_ID")
    AWS_SECRET_ACCESS_KEY: str = Field(..., alias="AWS_SECRET_ACCESS_KEY")
    AWS_REGION: str = "us-east-1"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
