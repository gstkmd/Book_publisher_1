from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings

from app.modules.core.models import (
    User,
    WebhookSubscription,
    Organization,
    InviteToken,
    OrganizationMember,
    UserRole,
    GlobalSettings   # ✅ FIX: REQUIRED (this was missing)
)

from app.modules.generic.models import (
    Content,
    ContentVersion,
    Comment,
    Task,
    TaskComment,
    ActivityLog,
    Notification
)

from app.modules.generic.monitoring_models import (
    MonitoringActivity,
    MonitoringScreenshot,
    MonitoringAgent
)

from app.modules.generic.rights_models import (
    License,
    Contract
)

from app.modules.educational.models import (
    Standard,
    Assessment,
    LessonPlan
)

from app.core.security import get_password_hash


# Global DB client (important for stability)
mongo_client: AsyncIOMotorClient = None


async def init_db():
    global mongo_client

    # -----------------------------
    # MONGO CONNECTION
    # -----------------------------
    mongo_client = AsyncIOMotorClient(settings.MONGO_URL)
    database = mongo_client[settings.DB_NAME]

    # -----------------------------
    # BEANIE INIT (CRITICAL FIX)
    # -----------------------------
    await init_beanie(
        database=database,
        document_models=[
            # Core
            User,
            WebhookSubscription,
            Organization,
            InviteToken,
            OrganizationMember,
            GlobalSettings,   # ✅ FIXED HERE

            # Generic
            Content,
            ContentVersion,
            Comment,
            Task,
            TaskComment,
            ActivityLog,
            Notification,

            # Monitoring
            MonitoringActivity,
            MonitoringScreenshot,
            MonitoringAgent,

            # Rights
            License,
            Contract,

            # Educational
            Standard,
            Assessment,
            LessonPlan,
        ]
    )

    print("✅ Mongo + Beanie initialized successfully")

    # -----------------------------
    # SUPER ADMIN BOOTSTRAP
    # -----------------------------
    admin_email = "ajaykumar.msn@gmail.com"
    admin_name = "Ajay Gill"
    admin_password = "Radam@13579"

    user = await User.find_one(User.email == admin_email)

    if user:
        print("DEBUG: Updating SUPER ADMIN")

        user.role = UserRole.SUPER_ADMIN
        user.full_name = admin_name
        user.hashed_password = get_password_hash(admin_password)
        user.is_active = True

        await user.save()

    else:
        print("DEBUG: Creating SUPER ADMIN")

        new_user = User(
            email=admin_email,
            full_name=admin_name,
            hashed_password=get_password_hash(admin_password),
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )

        await new_user.create()


async def close_db():
    """
    Safe shutdown hook (optional but recommended)
    """
    global mongo_client
    if mongo_client:
        mongo_client.close()
        print("🔌 MongoDB connection closed")
