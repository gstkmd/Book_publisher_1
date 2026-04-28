import asyncio
from app.modules.core.models import User, UserRole
from app.api.api_v1.endpoints.monitoring import get_dashboard_summary
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def test():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[User])
    
    # Get any admin user
    admin = await User.find_one(User.role == UserRole.ADMIN)
    if not admin:
        print("No admin user found")
        return
    
    print(f"Testing for admin: {admin.email}")
    try:
        res = await get_dashboard_summary(current_user=admin)
        print("Summary successful:", res)
    except Exception as e:
        print("Summary failed:", e)
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
