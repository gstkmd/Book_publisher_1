from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from beanie import PydanticObjectId
from app.api.deps import get_current_user
from app.modules.core.models import User
from app.modules.generic.models import Content
from app.modules.generic.integrity import integrity_provider, IntegrityReport

router = APIRouter()

class FullVerifyRequest(BaseModel):
    content_id: PydanticObjectId
    check_ai: bool = True
    check_copyright: bool = True

class PartialVerifyRequest(BaseModel):
    snippet: str
    check_ai: bool = True
    check_copyright: bool = True

@router.post("/verify/full", response_model=IntegrityReport)
async def verify_full_content(
    req: FullVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Verify the entire content item for AI and Copyright issues.
    """
    content = await Content.get(req.content_id)
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Ensure user belongs to the same organization
    if content.organization_id != current_user.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized to access this content")
    
    # Extract plain text from the content body (assuming Prosemirror-like JSON structure or raw text)
    # For now, we'll use a simplified extraction logic
    text_to_check = content.body
    if isinstance(text_to_check, dict):
        # Very simple JSON to text conversion - should be expanded based on actual schema
        import json
        text_to_check = json.dumps(text_to_check)
    
    report = await integrity_provider.generate_report(
        text=text_to_check,
        check_ai=req.check_ai,
        check_copyright=req.check_copyright
    )
    
    # Save to database
    content.latest_integrity_report = report.dict()
    await content.save()
    
    return report

@router.post("/verify/partial", response_model=IntegrityReport)
async def verify_partial_content(
    req: PartialVerifyRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Verify a specific text snippet for AI and Copyright issues.
    """
    if not req.snippet or len(req.snippet.strip()) < 10:
        raise HTTPException(status_code=400, detail="Snippet is too short for reliable analysis")
        
    report = await integrity_provider.generate_report(
        text=req.snippet,
        check_ai=req.check_ai,
        check_copyright=req.check_copyright
    )
    
    return report
