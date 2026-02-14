from fastapi import FastAPI
from app.core.config import settings
from app.api.api_v1.api import api_router
from starlette.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from app.core.database import init_db

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="Modular Educational Publishing Platform API",
    version="0.1.0",
    lifespan=lifespan,
    redirect_slashes=True,
)

# Set all CORS enabled origins
if settings.BACKEND_CORS_ORIGINS:
    # Parse comma-separated origins from environment variable
    origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=["Content-Type", "Authorization", "Accept"],
    )

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Educational Publishing Platform API"}

@app.get("/robots.txt")
def robots_txt():
    return "User-agent: *\nDisallow: /api/"
