from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.modules.core.models import User, WebhookSubscription, Organization, InviteToken, OrganizationMember
from app.modules.generic.models import Content, ContentVersion, Comment, Task, TaskComment, ActivityLog, Notification
from app.modules.generic.monitoring_models import MonitoringActivity, MonitoringScreenshot, MonitoringAgent
from app.modules.generic.rights_models import License, Contract
from app.modules.educational.models import Standard, Assessment, LessonPlan
from app.modules.core.models import UserRole
import certifi
from app.core.security import get_password_hash

async def init_db():
    client = AsyncIOMotorClient(
        settings.MONGO_URL,
    )
    await init_beanie(
        database=client[settings.DB_NAME],
        document_models=[
            User, Content, ContentVersion, Standard, Assessment, 
            LessonPlan, WebhookSubscription, Organization, Comment, 
            Task, TaskComment, ActivityLog, Notification,
            License, Contract, InviteToken, OrganizationMember,
            MonitoringActivity, MonitoringScreenshot, MonitoringAgent
        ]
    )
    
    # Ensure Super Admin exists after DB init
    admin_email = "ajaykumar.msn@gmail.com"
    admin_name = "Ajay Gill"
    admin_password = "Radam@13579"
    from app.modules.core.models import UserRole
    from app.core.security import get_password_hash
    
    user = await User.find_one(User.email == admin_email)
    if user:
        # Force correct Role and Password to ensure access
        print(f"DEBUG: Ensuring SUPER_ADMIN status for {admin_email}...")
        user.role = UserRole.SUPER_ADMIN
        user.full_name = admin_name
        user.hashed_password = get_password_hash(admin_password)
        user.is_active = True
        await user.save()
    else:
        print(f"DEBUG: Creating new SUPER_ADMIN {admin_email}...")
        new_user = User(
            email=admin_email,
            full_name=admin_name,
            hashed_password=get_password_hash(admin_password),
            role=UserRole.SUPER_ADMIN,
            is_active=True
        )
        await new_user.create()
