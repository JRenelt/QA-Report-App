"""
Import-Funktionen für V2 Management
- CSV/JSON Import für Companies, Users, Projects, Test Cases
- Duplikatsprüfung und Überspringen
- Rollenbasierte Berechtigungen
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import List, Dict, Any
import csv
import json
import io
from datetime import datetime
from auth import get_current_user
from models_v2 import (
    UserV2, CompanyV2, ProjectV2, TestCaseV2,
    CompanyCreateV2, UserCreateV2, ProjectCreateV2, TestCaseCreateV2,
    UserRoleV2
)
from database import get_database
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# Helper: Get max upload size from settings
async def get_max_upload_size() -> int:
    """Holt die maximale Upload-Größe aus den Einstellungen (in Bytes)"""
    db = get_database()
    settings = await db.settings_v2.find_one({"key": "max_upload_size"})
    if settings:
        return settings.get("value", 5 * 1024 * 1024)  # Default 5 MB
    return 5 * 1024 * 1024  # Default 5 MB


# Helper: Parse CSV
def parse_csv(content: bytes) -> List[Dict[str, Any]]:
    """Parst CSV-Datei"""
    try:
        text = content.decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        return list(reader)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"CSV-Parsing-Fehler: {str(e)}")


# Helper: Parse JSON
def parse_json(content: bytes) -> List[Dict[str, Any]]:
    """Parst JSON-Datei"""
    try:
        text = content.decode('utf-8')
        data = json.loads(text)
        if isinstance(data, list):
            return data
        elif isinstance(data, dict) and 'data' in data:
            return data['data']
        else:
            raise ValueError("JSON muss Array sein oder 'data'-Array enthalten")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"JSON-Parsing-Fehler: {str(e)}")


# ==================== COMPANIES IMPORT ====================
@router.post("/companies")
async def import_companies(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # "csv" or "json"
    current_user: dict = Depends(get_current_user)
):
    """
    Import von Firmen (nur SysOp)
    Duplikate werden übersprungen (basierend auf short_code)
    """
    # Rollenprüfung
    if current_user.get("role") != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp darf Firmen importieren")
    
    # Dateigröße prüfen
    max_size = await get_max_upload_size()
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu groß. Maximal {max_size / (1024 * 1024):.1f} MB erlaubt"
        )
    
    # Datei parsen
    if file_type == "csv":
        data = parse_csv(content)
    elif file_type == "json":
        data = parse_json(content)
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Dateityp. Nur 'csv' oder 'json' erlaubt")
    
    db = get_database()
    companies_collection = db.companies_v2
    
    imported = 0
    skipped = 0
    errors = []
    preview_data = []
    
    for idx, row in enumerate(data):
        try:
            # Pflichtfelder prüfen
            if not row.get("name") or not row.get("short_code"):
                errors.append(f"Zeile {idx + 1}: Pflichtfelder 'name' und 'short_code' fehlen")
                continue
            
            # Duplikatsprüfung (basierend auf short_code)
            existing = await companies_collection.find_one({"short_code": row["short_code"]})
            is_duplicate = existing is not None
            
            preview_data.append({
                "row": idx + 1,
                "name": row.get("name"),
                "short_code": row.get("short_code"),
                "is_duplicate": is_duplicate
            })
            
            if is_duplicate:
                skipped += 1
                continue
            
            # Firma erstellen
            company_data = {
                "name": row["name"],
                "short_code": row["short_code"],
                "description": row.get("description"),
                "logo_url": row.get("logo_url"),
                "street": row.get("street"),
                "postal_code": row.get("postal_code"),
                "city": row.get("city"),
                "country": row.get("country", "Deutschland"),
                "contact_person_name": row.get("contact_person_name"),
                "contact_person_email": row.get("contact_person_email"),
                "contact_person_phone": row.get("contact_person_phone"),
                "is_blocked": False,
                "is_deletable": True,
                "created_by": current_user.username,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # ID generieren
            import uuid
            company_data["id"] = str(uuid.uuid4())
            
            await companies_collection.insert_one(company_data)
            imported += 1
            
        except Exception as e:
            errors.append(f"Zeile {idx + 1}: {str(e)}")
    
    return {
        "success": True,
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "preview": preview_data
    }


# ==================== USERS IMPORT ====================
@router.post("/users")
async def import_users(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # "csv" or "json"
    current_user: UserV2 = Depends(get_current_user_v2)
):
    """
    Import von Benutzern (SysOp & Admin)
    - SysOp: Kann alle User importieren
    - Admin: Nur User der eigenen Firma
    Duplikate werden übersprungen (basierend auf username oder email)
    """
    # Rollenprüfung
    if current_user.role not in [UserRoleV2.sysop, UserRoleV2.admin]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zum User-Import")
    
    # Dateigröße prüfen
    max_size = await get_max_upload_size()
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu groß. Maximal {max_size / (1024 * 1024):.1f} MB erlaubt"
        )
    
    # Datei parsen
    if file_type == "csv":
        data = parse_csv(content)
    elif file_type == "json":
        data = parse_json(content)
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Dateityp")
    
    db = get_database()
    users_collection = db.users_v2
    
    imported = 0
    skipped = 0
    errors = []
    preview_data = []
    
    for idx, row in enumerate(data):
        try:
            # Pflichtfelder prüfen
            required = ["username", "email", "first_name", "last_name", "tel", "role", "company_id", "password"]
            missing = [f for f in required if not row.get(f)]
            if missing:
                errors.append(f"Zeile {idx + 1}: Fehlende Felder: {', '.join(missing)}")
                continue
            
            # Admin darf nur User der eigenen Firma importieren
            if current_user.role == UserRoleV2.admin:
                if row["company_id"] != current_user.company_id:
                    errors.append(f"Zeile {idx + 1}: Admin darf nur User der eigenen Firma importieren")
                    continue
            
            # Duplikatsprüfung (username oder email)
            existing = await users_collection.find_one({
                "$or": [
                    {"username": row["username"]},
                    {"email": row["email"]}
                ]
            })
            is_duplicate = existing is not None
            
            preview_data.append({
                "row": idx + 1,
                "username": row.get("username"),
                "email": row.get("email"),
                "company_id": row.get("company_id"),
                "is_duplicate": is_duplicate
            })
            
            if is_duplicate:
                skipped += 1
                continue
            
            # User erstellen
            user_data = {
                "username": row["username"],
                "email": row["email"],
                "first_name": row["first_name"],
                "last_name": row["last_name"],
                "tel": row["tel"],
                "role": row["role"],
                "company_id": row["company_id"],
                "language_preference": row.get("language_preference", "DE"),
                "hashed_password": pwd_context.hash(row["password"]),
                "is_active": True,
                "is_blocked": False,
                "is_deletable": True,
                "blocked_projects": [],
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # ID generieren
            import uuid
            user_data["id"] = str(uuid.uuid4())
            
            await users_collection.insert_one(user_data)
            imported += 1
            
        except Exception as e:
            errors.append(f"Zeile {idx + 1}: {str(e)}")
    
    return {
        "success": True,
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "preview": preview_data
    }


# ==================== PROJECTS IMPORT ====================
@router.post("/projects")
async def import_projects(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # "csv" or "json"
    current_user: UserV2 = Depends(get_current_user_v2)
):
    """
    Import von Projekten (SysOp, Admin, optional QA-Tester)
    Duplikate werden übersprungen (basierend auf title + company_id)
    """
    # Rollenprüfung (alle Rollen erlaubt, aber unterschiedliche Rechte)
    if current_user.role not in [UserRoleV2.sysop, UserRoleV2.admin, UserRoleV2.qa_tester]:
        raise HTTPException(status_code=403, detail="Keine Berechtigung zum Projekt-Import")
    
    # Dateigröße prüfen
    max_size = await get_max_upload_size()
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu groß. Maximal {max_size / (1024 * 1024):.1f} MB erlaubt"
        )
    
    # Datei parsen
    if file_type == "csv":
        data = parse_csv(content)
    elif file_type == "json":
        data = parse_json(content)
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Dateityp")
    
    db = get_database()
    projects_collection = db.projects_v2
    companies_collection = db.companies_v2
    
    imported = 0
    skipped = 0
    errors = []
    preview_data = []
    
    # Sequenznummer-Zähler für jede Firma
    seq_counters = {}
    
    for idx, row in enumerate(data):
        try:
            # Pflichtfelder prüfen
            if not row.get("title") or not row.get("company_id"):
                errors.append(f"Zeile {idx + 1}: Pflichtfelder 'title' und 'company_id' fehlen")
                continue
            
            # Admin/QA-Tester darf nur Projekte der eigenen Firma importieren
            if current_user.role in [UserRoleV2.admin, UserRoleV2.qa_tester]:
                if row["company_id"] != current_user.company_id:
                    errors.append(f"Zeile {idx + 1}: Keine Berechtigung für diese Firma")
                    continue
            
            # Duplikatsprüfung (title + company_id)
            existing = await projects_collection.find_one({
                "title": row["title"],
                "company_id": row["company_id"]
            })
            is_duplicate = existing is not None
            
            preview_data.append({
                "row": idx + 1,
                "title": row.get("title"),
                "company_id": row.get("company_id"),
                "is_duplicate": is_duplicate
            })
            
            if is_duplicate:
                skipped += 1
                continue
            
            # Firma laden für project_id Generierung
            company = await companies_collection.find_one({"id": row["company_id"]})
            if not company:
                errors.append(f"Zeile {idx + 1}: Firma nicht gefunden")
                continue
            
            # Sequenznummer für diese Firma
            if row["company_id"] not in seq_counters:
                # Höchste Sequenznummer für diese Firma ermitteln
                last_project = await projects_collection.find_one(
                    {"company_id": row["company_id"]},
                    sort=[("created_at", -1)]
                )
                if last_project:
                    # Extrahiere Sequenznummer aus project_id (letzten 2 Ziffern)
                    try:
                        seq_counters[row["company_id"]] = int(last_project["project_id"][-2:]) + 1
                    except:
                        seq_counters[row["company_id"]] = 1
                else:
                    seq_counters[row["company_id"]] = 1
            else:
                seq_counters[row["company_id"]] += 1
            
            # Projekt-ID generieren: [2Char-Company][1F][1L][TIME][SeqNr]
            from datetime import datetime
            now = datetime.utcnow()
            time_part = now.strftime("%H%M")
            seq_part = f"{seq_counters[row['company_id']]:02d}"
            first_char = current_user.first_name[0].upper() if current_user.first_name else "X"
            last_char = current_user.last_name[0].upper() if current_user.last_name else "X"
            project_id = f"{company['short_code']}{first_char}{last_char}{time_part}{seq_part}"
            
            # Projekt erstellen
            project_data = {
                "title": row["title"],
                "description": row.get("description", ""),
                "notes": row.get("notes"),
                "company_id": row["company_id"],
                "company_name": company["name"],
                "project_id": project_id,
                "status": "active",
                "is_blocked": False,
                "assigned_testers": [],
                "created_by": current_user.username,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # ID generieren
            import uuid
            project_data["id"] = str(uuid.uuid4())
            
            await projects_collection.insert_one(project_data)
            imported += 1
            
        except Exception as e:
            errors.append(f"Zeile {idx + 1}: {str(e)}")
    
    return {
        "success": True,
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "preview": preview_data
    }


# ==================== TEST CASES IMPORT ====================
@router.post("/test-cases")
async def import_test_cases(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # "csv" or "json"
    current_user: UserV2 = Depends(get_current_user_v2)
):
    """
    Import von Testfällen (alle Rollen)
    Duplikate werden übersprungen (basierend auf test_id + project_id)
    """
    # Dateigröße prüfen
    max_size = await get_max_upload_size()
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu groß. Maximal {max_size / (1024 * 1024):.1f} MB erlaubt"
        )
    
    # Datei parsen
    if file_type == "csv":
        data = parse_csv(content)
    elif file_type == "json":
        data = parse_json(content)
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Dateityp")
    
    db = get_database()
    test_cases_collection = db.test_cases_v2
    projects_collection = db.projects_v2
    
    imported = 0
    skipped = 0
    errors = []
    preview_data = []
    
    for idx, row in enumerate(data):
        try:
            # Pflichtfelder prüfen
            if not row.get("name") or not row.get("project_id"):
                errors.append(f"Zeile {idx + 1}: Pflichtfelder 'name' und 'project_id' fehlen")
                continue
            
            # Projekt existiert?
            project = await projects_collection.find_one({"id": row["project_id"]})
            if not project:
                errors.append(f"Zeile {idx + 1}: Projekt nicht gefunden")
                continue
            
            # Berechtigungsprüfung: QA-Tester nur für eigene Projekte
            if current_user.role == UserRoleV2.qa_tester:
                is_assigned = any(t["user_id"] == current_user.id for t in project.get("assigned_testers", []))
                if not is_assigned:
                    errors.append(f"Zeile {idx + 1}: Keine Berechtigung für dieses Projekt")
                    continue
            elif current_user.role == UserRoleV2.admin:
                if project["company_id"] != current_user.company_id:
                    errors.append(f"Zeile {idx + 1}: Projekt gehört nicht zur eigenen Firma")
                    continue
            
            # test_id generieren falls nicht vorhanden
            if not row.get("test_id"):
                # Höchste test_id für dieses Projekt ermitteln
                last_test = await test_cases_collection.find_one(
                    {"project_id": row["project_id"]},
                    sort=[("created_at", -1)]
                )
                if last_test:
                    # Extrahiere Nummer aus test_id und erhöhe
                    try:
                        last_num = int(last_test["test_id"].split("-")[-1])
                        row["test_id"] = f"{project['project_id']}-{last_num + 1:04d}"
                    except:
                        row["test_id"] = f"{project['project_id']}-0001"
                else:
                    row["test_id"] = f"{project['project_id']}-0001"
            
            # Duplikatsprüfung (test_id)
            existing = await test_cases_collection.find_one({"test_id": row["test_id"]})
            is_duplicate = existing is not None
            
            preview_data.append({
                "row": idx + 1,
                "test_id": row.get("test_id"),
                "name": row.get("name"),
                "project_id": row.get("project_id"),
                "is_duplicate": is_duplicate
            })
            
            if is_duplicate:
                skipped += 1
                continue
            
            # Testfall erstellen
            test_case_data = {
                "test_id": row["test_id"],
                "name": row["name"],
                "description": row.get("description"),
                "area": row.get("area"),
                "project_id": row["project_id"],
                "status": row.get("status", "pending"),
                "note": row.get("note"),
                "priority": int(row.get("priority", 3)),
                "expected_result": row.get("expected_result"),
                "created_by": current_user.username,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            
            # ID generieren
            import uuid
            test_case_data["id"] = str(uuid.uuid4())
            
            await test_cases_collection.insert_one(test_case_data)
            imported += 1
            
        except Exception as e:
            errors.append(f"Zeile {idx + 1}: {str(e)}")
    
    return {
        "success": True,
        "imported": imported,
        "skipped": skipped,
        "errors": errors,
        "preview": preview_data
    }


# ==================== PREVIEW (vor Import) ====================
@router.post("/preview")
async def preview_import(
    file: UploadFile = File(...),
    file_type: str = Form(...),  # "csv" or "json"
    import_type: str = Form(...),  # "companies", "users", "projects", "test_cases"
    current_user: UserV2 = Depends(get_current_user_v2)
):
    """
    Vorschau der zu importierenden Daten mit Duplikats-Markierung
    """
    # Dateigröße prüfen
    max_size = await get_max_upload_size()
    content = await file.read()
    if len(content) > max_size:
        raise HTTPException(
            status_code=413,
            detail=f"Datei zu groß. Maximal {max_size / (1024 * 1024):.1f} MB erlaubt"
        )
    
    # Datei parsen
    if file_type == "csv":
        data = parse_csv(content)
    elif file_type == "json":
        data = parse_json(content)
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Dateityp")
    
    db = get_database()
    preview_data = []
    
    # Je nach Import-Typ unterschiedliche Duplikatsprüfung
    if import_type == "companies":
        collection = db.companies_v2
        for idx, row in enumerate(data):
            existing = await collection.find_one({"short_code": row.get("short_code")})
            preview_data.append({
                "row": idx + 1,
                "data": row,
                "is_duplicate": existing is not None
            })
    
    elif import_type == "users":
        collection = db.users_v2
        for idx, row in enumerate(data):
            existing = await collection.find_one({
                "$or": [
                    {"username": row.get("username")},
                    {"email": row.get("email")}
                ]
            })
            preview_data.append({
                "row": idx + 1,
                "data": row,
                "is_duplicate": existing is not None
            })
    
    elif import_type == "projects":
        collection = db.projects_v2
        for idx, row in enumerate(data):
            existing = await collection.find_one({
                "title": row.get("title"),
                "company_id": row.get("company_id")
            })
            preview_data.append({
                "row": idx + 1,
                "data": row,
                "is_duplicate": existing is not None
            })
    
    elif import_type == "test_cases":
        collection = db.test_cases_v2
        for idx, row in enumerate(data):
            existing = await collection.find_one({"test_id": row.get("test_id")})
            preview_data.append({
                "row": idx + 1,
                "data": row,
                "is_duplicate": existing is not None
            })
    
    else:
        raise HTTPException(status_code=400, detail="Ungültiger Import-Typ")
    
    return {
        "success": True,
        "total_rows": len(data),
        "preview": preview_data
    }


# ==================== SETTINGS ====================
@router.get("/settings/max-upload-size")
async def get_max_upload_size_setting(
    current_user: UserV2 = Depends(get_current_user_v2)
):
    """Maximale Upload-Größe abrufen (alle Rollen)"""
    size_bytes = await get_max_upload_size()
    return {
        "max_upload_size_bytes": size_bytes,
        "max_upload_size_mb": size_bytes / (1024 * 1024)
    }


@router.put("/settings/max-upload-size")
async def set_max_upload_size_setting(
    size_mb: float,
    current_user: UserV2 = Depends(get_current_user_v2)
):
    """Maximale Upload-Größe setzen (nur SysOp)"""
    if current_user.role != UserRoleV2.sysop:
        raise HTTPException(status_code=403, detail="Nur SysOp darf diese Einstellung ändern")
    
    if size_mb < 0.1 or size_mb > 100:
        raise HTTPException(status_code=400, detail="Größe muss zwischen 0.1 MB und 100 MB liegen")
    
    db = get_database()
    size_bytes = int(size_mb * 1024 * 1024)
    
    await db.settings_v2.update_one(
        {"key": "max_upload_size"},
        {"$set": {
            "value": size_bytes,
            "updated_at": datetime.utcnow().isoformat(),
            "updated_by": current_user.username
        }},
        upsert=True
    )
    
    return {
        "success": True,
        "max_upload_size_bytes": size_bytes,
        "max_upload_size_mb": size_mb
    }
