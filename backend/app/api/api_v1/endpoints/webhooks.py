from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.modules.core.models import WebhookSubscription, User
from app.api import deps

router = APIRouter()

@router.post("/subscriptions", response_model=WebhookSubscription)
async def create_subscription(
    sub: WebhookSubscription,
    current_user: User = Depends(deps.get_current_active_user)
):
    if not current_user.is_superuser and not current_user.organization_id:
         # Optionally allow org admins
        pass
    
    sub.organization_id = current_user.organization_id
    await sub.create()
    return sub

@router.get("/subscriptions", response_model=List[WebhookSubscription])
async def read_subscriptions(
    current_user: User = Depends(deps.get_current_active_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return await WebhookSubscription.find_all().to_list()

@router.delete("/subscriptions/{id}")
async def delete_subscription(
    id: str,
    current_user: User = Depends(deps.get_current_active_user)
):
    if not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Not enough permissions")
    
    sub = await WebhookSubscription.get(id)
    if not sub:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    await sub.delete()
    return {"message": "Subscription deleted"}
