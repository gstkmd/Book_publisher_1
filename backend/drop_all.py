"""
Run this script to wipe all data from the Book_publisher database.
Usage: python drop_all.py
Requires MONGO_URI environment variable to be set.
"""
import asyncio
import os
from motor.motor_asyncio import AsyncIOMotorClient
import certifi

MONGO_URI = os.environ.get("MONGO_URI", "")
DB_NAME = "Book_publisher"

COLLECTIONS = [
    "users",
    "organizations",
    "invite_tokens",
    "contents",
    "content_versions",
    "comments",
    "tasks",
    "task_comments",
    "activity_logs",
    "notifications",
    "webhook_subscriptions",
    "standards",
    "assessments",
    "lesson_plans",
    "licenses",
    "contracts",
]

async def drop_all():
    if not MONGO_URI:
        print("❌ MONGO_URI environment variable is not set.")
        return

    client = AsyncIOMotorClient(MONGO_URI, tlsCAFile=certifi.where())
    db = client[DB_NAME]

    print(f"⚠️  Wiping database: {DB_NAME}")
    for col in COLLECTIONS:
        result = await db[col].delete_many({})
        print(f"  🗑️  {col}: deleted {result.deleted_count} documents")

    print("\n✅ Database wiped. Ready for a fresh start.")
    client.close()

if __name__ == "__main__":
    asyncio.run(drop_all())
