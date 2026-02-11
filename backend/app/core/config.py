
from typing import List, Union
from pydantic import AnyHttpUrl, validator, Field
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "Educational Publishing Platform"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "changethis" # TODO: Change in production
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8 # 8 days
    
    # BACKEND_CORS_ORIGINS is a JSON-formatted list of origins
    # e.g: '["http://localhost", "http://localhost:4200", "http://localhost:3000", \
    # "http://localhost:8080", "https://localhost", "https://localhost:4200", \
    # "https://localhost:3000", "https://localhost:8080", "http://local.dockertoolbox.tiangolo.com"]'
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = []

    @validator("BACKEND_CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    MONGODB_URL: str = Field(..., validation_alias="MONGO_URI") # Required, supports MONGO_URI env var
    DB_NAME: str = "edu_publishing"
    
    # Storage (Wasabi/S3)
    S3_ENDPOINT_URL: str = "https://s3.wasabisys.com"
    S3_BUCKET: str = "edu-publishing-bucket"
    AWS_ACCESS_KEY_ID: str = "change_me"
    AWS_SECRET_ACCESS_KEY: str = "change_me"
    AWS_REGION: str = "us-east-1"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
