
import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.modules.core.models import User
from app.modules.generic.monitoring_models import MonitoringAgent, MonitoringActivity, MonitoringScreenshot
from app.core.config import settings

async def diagnose():
    client = AsyncIOMotorClient("mongodb://admin:StrongPassword123@localhost:27017/admin?authSource=admin&tls=false")
    db = client.book_publisher
    await init_beanie(database=db, document_models=[User, MonitoringAgent, MonitoringActivity, MonitoringScreenshot])

    email = "rajpatijain34@gmail.com"
    user = await User.find_one(User.email == email)
    
    if not user:
        print(f"User {email} not found")
        return

    print(f"User Found: {user.email}, ID: {user.id}, Org: {user.organization_id}")

    agents = await MonitoringAgent.find(MonitoringAgent.user.id == user.id).to_list()
    print(f"Agents Found: {len(agents)}")
    for a in agents:
        print(f"  Agent ID: {a.id}, Computer: {a.computer_name}, Seen: {a.last_seen}")

    activities = await MonitoringActivity.find(MonitoringActivity.user.id == user.id).to_list()
    print(f"Activities Found: {len(activities)}")

    screenshots = await MonitoringScreenshot.find(MonitoringScreenshot.user.id == user.id).to_list()
    print(f"Screenshots Found: {len(screenshots)}")

if __name__ == "__main__":
    asyncio.run(diagnose())
