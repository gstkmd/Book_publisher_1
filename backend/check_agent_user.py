import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie, Document
from bson import ObjectId
from typing import Optional

# Simple model to avoid dependency issues
class User(Document):
    email: str
    class Settings:
        name = "users"

async def check_user():
    # Attempt to read MONGO_URI from .env
    mongo_uri = None
    if os.path.exists(".env"):
        with open(".env") as f:
            for line in f:
                if line.startswith("MONGO_URI=") or line.startswith("MONGO_URL="):
                    mongo_uri = line.split("=", 1)[1].strip().strip('"').strip("'")
                    break
    
    if not mongo_uri:
        print("MONGO_URI not found in .env")
        return

    client = AsyncIOMotorClient(mongo_uri)
    # Extract DB name from URI or use default
    db_name = mongo_uri.split("/")[-1].split("?")[0] or "book_publisher"
    
    await init_beanie(database=client[db_name], document_models=[User])
    
    target_id = "69d28db7a34cad89ad79ed96"
    try:
        user = await User.get(ObjectId(target_id))
        if user:
            print(f"User found: {user.email} (ID: {user.id})")
        else:
            print(f"User NOT found for ID: {target_id}")
    except Exception as e:
        print(f"Error finding user: {e}")
        
    # List some users to see what's there
    try:
        users = await User.find_all().limit(10).to_list()
        print(f"\nUsers in DB '{db_name}':")
        for u in users:
            print(f"  - {u.email} (ID: {u.id})")
    except Exception as e:
        print(f"Error listing users: {e}")

if __name__ == "__main__":
    asyncio.run(check_user())
