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
    file_path: Optional[str] = None
    activity_type: str
    idle_duration: int = 0

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
    for log in req.logs:
        ts = log.timestamp
        if ts.tzinfo is None:
            ts = ts.replace(tzinfo=timezone.utc)
            
        activities.append(MonitoringActivity(
            user=current_user,
            organization_id=current_user.organization_id,
            **{**log.dict(), "timestamp": ts}
        ))
    await MonitoringActivity.insert_many(activities)
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

@router.post("/screenshot")
async def upload_screenshot(
    app_name: str = Form(...),
    window_title: str = Form(...),
    timestamp: datetime = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User not part of an organization")

    # Ensure directory exists
    os.makedirs("storage/screenshots", exist_ok=True)
    
    # Generate unique filename
    file_id = str(uuid.uuid4())
    file_extension = os.path.splitext(file.filename)[1] or ".png"
    filename = f"{file_id}{file_extension}"
    filepath = f"storage/screenshots/{filename}"
    
    # Save file to disk
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    file_url = filepath # Store local path for internal use

    ts = timestamp
    if ts.tzinfo is None:
        ts = ts.replace(tzinfo=timezone.utc)

    screenshot = MonitoringScreenshot(
        user=current_user,
        organization_id=current_user.organization_id,
        timestamp=ts,
        file_url=file_url,
        app_name=app_name,
        window_title=window_title
    )
    await screenshot.create()
    return {"status": "success", "file_url": file_url}
