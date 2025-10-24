"""
Project Management V2 - Komplett überarbeitet
- Projekt-ID Format: [2Buchst-Firma][1Vorname][1Nachname][UHRZEIT][LfdNr]
- SysOp: Volle CRUD über alle Projekte (mit Firmen-Auswahl)
- Admin: Volle CRUD über eigene Firmen-Projekte
- QA-Tester: Nur zugewiesene Projekte, optional Edit
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List
from auth import get_current_user
from database import get_database
from models_v2 import (
    ProjectV2, ProjectCreateV2, ProjectUpdateV2, QATesterAssignment, ProjectStatus
)
import uuid
from datetime import datetime

router = APIRouter(prefix="/projects-v2", tags=["projects-v2"])

def generate_project_id(company_short_code: str, user_first_name: str, user_last_name: str, sequence_number: int) -> str:
    """
    Generiere Projekt-ID:
    Format: [2Buchst-Firma][1Vorname][1Nachname][UHRZEIT][LfdNr]
    Beispiel: IDJR143025001
    """
    # Hole erste Buchstaben
    first_initial = user_first_name[0].upper() if user_first_name else "X"
    last_initial = user_last_name[0].upper() if user_last_name else "X"
    
    # Hole aktuelle Zeit (HHMMSS)
    current_time = datetime.utcnow().strftime("%H%M%S")
    
    # 3-stellige Laufende Nummer
    sequence = str(sequence_number).zfill(3)
    
    return f"{company_short_code}{first_initial}{last_initial}{current_time}{sequence}"

@router.get("/", response_model=List[ProjectV2])
async def get_projects(
    company_id: str = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Get projects based on role:
    - SysOp: Alle Projekte (mit optionalem Firmen-Filter)
    - Admin: Nur Projekte seiner Firma
    - QA-Tester: Nur zugewiesene Projekte
    """
    db = await get_database()
    projects_collection = db["projects_v2"]
    
    query = {}
    
    if current_user.role == "sysop":
        # SysOp: Optional nach Firma filtern
        if company_id:
            query["company_id"] = company_id
    elif current_user.role == "admin":
        # Admin: Nur eigene Firma
        query["company_id"] = current_user["company_id"]
    else:
        # QA-Tester: Nur zugewiesene Projekte
        query["assigned_testers.user_id"] = current_user["id"]
    
    # Filter: Keine gesperrten Projekte für QA-Tester
    if current_user.role == "qa_tester":
        query["is_blocked"] = False
        # Prüfe blocked_projects des Users
        query["id"] = {"$nin": current_user.get("blocked_projects", [])}
    
    projects = await projects_collection.find(query).to_list(length=None)
    
    for project in projects:
        project.pop("_id", None)
    
    return projects

@router.get("/{project_id}", response_model=ProjectV2)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """Get single project"""
    db = await get_database()
    projects_collection = db["projects_v2"]
    
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Permission Check
    if current_user.role == "qa_tester":
        # QA-Tester: Nur zugewiesene Projekte
        assigned_user_ids = [t["user_id"] for t in project.get("assigned_testers", [])]
        if current_user["id"] not in assigned_user_ids:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für dieses Projekt")
    elif current_user.role == "admin":
        # Admin: Nur eigene Firma
        if project["company_id"] != current_user["company_id"]:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    project.pop("_id", None)
    return project

@router.post("/", response_model=ProjectV2)
async def create_project(project_data: ProjectCreateV2, current_user: dict = Depends(get_current_user)):
    """
    Create new project (SysOp + Admin)
    """
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="QA-Tester können keine Projekte anlegen")
    
    db = await get_database()
    projects_collection = db["projects_v2"]
    companies_collection = db["companies_v2"]
    
    # Permission Check für Admin
    if current_user.role == "admin" and project_data.company_id != current_user["company_id"]:
        raise HTTPException(status_code=403, detail="Admin kann nur Projekte für eigene Firma anlegen")
    
    # Get company info
    company = await companies_collection.find_one({"id": project_data.company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Firma nicht gefunden")
    
    # Get sequence number (count existing projects for this company)
    existing_count = await projects_collection.count_documents({"company_id": project_data.company_id})
    sequence_number = existing_count + 1
    
    # Generate project_id
    project_id_str = generate_project_id(
        company["short_code"],
        current_user.get("first_name", ""),
        current_user.get("last_name", ""),
        sequence_number
    )
    
    new_project = {
        "id": str(uuid.uuid4()),
        "project_id": project_id_str,
        **project_data.dict(),
        "company_name": company["name"],
        "status": ProjectStatus.active.value,
        "is_blocked": False,
        "assigned_testers": [],
        "created_by": current_user["id"],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    await projects_collection.insert_one(new_project)
    
    new_project.pop("_id")
    return new_project

@router.put("/{project_id}", response_model=ProjectV2)
async def update_project(
    project_id: str,
    project_update: ProjectUpdateV2,
    current_user: dict = Depends(get_current_user)
):
    """
    Update project:
    - SysOp: Volle Bearbeitung
    - Admin: Volle Bearbeitung für eigene Firma
    - QA-Tester: Nur 'notes' Feld (wenn zugewiesen)
    """
    db = await get_database()
    projects_collection = db["projects_v2"]
    
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Permission Check & Field Restrictions
    if current_user.role == "qa_tester":
        # QA-Tester: Nur zugewiesene Projekte & nur 'notes' änderbar
        assigned_user_ids = [t["user_id"] for t in project.get("assigned_testers", [])]
        if current_user["id"] not in assigned_user_ids:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")
        
        # Nur 'notes' erlaubt
        allowed_fields = {"notes"}
        update_fields = {k: v for k, v in project_update.dict(exclude_unset=True).items() if k in allowed_fields}
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="QA-Tester können nur 'notes' bearbeiten")
    elif current_user.role == "admin":
        # Admin: Nur eigene Firma
        if project["company_id"] != current_user["company_id"]:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")
        update_fields = project_update.dict(exclude_unset=True)
    else:
        # SysOp: Alles
        update_fields = project_update.dict(exclude_unset=True)
    
    update_fields["updated_at"] = datetime.utcnow().isoformat()
    
    await projects_collection.update_one(
        {"id": project_id},
        {"$set": update_fields}
    )
    
    updated_project = await projects_collection.find_one({"id": project_id})
    updated_project.pop("_id", None)
    return updated_project

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """
    Delete project (SysOp + Admin)
    """
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="QA-Tester können keine Projekte löschen")
    
    db = await get_database()
    projects_collection = db["projects_v2"]
    test_cases_collection = db["test_cases_v2"]
    
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Permission Check
    if current_user.role == "admin" and project["company_id"] != current_user["company_id"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    # Delete associated test cases
    await test_cases_collection.delete_many({"project_id": project_id})
    
    await projects_collection.delete_one({"id": project_id})
    
    return {"message": "Projekt erfolgreich gelöscht"}

@router.post("/{project_id}/assign-tester/{user_id}")
async def assign_tester_to_project(
    project_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Assign QA-Tester to project (SysOp + Admin)
    """
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    db = await get_database()
    projects_collection = db["projects_v2"]
    users_collection = db["users_v2"]
    
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Permission Check
    if current_user.role == "admin" and project["company_id"] != current_user["company_id"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    # Get user
    user = await users_collection.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User nicht gefunden")
    
    # Check if already assigned
    assigned_testers = project.get("assigned_testers", [])
    if any(t["user_id"] == user_id for t in assigned_testers):
        raise HTTPException(status_code=400, detail="User bereits zugewiesen")
    
    # Add assignment
    new_assignment = {
        "user_id": user_id,
        "username": user["username"],
        "assigned_at": datetime.utcnow().isoformat()
    }
    assigned_testers.insert(0, new_assignment)  # Neuester oben
    
    await projects_collection.update_one(
        {"id": project_id},
        {"$set": {"assigned_testers": assigned_testers, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": "QA-Tester zugewiesen", "assigned_testers": assigned_testers}

@router.delete("/{project_id}/assign-tester/{user_id}")
async def remove_tester_from_project(
    project_id: str,
    user_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Remove QA-Tester from project (SysOp + Admin)
    """
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    db = await get_database()
    projects_collection = db["projects_v2"]
    
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Permission Check
    if current_user.role == "admin" and project["company_id"] != current_user["company_id"]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    # Remove assignment
    assigned_testers = project.get("assigned_testers", [])
    assigned_testers = [t for t in assigned_testers if t["user_id"] != user_id]
    
    await projects_collection.update_one(
        {"id": project_id},
        {"$set": {"assigned_testers": assigned_testers, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": "QA-Tester entfernt", "assigned_testers": assigned_testers}

@router.post("/{project_id}/block")
async def block_project(project_id: str, current_user: dict = Depends(get_current_user)):
    """
    Block/Unblock project (nur SysOp)
    """
    if current_user.role != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp kann Projekte sperren")
    
    db = await get_database()
    projects_collection = db["projects_v2"]
    
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Toggle block status
    new_status = not project.get("is_blocked", False)
    await projects_collection.update_one(
        {"id": project_id},
        {"$set": {"is_blocked": new_status, "updated_at": datetime.utcnow().isoformat()}}
    )
    
    return {"message": f"Projekt {'gesperrt' if new_status else 'entsperrt'}", "is_blocked": new_status}
