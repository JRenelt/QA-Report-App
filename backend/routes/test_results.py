"""
Test Result Management Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
import uuid
from database import test_results_collection, test_cases_collection
from models import User, TestResult, TestResultCreate, TestStatus
from auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TestResult])
async def get_test_results(
    test_case_id: Optional[str] = None,
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get test results filtered by test case or session"""
    
    query = {}
    if test_case_id:
        query["test_case_id"] = test_case_id
    if session_id:
        query["session_id"] = session_id
    
    results = await test_results_collection.find(query).sort("execution_date", -1).to_list(1000)
    
    return [TestResult(**{k: v for k, v in result.items() if k != "_id"}) for result in results]

@router.post("/", response_model=TestResult)
async def create_test_result(
    result_data: TestResultCreate,
    current_user: User = Depends(get_current_user)
):
    """Create new test result"""
    
    # Verify test case exists
    test_case = await test_cases_collection.find_one({"id": result_data.test_case_id})
    if not test_case:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not found"
        )
    
    new_result = {
        "id": str(uuid.uuid4()),
        "test_case_id": result_data.test_case_id,
        "status": result_data.status,
        "notes": result_data.notes,
        "executed_by": current_user.id,
        "execution_date": datetime.utcnow(),
        "session_id": result_data.session_id
    }
    
    await test_results_collection.insert_one(new_result)
    
    return TestResult(**{k: v for k, v in new_result.items() if k != "_id"})

@router.get("/latest/{test_case_id}", response_model=TestResult)
async def get_latest_result(
    test_case_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get latest test result for a test case"""
    
    result = await test_results_collection.find_one(
        {"test_case_id": test_case_id},
        sort=[("execution_date", -1)]
    )
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No test results found"
        )
    
    return TestResult(**{k: v for k, v in result.items() if k != "_id"})

@router.get("/statistics/{project_id}")
async def get_project_statistics(
    project_id: str,
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get test statistics for a project"""
    
    # Get all test suites for project
    from database import test_suites_collection
    suites = await test_suites_collection.find({"project_id": project_id}).to_list(1000)
    suite_ids = [s["id"] for s in suites]
    
    # Get all test cases for these suites
    cases = await test_cases_collection.find({"test_suite_id": {"$in": suite_ids}}).to_list(1000)
    case_ids = [c["id"] for c in cases]
    
    # Build query for results
    result_query = {"test_case_id": {"$in": case_ids}}
    if session_id:
        result_query["session_id"] = session_id
    
    # Get all results
    results = await test_results_collection.find(result_query).to_list(10000)
    
    # Calculate statistics
    total_tests = len(cases)
    
    # Get latest result for each test case
    latest_results = {}
    for result in sorted(results, key=lambda x: x["execution_date"], reverse=True):
        case_id = result["test_case_id"]
        if case_id not in latest_results:
            latest_results[case_id] = result
    
    status_counts = {
        "success": 0,
        "error": 0,
        "warning": 0,
        "skipped": 0,
        "untested": 0
    }
    
    for case_id in case_ids:
        if case_id in latest_results:
            status = latest_results[case_id]["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        else:
            status_counts["untested"] += 1
    
    # Calculate pass rate
    tested_count = total_tests - status_counts["untested"]
    pass_rate = (status_counts["success"] / tested_count * 100) if tested_count > 0 else 0
    
    return {
        "total_tests": total_tests,
        "tested": tested_count,
        "untested": status_counts["untested"],
        "success": status_counts["success"],
        "error": status_counts["error"],
        "warning": status_counts["warning"],
        "skipped": status_counts["skipped"],
        "pass_rate": round(pass_rate, 2),
        "total_executions": len(results)
    }

@router.delete("/{result_id}")
async def delete_test_result(result_id: str, current_user: User = Depends(get_current_user)):
    """Delete test result"""
    
    result = await test_results_collection.find_one({"id": result_id})
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test result not found"
        )
    
    await test_results_collection.delete_one({"id": result_id})
    
    return {"message": "Test result deleted successfully"}
