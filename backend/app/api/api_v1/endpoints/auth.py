from datetime import timedelta
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.core.rate_limit import RateLimiter

from app.core import security
from app.api import deps
from app.core.config import settings
from app.modules.core.models import User
from app.modules.core.schemas import UserCreate, User as UserSchema
from app.modules.core import schemas
from app.core.gmail_service import gmail_service

router = APIRouter()


@router.post("/password-recovery/{email}", response_model=schemas.Msg)
async def recover_password(email: str) -> Any:
    """
    Password recovery
    """
    user = await User.find_one(User.email == email.lower())

    if not user:
        # Do not reveal whether user exists
        return {"msg": "Password recovery email sent"}

    password_reset_token = security.generate_password_reset_token(email=email.lower())

    await gmail_service.send_password_reset_email(
        email=user.email,
        token=password_reset_token,
        host=settings.FRONTEND_HOST
    )

    return {"msg": "Password recovery email sent"}


@router.post("/reset-password/", response_model=schemas.Msg)
async def reset_password(body: schemas.PasswordReset) -> Any:
    """
    Reset password
    """
    email = security.verify_password_reset_token(body.token)

    if not email:
        raise HTTPException(status_code=400, detail="Invalid token")

    user = await User.find_one(User.email == email)

    if not user:
        raise HTTPException(
            status_code=404,
            detail="The user with this email does not exist",
        )
    elif not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    user.hashed_password = security.get_password_hash(body.new_password)
    await user.save()

    return {"msg": "Password updated successfully"}


@router.post("/access-token", response_model=dict, dependencies=[Depends(RateLimiter(requests=5, window=60))])
async def login_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
) -> Any:
    """
    OAuth2 compatible login (username = email)
    """
    # Case-insensitive email lookup
    user = await User.find_one(User.email == form_data.username.lower())

    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    return {
        "access_token": security.create_access_token(
            str(user.id),
            expires_delta=access_token_expires,
        ),
        "token_type": "bearer",
    }


@router.post("/test-token", response_model=UserSchema)
async def test_token(current_user: User = Depends(deps.get_current_user)) -> Any:
    """
    Test access token
    """
    return current_user
