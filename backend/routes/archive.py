"""
Archive Management Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid
import json
from database import (
    archives_collection,
    projects_collection,
    test_suites_collection,
    test_cases_collection,
    test_results_collection
)
from models import User, Archive, ArchiveCreate
from auth import get_current_user, require_qa_or_admin

router = APIRouter()

@router.get("/", response_model=List[Archive])
async def get_archives(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all archives for a project"""
    
    # Verify project access
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    archives = await archives_collection.find(
        {"project_id": project_id}
    ).sort("created_at", -1).to_list(1000)
    
    return [Archive(**{k: v for k, v in archive.items() if k != "_id"}) for archive in archives]

@router.post("/", response_model=Archive)
async def create_archive(
    archive_data: ArchiveCreate,
    current_user: User = Depends(require_qa_or_admin)
):
    """Create new archive (snapshot of current project state)"""
    
    # Verify project exists
    project = await projects_collection.find_one({"id": archive_data.project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all test suites
    suites = await test_suites_collection.find(
        {"project_id": archive_data.project_id}
    ).to_list(1000)
    suite_ids = [s["id"] for s in suites]
    
    # Get all test cases
    cases = await test_cases_collection.find(
        {"test_suite_id": {"$in": suite_ids}}
    ).to_list(10000)
    case_ids = [c["id"] for c in cases]
    
    # Get all test results
    results = await test_results_collection.find(
        {"test_case_id": {"$in": case_ids}}
    ).to_list(10000)
    
    # Build archive data structure
    archive_data_content = {
        "project": {
            "id": project["id"],
            "name": project["name"],
            "description": project.get("description"),
            "template_type": project["template_type"],
            "status": project["status"]
        },
        "test_suites": [
            {
                "id": suite["id"],
                "name": suite["name"],
                "description": suite.get("description"),
                "icon": suite["icon"],
                "sort_order": suite["sort_order"]
            }
            for suite in suites
        ],
        "test_cases": [
            {
                "id": case["id"],
                "test_suite_id": case["test_suite_id"],
                "test_id": case["test_id"],
                "name": case["name"],
                "description": case.get("description"),
                "priority": case.get("priority", 3),
                "expected_result": case.get("expected_result"),
                "sort_order": case.get("sort_order", 0)
            }
            for case in cases
        ],
        "test_results": [
            {
                "id": result["id"],
                "test_case_id": result["test_case_id"],
                "status": result["status"],
                "notes": result.get("notes"),
                "executed_by": result["executed_by"],
                "execution_date": result["execution_date"].isoformat() if isinstance(result["execution_date"], datetime) else result["execution_date"],
                "session_id": result.get("session_id")
            }
            for result in results
        ],
        "statistics": {
            "total_suites": len(suites),
            "total_cases": len(cases),
            "total_results": len(results),
            "archive_date": datetime.utcnow().isoformat()
        }
    }
    
    # Create archive
    new_archive = {
        "id": str(uuid.uuid4()),
        "project_id": archive_data.project_id,
        "name": archive_data.name,
        "description": archive_data.description,
        "archive_data": archive_data_content,
        "created_by": current_user.id,
        "created_at": datetime.utcnow()
    }
    
    await archives_collection.insert_one(new_archive)
    
    return Archive(**{k: v for k, v in new_archive.items() if k != "_id"})

@router.get("/{archive_id}", response_model=Archive)
async def get_archive(
    archive_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get specific archive"""
    
    archive = await archives_collection.find_one({"id": archive_id})
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    return Archive(**{k: v for k, v in archive.items() if k != "_id"})

@router.post("/{archive_id}/restore")
async def restore_from_archive(
    archive_id: str,
    current_user: User = Depends(require_qa_or_admin)
):
    """Restore project from archive (creates new project)"""
    
    # Get archive
    archive = await archives_collection.find_one({"id": archive_id})
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    archive_data = archive["archive_data"]
    
    # Get original project to get company_id
    original_project = await projects_collection.find_one({"id": archive["project_id"]})
    if not original_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Original project not found"
        )
    
    # Create new project
    new_project_id = str(uuid.uuid4())
    new_project = {
        "id": new_project_id,
        "company_id": original_project["company_id"],
        "name": f"{archive_data['project']['name']} (Restored {datetime.utcnow().strftime('%Y-%m-%d')})",
        "description": archive_data['project'].get('description'),
        "template_type": archive_data['project']['template_type'],
        "status": "active",
        "created_by": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await projects_collection.insert_one(new_project)
    
    # Restore test suites with new IDs
    suite_id_mapping = {}
    for suite_data in archive_data.get("test_suites", []):
        old_suite_id = suite_data["id"]
        new_suite_id = str(uuid.uuid4())
        suite_id_mapping[old_suite_id] = new_suite_id
        
        new_suite = {
            "id": new_suite_id,
            "project_id": new_project_id,
            "name": suite_data["name"],
            "description": suite_data.get("description"),
            "icon": suite_data["icon"],
            "sort_order": suite_data["sort_order"],
            "created_at": datetime.utcnow()
        }
        await test_suites_collection.insert_one(new_suite)
    
    # Restore test cases with new IDs
    case_id_mapping = {}
    for case_data in archive_data.get("test_cases", []):
        old_case_id = case_data["id"]
        new_case_id = str(uuid.uuid4())
        case_id_mapping[old_case_id] = new_case_id
        
        new_case = {
            "id": new_case_id,
            "test_suite_id": suite_id_mapping[case_data["test_suite_id"]],
            "test_id": case_data["test_id"],
            "name": case_data["name"],
            "description": case_data.get("description"),
            "priority": case_data.get("priority", 3),
            "expected_result": case_data.get("expected_result"),
            "sort_order": case_data.get("sort_order", 0),
            "is_predefined": True,
            "created_by": current_user.id,
            "created_at": datetime.utcnow()
        }
        await test_cases_collection.insert_one(new_case)
    
    # Restore test results with new IDs
    for result_data in archive_data.get("test_results", []):
        new_result = {
            "id": str(uuid.uuid4()),
            "test_case_id": case_id_mapping[result_data["test_case_id"]],
            "status": result_data["status"],
            "notes": result_data.get("notes"),
            "executed_by": result_data["executed_by"],
            "execution_date": datetime.fromisoformat(result_data["execution_date"]) if isinstance(result_data["execution_date"], str) else result_data["execution_date"],
            "session_id": result_data.get("session_id")
        }
        await test_results_collection.insert_one(new_result)
    
    return {
        "message": "Project restored from archive successfully",
        "new_project_id": new_project_id,
        "project_name": new_project["name"]
    }

@router.delete("/{archive_id}")
async def delete_archive(
    archive_id: str,
    current_user: User = Depends(require_qa_or_admin)
):
    """Delete archive"""
    
    archive = await archives_collection.find_one({"id": archive_id})
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archive not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and archive["created_by"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only archive creator or admin can delete"
        )
    
    await archives_collection.delete_one({"id": archive_id})
    
    return {"message": "Archive deleted successfully"}
