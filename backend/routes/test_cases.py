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

@router.get("/", response_model=List[TestCase])
async def get_test_cases(test_suite_id: str, current_user: User = Depends(get_current_user)):
    """Get all test cases for a test suite"""
    
    # Verify suite exists
    suite = await test_suites_collection.find_one({"id": test_suite_id})
    if not suite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test suite not found"
        )
    
    cases = await test_cases_collection.find(
        {"test_suite_id": test_suite_id}
    ).sort("sort_order", 1).to_list(1000)
    
    return [TestCase(**{k: v for k, v in case.items() if k != "_id"}) for case in cases]

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
    case_data: TestCaseCreate,
    current_user: User = Depends(get_current_user)
):
    """Update test case"""
    
    case = await test_cases_collection.find_one({"id": case_id})
    if not case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    update_data = {
        "test_id": case_data.test_id,
        "name": case_data.name,
        "description": case_data.description,
        "priority": case_data.priority,
        "expected_result": case_data.expected_result,
        "sort_order": case_data.sort_order
    }
    
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
