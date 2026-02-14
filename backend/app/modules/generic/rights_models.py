from typing import Optional, List, Dict
from beanie import Document, Link
from pydantic import BaseModel, Field
from datetime import datetime
from app.modules.core.models import User
from app.modules.generic.models import Content

class LicenseStatus(str):
    ACTIVE = "active"
    EXPIRING_SOON = "expiring_soon"
    EXPIRED = "expired"
    TERMINATED = "terminated"

class License(Document):
    title: str
    content_id: Optional[Link[Content]] = None
    territory: str # e.g., "North America", "Global"
    type: str = "Exclusive" # Exclusive, Non-Exclusive
    start_date: datetime
    end_date: datetime
    status: str = "active"
    organization_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "licenses"

class RoyaltyTier(BaseModel):
    threshold: int # e.g., up to 5000 units
    rate: float # e.g., 0.10 (10%)

class Contract(Document):
    user_id: Link[User] # The author/illustrator
    content_id: Optional[Link[Content]] = None
    royalty_rate: float # Base rate
    tiers: List[RoyaltyTier] = []
    payment_terms: str = "Net 30"
    organization_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "contracts"
