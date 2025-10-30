"""
Test Cases V2 Routes - für V2 Projekte
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from auth import get_current_user
from models import User
from models_v2 import TestCaseV2, TestCaseCreateV2
from database import get_database

router = APIRouter()

@router.get("/", response_model=List[TestCaseV2])
async def get_test_cases(
    project_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """
    Alle Test-Cases abrufen
    - Optional nach project_id filtern
    - QA-Tester: Nur Test-Cases von zugewiesenen Projekten
    - Admin: Nur Test-Cases der eigenen Firma
    - SysOp: Alle Test-Cases (optional nach project_id gefiltert)
    """
    db = await get_database()
    test_cases_collection = db.test_cases_v2
    projects_collection = db.projects_v2
    
    query = {}
    
    # Projekt-Filter
    if project_id:
        query["project_id"] = project_id
    
    # Rollenbasierte Filterung
    if current_user.role == "qa_tester":
        # QA-Tester: Nur zugewiesene Projekte
        user_projects = await projects_collection.find({
            "assigned_testers": {
                "$elemMatch": {"user_id": current_user.id}
            }
        }).to_list(length=None)
        
        project_ids = [p["id"] for p in user_projects]
        if project_id:
            # Prüfe ob das angefragte Projekt zugewiesen ist
            if project_id not in project_ids:
                raise HTTPException(status_code=403, detail="Keine Berechtigung für dieses Projekt")
        else:
            query["project_id"] = {"$in": project_ids}
    
    elif current_user.role == "admin":
        # Admin: Nur Projekte der eigenen Firma
        if project_id:
            project = await projects_collection.find_one({"id": project_id})
            if not project:
                raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
            if project["company_id"] != current_user.company_id:
                raise HTTPException(status_code=403, detail="Keine Berechtigung für dieses Projekt")
        else:
            # Alle Projekte der Firma
            company_projects = await projects_collection.find({
                "company_id": current_user.company_id
            }).to_list(length=None)
            project_ids = [p["id"] for p in company_projects]
            query["project_id"] = {"$in": project_ids}
    
    # Test-Cases abrufen
    test_cases = await test_cases_collection.find(query).to_list(length=None)
    
    return [TestCaseV2(**tc) for tc in test_cases]


@router.get("/{test_case_id}", response_model=TestCaseV2)
async def get_test_case(
    test_case_id: str,
    current_user: User = Depends(get_current_user)
):
    """Einzelnen Test-Case abrufen"""
    db = await get_database()
    test_cases_collection = db.test_cases_v2
    projects_collection = db.projects_v2
    
    test_case = await test_cases_collection.find_one({"id": test_case_id})
    if not test_case:
        raise HTTPException(status_code=404, detail="Test-Case nicht gefunden")
    
    # Berechtigungsprüfung
    project = await projects_collection.find_one({"id": test_case["project_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    if current_user.role == "qa_tester":
        is_assigned = any(t["user_id"] == current_user.id for t in project.get("assigned_testers", []))
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Test-Case")
    elif current_user.role == "admin":
        if project["company_id"] != current_user.company_id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Test-Case")
    
    return TestCaseV2(**test_case)


@router.post("/", response_model=TestCaseV2)
async def create_test_case(
    test_case_data: TestCaseCreateV2,
    current_user: User = Depends(get_current_user)
):
    """Test-Case erstellen (SysOp, Admin)"""
    if current_user.role not in ["sysop", "admin"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zum Erstellen von Test-Cases")
    
    db = await get_database()
    test_cases_collection = db.test_cases_v2
    projects_collection = db.projects_v2
    
    # Projekt prüfen
    project = await projects_collection.find_one({"id": test_case_data.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Admin: Nur für eigene Firma
    if current_user.role == "admin":
        if project["company_id"] != current_user.company_id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für dieses Projekt")
    
    # test_id generieren (höchste existierende + 1)
    last_test = await test_cases_collection.find_one(
        {"project_id": test_case_data.project_id},
        sort=[("created_at", -1)]
    )
    
    if last_test and last_test.get("test_id"):
        try:
            last_id_num = int(last_test["test_id"].split("-")[-1])
            next_id_num = last_id_num + 1
        except:
            next_id_num = 1
    else:
        next_id_num = 1
    
    test_id = f"TC-{next_id_num:03d}"
    
    # Test-Case erstellen
    import uuid
    new_test_case = {
        "id": str(uuid.uuid4()),
        "test_id": test_id,
        "name": test_case_data.name,
        "area": test_case_data.area,
        "description": test_case_data.description,
        "priority": test_case_data.priority,
        "expected_result": test_case_data.expected_result,
        "status": test_case_data.status or "pending",
        "note": test_case_data.note,
        "project_id": test_case_data.project_id,
        "created_by": current_user.id,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await test_cases_collection.insert_one(new_test_case)
    
    return TestCaseV2(**new_test_case)


@router.put("/{test_case_id}", response_model=TestCaseV2)
async def update_test_case(
    test_case_id: str,
    test_case_data: TestCaseCreateV2,
    current_user: User = Depends(get_current_user)
):
    """Test-Case aktualisieren (SysOp, Admin, QA-Tester kann Notizen bearbeiten)"""
    db = await get_database()
    test_cases_collection = db.test_cases_v2
    projects_collection = db.projects_v2
    
    test_case = await test_cases_collection.find_one({"id": test_case_id})
    if not test_case:
        raise HTTPException(status_code=404, detail="Test-Case nicht gefunden")
    
    # Projekt prüfen
    project = await projects_collection.find_one({"id": test_case["project_id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Berechtigungsprüfung
    if current_user.role == "qa_tester":
        is_assigned = any(t["user_id"] == current_user.id for t in project.get("assigned_testers", []))
        if not is_assigned:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Test-Case")
        # QA-Tester darf nur Notizen bearbeiten
        update_data = {
            "note": test_case_data.note,
            "updated_at": datetime.utcnow().isoformat()
        }
    elif current_user.role == "admin":
        if project["company_id"] != current_user.company_id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Test-Case")
        # Admin darf alles außer test_id bearbeiten
        update_data = {
            "name": test_case_data.name,
            "area": test_case_data.area,
            "description": test_case_data.description,
            "priority": test_case_data.priority,
            "expected_result": test_case_data.expected_result,
            "status": test_case_data.status,
            "note": test_case_data.note,
            "updated_at": datetime.utcnow().isoformat()
        }
    else:  # sysop
        # SysOp darf alles bearbeiten
        update_data = {
            "name": test_case_data.name,
            "area": test_case_data.area,
            "description": test_case_data.description,
            "priority": test_case_data.priority,
            "expected_result": test_case_data.expected_result,
            "status": test_case_data.status,
            "note": test_case_data.note,
            "updated_at": datetime.utcnow().isoformat()
        }
    
    await test_cases_collection.update_one(
        {"id": test_case_id},
        {"$set": update_data}
    )
    
    updated_test_case = await test_cases_collection.find_one({"id": test_case_id})
    return TestCaseV2(**updated_test_case)


@router.delete("/{test_case_id}")
async def delete_test_case(
    test_case_id: str,
    current_user: User = Depends(get_current_user)
):
    """Test-Case löschen (nur SysOp und Admin)"""
    if current_user.role not in ["sysop", "admin"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zum Löschen von Test-Cases")
    
    db = await get_database()
    test_cases_collection = db.test_cases_v2
    projects_collection = db.projects_v2
    
    test_case = await test_cases_collection.find_one({"id": test_case_id})
    if not test_case:
        raise HTTPException(status_code=404, detail="Test-Case nicht gefunden")
    
    # Admin: Nur für eigene Firma
    if current_user.role == "admin":
        project = await projects_collection.find_one({"id": test_case["project_id"]})
        if not project or project["company_id"] != current_user.company_id:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für diesen Test-Case")
    
    await test_cases_collection.delete_one({"id": test_case_id})
    
    return {"message": "Test-Case erfolgreich gelöscht"}
