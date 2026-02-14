import asyncio
import os
from app.core.database import init_db
from app.modules.core.models import User, Organization
from app.modules.generic.models import Content
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def diagnose_content():
    print("Connecting to database...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DB_NAME], document_models=[User, Organization, Content])

    print("\n--- Diagnostic Report ---")
    
    # Check Organizations
    orgs = await Organization.find_all().to_list()
    print(f"Total Organizations: {len(orgs)}")
    for org in orgs:
        print(f" - Org: '{org.name}' ID: {org.id} Slug: {org.slug}")

    # Check Users
    users = await User.find_all().to_list()
    print(f"\nTotal Users: {len(users)}")
    for user in users:
        print(f" - User: {user.email} Role: {user.role} OrgID: {user.organization_id}")

    # Check Content
    contents = await Content.find_all().to_list()
    print(f"\nTotal Content Items: {len(contents)}")
    for c in contents:
        print(f" - Content: '{c.title}' ID: {c.id} Status: {c.status} OrgID: {c.organization_id}")

    print("\n--- Summary ---")
    if len(contents) > 0:
        org_ids = set([c.organization_id for c in contents])
        print(f"Content items belong to these Org IDs: {org_ids}")
        
        user_org_ids = set([u.organization_id for u in users])
        print(f"Users belong to these Org IDs: {user_org_ids}")
        
        mismatches = org_ids - user_org_ids
        if mismatches:
            print(f"WARNING: Found content with Org IDs not assigned to any user: {mismatches}")
        else:
            print("No obvious Org ID mismatches between users and content found.")
    else:
        print("No content found in the database at all.")

if __name__ == "__main__":
    try:
        asyncio.run(diagnose_content())
    except Exception as e:
        print(f"Error: {e}")
