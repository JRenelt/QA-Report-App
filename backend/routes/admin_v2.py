"""
Import & Testdaten-Generierung V2
- CSV/JSON Import für Firmen, User, Projekte, Testfälle
- Testdaten-Generierung für SysOp (Massentestdaten), Admin (2 Projekte), QA-Tester (optional)
"""

from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from typing import List
from auth import get_current_user, get_password_hash
from database import get_database
from models_v2 import (
    GenerateTestDataV2, ImportCompaniesV2, ImportUsersV2,
    ImportProjectsV2, ImportTestCasesV2
)
import uuid
from datetime import datetime
import json
import csv
import io

router = APIRouter(prefix="/admin-v2", tags=["admin-v2"])

# =============================================================================
# IMPORT FUNKTIONEN
# =============================================================================

@router.post("/import-companies")
async def import_companies(
    import_data: ImportCompaniesV2,
    current_user: dict = Depends(get_current_user)
):
    """
    Import companies from JSON/CSV (nur SysOp)
    """
    if current_user.role != "sysop":
        raise HTTPException(status_code=403, detail="Nur SysOp kann Firmen importieren")
    
    db = await get_database()
    companies_collection = db["companies_v2"]
    
    created_companies = []
    
    for company_data in import_data.companies:
        # Check if company already exists
        existing = await companies_collection.find_one({"name": company_data["name"]})
        if existing:
            continue
        
        new_company = {
            "id": str(uuid.uuid4()),
            "name": company_data["name"],
            "description": company_data.get("description", ""),
            "logo_url": company_data.get("logo_url", ""),
            "short_code": company_data.get("short_code", company_data["name"][:2].upper()),
            "is_blocked": False,
            "is_deletable": True,
            "created_by": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await companies_collection.insert_one(new_company)
        created_companies.append(new_company["name"])
    
    return {
        "message": f"{len(created_companies)} Firmen importiert",
        "companies": created_companies
    }

@router.post("/import-users")
async def import_users(
    import_data: ImportUsersV2,
    current_user: dict = Depends(get_current_user)
):
    """
    Import users from JSON/CSV (SysOp + Admin)
    """
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    db = await get_database()
    users_collection = db["users_v2"]
    
    created_users = []
    
    for user_data in import_data.users:
        # Permission Check für Admin
        if current_user.role == "admin" and user_data["company_id"] != current_user.company_id:
            continue
        
        # Check if user already exists
        existing = await users_collection.find_one({"username": user_data["username"]})
        if existing:
            continue
        
        new_user = {
            "id": str(uuid.uuid4()),
            "username": user_data["username"],
            "email": user_data["email"],
            "first_name": user_data["first_name"],
            "last_name": user_data["last_name"],
            "tel": user_data.get("tel", ""),
            "role": user_data["role"],
            "company_id": user_data["company_id"],
            "language_preference": user_data.get("language_preference", "DE"),
            "hashed_password": get_password_hash(user_data["password"]),
            "is_active": True,
            "is_blocked": False,
            "is_deletable": user_data["role"] != "sysop",
            "blocked_projects": [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await users_collection.insert_one(new_user)
        created_users.append(user_data["username"])
    
    return {
        "message": f"{len(created_users)} User importiert",
        "users": created_users
    }

@router.post("/import-projects")
async def import_projects(
    import_data: ImportProjectsV2,
    current_user: dict = Depends(get_current_user)
):
    """
    Import projects from JSON/CSV (SysOp + Admin)
    """
    if current_user.role == "qa_tester":
        raise HTTPException(status_code=403, detail="Keine Berechtigung")
    
    db = await get_database()
    projects_collection = db["projects_v2"]
    companies_collection = db["companies_v2"]
    
    created_projects = []
    
    for project_data in import_data.projects:
        # Permission Check für Admin
        if current_user.role == "admin" and project_data["company_id"] != current_user.company_id:
            continue
        
        # Get company
        company = await companies_collection.find_one({"id": project_data["company_id"]})
        if not company:
            continue
        
        # Generate project_id
        sequence_number = await projects_collection.count_documents({"company_id": project_data["company_id"]}) + 1
        project_id_str = f"{company['short_code']}{current_user['first_name'][0]}{current_user['last_name'][0]}{datetime.utcnow().strftime('%H%M%S')}{str(sequence_number).zfill(3)}"
        
        new_project = {
            "id": str(uuid.uuid4()),
            "project_id": project_id_str,
            "title": project_data["title"],
            "description": project_data["description"],
            "notes": project_data.get("notes", ""),
            "company_id": project_data["company_id"],
            "company_name": company["name"],
            "status": "active",
            "is_blocked": False,
            "assigned_testers": [],
            "created_by": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await projects_collection.insert_one(new_project)
        created_projects.append(project_data["title"])
    
    return {
        "message": f"{len(created_projects)} Projekte importiert",
        "projects": created_projects
    }

# =============================================================================
# TESTDATEN-GENERIERUNG
# =============================================================================

@router.post("/generate-test-data")
async def generate_test_data(
    test_data: GenerateTestDataV2,
    current_user: dict = Depends(get_current_user)
):
    """
    Generiere Testdaten basierend auf Rolle:
    - SysOp: Massentestdaten
    - Admin: 2 Projekte mit 10 und 15 Testfällen
    - QA-Tester: Optional 1 Projekt mit 10 Testfällen
    """
    db = await get_database()
    companies_collection = db["companies_v2"]
    projects_collection = db["projects_v2"]
    test_cases_collection = db["test_cases_v2"]
    
    created_companies = 0
    created_projects = 0
    created_test_cases = 0
    
    if current_user.role == "sysop":
        # SysOp: Massentestdaten
        company_count = test_data.company_count or 2
        
        for i in range(1, company_count + 1):
            company_name = f"Test_Firma_{i}"
            short_code = f"TF{i}"
            
            # Check if company exists
            existing = await companies_collection.find_one({"name": company_name})
            if existing:
                company_id = existing["id"]
            else:
                new_company = {
                    "id": str(uuid.uuid4()),
                    "name": company_name,
                    "description": f"Testfirma {i}",
                    "logo_url": None,
                    "short_code": short_code,
                    "is_blocked": False,
                    "is_deletable": True,
                    "created_by": current_user.id,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                await companies_collection.insert_one(new_company)
                company_id = new_company["id"]
                created_companies += 1
            
            # Create projects for this company
            projects_per_company = test_data.projects_per_company or 2
            for j in range(1, projects_per_company + 1):
                sequence_number = await projects_collection.count_documents({"company_id": company_id}) + 1
                project_id_str = f"{short_code}JR{datetime.utcnow().strftime('%H%M%S')}{str(sequence_number).zfill(3)}"
                
                new_project = {
                    "id": str(uuid.uuid4()),
                    "project_id": project_id_str,
                    "title": f"Testprojekt {i}.{j}",
                    "description": f"Testprojekt {j} für {company_name}",
                    "notes": "",
                    "company_id": company_id,
                    "company_name": company_name,
                    "status": "active",
                    "is_blocked": False,
                    "assigned_testers": [],
                    "created_by": current_user.id,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                await projects_collection.insert_one(new_project)
                created_projects += 1
                
                # Create test cases
                test_cases_per_project = test_data.test_cases_per_project or 10
                for k in range(1, test_cases_per_project + 1):
                    test_id = f"{short_code}{str(k).zfill(4)}"
                    
                    new_test_case = {
                        "id": str(uuid.uuid4()),
                        "test_id": test_id,
                        "name": f"Testfall {k}",
                        "description": f"Testfall {k} für Projekt {project_id_str}",
                        "status": "pending",
                        "note": "",
                        "priority": 3,
                        "expected_result": "",
                        "project_id": new_project["id"],
                        "created_by": current_user.id,
                        "created_at": datetime.utcnow().isoformat(),
                        "updated_at": datetime.utcnow().isoformat()
                    }
                    await test_cases_collection.insert_one(new_test_case)
                    created_test_cases += 1
    
    elif current_user.role == "admin":
        # Admin: 2 Projekte mit 10 und 15 Testfällen
        company_id = current_user.company_id
        company = await companies_collection.find_one({"id": company_id})
        if not company:
            raise HTTPException(status_code=404, detail="Firma nicht gefunden")
        
        test_case_counts = [10, 15]
        
        for idx, test_count in enumerate(test_case_counts):
            sequence_number = await projects_collection.count_documents({"company_id": company_id}) + 1
            project_id_str = f"{company['short_code']}{current_user.first_name[0]}{current_user.last_name[0]}{datetime.utcnow().strftime('%H%M%S')}{str(sequence_number).zfill(3)}"
            
            new_project = {
                "id": str(uuid.uuid4()),
                "project_id": project_id_str,
                "title": f"Test-Projekt {idx + 1}",
                "description": f"Testprojekt mit {test_count} Testfällen",
                "notes": "",
                "company_id": company_id,
                "company_name": company["name"],
                "status": "active",
                "is_blocked": False,
                "assigned_testers": [],
                "created_by": current_user.id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await projects_collection.insert_one(new_project)
            created_projects += 1
            
            # Create test cases
            for k in range(1, test_count + 1):
                test_id = f"{company['short_code']}{str(k).zfill(4)}"
                
                new_test_case = {
                    "id": str(uuid.uuid4()),
                    "test_id": test_id,
                    "name": f"Testfall {k}",
                    "description": f"Testfall {k} für {new_project['title']}",
                    "status": "pending",
                    "note": "",
                    "priority": 3,
                    "expected_result": "",
                    "project_id": new_project["id"],
                    "created_by": current_user.id,
                    "created_at": datetime.utcnow().isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                }
                await test_cases_collection.insert_one(new_test_case)
                created_test_cases += 1
    
    elif current_user.role == "qa_tester":
        # QA-Tester: Optional 1 Projekt mit 10 Testfällen
        company_id = current_user.company_id
        company = await companies_collection.find_one({"id": company_id})
        if not company:
            raise HTTPException(status_code=404, detail="Firma nicht gefunden")
        
        sequence_number = await projects_collection.count_documents({"company_id": company_id}) + 1
        project_id_str = f"{company['short_code']}{current_user['first_name'][0]}{current_user['last_name'][0]}{datetime.utcnow().strftime('%H%M%S')}{str(sequence_number).zfill(3)}"
        
        new_project = {
            "id": str(uuid.uuid4()),
            "project_id": project_id_str,
            "title": f"QA-Test-Projekt",
            "description": "Testprojekt für QA-Tester",
            "notes": "",
            "company_id": company_id,
            "company_name": company["name"],
            "status": "active",
            "is_blocked": False,
            "assigned_testers": [{
                "user_id": current_user.id,
                "username": current_user.username,
                "assigned_at": datetime.utcnow().isoformat()
            }],
            "created_by": current_user.id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        await projects_collection.insert_one(new_project)
        created_projects += 1
        
        # Create 10 test cases
        for k in range(1, 11):
            test_id = f"{company['short_code']}{str(k).zfill(4)}"
            
            new_test_case = {
                "id": str(uuid.uuid4()),
                "test_id": test_id,
                "name": f"Testfall {k}",
                "description": f"Testfall {k}",
                "status": "pending",
                "note": "",
                "priority": 3,
                "expected_result": "",
                "project_id": new_project["id"],
                "created_by": current_user.id,
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }
            await test_cases_collection.insert_one(new_test_case)
            created_test_cases += 1
    
    return {
        "message": "Testdaten erfolgreich generiert",
        "created_companies": created_companies,
        "created_projects": created_projects,
        "created_test_cases": created_test_cases
    }
