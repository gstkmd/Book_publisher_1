import asyncio
from app.core.database import init_db
from app.modules.core.models import User, Organization
from app.modules.generic.models import Content, Task, Comment
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def run_doctor():
    print("🏥 Starting Database Health Check...")
    
    # 1. Initialize DB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.DB_NAME], 
        document_models=[User, Organization, Content, Task, Comment]
    )

    # 2. Check for Orphaned Content (No Org ID)
    orphans = await Content.find(Content.organization_id == None).to_list()
    if orphans:
        print(f"⚠️  WARNING: Found {len(orphans)} content items without an Organization ID.")
        for o in orphans:
            print(f"   - '{o.title}' (ID: {o.id})")
    else:
        print("✅ No orphaned content found.")

    # 3. Check for User Org Mismatches
    users = await User.find_all().to_list()
    valid_orgs = set([str(o.id) for o in await Organization.find_all().to_list()])
    
    user_mismatches = [u for u in users if u.organization_id and u.organization_id not in valid_orgs]
    if user_mismatches:
        print(f"⚠️  WARNING: Found {len(user_mismatches)} users assigned to non-existent Organizations.")
        for u in user_mismatches:
            print(f"   - {u.email} (OrgID: {u.organization_id})")
    else:
        print("✅ All users assigned to valid organizations.")

    # 4. Content Org Mismatches
    content_mismatches = [c for c in await Content.find_all().to_list() 
                         if c.organization_id and c.organization_id not in valid_orgs]
    if content_mismatches:
        print(f"⚠️  WARNING: Found {len(content_mismatches)} content items assigned to non-existent Organizations.")
    else:
        print("✅ All content assigned to valid organizations.")

    print("\n🩺 Diagnostic complete.")

if __name__ == "__main__":
    asyncio.run(run_doctor())
