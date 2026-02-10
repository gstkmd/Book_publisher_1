from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core import security
from app.api import deps
from app.core.config import settings
from app.modules.core.models import User
from app.modules.core.schemas import UserCreate, User as UserSchema

router = APIRouter()

@router.post("/access-token", response_model=dict)
async def login_access_token(form_data: OAuth2PasswordRequestForm = Depends()) -> Any:
    """
    OAuth2 compatible token login, get an access token for future requests.
    """
    user = await User.find_one(User.email == form_data.username)
    
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(user.id, expires_delta=access_token_expires),
        "token_type": "bearer",
    }

@router.post("/test-token", response_model=UserSchema)
async def test_token(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token.
    """
    return current_user
