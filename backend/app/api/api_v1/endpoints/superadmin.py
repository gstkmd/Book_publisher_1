import os
import shutil
from typing import List, Optional, Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.core.models import User, Organization, UserRole, WebhookSubscription, InviteToken, OrganizationMember, GlobalSettings
from app.api.deps import get_current_super_admin
from pydantic import BaseModel
from app.core.security import get_password_hash, encrypt_string, decrypt_string
from app.modules.core import schemas
from beanie import PydanticObjectId
from datetime import datetime, timezone, timedelta
from app.modules.generic.monitoring_models import MonitoringActivity, MonitoringScreenshot, MonitoringAgent
from app.modules.generic.models import Content, ContentVersion, Comment, Task, TaskComment, ActivityLog, Notification
from app.modules.generic.rights_models import License, Contract
from app.modules.educational.models import Standard, Assessment, LessonPlan
from app.core.gmail_service import gmail_service

router = APIRouter()

# --- Global Settings / Email Configuration ---

@router.get("/email-settings", response_model=schemas.GlobalSettings)
async def get_email_settings(
    current_user: User = Depends(get_current_super_admin)
):
    settings = await GlobalSettings.find_one()
    if not settings:
        settings = GlobalSettings()
        await settings.insert()
    
    return schemas.GlobalSettings(
        smtp_server=settings.smtp_server,
        smtp_port=settings.smtp_port,
        smtp_user=settings.smtp_user,
        smtp_from_email=settings.smtp_from_email,
        smtp_use_tls=settings.smtp_use_tls,
        smtp_password_masked="••••••••" if settings.smtp_password_encrypted else None,
        updated_at=settings.updated_at
    )

@router.patch("/email-settings", response_model=schemas.GlobalSettings)
async def update_email_settings(
    update: schemas.GlobalSettingsUpdate,
    current_user: User = Depends(get_current_super_admin)
):
    try:
        print(f"[DEBUG] Updating email settings. User: {current_user.email}")
        settings = await GlobalSettings.find_one()
        if not settings:
            print("[DEBUG] No settings found, creating new GlobalSettings document.")
            settings = GlobalSettings()
            await settings.insert()
        
        if update.smtp_server is not None:
            settings.smtp_server = update.smtp_server
        if update.smtp_port is not None:
            settings.smtp_port = update.smtp_port
        if update.smtp_user is not None:
            settings.smtp_user = update.smtp_user
        if update.smtp_from_email is not None:
            settings.smtp_from_email = update.smtp_from_email
        if update.smtp_use_tls is not None:
            settings.smtp_use_tls = update.smtp_use_tls
        
        if update.smtp_password:
            print("[DEBUG] Encrypting new SMTP password.")
            try:
                settings.smtp_password_encrypted = encrypt_string(update.smtp_password)
            except Exception as enc_err:
                print(f"[ERROR] Encryption failed: {str(enc_err)}")
                raise HTTPException(status_code=500, detail=f"Encryption error: {str(enc_err)}")
        
        settings.updated_at = datetime.now(timezone.utc)
        settings.updated_by = str(current_user.id)
        
        print("[DEBUG] Saving settings to database...")
        await settings.save()
        print("[DEBUG] Save successful.")
        
        return schemas.GlobalSettings(
            smtp_server=settings.smtp_server,
            smtp_port=settings.smtp_port,
            smtp_user=settings.smtp_user,
            smtp_from_email=settings.smtp_from_email,
            smtp_use_tls=settings.smtp_use_tls,
            smtp_password_masked="••••••••" if settings.smtp_password_encrypted else None,
            updated_at=settings.updated_at
        )
    except Exception as e:
        print(f"[CRITICAL ERROR] Failed to update email settings: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/email-settings/test")
async def test_email_settings(
    current_user: User = Depends(get_current_super_admin)
):
    settings = await GlobalSettings.find_one()
    if not settings or not settings.smtp_server:
        raise HTTPException(status_code=400, detail="SMTP settings not fully configured")
    
    # Decrypt password for the test
    password = decrypt_string(settings.smtp_password_encrypted)
    
    try:
        success = await gmail_service.test_connection(
            server=settings.smtp_server,
            port=settings.smtp_port,
            user=settings.smtp_user,
            password=password,
            from_email=settings.smtp_from_email,
            use_tls=settings.smtp_use_tls,
            to_email=current_user.email
        )
        if success:
            return {"message": f"Test email sent successfully to {current_user.email}!"}
        else:
            raise HTTPException(status_code=500, detail="Failed to send test email. Check your SMTP settings.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Connection error: {str(e)}")

# --- End Global Settings ---

class OrgUpdate(BaseModel):
    name: Optional[str] = None
    plan: Optional[str] = None
    is_active: Optional[bool] = None
    monitoring_retention_days: Optional[int] = None
    screenshot_retention_days: Optional[int] = None
    sync_interval_seconds: Optional[int] = None
    enabled_modules: Optional[List[str]] = None
    hide_disabled_features: Optional[bool] = None

class ModuleUpdate(BaseModel):
    enabled_modules: List[str]

class UserResetPassword(BaseModel):
    new_password: str

def get_dir_size(path: str) -> int:
    """Calculate total size of a directory in bytes."""
    total_size = 0
    try:
        if not os.path.exists(path):
            return 0
        for dirpath, dirnames, filenames in os.walk(path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                # skip if it is symbolic link
                if not os.path.islink(fp):
                    total_size += os.path.getsize(fp)
    except Exception:
        pass
    return total_size

def format_size(size_bytes: int) -> str:
    """Format bytes into human readable format."""
    if size_bytes == 0: return "0 B"
    size_name = ("B", "KB", "MB", "GB", "TB")
    import math
    i = int(math.floor(math.log(size_bytes, 1024)))
    p = math.pow(1024, i)
    s = round(size_bytes / p, 2)
    return "%s %s" % (s, size_name[i])

@router.get("/stats")
async def get_platform_stats(
    current_user: User = Depends(get_current_super_admin)
):
    """Platform-wide statistics for the super admin dashboard."""
    total_orgs = await Organization.find_all().count()
    total_users = await User.find_all().count()
    
    # Calculate storage size - Screenshots are in storage/screenshots
    # On host, this is ./storage. Mapping in docker is /app/storage
    screenshot_size = get_dir_size("storage")
    
    return {
        "total_orgs": total_orgs,
        "total_users": total_users,
        "total_storage_bytes": screenshot_size,
        "total_storage_formatted": format_size(screenshot_size)
    }

@router.get("/organizations")
async def list_organizations(
    current_user: User = Depends(get_current_super_admin)
):
    """List all organizations with basic stats from cache."""
    orgs = await Organization.find_all().to_list()
    results = []
    for org in orgs:
        # Get member count (excluding super admins)
        member_count = await User.find(
            User.organization_id == str(org.id),
            User.role != UserRole.SUPER_ADMIN
        ).count()
        org_dict = org.model_dump()
        org_dict["id"] = str(org.id)
        org_dict["member_count"] = member_count
        
        # Ensure we return human readable sizes
        org_dict["db_storage_formatted"] = format_size(org.db_storage_bytes)
        org_dict["file_storage_formatted"] = format_size(org.file_storage_bytes)
        org_dict["total_storage_formatted"] = format_size(org.total_storage_bytes)
        
        results.append(org_dict)
    return results

@router.post("/usage/sync")
async def sync_usage_stats(
    current_user: User = Depends(get_current_super_admin)
):
    """Trigger a manual recalculation of all organization usage stats."""
    from app.core.scheduler import calculate_platform_usage
    # We run this in the background to avoid timeout
    from fastapi import BackgroundTasks
    bg_tasks = BackgroundTasks()
    bg_tasks.add_task(calculate_platform_usage)
    return {"message": "Usage calculation started in background."}

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

@router.post("/exit-context")
async def exit_organization_context(
    current_user: User = Depends(get_current_super_admin)
):
    """Clear the Super Admin's current organization context."""
    current_user.organization_id = None
    await current_user.save()
    return {"message": "Organization context cleared"}

@router.delete("/organizations/{org_id}")
async def delete_organization(
    org_id: str,
    current_user: User = Depends(get_current_super_admin)
):
    """Permanently delete an organization and ALL associated data."""
    org = await Organization.get(PydanticObjectId(org_id))
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    # 1. Collect all Content IDs to delete their versions
    content_list = await Content.find(Content.organization_id == org_id).to_list()
    content_ids = [c.id for c in content_list]
    
    # 2. Batch Purge for models with organization_id
    models_to_purge = [
        User, WebhookSubscription, InviteToken, OrganizationMember,
        MonitoringActivity, MonitoringScreenshot, MonitoringAgent,
        Content, Comment, Task, TaskComment, ActivityLog, Notification,
        License, Contract, Standard, Assessment, LessonPlan
    ]
    
    for model in models_to_purge:
        await model.find(model.organization_id == org_id).delete()
    
    # 3. Purge ContentVersions
    if content_ids:
        # Delete versions referencing these contents
        await ContentVersion.find({"content_id.$id": {"$in": content_ids}}).delete()

    # 4. Finally, delete the Org metadata itself
    await org.delete()
    
    return {"message": f"Organization {org.name} and all data have been purged."}
