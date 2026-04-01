from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.modules.core.models import User
from app.api.deps import get_current_user
from app.modules.generic.monitoring_models import MonitoringActivity, MonitoringScreenshot
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timezone
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

@router.post("/activity")
async def submit_activity(
    req: ActivitySubmitRequest,
    current_user: User = Depends(get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not part of an organization")

    activities = []
    print(f"DEBUG: [Activity] User: {current_user.email}, Org: {current_user.organization_id}, Role: {current_user.role}, Logs: {len(req.logs)}")
    
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
    if current_user.role != "admin": # Only admins/managers see others
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
    agent_id: Optional[str] = Form(None), # Add optional agent_id
    agentId: Optional[str] = Form(None), # Add agentId alias for compatibility
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
    
    # Ensure directory exists
    os.makedirs("storage/screenshots", exist_ok=True)
    abs_dir = os.path.abspath("storage/screenshots")
    print(f"DEBUG: [Screenshot] Absolute storage dir: {abs_dir}")
    
    # Generate unique filename
    extension = file.filename.split(".")[-1] if "." in file.filename else "png"
    # Use descriptive filename from agent with a short unique suffix
    base_name = file.filename.split(".")[0]
    filename = f"{base_name}_{uuid.uuid4().hex[:6]}.{extension}"
    filepath = f"storage/screenshots/{filename}"
    abs_file = os.path.abspath(filepath)
    print(f"DEBUG: [Screenshot] Saving file to: {abs_file}")
    
    # Ensure storage directory exists at project root if not found locally
    os.makedirs("storage/screenshots", exist_ok=True)
    
    # Save file to disk
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = filepath # Store local path for internal use

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
        agent_id=target_agent_id, # Use target_agent_id which captures both aliases
        timestamp=ts,
        file_url=file_url,
        app_name=app_name,
        window_title=window_title
    )
    await screenshot.create()
    print(f"DEBUG: [Screenshot] Created document for {current_user.email} (Org: {current_user.organization_id})")
    print(f"DEBUG: [Screenshot] Path: {file_url}, TS: {ts}, Agent: {target_agent_id}")
    return {"status": "success", "file_url": file_url}
