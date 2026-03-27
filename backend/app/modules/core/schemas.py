from typing import Optional, Any
from pydantic import BaseModel, EmailStr, ConfigDict, field_validator
from beanie import PydanticObjectId

from app.modules.core.models import UserRole

class UserBase(BaseModel):
    email: Optional[EmailStr] = None
    is_active: Optional[bool] = True
    full_name: Optional[str] = None
    role: Optional[UserRole] = UserRole.USER

class UserCreate(UserBase):
    email: EmailStr
    password: str

class UserUpdate(UserBase):
    password: Optional[str] = None

class UserInDBBase(UserBase):
    id: Optional[str] = None
    organization_id: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)

    @field_validator("id", "organization_id", mode="before")
    @classmethod
    def convert_object_id(cls, v: Any) -> Any:
        if isinstance(v, PydanticObjectId):
            return str(v)
        return v

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

