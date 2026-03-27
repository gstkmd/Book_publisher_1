import asyncio
from app.core.database import init_db
from app.modules.core.models import User, Organization
from app.modules.generic.models import Task, Content
from beanie import init_beanie
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

async def verify_task_workflow():
    # 1. Initialize DB
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    await init_beanie(database=client[settings.DB_NAME], document_models=[User, Organization, Task, Content])

    # 2. Setup Data
    print("--- Setting up Data ---")
    org = Organization(name="Test Org", slug="test-org")
    await org.create()
    
    user = User(email="editor@example.com", hashed_password="xxx", organization_id=str(org.id))
    await user.create()

    content = Content(title="Chapter 1", slug="ch-1", author=user, organization_id=str(org.id))
    await content.create()

    # 3. Create Task (Assignment)
    print("--- Creating Assignment ---")
    task = Task(
        title="Review Chapter 1",
        description="Please check for grammar.",
        assignee=user,
        content_id=content,
        organization_id=str(org.id),
        status="pending"
    )
    await task.create()
    print(f"Task Created: '{task.title}' assigned to {task.assignee.email}")

    # 4. Verify Fetch
    print("--- Verifying Fetch ---")
    tasks = await Task.find(Task.assignee.id == user.id).to_list()
    if len(tasks) > 0:
        print(f"SUCCESS: Found {len(tasks)} task(s) for user.")
        print(f"Task Status: {tasks[0].status}")
    else:
        print("FAILURE: No tasks found.")

    # Clean up (optional, relying on test db draft nature)

if __name__ == "__main__":
    asyncio.run(verify_task_workflow())
