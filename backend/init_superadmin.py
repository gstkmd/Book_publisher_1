import asyncio
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.modules.core.models import User, UserRole, Organization
from app.core.security import get_password_hash
from app.core.config import settings

async def init_superadmin():
    # Use environment variables or fall back to provided defaults
    import os
    email = os.environ.get("SUPERADMIN_EMAIL", "ajaykumar.msn@gmail.com")
    password = os.environ.get("SUPERADMIN_PASSWORD")
    name = os.environ.get("SUPERADMIN_NAME", "Ajay Gill")

    if not password:
        print("❌ Error: SUPERADMIN_PASSWORD environment variable is not set.")
        print("Usage: SUPERADMIN_PASSWORD=your_password python init_superadmin.py")
        return

    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.MONGODB_DB_NAME], document_models=[User, Organization])
    
    # Check if user already exists
    user = await User.find_one(User.email == email)
    if user:
        print(f"User {email} already exists. Updating to SUPER_ADMIN...")
        user.role = UserRole.SUPER_ADMIN
        user.full_name = name
        user.hashed_password = get_password_hash(password)
        await user.save()
    else:
        print(f"Creating SUPER_ADMIN {email}...")
        user = User(
            email=email,
            hashed_password=get_password_hash(password),
            full_name=name,
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        await user.create()
    
    print("Super Admin initialized successfully.")

if __name__ == "__main__":
    asyncio.run(init_superadmin())
