from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.modules.core.models import User, Organization
from beanie import PydanticObjectId
from app.api.deps import get_current_user
from app.modules.generic.monitoring_models import MonitoringActivity, MonitoringScreenshot
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
from bson import ObjectId, DBRef
from app.modules.generic.models import Content, Task
import os
import shutil
import uuid

router = APIRouter()

class ActivityLog(BaseModel):
    timestamp: datetime
    app_name: Optional[str] = None
    window_title: Optional[str] = None
    web_url: Optional[str] = None
    web_title: Optional[str] = None
    web_domain: Optional[str] = None
    web_category: Optional[str] = None
    file_path: Optional[str] = None
    file_name: Optional[str] = None
    file_extension: Optional[str] = None
    activity_type: str
    idle_duration: int = 0
    duration: int = 0
    keys_pressed: int = 0
    mouse_clicks: int = 0
    agent_id: Optional[str] = None

class ActivitySubmitRequest(BaseModel):
    logs: List[ActivityLog]
    agent_id: Optional[str] = None

@router.post("/activity")
async def submit_activity(
    req: ActivitySubmitRequest,
    current_user: User = Depends(get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not part of an organization")

    activities = []
    print(f"DEBUG: [Activity] User: {current_user.email}, UserId: {current_user.id}, OrgId: {current_user.organization_id}, Role: {current_user.role}, Logs: {len(req.logs)}, Root AgentId: {req.agent_id}")
    
    if len(req.logs) > 0:
        print(f"DEBUG: [Activity] First log sample: App: {req.logs[0].app_name}, Time: {req.logs[0].timestamp}")
    
    for log in req.logs:
        ts = log.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
            
        activities.append(MonitoringActivity(
            user=current_user,
            organization_id=current_user.organization_id,
            **{**log.dict(), "timestamp": ts}
        ))
    
    try:
        await MonitoringActivity.insert_many(activities)
        print(f"DEBUG: [Activity] Successfully inserted {len(activities)} logs for {current_user.email}")
    except Exception as e:
        print(f"DEBUG: [Activity] FAILED to insert logs for {current_user.email}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save activities: {e}")

    return {"status": "success", "count": len(activities)}

@router.get("/team-activity")
async def get_team_activity(
    current_user: User = Depends(get_current_user)
):
    if current_user.role not in ["admin", "super_admin"]: # Only admins/managers see others
        raise HTTPException(status_code=403, detail="Not authorized to view team activity")

    activities = await MonitoringActivity.find(
        MonitoringActivity.organization_id == current_user.organization_id,
        fetch_links=True
    ).sort(-MonitoringActivity.timestamp).limit(200).to_list()
    
    return activities

@router.post("/screenshots/upload")
async def upload_screenshot(
    app_name: str = Form(...),
    window_title: str = Form(...),
    timestamp: str = Form(...), # Change to str for flexible parsing
    file: UploadFile = File(...),
    agent_id: Optional[str] = Form(None),
    agentId: Optional[str] = Form(None),
    current_user: User = Depends(get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not part of an organization")

    # Handle agent tracking (matches monitoring.py style)
    target_agent_id = agent_id or agentId # Use whichever is provided
    
    # DIAGNOSTIC LOGGING
    print(f"DEBUG: [Screenshot] Incoming upload request:")
    print(f"DEBUG: [Screenshot] AgentID: {target_agent_id}")
    print(f"DEBUG: [Screenshot] App: {app_name}, Title: {window_title}")
    
    # Find correct storage directory (check if it's one level up)
    base_dir = "storage/screenshots"
    if not os.path.exists("storage") and os.path.exists("../storage"):
        base_dir = "../storage/screenshots"
    
    os.makedirs(base_dir, exist_ok=True)
    
    # Generate unique filename
    extension = file.filename.split(".")[-1] if "." in file.filename else "png"
    base_name = file.filename.split(".")[0]
    filename = f"{base_name}_{uuid.uuid4().hex[:6]}.{extension}"
    filepath = os.path.join(base_dir, filename)
    abs_file = os.path.abspath(filepath)
    print(f"DEBUG: [Screenshot] Saving file to: {abs_file}")
    
    # Save file to disk
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    # Store relative to PROJECT focus (always "storage/screenshots/...")
    file_url = f"storage/screenshots/{filename}"

    # Robust timestamp parsing to handle JS ISO strings (e.g., .000Z)
    try:
        ts = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
    except Exception:
        try:
            # Fallback if fromisoformat fails
            ts = datetime.strptime(timestamp, "%Y-%m-%dT%H:%M:%S.%fZ")
        except Exception:
            ts = datetime.now(timezone.utc)

    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    screenshot = MonitoringScreenshot(
        user=current_user,
        organization_id=current_user.organization_id,
        agent_id=target_agent_id,
        timestamp=ts,
        file_url=file_url,
        app_name=app_name,
        window_title=window_title
    )
    await screenshot.create()
    print(f"DEBUG: [Screenshot] Created document for {current_user.email} (Org: {current_user.organization_id})")
    print(f"DEBUG: [Screenshot] Path: {file_url}, TS: {ts}, Agent: {target_agent_id}")
    return {"status": "success", "file_url": file_url}

@router.get("/config")
async def get_agent_config(current_user: User = Depends(get_current_user)):
    """Fetch configuration for the monitoring agent (sync intervals, etc.)"""
    if not current_user.organization_id:
        return {"sync_interval_seconds": 300} # Default 5 mins
        
    org = await Organization.get(PydanticObjectId(current_user.organization_id))
    if not org:
        return {"sync_interval_seconds": 300}
        
    return {
        "sync_interval_seconds": org.sync_interval_seconds or 300,
        "enabled_modules": org.enabled_modules or [],
        "monitoring_retention_days": org.monitoring_retention_days or 30,
        "screenshot_retention_days": org.screenshot_retention_days or 7,
        "threat_domains": org.threat_domains or [],
        "productive_domains": org.productive_domains or []
    }
