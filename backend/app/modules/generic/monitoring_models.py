from typing import Optional, List, Dict
from beanie import Document, Link
from pymongo import IndexModel, ASCENDING, DESCENDING
from datetime import datetime, timezone
from app.modules.core.models import User

class MonitoringActivity(Document):
    user: Link[User]
    organization_id: str
    timestamp: datetime
    app_name: Optional[str] = None
    window_title: Optional[str] = None
    web_url: Optional[str] = None
    file_path: Optional[str] = None
    activity_type: str # active, idle
    idle_duration: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "monitoring_activity"
        indexes = [
            IndexModel([("organization_id", ASCENDING)]),
            IndexModel([("user", ASCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
            IndexModel([("created_at", ASCENDING)], expireAfterSeconds=2592000) # Keep for 30 days
        ]

class MonitoringScreenshot(Document):
    user: Link[User]
    organization_id: str
    timestamp: datetime
    file_url: str # URL to stored image (e.g. S3/Wasabi)
    app_name: Optional[str] = None
    window_title: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Settings:
        name = "monitoring_screenshots"
        indexes = [
            IndexModel([("organization_id", ASCENDING)]),
            IndexModel([("user", ASCENDING)]),
            IndexModel([("timestamp", DESCENDING)]),
            IndexModel([("created_at", ASCENDING)], expireAfterSeconds=604800) # Keep for 7 days
        ]
