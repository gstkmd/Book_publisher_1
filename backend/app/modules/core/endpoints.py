from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.core.models import User, Organization, InviteToken, OrganizationMember
from beanie import PydanticObjectId
from app.api.deps import get_current_user
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.security import get_password_hash
import uuid
from datetime import datetime, timezone, timedelta
from app.modules.core.crypto import encrypt_value

router = APIRouter()

class InviteRequest(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    password: Optional[str] = None
    role: Optional[str] = "user"

class CreateOrgRequest(BaseModel):
    name: str
    slug: str

class InviteLinkRequest(BaseModel):
    email: EmailStr
    role: Optional[str] = "user"

class JoinRequest(BaseModel):
    token: str
    full_name: str
    password: str

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
    
    current_user.organization_id = str(org.id)
    current_user.role = "admin" # First user becomes admin
    await current_user.save()
    
    # Create OrganizationMember for creator
    org_member = OrganizationMember(
        organization_id=str(org.id),
        user_id=str(current_user.id),
        role="admin",
        status="active"
    )
    await org_member.create()
    
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
    if current_user.role not in ["admin", "super_admin"]: # Simple RBAC check
        raise HTTPException(status_code=403, detail="Only admins can update organization settings")

    if not current_user.organization_id:
        raise HTTPException(status_code=404, detail="User not part of any organization")

    org = await Organization.get(current_user.organization_id)
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Allow partial updates
    if "name" in update_data:
        org.name = update_data["name"]
    if "slug" in update_data and update_data["slug"] != org.slug:
        new_slug = update_data["slug"]
        # Check uniqueness
        existing = await Organization.find_one(Organization.slug == new_slug)
        if existing and str(existing.id) != str(org.id):
            raise HTTPException(status_code=400, detail="Organization slug already taken")
        org.slug = new_slug
    if "content_settings" in update_data:
        org.content_settings = update_data["content_settings"]
    if "role_permissions" in update_data:
        org.role_permissions = update_data["role_permissions"]
    
    # Website Categorization
    if "threat_domains" in update_data:
        org.threat_domains = update_data["threat_domains"]
    if "productive_domains" in update_data:
        org.productive_domains = update_data["productive_domains"]
    
    # Update Copyleaks Credentials
    if "copyleaks_email" in update_data:
        org.copyleaks_email = update_data["copyleaks_email"]
    if "copyleaks_api_key" in update_data and update_data["copyleaks_api_key"]:
        # Encrypt the plain text key before saving
        org.copyleaks_api_key_encrypted = encrypt_value(update_data["copyleaks_api_key"])
    
    await org.save()
    return org

# ─── TEAM INVITATION & MEMBERSHIP ENDPOINTS ───────────────────────────────────

@router.post("/{organization_id}/invite")
async def invite_member(
    organization_id: str,
    req: InviteLinkRequest,
    current_user: User = Depends(get_current_user)
):
    """Admin invites a user by email, returns an invite link."""
    if current_user.organization_id != organization_id:
        raise HTTPException(status_code=403, detail="Not authorized for this organization")
    if current_user.role not in ["admin", "owner", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can invite members")

    email_lower = req.email.lower()

    # Check if user is already a member
    existing_user = await User.find_one(User.email == email_lower)
    if existing_user:
        existing_member = await OrganizationMember.find_one(
            OrganizationMember.organization_id == organization_id,
            OrganizationMember.user_id == str(existing_user.id)
        )
        if existing_member and existing_member.status == "active":
            raise HTTPException(status_code=400, detail="User is already an active member")

    # Invalidate old pending invites for this email + org
    old_invites = await InviteToken.find(
        InviteToken.email == email_lower,
        InviteToken.organization_id == organization_id,
        InviteToken.status == "pending"
    ).to_list()
    for inv in old_invites:
        inv.status = "revoked"
        await inv.save()

    token = str(uuid.uuid4())
    invite = InviteToken(
        token=token,
        email=email_lower,
        role=req.role or "user",
        organization_id=organization_id,
        status="pending",
        invited_by=str(current_user.id),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=48)
    )
    await invite.create()
    
    # Return the token or full constructed link (frontend usually constructs it, but we return token here)
    return {"token": token, "message": "Invitation created successfully"}


@router.get("/invitations/{token}")
async def validate_invite_token(token: str):
    """Public endpoint — validates token and returns org name, email, role for the join page."""
    invite = await InviteToken.find_one(InviteToken.token == token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite link is invalid or does not exist")
    if invite.status == "revoked":
        raise HTTPException(status_code=400, detail="This invite link has been revoked")
    if invite.status == "accepted":
        raise HTTPException(status_code=400, detail="This invite link has already been accepted")
    if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        invite.status = "expired"
        await invite.save()
        raise HTTPException(status_code=400, detail="This invite link has expired")

    org = await Organization.get(PydanticObjectId(invite.organization_id))
    org_name = org.name if org else "Unknown Organization"

    # Check if user already exists
    user_exists = await User.find_one(User.email == invite.email) is not None

    return {
        "email": invite.email,
        "role": invite.role,
        "org_name": org_name,
        "status": invite.status,
        "user_exists": user_exists
    }


@router.post("/invitations/{token}/accept")
async def accept_invitation(
    token: str,
    current_user: User = Depends(get_current_user)
):
    """Authenticated endpoint — accepts the invite and links user to org."""
    invite = await InviteToken.find_one(InviteToken.token == token)
    if not invite:
        raise HTTPException(status_code=404, detail="Invite link is invalid")
    
    if invite.status != "pending":
        raise HTTPException(status_code=400, detail=f"Invite is already {invite.status}")
        
    if invite.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        invite.status = "expired"
        await invite.save()
        raise HTTPException(status_code=400, detail="This invite link has expired")

    if current_user.email != invite.email:
        raise HTTPException(status_code=400, detail="Logged-in user email does not match invited email")

    # Prevent duplicate active memberships
    existing_member = await OrganizationMember.find_one(
        OrganizationMember.organization_id == invite.organization_id,
        OrganizationMember.user_id == str(current_user.id)
    )
    if existing_member and existing_member.status == "active":
        invite.status = "accepted"
        await invite.save()
        return {"message": "You are already an active member of this organization"}
    
    # Create or update membership
    if existing_member:
        existing_member.status = "active"
        existing_member.role = invite.role
        await existing_member.save()
    else:
        new_member = OrganizationMember(
            organization_id=invite.organization_id,
            user_id=str(current_user.id),
            role=invite.role,
            status="active",
            invited_by=invite.invited_by
        )
        await new_member.create()

    # Switch user context to this org so they can actually see the invited workspace
    current_user.organization_id = invite.organization_id
    current_user.role = invite.role
    await current_user.save()

    invite.status = "accepted"
    invite.accepted_by_user_id = str(current_user.id)
    invite.accepted_at = datetime.now(timezone.utc)
    # keep used for backward compat
    invite.used = True 
    await invite.save()

    org = await Organization.get(PydanticObjectId(invite.organization_id))
    return {
        "message": "Successfully joined organization", 
        "organization_id": invite.organization_id,
        "org_name": org.name if org else ""
    }


@router.get("/{organization_id}/members")
async def get_organization_members(
    organization_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.organization_id != organization_id:
        raise HTTPException(status_code=403, detail="Not authorized for this organization")
    
    # Ideally should join OrganizationMember with User
    memberships = await OrganizationMember.find(OrganizationMember.organization_id == organization_id).to_list()
    user_ids = [PydanticObjectId(m.user_id) for m in memberships]
    
    users = await User.find({"_id": {"$in": user_ids}}).to_list()
    
    # Attach role and specific membership info
    result = []
    for u in users:
        u_dict = u.model_dump(by_alias=True)
        u_dict["_id"] = str(u.id) # Force string serialization for PydanticObjectId, frontend expects _id
        u_dict["id"] = str(u.id) # Add id for older components
        m = next((mb for mb in memberships if mb.user_id == str(u.id)), None)
        if m:
            u_dict["organization_role"] = m.role
            u_dict["membership_status"] = m.status
            u_dict["joined_at"] = m.joined_at
        result.append(u_dict)
        
    return result

@router.get("/{organization_id}/invitations")
async def get_organization_invitations(
    organization_id: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.organization_id != organization_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if current_user.role not in ["admin", "owner", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can view invitations")

    invites = await InviteToken.find(InviteToken.organization_id == organization_id).to_list()
    return invites

@router.post("/invitations/{invitation_id}/revoke")
async def revoke_invitation(
    invitation_id: str,
    current_user: User = Depends(get_current_user)
):
    invite = await InviteToken.get(PydanticObjectId(invitation_id))
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation not found")
        
    if current_user.organization_id != invite.organization_id or current_user.role not in ["admin", "owner", "super_admin"]:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this invitation")

    if invite.status != "pending":
        raise HTTPException(status_code=400, detail=f"Cannot revoke {invite.status} invitation")

    invite.status = "revoked"
    await invite.save()
    return {"message": "Invitation revoked successfully"}

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

@router.patch("/members/{user_id}/status")
async def update_member_status(
    user_id: PydanticObjectId,
    is_active: bool,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can manage members")

    user = await User.get(user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Member not found in your organization")

    user.is_active = is_active
    await user.save()
    return {"message": f"User status updated to {'active' if is_active else 'inactive'}"}

@router.patch("/members/{user_id}/role")
async def update_member_role(
    user_id: PydanticObjectId,
    role: str,
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "super_admin"]:
        raise HTTPException(status_code=403, detail="Only admins can manage members")

    user = await User.get(user_id)
    if not user or user.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Member not found in your organization")

    # Validate role - simplified check
    from app.modules.core.models import UserRole
    try:
        user.role = UserRole(role)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    await user.save()

    # Also update the OrganizationMember record to keep them in sync
    member = await OrganizationMember.find_one(
        OrganizationMember.organization_id == current_user.organization_id,
        OrganizationMember.user_id == str(user_id)
    )
    if member:
        member.role = role
        await member.save()

    return {"message": f"User role updated to {role}"}

