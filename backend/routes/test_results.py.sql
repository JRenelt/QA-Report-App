"""
Test Results Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from database import database
from models import User, TestResult, TestResultCreate
from auth import get_current_user

router = APIRouter()

@router.get("/test-case/{test_case_id}", response_model=List[TestResult])
async def get_test_results_by_case(
    test_case_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get all test results for a test case"""
    # Verify access to test case through project
    access_check = """
        SELECT tc.id FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tc.id = :test_case_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_check, {
        "test_case_id": test_case_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this test case"
        )
    
    query = """
        SELECT id, test_case_id, status, notes, executed_by, execution_date, session_id
        FROM test_results 
        WHERE test_case_id = :test_case_id
        ORDER BY execution_date DESC
    """
    result = await database.fetch_all(query, {"test_case_id": test_case_id})
    return [TestResult(**dict(row)) for row in result]

@router.get("/session/{session_id}", response_model=List[TestResult])
async def get_test_results_by_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all test results for a session"""
    query = """
        SELECT tr.id, tr.test_case_id, tr.status, tr.notes, tr.executed_by, tr.execution_date, tr.session_id
        FROM test_results tr
        JOIN test_cases tc ON tr.test_case_id = tc.id
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tr.session_id = :session_id
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
        ORDER BY tc.sort_order, tc.test_id
    """
    result = await database.fetch_all(query, {
        "session_id": session_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    return [TestResult(**dict(row)) for row in result]

@router.post("/", response_model=TestResult)
async def create_test_result(
    result_data: TestResultCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new test result"""
    # Verify access to test case through project
    access_check = """
        SELECT tc.id FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tc.id = :test_case_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR pu.access_level IN ('owner', 'editor') OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_check, {
        "test_case_id": result_data.test_case_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to create result for this test case"
        )
    
    query = """
        INSERT INTO test_results (test_case_id, status, notes, executed_by, session_id)
        VALUES (:test_case_id, :status, :notes, :executed_by, :session_id)
        RETURNING id, test_case_id, status, notes, executed_by, execution_date, session_id
    """
    
    result = await database.fetch_one(query, {
        "test_case_id": result_data.test_case_id,
        "status": result_data.status,
        "notes": result_data.notes,
        "executed_by": current_user.id,
        "session_id": result_data.session_id
    })
    
    return TestResult(**dict(result))

@router.get("/{result_id}", response_model=TestResult)
async def get_test_result(
    result_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get specific test result"""
    # Verify access through project
    query = """
        SELECT tr.id, tr.test_case_id, tr.status, tr.notes, tr.executed_by, tr.execution_date, tr.session_id
        FROM test_results tr
        JOIN test_cases tc ON tr.test_case_id = tc.id
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tr.id = :result_id
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    result = await database.fetch_one(query, {
        "result_id": result_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found or access denied"
        )
    
    return TestResult(**dict(result))

@router.put("/{result_id}", response_model=TestResult)
async def update_test_result(
    result_id: int,
    result_data: TestResultCreate,
    current_user: User = Depends(get_current_user)
):
    """Update test result"""
    # Verify access and ownership
    access_query = """
        SELECT tr.id FROM test_results tr
        JOIN test_cases tc ON tr.test_case_id = tc.id
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tr.id = :result_id
          AND (tr.executed_by = :user_id OR p.created_by = :user_id OR pu.access_level = 'owner' OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_query, {
        "result_id": result_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to update this test result"
        )
    
    query = """
        UPDATE test_results 
        SET status = :status, notes = :notes, session_id = :session_id
        WHERE id = :result_id
        RETURNING id, test_case_id, status, notes, executed_by, execution_date, session_id
    """
    
    result = await database.fetch_one(query, {
        "result_id": result_id,
        "status": result_data.status,
        "notes": result_data.notes,
        "session_id": result_data.session_id
    })
    
    return TestResult(**dict(result))

@router.delete("/{result_id}")
async def delete_test_result(
    result_id: int,
    current_user: User = Depends(get_current_user)
):
    """Delete test result"""
    # Verify access and ownership
    access_query = """
        SELECT tr.id FROM test_results tr
        JOIN test_cases tc ON tr.test_case_id = tc.id
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tr.id = :result_id
          AND (tr.executed_by = :user_id OR p.created_by = :user_id OR pu.access_level = 'owner' OR :user_role = 'admin')
    """
    access = await database.fetch_one(access_query, {
        "result_id": result_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to delete this test result"
        )
    
    await database.execute("DELETE FROM test_results WHERE id = :result_id", {
        "result_id": result_id
    })
    
    return {"message": "Test result deleted successfully"}

@router.get("/project/{project_id}/summary")
async def get_project_test_summary(
    project_id: int,
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get test summary for a project"""
    # Verify access to project
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
    
    # Get test summary
    base_query = """
        SELECT 
            COUNT(DISTINCT tc.id) as total_tests,
            COUNT(DISTINCT tr.id) as executed_tests,
            COUNT(CASE WHEN tr.status = 'success' THEN 1 END) as passed_tests,
            COUNT(CASE WHEN tr.status = 'error' THEN 1 END) as failed_tests,
            COUNT(CASE WHEN tr.status = 'warning' THEN 1 END) as warning_tests,
            COUNT(CASE WHEN tr.status = 'skipped' THEN 1 END) as skipped_tests
        FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        LEFT JOIN test_results tr ON tc.id = tr.test_case_id
        WHERE ts.project_id = :project_id
    """
    
    params = {"project_id": project_id}
    if session_id:
        base_query += " AND (tr.session_id = :session_id OR tr.id IS NULL)"
        params["session_id"] = session_id
    
    result = await database.fetch_one(base_query, params)
    
    return {
        "project_id": project_id,
        "session_id": session_id,
        "total_tests": result["total_tests"] or 0,
        "executed_tests": result["executed_tests"] or 0,
        "passed_tests": result["passed_tests"] or 0,
        "failed_tests": result["failed_tests"] or 0,
        "warning_tests": result["warning_tests"] or 0,
        "skipped_tests": result["skipped_tests"] or 0,
        "completion_percentage": round((result["executed_tests"] or 0) / (result["total_tests"] or 1) * 100, 2)
    }