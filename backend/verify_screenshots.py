
import asyncio
import os
from datetime import datetime, timezone, timedelta
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys

# Add backend to path to import models
sys.path.append(os.getcwd())

from app.modules.generic.monitoring_models import MonitoringScreenshot, MonitoringActivity
from app.modules.core.models import User
from app.core.config import settings

async def verify_data(email):
    print(f"Verifying data for user: {email}")
    
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db_name = settings.DB_NAME
    await init_beanie(database=client[db_name], document_models=[MonitoringActivity, MonitoringScreenshot, User])
    
    user = await User.find_one({"email": email})
    if not user:
        print(f"User not found: {email}")
        return
    
    print(f"User ID: {user.id}")
    
    # Check Activity
    activity_count = await MonitoringActivity.find({"user.$id": user.id}).count()
    print(f"Total Activity Logs for user: {activity_count}")
    
    # Check Screenshots
    screenshot_count = await MonitoringScreenshot.find({"user.$id": user.id}).count()
    print(f"Total Screenshots for user: {screenshot_count}")
    
    if screenshot_count > 0:
        latest = await MonitoringScreenshot.find({"user.$id": user.id}).sort(-MonitoringScreenshot.timestamp).first_or_none()
        print(f"Latest Screenshot: {latest.timestamp} - {latest.app_name}")
    
    # Check for today specifically (UTC)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_activity = await MonitoringActivity.find({"user.$id": user.id}, MonitoringActivity.timestamp >= today).count()
    print(f"Activity Logs today (UTC): {today_activity}")
    
    today_screenshots = await MonitoringScreenshot.find({"user.$id": user.id}, MonitoringScreenshot.timestamp >= today).count()
    print(f"Screenshots today (UTC): {today_screenshots}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_screenshots.py <email>")
    else:
        asyncio.run(verify_data(sys.argv[1]))
