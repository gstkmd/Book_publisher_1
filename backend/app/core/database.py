from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from app.core.config import settings
from app.modules.core.models import User, WebhookSubscription, Organization
from app.modules.generic.models import Content, ContentVersion, Comment, Task
from app.modules.educational.models import Standard, Assessment, LessonPlan

async def init_db():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(
        database=client[settings.DB_NAME],
        document_models=[User, Content, ContentVersion, Standard, Assessment, LessonPlan, WebhookSubscription, Organization, Comment, Task]
    )
