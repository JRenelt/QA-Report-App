"""
Company Management Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid
from database import companies_collection, projects_collection, project_users_collection
from models import User, Company, CompanyCreate
from auth import get_current_user, require_qa_or_admin

router = APIRouter()

@router.get("/", response_model=List[Company])
async def get_companies(current_user: User = Depends(get_current_user)):
    """Get all companies user has access to"""
    
    if current_user.role in ["admin", "sysop"]:
        # Admins and SysOps see all companies
        companies = await companies_collection.find().sort("name", 1).to_list(1000)
    else:
        # Get companies where user is creator or has project access
        user_projects = await project_users_collection.find({"user_id": current_user.id}).to_list(1000)
        project_ids = [p["project_id"] for p in user_projects]
        
        # Get company IDs from projects
        projects = await projects_collection.find({"id": {"$in": project_ids}}).to_list(1000)
        company_ids = list(set([p["company_id"] for p in projects]))
        
        # Get companies
        companies = await companies_collection.find({
            "$or": [
                {"created_by": current_user.id},
                {"id": {"$in": company_ids}}
            ]
        }).sort("name", 1).to_list(1000)
    
    return [Company(**{k: v for k, v in company.items() if k != "_id"}) for company in companies]

@router.post("/", response_model=Company)
async def create_company(
    company_data: CompanyCreate, 
    current_user: User = Depends(require_qa_or_admin)
):
    """Create new company"""
    
    new_company = {
        "id": str(uuid.uuid4()),
        "name": company_data.name,
        "description": company_data.description,
        "logo_url": company_data.logo_url,
        "created_by": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await companies_collection.insert_one(new_company)
    
    return Company(**{k: v for k, v in new_company.items() if k != "_id"})

@router.get("/{company_id}", response_model=Company)
async def get_company(company_id: str, current_user: User = Depends(get_current_user)):
    """Get specific company"""
    
    company = await companies_collection.find_one({"id": company_id})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Check access rights
    if current_user.role not in ["admin", "sysop"] and company["created_by"] != current_user.id:
        # Check if user has access via projects
        projects = await projects_collection.find({"company_id": company_id}).to_list(1000)
        project_ids = [p["id"] for p in projects]
        
        user_access = await project_users_collection.find_one({
            "project_id": {"$in": project_ids},
            "user_id": current_user.id
        })
        
        if not user_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return Company(**{k: v for k, v in company.items() if k != "_id"})

@router.put("/{company_id}", response_model=Company)
async def update_company(
    company_id: str,
    company_data: CompanyCreate,
    current_user: User = Depends(require_qa_or_admin)
):
    """Update company"""
    
    company = await companies_collection.find_one({"id": company_id})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and company["created_by"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company creator or admin can update"
        )
    
    update_data = {
        "name": company_data.name,
        "description": company_data.description,
        "logo_url": company_data.logo_url,
        "updated_at": datetime.utcnow()
    }
    
    result = await companies_collection.find_one_and_update(
        {"id": company_id},
        {"$set": update_data},
        return_document=True
    )
    
    return Company(**{k: v for k, v in result.items() if k != "_id"})

@router.delete("/{company_id}")
async def delete_company(company_id: str, current_user: User = Depends(require_qa_or_admin)):
    """Delete company"""
    
    company = await companies_collection.find_one({"id": company_id})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and company["created_by"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only company creator or admin can delete"
        )
    
    # Check if company has projects
    projects = await projects_collection.count_documents({"company_id": company_id})
    if projects > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete company with {projects} project(s). Delete projects first."
        )
    
    await companies_collection.delete_one({"id": company_id})
    
    return {"message": "Company deleted successfully"}
