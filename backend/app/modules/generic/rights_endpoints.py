from fastapi import APIRouter, Depends, HTTPException
from typing import List
from app.modules.generic.rights_models import License, Contract
from app.modules.core.models import User
from app.api.deps import get_current_user
from datetime import datetime

router = APIRouter()

@router.get("/licenses", response_model=List[License])
async def read_licenses(current_user: User = Depends(get_current_user)):
    return await License.find(License.organization_id == current_user.organization_id).to_list()

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
    
    # Mock calculation based on sales data placeholder
    # In a real app, this would query a Sales/Orders collection
    mock_units_sold = 1500
    royalties = mock_units_sold * contract.royalty_rate
    
    return {
        "contract_id": contract_id,
        "units_sold": mock_units_sold,
        "total_royalties": royalties,
        "currency": "USD"
    }
