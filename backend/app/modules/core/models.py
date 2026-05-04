from typing import Optional, List, Dict, Any
from beanie import Document
from pymongo import IndexModel, ASCENDING
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
    SUPER_ADMIN = "super_admin"
    USER = "user" # Basic consumer

class User(Document):
    email: EmailStr
    hashed_password: str
    full_name: Optional[str] = None
    organization_id: Optional[str] = None # Link to Organization
    role: str = UserRole.USER.value
    is_active: bool = True
    monitoring_enabled: bool = True
    screenshots_enabled: bool = True
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "users"
        # Enable proper JSON serialization of ObjectId
        use_state_management = True
        validate_on_save = True
        indexes = [
            IndexModel([("email", ASCENDING)], unique=True),
            IndexModel([("organization_id", ASCENDING)]),
            IndexModel([("role", ASCENDING)])
        ]

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
    plan: str = "trial" # basic_10k, pro_18k, enterprise, trial, custom
    plan_display_name: Optional[str] = None # For custom plans
    plan_price_display: Optional[str] = None # e.g. "₹15,000"
    max_users: int = 10 # Default limit
    subscription_status: str = "trialing" # trialing, active, past_due, canceled
    trial_ends_at: Optional[datetime] = None
    stripe_customer_id: Optional[str] = None
    created_at: datetime = datetime.now(timezone.utc)
    is_active: bool = True
    enabled_modules: List[str] = ["monitoring", "tasks", "workflow", "library"] # Feature toggles
    monitoring_retention_days: int = 30
    screenshot_retention_days: int = 7
    sync_interval_seconds: int = 300 # Default 5 mins
    hide_disabled_features: bool = False # Option to hide instead of lock
    content_settings: Dict[str, Any] = {} # Custom labels and custom fields setup
    role_permissions: Dict[str, List[str]] = {} # Role name -> List of module names
    
    # Website Categorization
    threat_domains: List[str] = []
    productive_domains: List[str] = []
    
    # Integrations
    copyleaks_email: Optional[str] = None
    copyleaks_api_key_encrypted: Optional[str] = None

    # Usage Statistics (Cached weekly)
    db_storage_bytes: int = 0
    file_storage_bytes: int = 0
    total_storage_bytes: int = 0
    usage_updated_at: Optional[datetime] = None

    class Settings:
        name = "organizations"
        indexes = [
            IndexModel([("slug", ASCENDING)], unique=True),
            IndexModel([("is_active", ASCENDING)])
        ]

class OrganizationMember(Document):
    organization_id: str
    user_id: str
    role: str = "user" # user, admin, etc.
    status: str = "active" # active, disabled
    invited_by: Optional[str] = None
    joined_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "organization_members"
        indexes = [
            IndexModel([("organization_id", ASCENDING), ("user_id", ASCENDING)], unique=True),
            IndexModel([("user_id", ASCENDING)]),
            IndexModel([("organization_id", ASCENDING)])
        ]

class InviteToken(Document):
    token: str              # UUID token
    email: str              # Invited email
    role: str = "user"      # Role to assign
    organization_id: str    # Org they'll join
    status: str = "pending" # pending, accepted, expired, revoked
    invited_by: Optional[str] = None
    accepted_by_user_id: Optional[str] = None
    accepted_at: Optional[datetime] = None
    expires_at: datetime    # 48-hour expiry
    used: bool = False      # Keep for backward compatibility if needed, though status supersedes
    created_at: datetime = datetime.now(timezone.utc)

    class Settings:
        name = "invite_tokens"
        indexes = [
            IndexModel([("token", ASCENDING)], unique=True),
            IndexModel([("email", ASCENDING)]),
            IndexModel([("organization_id", ASCENDING)]),
            IndexModel([("status", ASCENDING)])
        ]

class GlobalSettings(Document):
    # SMTP Settings (Encrypted where sensitive)
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = 587
    smtp_user: Optional[str] = None
    smtp_password_encrypted: Optional[str] = None
    smtp_from_email: Optional[str] = None
    smtp_use_tls: bool = True
    
    # System info
    updated_at: datetime = datetime.now(timezone.utc)
    updated_by: Optional[str] = None # User ID

    class Settings:
        name = "global_settings"
