"""
Company Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import database
from models import User, Company, CompanyCreate
from auth import get_current_user, require_qa_or_admin

router = APIRouter()

@router.get("/", response_model=List[Company])
async def get_companies(current_user: User = Depends(get_current_user)):
    """Get all companies user has access to"""
    query = """
        SELECT DISTINCT c.id, c.name, c.description, c.logo_url, c.created_by, c.created_at, c.updated_at
        FROM companies c
        LEFT JOIN projects p ON c.id = p.company_id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE c.created_by = :user_id 
           OR pu.user_id = :user_id 
           OR :user_role = 'admin'
        ORDER BY c.name
    """
    result = await database.fetch_all(query, {
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    return [Company(**dict(row)) for row in result]

@router.post("/", response_model=Company)
async def create_company(
    company_data: CompanyCreate, 
    current_user: User = Depends(require_qa_or_admin)
):
    """Create new company"""
    query = text("""
        INSERT INTO companies (name, description, logo_url, created_by)
        VALUES (:name, :description, :logo_url, :created_by)
        RETURNING id, name, description, logo_url, created_by, created_at, updated_at
    """)
    
    result = await database.fetch_one(query, {
        "name": company_data.name,
        "description": company_data.description,
        "logo_url": company_data.logo_url,
        "created_by": current_user.id
    })
    
    return Company(**dict(result))

@router.get("/{company_id}", response_model=Company)
async def get_company(company_id: int, current_user: User = Depends(get_current_user)):
    """Get specific company"""
    query = text("""
        SELECT c.id, c.name, c.description, c.logo_url, c.created_by, c.created_at, c.updated_at
        FROM companies c
        LEFT JOIN projects p ON c.id = p.company_id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE c.id = :company_id
          AND (c.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
        LIMIT 1
    """)
    result = await database.fetch_one(query, {
        "company_id": company_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found or access denied"
        )
    
    return Company(**dict(result))