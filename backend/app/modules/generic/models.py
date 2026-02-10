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
    organization_id: Optional[str] = None
    status: str = "pending" # pending, in_progress, completed
    due_date: Optional[datetime] = None
    created_by: Link[User]
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "tasks"
