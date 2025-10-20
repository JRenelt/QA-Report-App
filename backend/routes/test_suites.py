"""
Test Suite Management Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid
from database import test_suites_collection, projects_collection, test_cases_collection
from models import User, TestSuite, TestSuiteCreate
from auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_test_suites(project_id: str, current_user: User = Depends(get_current_user)):
    """Get all test suites for a project"""
    from fastapi.responses import JSONResponse
    
    # Verify project access
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    suites = await test_suites_collection.find(
        {"project_id": project_id}
    ).sort("sort_order", 1).to_list(1000)
    
    # Konvertiere snake_case Keys zu camelCase für Frontend
    converted_suites = []
    for suite in suites:
        suite_dict = {k: v for k, v in suite.items() if k != "_id"}
        # Konvertiere Keys
        if "project_id" in suite_dict:
            suite_dict["projectId"] = suite_dict.pop("project_id")
        if "created_by" in suite_dict:
            suite_dict["createdBy"] = suite_dict.pop("created_by")
        if "created_at" in suite_dict:
            suite_dict["createdAt"] = suite_dict["created_at"].isoformat() if hasattr(suite_dict["created_at"], 'isoformat') else suite_dict["created_at"]
            del suite_dict["created_at"]
        if "updated_at" in suite_dict:
            suite_dict["updatedAt"] = suite_dict["updated_at"].isoformat() if hasattr(suite_dict["updated_at"], 'isoformat') else suite_dict["updated_at"]
            del suite_dict["updated_at"]
        if "sort_order" in suite_dict:
            suite_dict["sortOrder"] = suite_dict.pop("sort_order")
        converted_suites.append(suite_dict)
    
    return JSONResponse(content=converted_suites)

@router.post("/", response_model=TestSuite)
async def create_test_suite(
    suite_data: TestSuiteCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new test suite"""
    
    # Verify project exists
    project = await projects_collection.find_one({"id": suite_data.project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    new_suite = {
        "id": str(uuid.uuid4()),
        "project_id": suite_data.project_id,
        "name": suite_data.name,
        "description": suite_data.description,
        "icon": suite_data.icon,
        "sort_order": suite_data.sort_order,
        "created_at": datetime.utcnow()
    }
    
    await test_suites_collection.insert_one(new_suite)
    
    return TestSuite(**{k: v for k, v in new_suite.items() if k != "_id"})

@router.put("/{suite_id}", response_model=TestSuite)
async def update_test_suite(
    suite_id: str,
    suite_data: TestSuiteCreate,
    current_user: User = Depends(get_current_user)
):
    """Update test suite"""
    
    suite = await test_suites_collection.find_one({"id": suite_id})
    if not suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )
    
    update_data = {
        "name": suite_data.name,
        "description": suite_data.description,
        "icon": suite_data.icon,
        "sort_order": suite_data.sort_order
    }
    
    result = await test_suites_collection.find_one_and_update(
        {"id": suite_id},
        {"$set": update_data},
        return_document=True
    )
    
    return TestSuite(**{k: v for k, v in result.items() if k != "_id"})

@router.delete("/{suite_id}")
async def delete_test_suite(suite_id: str, current_user: User = Depends(get_current_user)):
    """Delete test suite and all test cases"""
    
    suite = await test_suites_collection.find_one({"id": suite_id})
    if not suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )
    
    # Delete suite and all test cases
    await test_suites_collection.delete_one({"id": suite_id})
    await test_cases_collection.delete_many({"test_suite_id": suite_id})
    
    return {"message": "Test suite deleted successfully"}
