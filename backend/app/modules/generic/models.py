from typing import Optional, List, Dict
from beanie import Document, Link
from pymongo import IndexModel, ASCENDING, DESCENDING, TEXT
from pydantic import Field
from datetime import datetime, timezone
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
    latest_integrity_report: Optional[Dict] = None # Stores AI score and Plagiarism matches
    custom_fields: Dict[str, str] = {} # Custom field values (subject, class, board, etc.)
    attachments: List[Dict[str, str]] = [] # [{"name": "file.pdf", "url": "/uploads/..."}]
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "content"
        indexes = [
            IndexModel([("organization_id", ASCENDING)]),
            IndexModel([("title", TEXT)]), # Full text search support
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("type", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("updated_at", DESCENDING)]),
            IndexModel([("custom_fields.subject", ASCENDING)]), # Common custom field
            IndexModel([("custom_fields.class", ASCENDING)])   # Common custom field
        ]

class ContentVersion(Document):
    content_id: Link[Content]
    version_number: int
    title: str
    body: Dict = {}
    created_at: datetime = datetime.now(timezone.utc)
    created_by: Link[User]

    class Settings:
        name = "content_versions"
        indexes = [
            IndexModel([("content_id", ASCENDING)]),
            IndexModel([("version_number", DESCENDING)])
        ]

class Comment(Document):
    content_id: Link[Content]
    text: str
    selection_range: Optional[Dict] = None # {from: int, to: int}
    author: Link[User]
    organization_id: Optional[str] = None
    resolved: bool = False
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "comments"
        indexes = [
            IndexModel([("content_id", ASCENDING)]),
            IndexModel([("organization_id", ASCENDING)]),
            IndexModel([("resolved", ASCENDING)])
        ]

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
    attachments: list[dict[str, str]] = [] # [{"name": "file.pdf", "url": "/uploads/..."}]
    links: list[dict[str, str]] = [] # [{"label": "Google Drive", "url": "https://..."}]
    custom_fields: Dict[str, str] = {}
    parent_task_id: Optional[Link["Task"]] = None
    created_by: Link[User]
    created_at: datetime = datetime.now(timezone.utc)
    updated_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "tasks"
        indexes = [
            IndexModel([("organization_id", ASCENDING)]),
            IndexModel([("content_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)]),
            IndexModel([("stage", ASCENDING)]),
            IndexModel([("assignee", ASCENDING)]),
            IndexModel([("due_date", ASCENDING)]),
            IndexModel([("updated_at", DESCENDING)])
        ]

class TaskComment(Document):
    task_id: Link[Task]
    text: str
    author: Link[User]
    organization_id: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)

class ActivityLog(Document):
    resource_type: str # e.g., "task", "content"
    resource_id: str
    action: str # e.g., "status_change", "assignee_change", "created"
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    user: Link[User]
    organization_id: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "activity_logs"
        indexes = [
            IndexModel(
                [("created_at", ASCENDING)],
                expireAfterSeconds=7776000 # 3 months (90 days)
            )
        ]

class Notification(Document):
    user_id: Link[User]
    title: str
    message: str
    type: str # "task_assignment", "mention", "status_update"
    link: str
    read: bool = False
    organization_id: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "notifications"
