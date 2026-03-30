
import asyncio
import os
from datetime import datetime, timezone
from beanie import init_beanie, Link
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import sys

# Add backend to path to import models
sys.path.append(os.getcwd())

from app.modules.generic.monitoring_models import MonitoringActivity
from app.modules.core.models import User
from app.core.config import settings

async def test_query(agent_id_str, date_str):
    print(f"Testing query for agent_id: {agent_id_str}, date: {date_str}")
    
    # Initialize Beanie
    client = AsyncIOMotorClient(settings.MONGO_URL)
    db_name = settings.DB_NAME
    await init_beanie(database=client[db_name], document_models=[MonitoringActivity, User])
    
    try:
        user_oid = ObjectId(agent_id_str)
    except:
        print("Invalid agent_id")
        return

    user_match = {"$or": [
        {"user": user_oid},
        {"user.$id": user_oid}
    ]}
    
    start_date = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
    start_date = start_date.replace(hour=0, minute=0, second=0, microsecond=0)
    end_date = start_date.replace(hour=23, minute=59, second=59, microsecond=999999)
    
    print(f"Date range: {start_date} to {end_date}")
    
    # Test Aggregation (App usage)
    app_pipeline = [
        {
            "$match": {
                **user_match,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }
        },
        {"$group": {"_id": "$app_name", "count": {"$sum": 1}}}
    ]
    apps_result = await MonitoringActivity.aggregate(app_pipeline).to_list()
    print(f"Aggregation result count: {len(apps_result)}")
    for app in apps_result:
        print(f"  - {app['_id']}: {app['count']}")
        
    # Test Find
    raw_logs_query = {
        **user_match,
        "timestamp": {"$gte": start_date, "$lte": end_date}
    }
    raw_logs = await MonitoringActivity.find(
        raw_logs_query,
        fetch_links=False
    ).sort(-MonitoringActivity.timestamp).limit(10).to_list()
    
    print(f"Find (fetch_links=False) result count: {len(raw_logs)}")
    
    # Test Find with fetch_links
    raw_logs_links = await MonitoringActivity.find(
        raw_logs_query,
        fetch_links=True
    ).sort(-MonitoringActivity.timestamp).limit(10).to_list()
    
    print(f"Find (fetch_links=True) result count: {len(raw_logs_links)}")
    if len(raw_logs_links) > 0:
        log = raw_logs_links[0]
        print(f"First log sample: {log.app_name} at {log.timestamp}")
        print(f"User link resolved: {log.user is not None and not isinstance(log.user, Link)}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python debug_query.py <agent_id> <date>")
    else:
        asyncio.run(test_query(sys.argv[1], sys.argv[2]))
