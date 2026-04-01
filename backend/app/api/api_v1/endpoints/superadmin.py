from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.core.models import User, Organization, UserRole
from app.api.deps import get_current_super_admin
from pydantic import BaseModel
from app.core.security import get_password_hash
from beanie import PydanticObjectId
from datetime import datetime, timezone, timedelta
from app.modules.generic.monitoring_models import MonitoringActivity, MonitoringScreenshot

router = APIRouter()

class OrgUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    monitoring_retention_days: Optional[int] = None
    screenshot_retention_days: Optional[int] = None
    sync_interval_seconds: Optional[int] = None

class ModuleUpdate(BaseModel):
    enabled_modules: List[str]

class UserResetPassword(BaseModel):
    new_password: str

@router.get("/organizations")
async def list_organizations(
    current_user: User = Depends(get_current_super_admin)
):
    """List all organizations with basic stats."""
    orgs = await Organization.find_all().to_list()
    results = []
    for org in orgs:
        # Get member count
        member_count = await User.find(User.organization_id == str(org.id)).count()
        org_dict = org.model_dump()
        org_dict["id"] = str(org.id)
        org_dict["member_count"] = member_count
        results.append(org_dict)
    return results

@router.patch("/organizations/{org_id}")
async def update_organization(
    org_id: str,
    update: OrgUpdate,
    current_user: User = Depends(get_current_super_admin)
):
    org = await Organization.get(PydanticObjectId(org_id))
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    update_data = update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(org, field, value)
    
    await org.save()
    return org

@router.patch("/organizations/{org_id}/modules")
async def update_org_modules(
    org_id: str,
    update: ModuleUpdate,
    current_user: User = Depends(get_current_super_admin)
):
    org = await Organization.get(PydanticObjectId(org_id))
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    org.enabled_modules = update.enabled_modules
    await org.save()
    return org

@router.get("/users")
async def list_all_users(
    email: Optional[str] = None,
    current_user: User = Depends(get_current_super_admin)
):
    """Search users across all organizations."""
    query = {}
    if email:
        query["email"] = {"$regex": email, "$options": "i"}
    
    users = await User.find(query).limit(100).to_list()
    return users

@router.post("/users/{user_id}/reset-password")
async def admin_reset_password(
    user_id: str,
    req: UserResetPassword,
    current_user: User = Depends(get_current_super_admin)
):
    user = await User.get(PydanticObjectId(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = get_password_hash(req.new_password)
    await user.save()
    return {"message": f"Password for user {user.email} has been reset."}

@router.delete("/data/cleanup")
async def trigger_cleanup(
    current_user: User = Depends(get_current_super_admin)
):
    """Clean up old records based on each organization's retention policy."""
    orgs = await Organization.find_all().to_list()
    total_activities_deleted = 0
    total_screenshots_deleted = 0
    
    for org in orgs:
        org_id = str(org.id)
        
        # 1. Cleanup Activities
        activity_deadline = datetime.now(timezone.utc) - timedelta(days=org.monitoring_retention_days)
        deleted_act = await MonitoringActivity.find(
            MonitoringActivity.organization_id == org_id,
            MonitoringActivity.timestamp < activity_deadline
        ).delete()
        total_activities_deleted += deleted_act.deleted_count
        
        # 2. Cleanup Screenshots
        screenshot_deadline = datetime.now(timezone.utc) - timedelta(days=org.screenshot_retention_days)
        # Note: In a production app, we'd also delete the files from S3/Storage here.
        # For now, we delete the DB records.
        deleted_shot = await MonitoringScreenshot.find(
            MonitoringScreenshot.organization_id == org_id,
            MonitoringScreenshot.timestamp < screenshot_deadline
        ).delete()
        total_screenshots_deleted += deleted_shot.deleted_count

    return {
        "status": "Cleanup completed",
        "activities_deleted": total_activities_deleted,
        "screenshots_deleted": total_screenshots_deleted
    }

@router.post("/impersonate/{org_id}")
async def impersonate_organization(
    org_id: str,
    current_user: User = Depends(get_current_super_admin)
):
    """Switch the Super Admin's current organization context."""
    org = await Organization.get(PydanticObjectId(org_id))
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    current_user.organization_id = org_id
    await current_user.save()
    
    return {"message": f"Successfully switched context to {org.name}", "org_id": org_id, "org_name": org.name}
