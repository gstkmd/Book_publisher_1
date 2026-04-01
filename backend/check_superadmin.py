import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.modules.core.models import User
from app.core.config import settings

async def check_superadmin():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client.get_default_database(), document_models=[User])
    
    user = await User.find_one(User.email == "ajaykumar.msn@gmail.com")
    if user:
        print(f"User found: {user.email}")
        print(f"Full Name: {user.full_name}")
        print(f"Is Superuser: {user.is_superuser}")
        print(f"Is Active: {user.is_active}")
        print(f"Role: {user.role}")
    else:
        print("User not found.")

if __name__ == "__main__":
    asyncio.run(check_superadmin())
