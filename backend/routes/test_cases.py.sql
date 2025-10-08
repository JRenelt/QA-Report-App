"""
Test Case Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import database
from models import User, TestCase, TestCaseCreate
from auth import get_current_user

router = APIRouter()

@router.get("/suite/{test_suite_id}", response_model=List[TestCase])
async def get_test_cases_by_suite(
    test_suite_id: int, 
    current_user: User = Depends(get_current_user)
):
    """Get all test cases for a test suite"""
    # Verify access to test suite through project
    access_check = """
        SELECT ts.id FROM test_suites ts
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE ts.id = :test_suite_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_check, {
        "test_suite_id": test_suite_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this test suite"
        )
    
    query = """
        SELECT id, test_suite_id, test_id, name, description, priority, 
               expected_result, sort_order, is_predefined, created_by, created_at
        FROM test_cases 
        WHERE test_suite_id = :test_suite_id
        ORDER BY sort_order, test_id
    """
    result = await database.fetch_all(query, {"test_suite_id": test_suite_id})
    return [TestCase(**dict(row)) for row in result]

@router.post("/", response_model=TestCase)
async def create_test_case(
    test_case_data: TestCaseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new test case"""
    # Verify access to test suite through project
    access_check = """
        SELECT ts.id FROM test_suites ts
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE ts.id = :test_suite_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR pu.access_level IN ('owner', 'editor') OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_check, {
        "test_suite_id": test_case_data.test_suite_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No edit access to this test suite"
        )
    
    query = """
        INSERT INTO test_cases (test_suite_id, test_id, name, description, priority, expected_result, sort_order, created_by)
        VALUES (:test_suite_id, :test_id, :name, :description, :priority, :expected_result, :sort_order, :created_by)
        RETURNING id, test_suite_id, test_id, name, description, priority, expected_result, sort_order, is_predefined, created_by, created_at
    """
    
    result = await database.fetch_one(query, {
        "test_suite_id": test_case_data.test_suite_id,
        "test_id": test_case_data.test_id,
        "name": test_case_data.name,
        "description": test_case_data.description,
        "priority": test_case_data.priority,
        "expected_result": test_case_data.expected_result,
        "sort_order": test_case_data.sort_order,
        "created_by": current_user.id
    })
    
    return TestCase(**dict(result))

@router.get("/{test_case_id}", response_model=TestCase)
async def get_test_case(
    test_case_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get specific test case"""
    # Verify access through project
    query = """
        SELECT tc.id, tc.test_suite_id, tc.test_id, tc.name, tc.description, tc.priority, 
               tc.expected_result, tc.sort_order, tc.is_predefined, tc.created_by, tc.created_at
        FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tc.id = :test_case_id
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    result = await database.fetch_one(query, {
        "test_case_id": test_case_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found or access denied"
        )
    
    return TestCase(**dict(result))

@router.put("/{test_case_id}", response_model=TestCase)
async def update_test_case(
    test_case_id: int,
    test_case_data: TestCaseCreate,
    current_user: User = Depends(get_current_user)
):
    """Update test case"""
    # Verify access and get current test case
    access_query = """
        SELECT tc.id FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tc.id = :test_case_id
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR pu.access_level IN ('owner', 'editor') OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_query, {
        "test_case_id": test_case_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No edit access to this test case"
        )
    
    query = """
        UPDATE test_cases 
        SET test_id = :test_id, name = :name, description = :description, 
            priority = :priority, expected_result = :expected_result, sort_order = :sort_order
        WHERE id = :test_case_id
        RETURNING id, test_suite_id, test_id, name, description, priority, expected_result, sort_order, is_predefined, created_by, created_at
    """
    
    result = await database.fetch_one(query, {
        "test_case_id": test_case_id,
        "test_id": test_case_data.test_id,
        "name": test_case_data.name,
        "description": test_case_data.description,
        "priority": test_case_data.priority,
        "expected_result": test_case_data.expected_result,
        "sort_order": test_case_data.sort_order
    })
    
    return TestCase(**dict(result))

@router.delete("/{test_case_id}")
async def delete_test_case(
    test_case_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete test case"""
    # Verify access
    access_query = """
        SELECT tc.id FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tc.id = :test_case_id
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR pu.access_level IN ('owner', 'editor') OR :user_role = 'admin')
          AND tc.is_predefined = false  -- Don't allow deleting predefined tests
    """
    access = await database.fetch_one(access_query, {
        "test_case_id": test_case_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete this test case (predefined or no access)"
        )
    
    # Delete test results first
    await database.execute("DELETE FROM test_results WHERE test_case_id = :test_case_id", {
        "test_case_id": test_case_id
    })
    
    # Delete test case
    await database.execute("DELETE FROM test_cases WHERE id = :test_case_id", {
        "test_case_id": test_case_id
    })
    
    return {"message": "Test case deleted successfully"}