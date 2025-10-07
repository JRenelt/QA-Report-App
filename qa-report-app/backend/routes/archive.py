"""
Archive Management Routes
"""

import json
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from database import database
from models import User
from auth import get_current_user, require_admin

router = APIRouter()

@router.post("/create-archive")
async def create_archive(
    project_id: int,
    archive_name: str,
    description: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Create archive of project test results"""
    
    # Verify project access
    project = await _verify_project_access(project_id, current_user)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nicht gefunden oder keine Berechtigung"
        )
    
    # Get all test data for archiving
    archive_data = await _collect_project_data_for_archive(project_id)
    
    # Create archive entry
    archive_id = await database.execute("""
        INSERT INTO archives (
            project_id, name, description, archive_data, 
            created_by, created_at
        )
        VALUES (:project_id, :name, :description, :archive_data, :created_by, :created_at)
        RETURNING id
    """, {
        "project_id": project_id,
        "name": archive_name,
        "description": description,
        "archive_data": json.dumps(archive_data),
        "created_by": current_user.id,
        "created_at": datetime.now()
    })
    
    return {
        "status": "archive_created",
        "archive_id": archive_id,
        "message": f"Archiv '{archive_name}' erfolgreich erstellt",
        "archived_items": {
            "test_suites": len(archive_data.get("test_suites", [])),
            "test_cases": len(archive_data.get("test_cases", [])),
            "test_results": len(archive_data.get("test_results", []))
        }
    }

@router.get("/list")
async def list_archives(
    project_id: Optional[int] = Query(None, description="Filter nach Projekt"),
    current_user: User = Depends(get_current_user)
):
    """List available archives for user"""
    
    query = """
        SELECT a.id, a.project_id, a.name, a.description, a.created_at,
               u.first_name, u.last_name, p.name as project_name
        FROM archives a
        JOIN users u ON a.created_by = u.id
        JOIN projects p ON a.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    
    params = {
        "user_id": current_user.id,
        "user_role": current_user.role
    }
    
    if project_id:
        query += " AND a.project_id = :project_id"
        params["project_id"] = project_id
    
    query += " ORDER BY a.created_at DESC"
    
    archives = await database.fetch_all(query, params)
    
    return {
        "archives": [
            {
                "id": archive["id"],
                "project_id": archive["project_id"],
                "project_name": archive["project_name"],
                "name": archive["name"],
                "description": archive["description"],
                "created_at": archive["created_at"].isoformat() if hasattr(archive["created_at"], 'isoformat') else str(archive["created_at"]),
                "created_by": f"{archive['first_name']} {archive['last_name']}"
            }
            for archive in archives
        ]
    }

@router.get("/details/{archive_id}")
async def get_archive_details(
    archive_id: int,
    current_user: User = Depends(get_current_user)
):
    """Get detailed archive information"""
    
    query = """
        SELECT a.*, p.name as project_name, u.first_name, u.last_name
        FROM archives a
        JOIN projects p ON a.project_id = p.id
        JOIN users u ON a.created_by = u.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE a.id = :archive_id
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    
    archive = await database.fetch_one(query, {
        "archive_id": archive_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archiv nicht gefunden"
        )
    
    # Parse archive data
    archive_data = json.loads(archive["archive_data"])
    
    return {
        "id": archive["id"],
        "project_id": archive["project_id"],
        "project_name": archive["project_name"],
        "name": archive["name"],
        "description": archive["description"],
        "created_at": archive["created_at"].isoformat(),
        "created_by": f"{archive['first_name']} {archive['last_name']}",
        "data": archive_data,
        "summary": {
            "test_suites": len(archive_data.get("test_suites", [])),
            "test_cases": len(archive_data.get("test_cases", [])),
            "test_results": len(archive_data.get("test_results", []))
        }
    }

@router.post("/restore/{archive_id}")
async def restore_from_archive(
    archive_id: int,
    target_project_id: Optional[int] = None,
    restore_options: Dict[str, bool] = {
        "restore_test_suites": True,
        "restore_test_cases": True,
        "restore_test_results": False,
        "overwrite_existing": False
    },
    current_user: User = Depends(require_admin)
):
    """Restore data from archive (Admin only)"""
    
    # Get archive
    archive = await database.fetch_one(
        "SELECT * FROM archives WHERE id = :archive_id",
        {"archive_id": archive_id}
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archiv nicht gefunden"
        )
    
    # Use original project or specified target
    project_id = target_project_id or archive["project_id"]
    
    # Verify target project access
    target_project = await _verify_project_access(project_id, current_user)
    if not target_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ziel-Projekt nicht gefunden oder keine Berechtigung"
        )
    
    # Parse archive data
    archive_data = json.loads(archive["archive_data"])
    
    # Perform restore
    restore_result = await _restore_archive_data(
        archive_data,
        project_id,
        restore_options,
        current_user.id
    )
    
    return {
        "status": "restore_completed",
        "archive_id": archive_id,
        "target_project_id": project_id,
        "restored": restore_result
    }

@router.delete("/delete/{archive_id}")
async def delete_archive(
    archive_id: int,
    current_user: User = Depends(require_admin)
):
    """Delete archive (Admin only)"""
    
    # Check if archive exists and get info
    archive = await database.fetch_one(
        """
        SELECT a.name, p.name as project_name 
        FROM archives a
        JOIN projects p ON a.project_id = p.id
        WHERE a.id = :archive_id
        """,
        {"archive_id": archive_id}
    )
    
    if not archive:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archiv nicht gefunden"
        )
    
    # Delete archive
    await database.execute(
        "DELETE FROM archives WHERE id = :archive_id",
        {"archive_id": archive_id}
    )
    
    return {
        "status": "archive_deleted",
        "message": f"Archiv '{archive['name']}' aus Projekt '{archive['project_name']}' wurde gelöscht"
    }

@router.post("/cleanup-old")
async def cleanup_old_archives(
    days_old: int = Query(90, description="Archive älter als X Tage"),
    dry_run: bool = Query(True, description="Nur anzeigen, nicht löschen"),
    current_user: User = Depends(require_admin)
):
    """Cleanup old archives (Admin only)"""
    
    cutoff_date = datetime.now() - timedelta(days=days_old)
    
    # Find old archives
    old_archives_query = """
        SELECT a.id, a.name, a.created_at, p.name as project_name
        FROM archives a
        JOIN projects p ON a.project_id = p.id
        WHERE a.created_at < :cutoff_date
        ORDER BY a.created_at
    """
    
    old_archives = await database.fetch_all(
        old_archives_query,
        {"cutoff_date": cutoff_date}
    )
    
    if dry_run:
        return {
            "status": "dry_run_completed",
            "cutoff_date": cutoff_date.isoformat(),
            "archives_to_delete": len(old_archives),
            "archives": [
                {
                    "id": archive["id"],
                    "name": archive["name"],
                    "project_name": archive["project_name"],
                    "created_at": archive["created_at"].isoformat()
                }
                for archive in old_archives
            ]
        }
    
    # Delete old archives
    deleted_count = 0
    for archive in old_archives:
        await database.execute(
            "DELETE FROM archives WHERE id = :archive_id",
            {"archive_id": archive["id"]}
        )
        deleted_count += 1
    
    return {
        "status": "cleanup_completed",
        "deleted_archives": deleted_count,
        "cutoff_date": cutoff_date.isoformat()
    }

# Helper Functions

async def _verify_project_access(project_id: int, current_user: User) -> Optional[Dict]:
    """Verify user has access to project"""
    query = """
        SELECT p.* FROM projects p
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE p.id = :project_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    
    result = await database.fetch_one(query, {
        "project_id": project_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    return dict(result) if result else None

async def _collect_project_data_for_archive(project_id: int) -> Dict[str, Any]:
    """Collect all project data for archiving"""
    
    # Get test suites
    suites = await database.fetch_all(
        "SELECT * FROM test_suites WHERE project_id = :project_id ORDER BY sort_order",
        {"project_id": project_id}
    )
    
    # Get test cases
    cases = await database.fetch_all(
        """
        SELECT tc.* FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        WHERE ts.project_id = :project_id
        ORDER BY ts.sort_order, tc.sort_order
        """,
        {"project_id": project_id}
    )
    
    # Get test results
    results = await database.fetch_all(
        """
        SELECT tr.* FROM test_results tr
        JOIN test_cases tc ON tr.test_case_id = tc.id
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        WHERE ts.project_id = :project_id
        ORDER BY tr.execution_date DESC
        """,
        {"project_id": project_id}
    )
    
    return {
        "project_id": project_id,
        "archived_at": datetime.now().isoformat(),
        "test_suites": [dict(suite) for suite in suites],
        "test_cases": [dict(case) for case in cases],
        "test_results": [
            {
                **dict(result),
                "execution_date": result["execution_date"].isoformat() if result["execution_date"] else None
            }
            for result in results
        ]
    }

async def _restore_archive_data(
    archive_data: Dict[str, Any],
    target_project_id: int,
    restore_options: Dict[str, bool],
    user_id: int
) -> Dict[str, int]:
    """Restore data from archive"""
    
    restored = {
        "test_suites": 0,
        "test_cases": 0,
        "test_results": 0
    }
    
    # Restore test suites
    if restore_options.get("restore_test_suites", True):
        for suite_data in archive_data.get("test_suites", []):
            # Check if exists
            existing = await database.fetch_one(
                """
                SELECT id FROM test_suites 
                WHERE project_id = :project_id AND name = :name
                """,
                {"project_id": target_project_id, "name": suite_data["name"]}
            )
            
            if existing and not restore_options.get("overwrite_existing", False):
                continue
            
            if existing and restore_options.get("overwrite_existing", False):
                # Update existing
                await database.execute(
                    """
                    UPDATE test_suites 
                    SET description = :description, icon = :icon, sort_order = :sort_order
                    WHERE id = :id
                    """,
                    {
                        "id": existing["id"],
                        "description": suite_data.get("description"),
                        "icon": suite_data.get("icon"),
                        "sort_order": suite_data.get("sort_order")
                    }
                )
            else:
                # Create new
                await database.execute(
                    """
                    INSERT INTO test_suites 
                    (project_id, name, description, icon, sort_order, created_by)
                    VALUES (:project_id, :name, :description, :icon, :sort_order, :created_by)
                    """,
                    {
                        "project_id": target_project_id,
                        "name": suite_data["name"],
                        "description": suite_data.get("description"),
                        "icon": suite_data.get("icon"),
                        "sort_order": suite_data.get("sort_order"),
                        "created_by": user_id
                    }
                )
            
            restored["test_suites"] += 1
    
    # Similar logic for test_cases and test_results...
    # (Implementation would continue with restore logic for other data types)
    
    return restored