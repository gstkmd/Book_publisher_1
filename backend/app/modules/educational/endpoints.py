from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from typing import List
import json
from app.api.deps import get_current_user, get_current_active_superuser
from app.modules.core.models import User
from app.modules.educational.models import Standard, Assessment, LessonPlan
from app.modules.educational.services import standards_service, lesson_plan_service
from app.modules.generic.models import Content

router = APIRouter()

@router.post("/lesson-plans/generate", response_model=LessonPlan)
async def generate_lesson_plan(
    content_id: str, 
    standard_id: str,
    current_user: User = Depends(get_current_user)
):
    content = await Content.get(content_id)
    standard = await Standard.get(standard_id)
    if not content or not standard:
        raise HTTPException(status_code=404, detail="Content or Standard not found")
    
    plan = await lesson_plan_service.generate_plan(content, standard)
    plan.organization_id = current_user.organization_id
    await plan.save()
    return plan

@router.get("/standards", response_model=List[Standard])
async def read_standards(
    q: str = None,
    current_user: User = Depends(get_current_user)
):
    # Filter by org or show global if approved by user, but let's stick to org for now as requested
    base_query = Standard.find(Standard.organization_id == current_user.organization_id)
    if q:
        # Note: standards_service search might need update for org filtering
        return await base_query.find(Standard.description == {"$regex": q, "$options": "i"}).to_list()
    return await base_query.to_list()

@router.post("/standards", response_model=Standard)
async def create_standard(
    standard: Standard,
    current_user: User = Depends(get_current_user)
):
    standard.organization_id = current_user.organization_id
    await standard.create()
    return standard

@router.post("/standards/upload")
async def upload_standards(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Upload a JSON file containing standards.
    """
    contents = await file.read()
    try:
        data = json.loads(contents)
        if not isinstance(data, list):
             raise HTTPException(status_code=400, detail="JSON must be a list of standards")
        
        # Inject org_id before ingestion or modify service
        for item in data:
            item["organization_id"] = current_user.organization_id
            
        created = await standards_service.ingest_standards_json(data)
        return {"message": f"Successfully ingested {len(created)} standards"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

@router.get("/assessments", response_model=List[Assessment])
async def read_assessments(current_user: User = Depends(get_current_user)):
    return await Assessment.find(Assessment.organization_id == current_user.organization_id).to_list()

@router.post("/assessments", response_model=Assessment)
async def create_assessment(
    assessment: Assessment,
    current_user: User = Depends(get_current_user)
):
    assessment.organization_id = current_user.organization_id
    await assessment.create()
    return assessment

@router.post("/migrate-orphans")
async def migrate_orphans(current_user: User = Depends(get_current_active_superuser)):
    """
    Check for orphaned educational records and assign to current org.
    """
    total = 0
    # Standards
    orphans = await Standard.find(Standard.organization_id == None).to_list()
    for o in orphans:
        o.organization_id = current_user.organization_id
        await o.save()
        total += 1
    
    # Assessments
    orphans = await Assessment.find(Assessment.organization_id == None).to_list()
    for o in orphans:
        o.organization_id = current_user.organization_id
        await o.save()
        total += 1

    # Lesson Plans
    orphans = await LessonPlan.find(LessonPlan.organization_id == None).to_list()
    for o in orphans:
        o.organization_id = current_user.organization_id
        await o.save()
        total += 1
        
    return {"message": f"Successfully migrated {total} educational items to {current_user.organization_id}"}
