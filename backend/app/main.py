from fastapi import FastAPI
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.api.api_v1.api import api_router
from app.core.database import init_db
from app.core.scheduler import start_scheduler


# -----------------------------
# LIFESPAN (IMPORTANT FIX AREA)
# -----------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup sequence:
    1. Initialize DB (Mongo + Beanie)
    2. Start background scheduler
    """

    print("🚀 Starting application...")

    # 1. INIT DATABASE (THIS FIXES YOUR ERROR)
    await init_db()
    print("✅ Database initialized")

    # 2. START SCHEDULER
    start_scheduler()
    print("⏰ Scheduler started")

    yield

    # Optional cleanup (if needed)
    print("🛑 Shutting down application...")


# -----------------------------
# FASTAPI APP INIT
# -----------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Modular Educational Publishing Platform API",
    version="0.1.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
    redirect_slashes=True,
)


# -----------------------------
# STATIC FILES (SAFE MOUNT)
# -----------------------------
storage_path = "/app/storage"
if os.path.isdir(storage_path):
    app.mount("/storage", StaticFiles(directory=storage_path), name="storage")


# -----------------------------
# CORS CONFIG
# -----------------------------
if settings.BACKEND_CORS_ORIGINS:
    origins = [
        origin.strip()
        for origin in settings.BACKEND_CORS_ORIGINS.split(",")
        if origin.strip()
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )


# -----------------------------
# ROUTES
# -----------------------------
app.include_router(api_router, prefix=settings.API_V1_STR)


# -----------------------------
# ROOT ENDPOINT
# -----------------------------
@app.get("/")
def read_root():
    return {
        "message": "Welcome to the Educational Publishing Platform API",
        "status": "running"
    }


# -----------------------------
# ROBOTS.TXT
# -----------------------------
@app.get("/robots.txt")
def robots_txt():
    return "User-agent: *\nDisallow: /api/"
