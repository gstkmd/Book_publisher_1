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
    
    # Extract plain text from the content body
    text_to_check = ""
    body = content.body
    
    if isinstance(body, str):
        # Strip HTML tags
        import re
        text_to_check = re.sub('<[^<]+?>', '', body)
    elif isinstance(body, dict):
        # Try to extract text from common rich-text structures (Tiptap/Prosemirror)
        def extract_recursive(node):
            if not node: return ""
            if isinstance(node, str): return node
            if isinstance(node, dict):
                if node.get("type") == "text": return node.get("text", "")
                content_list = node.get("content", [])
                if isinstance(content_list, list):
                    return " ".join([extract_recursive(child) for child in content_list])
            return ""
        text_to_check = extract_recursive(body)
    else:
        text_to_check = str(body)
    
    report = await integrity_provider.generate_report(
        text=text_to_check,
        organization_id=current_user.organization_id,
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
        organization_id=current_user.organization_id,
        check_ai=req.check_ai,
        check_copyright=req.check_copyright
    )
    
    return report

@router.get("/verify/credits")
async def get_copyleaks_credits(
    current_user: User = Depends(get_current_user)
):
    """
    Get the remaining Copyleaks credit balance for the organization.
    Only allows users in an organization to check their own organization's balance.
    """
    if not current_user.organization_id:
        raise HTTPException(status_code=400, detail="User is not part of an organization")
        
    balance = await integrity_provider.get_credits_balance(current_user.organization_id)
    return balance
