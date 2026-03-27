import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.modules.core.models import User
from app.core.config import settings

async def list_users():
    # Use the same database initialization as the main app
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client.get_database(), document_models=[User])
    
    users = await User.find_all().to_list()
    print(f"Found {len(users)} users:")
    for user in users:
        print(f"Email: {user.email}, Is Active: {user.is_active}, Role: {user.role}")

if __name__ == "__main__":
    asyncio.run(list_users())
