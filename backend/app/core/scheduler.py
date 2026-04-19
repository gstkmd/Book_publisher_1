import os
from datetime import datetime, timezone
import asyncio
from typing import List
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from app.modules.core.models import Organization, User
from app.modules.generic.models import Content, ContentVersion, Comment, Task, TaskComment, ActivityLog, Notification
from app.modules.generic.monitoring_models import MonitoringActivity, MonitoringScreenshot, MonitoringAgent
from app.modules.generic.rights_models import License, Contract
from app.modules.educational.models import Standard, Assessment, LessonPlan
import logging

logger = logging.getLogger(__name__)

async def get_collection_usage_for_org(model, org_id: str) -> int:
    """Calculate the BSON size of all documents in a collection for a specific organization."""
    try:
        pipeline = [
            {"$match": {"organization_id": org_id}},
            {"$group": {"_id": None, "total_bytes": {"$sum": {"$bsonSize": "$$ROOT"}}}}
        ]
        # Access the raw collection through motor
        collection = model.get_motor_collection()
        results = await collection.aggregate(pipeline).to_list(length=1)
        return results[0]["total_bytes"] if results else 0
    except Exception as e:
        logger.error(f"Error calculating DB usage for {model.__name__} in org {org_id}: {e}")
        return 0

async def calculate_org_usage(org: Organization):
    """Calculate total DB and File storage for a single organization."""
    org_id = str(org.id)
    logger.info(f"Calculating usage for Organization: {org.name} ({org_id})")
    
    # 1. Database Usage
    models_with_org_id = [
        MonitoringActivity, MonitoringScreenshot, MonitoringAgent,
        Content, Comment, Task, TaskComment, ActivityLog, Notification,
        License, Contract, Standard, Assessment, LessonPlan
    ]
    
    db_total_bytes = 0
    for model in models_with_org_id:
        db_total_bytes += await get_collection_usage_for_org(model, org_id)
    
    # Special case: ContentVersion (links to Content)
    try:
        # We find versions whose content belongs to this org
        # Simplified: Get all content IDs for this org first
        content_ids = await Content.find(Content.organization_id == org_id).to_list()
        content_oids = [c.id for c in content_ids]
        
        if content_oids:
            version_pipeline = [
                {"$match": {"content_id.$id": {"$in": content_oids}}},
                {"$group": {"_id": None, "total_bytes": {"$sum": {"$bsonSize": "$$ROOT"}}}}
            ]
            v_collection = ContentVersion.get_motor_collection()
            v_results = await v_collection.aggregate(version_pipeline).to_list(length=1)
            db_total_bytes += v_results[0]["total_bytes"] if v_results else 0
    except Exception as e:
        logger.error(f"Error calculating ContentVersion usage for org {org_id}: {e}")

    # 2. File Storage Usage (Screenshots)
    file_total_bytes = 0
    try:
        # Sum up file sizes for all screenshots of this org
        screenshots = await MonitoringScreenshot.find(MonitoringScreenshot.organization_id == org_id).to_list()
        for s in screenshots:
            if s.file_url and os.path.exists(s.file_url):
                file_total_bytes += os.path.getsize(s.file_url)
    except Exception as e:
        logger.error(f"Error calculating file storage for org {org_id}: {e}")

    # 3. Update Organization
    org.db_storage_bytes = db_total_bytes
    org.file_storage_bytes = file_total_bytes
    org.total_storage_bytes = db_total_bytes + file_total_bytes
    org.usage_updated_at = datetime.now(timezone.utc)
    await org.save()
    logger.info(f"Updated usage for {org.name}: DB={db_total_bytes}, Files={file_total_bytes}")

async def calculate_platform_usage():
    """Scan all organizations and calculate usage."""
    logger.info("Starting Platform-wide usage calculation task...")
    orgs = await Organization.find_all().to_list()
    for org in orgs:
        await calculate_org_usage(org)
    logger.info("Finished Platform-wide usage calculation task.")

# Global scheduler instance
scheduler = AsyncIOScheduler()

def start_scheduler():
    """Start the background task scheduler."""
    if not scheduler.running:
        # Run every Sunday at 2 AM
        scheduler.add_job(
            calculate_platform_usage,
            CronTrigger(day_of_week='sun', hour=2, minute=0),
            id='weekly_usage_calc',
            replace_existing=True
        )
        
        # Also run once on startup (optional, but good for initial population)
        # scheduler.add_job(calculate_platform_usage, id='initial_startup_calc')
        
        scheduler.start()
        logger.info("Background scheduler started (Weekly 2AM Task)")
