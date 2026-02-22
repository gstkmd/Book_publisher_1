from typing import Optional
from pydantic import BaseModel, EmailStr, ConfigDict

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

class User(UserInDBBase):
    pass

class UserInDB(UserInDBBase):
    hashed_password: str

