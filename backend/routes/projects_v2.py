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

def generate_project_id(project_title: str, company_name: str, user_first_name: str, user_last_name: str) -> str:
    """
    Generiere Projekt-ID:
    Format: [Anfangsbuchstabe erste 3 Worte Projektname]_[Anfangsbuchstaben Firmenname]_[Vorname+Nachname]_[Datum YYYY.MM.DD]_[Zeit HH.MM]
    Beispiel: TWR_MI_JR_2025.10.29_14.30
    """
    # Hole Anfangsbuchstaben der ersten 3 Worte des Projektnamens
    project_words = project_title.split()[:3]
    project_initials = ''.join([word[0].upper() for word in project_words if word])
    
    # Hole Anfangsbuchstaben des Firmennamens (alle Worte)
    company_words = company_name.split()
    company_initials = ''.join([word[0].upper() for word in company_words if word])
    
    # Hole Anfangsbuchstaben Vor+Nachname
    first_initial = user_first_name[0].upper() if user_first_name else "X"
    last_initial = user_last_name[0].upper() if user_last_name else "X"
    user_initials = f"{first_initial}{last_initial}"
    
    # Hole aktuelles Datum und Zeit
    now = datetime.utcnow()
    date_str = now.strftime("%Y.%m.%d")
    time_str = now.strftime("%H.%M")
    
    return f"{project_initials}_{company_initials}_{user_initials}_{date_str}_{time_str}"

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
        query["company_id"] = current_user.company_id
    else:
        # QA-Tester: Nur zugewiesene Projekte
        query["assigned_testers.user_id"] = current_user.id
    
    # Filter: Keine gesperrten Projekte für QA-Tester
    if current_user.role == "qa_tester":
        query["is_blocked"] = False
        # Prüfe blocked_projects des Users
        query["id"] = {"$nin": getattr(current_user, "blocked_projects", [])}
    
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
        if current_user.id not in assigned_user_ids:
            raise HTTPException(status_code=403, detail="Keine Berechtigung für dieses Projekt")
    elif current_user.role == "admin":
        # Admin: Nur eigene Firma
        if project["company_id"] != current_user.company_id:
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
    if current_user.role == "admin" and project_data.company_id != current_user.company_id:
        raise HTTPException(status_code=403, detail="Admin kann nur Projekte für eigene Firma anlegen")
    
    # Get company info
    company = await companies_collection.find_one({"id": project_data.company_id})
    if not company:
        raise HTTPException(status_code=404, detail="Firma nicht gefunden")
    
    # Generate project_id
    project_id_str = generate_project_id(
        project_data.title,
        company["name"],
        current_user.first_name,
        current_user.last_name
    )
    
    new_project = {
        "id": str(uuid.uuid4()),
        "project_id": project_id_str,
        **project_data.dict(),
        "company_name": company["name"],
        "status": ProjectStatus.active.value,
        "is_blocked": False,
        "assigned_testers": [],
        "created_by": current_user.id,
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
        if current_user.id not in assigned_user_ids:
            raise HTTPException(status_code=403, detail="Keine Berechtigung")
        
        # Nur 'notes' erlaubt
        allowed_fields = {"notes"}
        update_fields = {k: v for k, v in project_update.dict(exclude_unset=True).items() if k in allowed_fields}
        
        if not update_fields:
            raise HTTPException(status_code=400, detail="QA-Tester können nur 'notes' bearbeiten")
    elif current_user.role == "admin":
        # Admin: Nur eigene Firma
        if project["company_id"] != current_user.company_id:
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
    if current_user.role == "admin" and project["company_id"] != current_user.company_id:
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
    if current_user.role == "admin" and project["company_id"] != current_user.company_id:
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
    if current_user.role == "admin" and project["company_id"] != current_user.company_id:
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
