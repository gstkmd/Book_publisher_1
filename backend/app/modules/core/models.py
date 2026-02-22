from typing import Optional, List
from beanie import Document
from pydantic import EmailStr
from datetime import datetime, timezone

from enum import Enum

class UserRole(str, Enum):
    ADMIN = "admin"
    EDITOR_IN_CHIEF = "editor_in_chief"
    SECTION_EDITOR = "section_editor"
    AUTHOR = "author"
    REVIEWER = "reviewer"
    ILLUSTRATOR = "illustrator"
    TEACHER = "teacher"
    USER = "user" # Basic consumer

class User(Document):
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    organization_id: Optional[str] = None # Link to Organization
    role: UserRole = UserRole.USER
    is_active: bool = True
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "users"
        # Enable proper JSON serialization of ObjectId
        use_state_management = True
        validate_on_save = True

class WebhookSubscription(Document):
    url: str
    events: List[str] # e.g. ["content.created", "content.updated"]
    secret: str
    organization_id: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    is_active: bool = True

    class Settings:
        name = "webhook_subscriptions"

class Organization(Document):
    name: str
    slug: str
    plan: str = "free" # free, pro, enterprise
    stripe_customer_id: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    is_active: bool = True

    class Settings:
        name = "organizations"

class InviteToken(Document):
    token: str              # UUID token
    email: str              # Invited email
    role: str = "user"      # Role to assign
    organization_id: str    # Org they'll join
    expires_at: datetime    # 48-hour expiry
    used: bool = False      # Consumed after join
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "invite_tokens"
