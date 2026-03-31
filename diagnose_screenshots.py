
import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.modules.core.models import User
from app.modules.generic.monitoring_models import MonitoringAgent, MonitoringActivity, MonitoringScreenshot
from datetime import datetime, timezone, timedelta

async def diagnose():
    client = AsyncIOMotorClient("mongodb://admin:StrongPassword123@localhost:27017/admin?authSource=admin&tls=false")
    db = client.book_publisher
    await init_beanie(database=db, document_models=[User, MonitoringAgent, MonitoringActivity, MonitoringScreenshot])

    email = "manojpansari1967@gmail.com"
    user = await User.find_one(User.email == email)
    
    if not user:
        print(f"User {email} not found")
        return

    print(f"User Found: {user.email}, ID: {user.id}, Org: {user.organization_id}")

    # Check today's start
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    print(f"Today UTC start: {today}")

    # Check activities today
    activities_today = await MonitoringActivity.find(
        MonitoringActivity.organization_id == user.organization_id,
        MonitoringActivity.timestamp >= today
    ).count()
    print(f"Activities today for org {user.organization_id}: {activities_today}")

    # Check screenshots today with org filter
    screenshots_today_org = await MonitoringScreenshot.find(
        MonitoringScreenshot.organization_id == user.organization_id,
        MonitoringScreenshot.timestamp >= today
    ).count()
    print(f"Screenshots today for org {user.organization_id}: {screenshots_today_org}")

    # Check screenshots today WITHOUT org filter
    screenshots_today_no_org = await MonitoringScreenshot.find(
        MonitoringScreenshot.timestamp >= today
    ).count()
    print(f"Screenshots today (ANY org): {screenshots_today_no_org}")

    # Check screenshots for this user
    screenshots_user = await MonitoringScreenshot.find(
        MonitoringScreenshot.user.id == user.id
    ).count()
    print(f"Total screenshots for user: {screenshots_user}")

    # Show last 5 screenshots
    last_shots = await MonitoringScreenshot.find(
        MonitoringScreenshot.user.id == user.id
    ).sort(-MonitoringScreenshot.timestamp).limit(5).to_list()
    
    for s in last_shots:
        print(f"  Shot ID: {s.id}, TS: {s.timestamp}, Org: {s.organization_id}")

if __name__ == "__main__":
    asyncio.run(diagnose())
