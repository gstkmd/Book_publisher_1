import asyncio
import pytest
from httpx import AsyncClient
from app.main import app
from app.core.database import init_db
from app.core.config import settings
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.modules.core.models import User, Organization
from app.modules.generic.models import Content, ContentVersion, Comment, Task
from app.modules.educational.models import Standard, Assessment, LessonPlan

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest.fixture(scope="session", autouse=True)
async def initialize_test_db():
    # Use a separate test database name
    test_db_name = f"{settings.DB_NAME}_test"
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    
    await init_beanie(
        database=client[test_db_name],
        document_models=[
            User, Content, ContentVersion, Standard, Assessment, 
            LessonPlan, Organization, Comment, Task
        ]
    )
    yield
    # Optional: Drop test database after session
    # await client.drop_database(test_db_name)

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def test_user(initialize_test_db):
    # Create a test organization and user
    org = await Organization.find_one(Organization.slug == "test-org")
    if not org:
        org = Organization(name="Test Org", slug="test-org")
        await org.create()
    
    user = await User.find_one(User.email == "test@example.com")
    if not user:
        from app.core import security
        user = User(
            email="test@example.com",
            hashed_password=security.get_password_hash("testpassword"),
            full_name="Test User",
            organization_id=str(org.id),
            role="admin",
            is_active=True
        )
        await user.create()
    return user

@pytest.fixture
async def auth_token(client, test_user):
    # Get access token for test user
    response = await client.post(
        f"{settings.API_V1_STR}/auth/access-token",
        data={
            "username": "test@example.com",
            "password": "testpassword"
        }
    )
    return response.json()["access_token"]
