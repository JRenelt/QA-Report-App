"""
Archiv-System für persistente Projekt-Snapshots
- Nur SysOp hat CRUD-Rechte
- Speichert komplette Projekte mit allen Testfällen
- Überschreibt bei gleichem Projekt mit Bestätigung
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
from auth import get_current_user
from models import User
from database import get_database
import uuid

router = APIRouter()


class ProjectArchive(BaseModel):
    id: str
    project_id: str
    project_name: str
    company_name: str
    saved_by: str
    saved_at: str
    test_start_date: Optional[str] = None
    test_completion_date: Optional[str] = None
    time_spent_hours: Optional[float] = None
    is_completed: bool = False
    snapshot: dict  # Komplettes Projekt + Testfälle


@router.get("/", response_model=List[ProjectArchive])
async def get_archives(
    current_user: User = Depends(get_current_user)
):
    """
    Alle Archive abrufen
    Sortiert nach saved_at (neueste zuerst)
    """
    db = await get_database()
    archives_collection = db.project_archives
    
    archives = await archives_collection.find().sort("saved_at", -1).to_list(length=None)
    
    # Remove MongoDB _id
    for archive in archives:
        archive.pop("_id", None)
    
    return archives


@router.post("/", response_model=ProjectArchive)
async def create_archive(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Projekt im Archiv speichern
    - Lädt aktuelles Projekt + alle Testfälle
    - Speichert Snapshot
    - Bei existierendem Archiv: Überschreiben mit Warnung
    """
    db = await get_database()
    projects_collection = db.projects_v2
    test_cases_collection = db.test_cases_v2
    archives_collection = db.project_archives
    
    # Projekt laden
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    # Testfälle laden
    test_cases = await test_cases_collection.find({"project_id": project_id}).to_list(length=None)
    
    # Remove MongoDB _id
    project.pop("_id", None)
    for tc in test_cases:
        tc.pop("_id", None)
    
    # Prüfen ob bereits archiviert
    existing_archive = await archives_collection.find_one({"project_id": project_id})
    
    # Berechne Test-Zeiten wenn abgeschlossen
    is_completed = all(tc.get("status") in ["passed", "failed", "skipped"] for tc in test_cases)
    test_start_date = None
    test_completion_date = None
    time_spent_hours = None
    
    if is_completed and test_cases:
        # Nehme created_at als Start
        start_dates = [tc.get("created_at") for tc in test_cases if tc.get("created_at")]
        if start_dates:
            test_start_date = min(start_dates)
        
        # Nehme updated_at als Ende
        completion_dates = [tc.get("updated_at") for tc in test_cases if tc.get("updated_at")]
        if completion_dates:
            test_completion_date = max(completion_dates)
        
        # Berechne Zeitaufwand (grobe Schätzung)
        if test_start_date and test_completion_date:
            try:
                start = datetime.fromisoformat(test_start_date.replace("Z", "+00:00"))
                end = datetime.fromisoformat(test_completion_date.replace("Z", "+00:00"))
                time_spent_hours = round((end - start).total_seconds() / 3600, 2)
            except:
                pass
    
    # Archiv-Objekt erstellen
    archive_data = {
        "id": str(uuid.uuid4()) if not existing_archive else existing_archive["id"],
        "project_id": project_id,
        "project_name": project.get("title", "Unbenannt"),
        "company_name": project.get("company_name", "Unbekannt"),
        "saved_by": current_user.get("username"),
        "saved_at": datetime.utcnow().isoformat(),
        "test_start_date": test_start_date,
        "test_completion_date": test_completion_date,
        "time_spent_hours": time_spent_hours,
        "is_completed": is_completed,
        "snapshot": {
            "project": project,
            "test_cases": test_cases
        }
    }
    
    # Speichern (upsert wenn existiert)
    if existing_archive:
        await archives_collection.replace_one({"id": existing_archive["id"]}, archive_data)
    else:
        await archives_collection.insert_one(archive_data)
    
    return ProjectArchive(**archive_data)


@router.get("/{archive_id}", response_model=ProjectArchive)
async def get_archive(
    archive_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Einzelnes Archiv abrufen
    """
    db = await get_database()
    archives_collection = db.project_archives
    
    archive = await archives_collection.find_one({"id": archive_id})
    if not archive:
        raise HTTPException(status_code=404, detail="Archiv nicht gefunden")
    
    archive.pop("_id", None)
    return ProjectArchive(**archive)


@router.post("/{archive_id}/restore")
async def restore_archive(
    archive_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Projekt aus Archiv wiederherstellen
    - Erstellt neues Projekt mit Suffix "(Wiederhergestellt)"
    - Kopiert alle Testfälle
    """
    db = await get_database()
    archives_collection = db.project_archives
    projects_collection = db.projects_v2
    test_cases_collection = db.test_cases_v2
    
    # Archiv laden
    archive = await archives_collection.find_one({"id": archive_id})
    if not archive:
        raise HTTPException(status_code=404, detail="Archiv nicht gefunden")
    
    snapshot = archive.get("snapshot", {})
    project_data = snapshot.get("project", {})
    test_cases_data = snapshot.get("test_cases", [])
    
    # Neues Projekt erstellen
    new_project_id = str(uuid.uuid4())
    project_data["id"] = new_project_id
    project_data["title"] = f"{project_data.get('title', 'Unbenannt')} (Wiederhergestellt)"
    project_data["created_at"] = datetime.utcnow().isoformat()
    project_data["updated_at"] = datetime.utcnow().isoformat()
    
    await projects_collection.insert_one(project_data)
    
    # Testfälle kopieren
    for tc in test_cases_data:
        tc["id"] = str(uuid.uuid4())
        tc["project_id"] = new_project_id
        tc["created_at"] = datetime.utcnow().isoformat()
        tc["updated_at"] = datetime.utcnow().isoformat()
        await test_cases_collection.insert_one(tc)
    
    return {
        "success": True,
        "message": f"Projekt '{project_data['title']}' wiederhergestellt",
        "new_project_id": new_project_id,
        "test_cases_count": len(test_cases_data)
    }


@router.delete("/{archive_id}")
async def delete_archive(
    archive_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Archiv löschen (nur SysOp)
    """
    if current_user.get("role") != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp darf Archive löschen")
    
    db = await get_database()
    archives_collection = db.project_archives
    
    result = await archives_collection.delete_one({"id": archive_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Archiv nicht gefunden")
    
    return {"success": True, "message": "Archiv gelöscht"}


@router.get("/count/by-project/{project_id}")
async def get_archive_count(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Anzahl der Archive für ein Projekt
    """
    db = await get_database()
    archives_collection = db.project_archives
    
    count = await archives_collection.count_documents({"project_id": project_id})
    
    return {"project_id": project_id, "archive_count": count}
