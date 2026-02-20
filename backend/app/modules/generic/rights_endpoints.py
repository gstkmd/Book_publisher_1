from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.modules.generic.rights_models import License, Contract
from app.modules.core.models import User
from app.api.deps import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/licenses", response_model=List[License])
async def read_licenses(current_user: User = Depends(get_current_user)):
    licenses = await License.find(License.organization_id == current_user.organization_id).to_list()
    
    # Auto-tag expiring soon licenses (within 30 days)
    now = datetime.now(timezone.utc)
    for license in licenses:
        if license.status == "active":
            days_left = (license.end_date - now).days
            if days_left < 0:
                license.status = "expired"
            elif days_left <= 30:
                license.status = "expiring_soon"
    
    return licenses

@router.post("/licenses", response_model=License)
async def create_license(license: License, current_user: User = Depends(get_current_user)):
    license.organization_id = current_user.organization_id
    await license.create()
    return license

@router.get("/contracts", response_model=List[Contract])
async def read_contracts(current_user: User = Depends(get_current_user)):
    return await Contract.find(Contract.organization_id == current_user.organization_id).to_list()

@router.post("/contracts", response_model=Contract)
async def create_contract(contract: Contract, current_user: User = Depends(get_current_user)):
    contract.organization_id = current_user.organization_id
    await contract.create()
    return contract

@router.get("/royalties/{contract_id}")
async def calculate_royalties(contract_id: str, current_user: User = Depends(get_current_user)):
    contract = await Contract.get(contract_id)
    if not contract or contract.organization_id != current_user.organization_id:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Mock data for demonstration - in prod this queries sales records
    mock_units_sold = 15000 
    
    total_royalties = 0
    units_left = mock_units_sold
    last_threshold = 0
    
    # Calculation handles tiered royalties defined in the contract
    sorted_tiers = sorted(contract.tiers, key=lambda x: x.threshold)
    
    if not sorted_tiers:
        total_royalties = mock_units_sold * contract.royalty_rate
    else:
        for tier in sorted_tiers:
            if units_left <= 0:
                break
            tier_capacity = tier.threshold - last_threshold
            units_in_tier = min(units_left, tier_capacity)
            total_royalties += units_in_tier * tier.rate
            units_left -= units_in_tier
            last_threshold = tier.threshold
        
        if units_left > 0:
            final_rate = sorted_tiers[-1].rate
            total_royalties += units_left * final_rate
    
    return {
        "contract_id": contract_id,
        "units_sold": mock_units_sold,
        "total_royalties": round(total_royalties, 2),
        "currency": "USD",
        "method": "Tiered" if sorted_tiers else "Flat"
    }
