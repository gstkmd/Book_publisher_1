from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError
from beanie import PydanticObjectId
from app.core import security
from app.core.config import settings
from app.modules.core.models import User, UserRole

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/access-token")

async def get_current_user(token: str = Depends(reusable_oauth2)) -> User:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[security.ALGORITHM])
        token_data = payload.get("sub")
        if token_data is None:
             raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    except (jwt.JWTError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    try:
        user_id = PydanticObjectId(token_data)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    user = await User.get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")

    # Subscription / Trial Check
    if user.organization_id and user.role != UserRole.SUPER_ADMIN:
        from app.modules.core.models import Organization
        org = await Organization.get(PydanticObjectId(user.organization_id))
        if org:
            if org.subscription_status == "trialing":
                if not org.trial_ends_at:
                    # Initialize trial end date if not set (10 days from creation or now)
                    from datetime import datetime, timezone, timedelta
                    org.trial_ends_at = org.created_at + timedelta(days=10)
                    await org.save()
                
                from datetime import datetime, timezone
                trial_end = org.trial_ends_at
                if trial_end.tzinfo is None:
                    trial_end = trial_end.replace(tzinfo=timezone.utc)
                
                if datetime.now(timezone.utc) > trial_end:
                    raise HTTPException(
                        status_code=status.HTTP_402_PAYMENT_REQUIRED,
                        detail="Your 10-day trial has expired. Please subscribe to a plan to continue."
                    )
            elif org.subscription_status == "canceled" or org.subscription_status == "past_due":
                raise HTTPException(
                    status_code=status.HTTP_402_PAYMENT_REQUIRED,
                    detail="Your subscription is inactive. Please update your billing details."
                )

    return user

async def get_current_active_superuser(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=400, detail="The user doesn't have enough privileges"
        )
    return current_user

async def get_current_super_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=403, detail="Not authorized. Super Admin privileges required."
        )
    return current_user
