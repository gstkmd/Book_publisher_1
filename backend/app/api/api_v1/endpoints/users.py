from typing import Any, List
from fastapi import APIRouter, Body, Depends, HTTPException
from fastapi.encoders import jsonable_encoder
from pydantic.networks import EmailStr
from app.api import deps
from app.core import security
from app.core.config import settings
from app.modules.core.models import User
from app.modules.core.schemas import UserCreate, User as UserSchema, UserUpdate
from app.modules.core.utils import normalize_role

router = APIRouter()

@router.get("/me", response_model=UserSchema, dependencies=[Depends(RateLimiter(requests=60, window=60))])
async def read_user_me(
    current_user: User = Depends(deps.get_current_user),
) -> Any:
    # Normalize role to prevent validation errors with dynamic roles
    user_data = current_user.model_dump()
    user_data["id"] = str(current_user.id)
    user_data["role"] = normalize_role(user_data.get("role", "user"))
    
    if user_data.get("organization_id"):
        user_data["organization_id"] = str(user_data["organization_id"])
        
    return user_data

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
