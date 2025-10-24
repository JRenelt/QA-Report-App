"""
Company Management V2 - Komplett überarbeitet
- SysOp: Volle CRUD + Sperr-Funktionalität über alle Firmen
- Admin: Keine Berechtigung (nur eigene Firma sehen)
- QA-Tester: Keine Berechtigung
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from backend.auth import get_current_user
from backend.database import get_database
from backend.models_v2 import CompanyV2, CompanyCreateV2, CompanyUpdateV2
import uuid
from datetime import datetime

router = APIRouter(prefix="/api/companies-v2", tags=["companies-v2"])

@router.get("/", response_model=List[CompanyV2])
async def get_companies(current_user: dict = Depends(get_current_user)):
    """
    Get companies based on role:
    - SysOp: Alle Firmen
    - Admin: Nur eigene Firma
    - QA-Tester: Nur eigene Firma
    """
    db = await get_database()
    companies_collection = db["companies_v2"]
    
    if current_user["role"] == "sysop":
        # SysOp sieht ALLE Firmen
        companies = await companies_collection.find().to_list(length=None)
    else:
        # Admin & QA-Tester sehen nur eigene Firma
        companies = await companies_collection.find({
            "id": current_user["company_id"]
        }).to_list(length=None)
    
    for company in companies:
        company.pop("_id", None)
    
    return companies

@router.get("/{company_id}", response_model=CompanyV2)
async def get_company(company_id: str, current_user: dict = Depends(get_current_user)):
    """Get single company"""
    db = await get_database()
    companies_collection = db["companies_v2"]
    
    company = await companies_collection.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Firma nicht gefunden")
    
    # Permission Check
    if current_user["role"] != "sysop" and current_user["company_id"] != company_id:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    company.pop("_id", None)
    return company

@router.post("/", response_model=CompanyV2)
async def create_company(company_data: CompanyCreateV2, current_user: dict = Depends(get_current_user)):
    """
    Create new company (nur SysOp)
    """
    if current_user["role"] != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp kann Firmen anlegen")
    
    db = await get_database()
    companies_collection = db["companies_v2"]
    
    # Check if company name already exists
    existing = await companies_collection.find_one({"name": company_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Firma mit diesem Namen existiert bereits")
    
    # Generate short_code (erste 2 Buchstaben des Firmennamens)
    short_code = "".join([c for c in company_data.name if c.isalpha()])[:2].upper()
    
    # Check if short_code already exists
    existing_code = await companies_collection.find_one({"short_code": short_code})
    if existing_code:
        # Add number suffix
        counter = 1
        while existing_code:
            new_short_code = f"{short_code}{counter}"
            existing_code = await companies_collection.find_one({"short_code": new_short_code})
            counter += 1
        short_code = new_short_code
    
    new_company = {
        "id": str(uuid.uuid4()),
        **company_data.dict(),
        "short_code": short_code,
        "is_blocked": False,
        "is_deletable": True,
        "created_by": current_user["id"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await companies_collection.insert_one(new_company)
    
    new_company.pop("_id")
    return new_company

@router.put("/{company_id}", response_model=CompanyV2)
async def update_company(
    company_id: str,
    company_update: CompanyUpdateV2,
    current_user: dict = Depends(get_current_user)
):
    """
    Update company (nur SysOp)
    """
    if current_user["role"] != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp kann Firmen bearbeiten")
    
    db = await get_database()
    companies_collection = db["companies_v2"]
    
    company = await companies_collection.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Firma nicht gefunden")
    
    update_fields = company_update.dict(exclude_unset=True)
    update_fields["updated_at"] = datetime.utcnow().isoformat()
    
    await companies_collection.update_one(
        {"id": company_id},
        {"$set": update_fields}
    )
    
    updated_company = await companies_collection.find_one({"id": company_id})
    updated_company.pop("_id", None)
    return updated_company

@router.delete("/{company_id}")
async def delete_company(company_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete company (nur SysOp)
    """
    if current_user["role"] != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp kann Firmen löschen")
    
    db = await get_database()
    companies_collection = db["companies_v2"]
    users_collection = db["users_v2"]
    projects_collection = db["projects_v2"]
    
    company = await companies_collection.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Firma nicht gefunden")
    
    # Check if deletable
    if not company.get("is_deletable", True):
        raise HTTPException(status_code=403, detail="Diese Firma kann nicht gelöscht werden")
    
    # Check if company has users
    users_count = await users_collection.count_documents({"company_id": company_id})
    if users_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Firma hat noch {users_count} User. Bitte erst User löschen."
        )
    
    # Check if company has projects
    projects_count = await projects_collection.count_documents({"company_id": company_id})
    if projects_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Firma hat noch {projects_count} Projekte. Bitte erst Projekte löschen."
        )
    
    await companies_collection.delete_one({"id": company_id})
    
    return {"message": "Firma erfolgreich gelöscht"}

@router.post("/{company_id}/block")
async def block_company(company_id: str, current_user: dict = Depends(get_current_user)):
    """
    Block/Unblock company und alle zugehörigen User (nur SysOp)
    """
    if current_user["role"] != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp kann Firmen sperren")
    
    db = await get_database()
    companies_collection = db["companies_v2"]
    users_collection = db["users_v2"]
    
    company = await companies_collection.find_one({"id": company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Firma nicht gefunden")
    
    # Toggle block status
    new_status = not company.get("is_blocked", False)
    await companies_collection.update_one(
        {"id": company_id},
        {"$set": {"is_blocked": new_status, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    # Block/Unblock alle User der Firma
    await users_collection.update_many(
        {"company_id": company_id},
        {"$set": {"is_blocked": new_status, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    users_count = await users_collection.count_documents({"company_id": company_id})
    
    return {
        "message": f"Firma {'gesperrt' if new_status else 'entsperrt'}",
        "is_blocked": new_status,
        "affected_users": users_count
    }
