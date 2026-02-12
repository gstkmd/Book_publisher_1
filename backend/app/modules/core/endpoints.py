from fastapi import APIRouter, Depends, HTTPException
from app.modules.core.models import User, Organization
from app.api.deps import get_current_user
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.security import get_password_hash

router = APIRouter()

class InviteRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "user"

class CreateOrgRequest(BaseModel):
    name: str
    slug: str

@router.post("/", response_model=Organization)
async def create_organization(
    org_in: CreateOrgRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.organization_id:
        raise HTTPException(status_code=400, detail="User already belongs to an organization")
    
    # Check slug uniqueness
    existing = await Organization.find_one(Organization.slug == org_in.slug)
    if existing:
        raise HTTPException(status_code=400, detail="Organization slug already exists")
    
    org = Organization(
        name=org_in.name,
        slug=org_in.slug,
        plan="free"
    )
    await org.create()
    
    current_user.organization_id = org.id
    current_user.role = "admin" # First user becomes admin
    await current_user.save()
    
    return org

@router.get("/me", response_model=Optional[Organization])
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
    await org.save()
    return org

@router.post("/invite")
async def invite_member(
    invite: InviteRequest,
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin": 
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="Create an organization first")

    # Check if user exists
    user_to_invite = await User.find_one(User.email == invite.email.lower())
    
    if user_to_invite:
        # Existing user logic
        if user_to_invite.organization_id:
            if user_to_invite.organization_id == current_user.organization_id:
                raise HTTPException(status_code=400, detail="User is already in this organization")
            else:
                raise HTTPException(status_code=400, detail="User is already in another organization")
        
        user_to_invite.organization_id = current_user.organization_id
        if invite.role:
            user_to_invite.role = invite.role
        await user_to_invite.save()
        return {"message": f"Added existing user {user_to_invite.email} to organization"}
    
    else:
        # Create NEW user (Manual Provisioning)
        if not invite.password:
             raise HTTPException(status_code=400, detail="Password is required to create a new user")
        
        new_user = User(
            email=invite.email.lower(),
            hashed_password=get_password_hash(invite.password),
            full_name=invite.full_name or invite.email.split('@')[0],
            organization_id=current_user.organization_id,
            role=invite.role or "user", 
            is_active=True
        )
        await new_user.create()
        return {"message": f"Created new user {new_user.email} and added to organization"}

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

