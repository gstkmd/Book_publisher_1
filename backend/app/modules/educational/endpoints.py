from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List
import json
from app.modules.educational.models import Standard, Assessment, LessonPlan
from app.modules.educational.services import standards_service, lesson_plan_service
from app.modules.generic.models import Content

router = APIRouter()

@router.post("/lesson-plans/generate", response_model=LessonPlan)
async def generate_lesson_plan(content_id: str, standard_id: str):
    content = await Content.get(content_id)
    standard = await Standard.get(standard_id)
    if not content or not standard:
        raise HTTPException(status_code=404, detail="Content or Standard not found")
    
    return await lesson_plan_service.generate_plan(content, standard)

@router.get("/standards", response_model=List[Standard])
async def read_standards(q: str = None):
    if q:
        return await standards_service.search_standards(q)
    return await Standard.find_all().to_list()

@router.post("/standards", response_model=Standard)
async def create_standard(standard: Standard):
    await standard.create()
    return standard

@router.post("/standards/upload")
async def upload_standards(file: UploadFile = File(...)):
    """
    Upload a JSON file containing standards.
    """
    contents = await file.read()
    try:
        data = json.loads(contents)
        if not isinstance(data, list):
             raise HTTPException(status_code=400, detail="JSON must be a list of standards")
        created = await standards_service.ingest_standards_json(data)
        return {"message": f"Successfully ingested {len(created)} standards"}
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON file")

@router.get("/assessments", response_model=List[Assessment])
async def read_assessments():
    return await Assessment.find_all().to_list()

@router.post("/assessments", response_model=Assessment)
async def create_assessment(assessment: Assessment):
    await assessment.create()
    return assessment
