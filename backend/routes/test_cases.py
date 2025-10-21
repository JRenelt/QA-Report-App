"""
Test Case Management Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid
from database import test_cases_collection, test_suites_collection, test_results_collection
from models import User, TestCase, TestCaseCreate
from auth import get_current_user

router = APIRouter()

@router.get("/")
async def get_test_cases(
    test_suite_id: str = None, 
    project_id: str = None,
    current_user: User = Depends(get_current_user)
):
    """Get all test cases for a test suite OR all test cases for a project"""
    from fastapi.responses import JSONResponse
    
    # Build query filter
    query_filter = {}
    if test_suite_id:
        # Verify suite exists
        suite = await test_suites_collection.find_one({"id": test_suite_id})
        if not suite:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test suite not found"
            )
        query_filter["test_suite_id"] = test_suite_id
    elif project_id:
        # Get all test cases for project
        query_filter["project_id"] = project_id
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either test_suite_id or project_id must be provided"
        )
    
    cases = await test_cases_collection.find(query_filter).sort("sort_order", 1).to_list(10000)
    
    # Konvertiere snake_case Keys zu camelCase für Frontend
    converted_cases = []
    for case in cases:
        case_dict = {k: v for k, v in case.items() if k != "_id"}
        # Konvertiere Keys
        if "test_suite_id" in case_dict:
            case_dict["testSuiteId"] = case_dict.pop("test_suite_id")
        if "project_id" in case_dict:
            case_dict["projectId"] = case_dict.pop("project_id")
        if "created_by" in case_dict:
            case_dict["createdBy"] = case_dict.pop("created_by")
        if "created_at" in case_dict:
            case_dict["createdAt"] = case_dict["created_at"].isoformat() if hasattr(case_dict["created_at"], 'isoformat') else case_dict["created_at"]
            del case_dict["created_at"]
        if "updated_at" in case_dict:
            case_dict["updatedAt"] = case_dict["updated_at"].isoformat() if hasattr(case_dict["updated_at"], 'isoformat') else case_dict["updated_at"]
            del case_dict["updated_at"]
        if "sort_order" in case_dict:
            case_dict["sortOrder"] = case_dict.pop("sort_order")
        converted_cases.append(case_dict)
    
    return JSONResponse(content=converted_cases)

@router.post("/", response_model=TestCase)
async def create_test_case(
    case_data: TestCaseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new test case"""
    
    # Verify suite exists
    suite = await test_suites_collection.find_one({"id": case_data.test_suite_id})
    if not suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )
    
    new_case = {
        "id": str(uuid.uuid4()),
        "test_suite_id": case_data.test_suite_id,
        "test_id": case_data.test_id,
        "name": case_data.name,
        "description": case_data.description,
        "priority": case_data.priority,
        "expected_result": case_data.expected_result,
        "sort_order": case_data.sort_order,
        "is_predefined": False,
        "created_by": current_user.id,
        "created_at": datetime.utcnow()
    }
    
    await test_cases_collection.insert_one(new_case)
    
    return TestCase(**{k: v for k, v in new_case.items() if k != "_id"})

@router.get("/{case_id}", response_model=TestCase)
async def get_test_case(case_id: str, current_user: User = Depends(get_current_user)):
    """Get specific test case"""
    
    case = await test_cases_collection.find_one({"id": case_id})
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    return TestCase(**{k: v for k, v in case.items() if k != "_id"})

@router.put("/{case_id}", response_model=TestCase)
async def update_test_case(
    case_id: str,
    case_data: TestCaseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update test case - allows partial updates"""
    
    case = await test_cases_collection.find_one({"id": case_id})
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # Nur Felder updaten die tatsächlich gesendet wurden
    update_data = {"updated_at": datetime.utcnow()}
    
    if case_data.test_id is not None:
        update_data["test_id"] = case_data.test_id
    if case_data.name is not None:
        update_data["name"] = case_data.name
    if case_data.description is not None:
        update_data["description"] = case_data.description
    if case_data.status is not None:
        update_data["status"] = case_data.status
    if case_data.note is not None:
        update_data["note"] = case_data.note
    if case_data.priority is not None:
        update_data["priority"] = case_data.priority
    if case_data.expected_result is not None:
        update_data["expected_result"] = case_data.expected_result
    if case_data.sort_order is not None:
        update_data["sort_order"] = case_data.sort_order
    
    result = await test_cases_collection.find_one_and_update(
        {"id": case_id},
        {"$set": update_data},
        return_document=True
    )
    
    return TestCase(**{k: v for k, v in result.items() if k != "_id"})

@router.delete("/{case_id}")
async def delete_test_case(case_id: str, current_user: User = Depends(get_current_user)):
    """Delete test case and all results"""
    
    case = await test_cases_collection.find_one({"id": case_id})
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    # Delete case and results
    await test_cases_collection.delete_one({"id": case_id})
    await test_results_collection.delete_many({"test_case_id": case_id})
    
    return {"message": "Test case deleted successfully"}

@router.post("/bulk", response_model=List[TestCase])
async def create_test_cases_bulk(
    cases: List[TestCaseCreate],
    current_user: User = Depends(get_current_user)
):
    """Create multiple test cases at once"""
    
    created_cases = []
    
    for case_data in cases:
        new_case = {
            "id": str(uuid.uuid4()),
            "test_suite_id": case_data.test_suite_id,
            "test_id": case_data.test_id,
            "name": case_data.name,
            "description": case_data.description,
            "priority": case_data.priority,
            "expected_result": case_data.expected_result,
            "sort_order": case_data.sort_order,
            "is_predefined": False,
            "created_by": current_user.id,
            "created_at": datetime.utcnow()
        }
        await test_cases_collection.insert_one(new_case)
        created_cases.append(TestCase(**{k: v for k, v in new_case.items() if k != "_id"}))
    
    return created_cases
