import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
import sys
import os

# Add backend to path to import app
sys.path.append(os.path.abspath("."))

from app.core.config import settings
from app.modules.core.models import User
from app.modules.generic.monitoring_models import MonitoringActivity

async def check_data():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    await init_beanie(
        database=client[settings.DB_NAME],
        document_models=[User, MonitoringActivity]
    )
    
    # 1. List all users and their orgs
    all_users = await User.find_all().to_list()
    print(f"Total users in DB: {len(all_users)}")
    
    for m in all_users:
        # Check activity count for each
        count = await MonitoringActivity.find(MonitoringActivity.user.id == m.id).count()
        print(f"User: {m.email}, Role: {m.role}, OrgID: {m.organization_id}, Activity Count: {count}")

if __name__ == "__main__":
    asyncio.run(check_data())
