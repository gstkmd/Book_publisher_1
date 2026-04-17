import asyncio
import sys
import os

# Add the parent directory to sys.path to allow imports from app
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.modules.core.models import Organization
from app.modules.core.crypto import encrypt_value
from app.core.config import settings

async def set_copyleaks_keys(slug: str, email: str, api_key: str):
    print(f"Connecting to database: {settings.DB_NAME}...")
    client = AsyncIOMotorClient(settings.MONGO_URL)
    await init_beanie(database=client[settings.DB_NAME], document_models=[Organization])
    
    print(f"Searching for organization with slug: {slug}...")
    org = await Organization.find_one(Organization.slug == slug)
    
    if not org:
        print(f"Error: Organization with slug '{slug}' not found.")
        return

    print(f"Encrypting API key and updating organization '{org.name}'...")
    org.copyleaks_email = email
    org.copyleaks_api_key_encrypted = encrypt_value(api_key)
    
    await org.save()
    print(f"Success! Copyleaks credentials updated for {org.name}.")

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python set_copyleaks_keys.py <org_slug> <copyleaks_email> <copyleaks_api_key>")
        print("Example: python set_copyleaks_keys.py demo1 user@example.com my-secret-api-key")
        sys.exit(1)
    
    org_slug = sys.argv[1]
    cl_email = sys.argv[2]
    cl_key = sys.argv[3]
    
    asyncio.run(set_copyleaks_keys(org_slug, cl_email, cl_key))
