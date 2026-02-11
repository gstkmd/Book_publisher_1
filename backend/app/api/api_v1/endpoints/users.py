from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic.networks import EmailStr
from app.api import deps
from app.core import security
from app.core.config import settings
from app.modules.core.models import User
from app.modules.core.schemas import UserCreate, User as UserSchema, UserUpdate

router = APIRouter()

@router.get("/me", response_model=UserSchema)
def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    """
    Get current user.
    """
    return UserSchema(
        id=str(current_user.id),
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        is_active=current_user.is_active
    )

@router.post("/", response_model=UserSchema)
async def create_user(
    *,
    user_in: UserCreate,
) -> Any:
    """
    Create new user.
    """
    # Normalize email to lowercase for case-insensitive lookups
    email_lower = user_in.email.lower()
    user = await User.find_one(User.email == email_lower)
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    
    user = User(
        email=email_lower,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=True,
    )
    await user.create()
    
    # Convert to dict to ensure proper serialization of ObjectId
    return UserSchema(
        id=str(user.id),
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        is_active=user.is_active
    )
