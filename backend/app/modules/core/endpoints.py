from fastapi import APIRouter, Depends, HTTPException
from app.modules.core.models import User, Organization
from app.api.deps import get_current_user
from typing import List

router = APIRouter()

@router.get("/me", response_model=Organization)
async def get_my_organization(current_user: User = Depends(get_current_user)):
    if not current_user.organization_id:
        # Return None - frontend should handle this gracefully
        return None
    
    org = await Organization.get(current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return org

@router.put("/me", response_model=Organization)
async def update_organization(
    update_data: dict, 
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin": # Simple RBAC check
        raise HTTPException(status_code=403, detail="Only admins can update organization settings")

    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not part of any organization")

    org = await Organization.get(current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Allow partial updates
    if "name" in update_data:
        org.name = update_data["name"]
    if "slug" in update_data:
        org.slug = update_data["slug"]
    
    await org.save()
    return org

@router.get("/members", response_model=List[User])
async def get_organization_members(current_user: User = Depends(get_current_user)):
    if not current_user.organization_id:
        # Return empty list for users without organization
        return []
    
    members = await User.find(User.organization_id == current_user.organization_id).to_list()
    return members

@router.get("/stats")
async def get_organization_stats(current_user: User = Depends(get_current_user)):
    # Return default stats if user is not part of an organization yet
    if not current_user.organization_id:
        return {
            "members": 1,  # Just the current user
            "content_items": 0,
            "storage_used_mb": 0,
            "plan_limit_mb": 1024  # 1GB free tier
        }

    # 1. Member Count
    member_count = await User.find(User.organization_id == current_user.organization_id).count()

    # 2. Content Count
    # Need to import generic models inside function to avoid circular imports if any
    from app.modules.generic.models import Content
    content_count = await Content.find(Content.organization_id == current_user.organization_id).count()

    # 3. Storage Usage (Mock for now, or sum content size if we tracked it)
    # in a real app, we'd query S3 or a 'File' model
    storage_used_mb = 120.5 # Mock

    return {
        "members": member_count,
        "content_items": content_count,
        "storage_used_mb": storage_used_mb,
        "plan_limit_mb": 1024 # 1GB free tier
    }

