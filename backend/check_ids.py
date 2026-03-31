import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from bson import ObjectId
import sys
import os

# Add backend to path to import app
sys.path.append(os.path.abspath("."))

from app.core.config import settings
from app.modules.core.models import User

async def check_users():
    client = AsyncIOMotorClient(settings.MONGO_URL)
    await init_beanie(
        database=client[settings.DB_NAME],
        document_models=[User]
    )
    
    ids = ["69c565e00e82bbbed3ee5b4e", "69cb3ac4097ea93f6e2498a8"]
    
    for id_str in ids:
        user = await User.get(id_str)
        if user:
            print(f"ID {id_str} is User: {user.email}, Name: {user.full_name}")
        else:
            print(f"ID {id_str} NOT FOUND in User collection")

if __name__ == "__main__":
    asyncio.run(check_users())
