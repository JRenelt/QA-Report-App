"""
Test Suite Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import database
from models import User, TestSuite, TestSuiteCreate
from auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TestSuite])
async def get_test_suites(current_user: User = Depends(get_current_user)):
    """Get all test suites user has access to"""
    query = """
        SELECT DISTINCT ts.id, ts.project_id, ts.name, ts.description, ts.icon, ts.sort_order, ts.created_at
        FROM test_suites ts
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE p.created_by = :user_id 
           OR pu.user_id = :user_id 
           OR :user_role = 'admin'
        ORDER BY ts.sort_order, ts.name
    """
    result = await database.fetch_all(query, {
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    return [TestSuite(**dict(row)) for row in result]

@router.get("/project/{project_id}", response_model=List[TestSuite])
async def get_project_test_suites(
    project_id: int, 
    current_user: User = Depends(get_current_user)
):
    """Get all test suites for a project"""
    # Verify project access
    access_check = """
        SELECT p.id FROM projects p
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE p.id = :project_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_check, {
        "project_id": project_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this project"
        )
    
    query = """
        SELECT id, project_id, name, description, icon, sort_order, created_at
        FROM test_suites 
        WHERE project_id = :project_id
        ORDER BY sort_order, name
    """
    result = await database.fetch_all(query, {"project_id": project_id})
    return [TestSuite(**dict(row)) for row in result]

@router.post("/", response_model=TestSuite)
async def create_test_suite(
    suite_data: TestSuiteCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new test suite"""
    # Verify project access
    access_check = text("""
        SELECT p.id FROM projects p
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE p.id = :project_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR pu.access_level IN ('owner', 'editor') OR :user_role = 'admin')
    """)
    access = await database.fetch_one(access_check, {
        "project_id": suite_data.project_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No edit access to this project"
        )
    
    query = text("""
        INSERT INTO test_suites (project_id, name, description, icon, sort_order)
        VALUES (:project_id, :name, :description, :icon, :sort_order)
        RETURNING id, project_id, name, description, icon, sort_order, created_at
    """)
    
    result = await database.fetch_one(query, {
        "project_id": suite_data.project_id,
        "name": suite_data.name,
        "description": suite_data.description,
        "icon": suite_data.icon,
        "sort_order": suite_data.sort_order
    })
    
    return TestSuite(**dict(result))