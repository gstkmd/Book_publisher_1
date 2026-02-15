from typing import Optional, List, Dict
from beanie import Document, Link
from pydantic import Field
from datetime import datetime
from app.modules.core.models import User

class Content(Document):
    title: str
    slug: str
    body: Dict = {} # Rich Text JSON
    cover_image: Optional[str] = None
    type: str = "article" # article, book_chapter, resource
    status: str = "draft" # draft, review, published
    author: Link[User]
    tags: List[str] = []
    organization_id: Optional[str] = None
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "content"

class ContentVersion(Document):
    content_id: Link[Content]
    version_number: int
    title: str
    body: Dict = {}
    created_at: datetime = datetime.utcnow()
    created_by: Link[User]

    class Settings:
        name = "content_versions"

class Comment(Document):
    content_id: Link[Content]
    text: str
    selection_range: Optional[Dict] = None # {from: int, to: int}
    author: Link[User]
    organization_id: Optional[str] = None
    resolved: bool = False
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "comments"

class Task(Document):
    title: str
    description: Optional[str] = None
    content_id: Optional[Link[Content]] = None
    assignee: Optional[Link[User]] = None
    assigner: Optional[Link[User]] = None
    organization_id: Optional[str] = None
    status: str = "pending" # pending, in_progress, completed
    priority: str = "medium" # low, medium, high, urgent
    stage: str = "To Do" # To Do, In Progress, Review, Done
    tags: List[str] = []
    due_date: Optional[datetime] = None
    start_date: Optional[datetime] = None
    time_estimate: Optional[str] = None
    timer_start: Optional[datetime] = None
    track_time: Optional[int] = 0 # In seconds
    custom_fields: Dict[str, str] = {}
    parent_task_id: Optional[Link["Task"]] = None
    created_by: Link[User]
    created_at: datetime = datetime.utcnow()
    updated_at: datetime = datetime.utcnow()

    class Settings:
        name = "tasks"

class TaskComment(Document):
    task_id: Link[Task]
    text: str
    author: Link[User]
    organization_id: Optional[str] = None
    created_at: datetime = datetime.utcnow()

class ActivityLog(Document):
    resource_type: str # e.g., "task", "content"
    resource_id: str
    action: str # e.g., "status_change", "assignee_change", "created"
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user: Link[User]
    organization_id: Optional[str] = None
    created_at: datetime = datetime.utcnow()

class Notification(Document):
    user_id: Link[User]
    title: str
    message: str
    type: str # "task_assignment", "mention", "status_update"
    link: str
    read: bool = False
    organization_id: Optional[str] = None
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "notifications"
