"""
Admin Routes - MongoDB Version
Dangerous operations for database management
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import Dict
from datetime import datetime
import uuid
import random
from database import (
    users_collection,
    companies_collection,
    projects_collection,
    test_suites_collection,
    test_cases_collection,
    test_results_collection,
    archives_collection,
    project_users_collection,
    reports_collection
)
from models import User
from auth import require_admin

router = APIRouter()

@router.post("/generate-test-data")
async def generate_test_data(
    data: Dict,
    current_user: User = Depends(require_admin)
):
    """
    Generate test data: N companies with M test points each
    WARNING: Deletes all existing data!
    """
    
    companies_count = data.get('companies', 15)
    tests_per_company = data.get('testsPerCompany', 100)
    
    # Clear existing data (except users)
    await companies_collection.delete_many({})
    await projects_collection.delete_many({})
    await test_suites_collection.delete_many({})
    await test_cases_collection.delete_many({})
    await test_results_collection.delete_many({})
    await archives_collection.delete_many({})
    await project_users_collection.delete_many({})
    await reports_collection.delete_many({})
    
    # Generate companies
    company_ids = []
    for i in range(companies_count):
        company = {
            "id": str(uuid.uuid4()),
            "name": f"Test Firma {i+1:02d}",
            "description": f"Automatisch generierte Testfirma Nr. {i+1}",
            "logo_url": None,
            "created_by": current_user.id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await companies_collection.insert_one(company)
        company_ids.append(company["id"])
    
    # Generate projects for each company
    project_ids = []
    templates = ["web_app_qa", "mobile_app_qa", "api_testing"]
    
    for company_id in company_ids:
        project = {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "name": f"QA-Projekt",
            "description": "Automatisch generiertes Testprojekt",
            "template_type": random.choice(templates),
            "status": "active",
            "created_by": current_user.id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await projects_collection.insert_one(project)
        project_ids.append((project["id"], project["template_type"]))
    
    # Generate test suites and test cases
    total_test_cases = 0
    suite_templates = {
        "web_app_qa": [
            {"name": "UI/UX Tests", "icon": "🎨"},
            {"name": "Funktionalität", "icon": "⚙️"},
            {"name": "Performance", "icon": "⚡"},
        ],
        "mobile_app_qa": [
            {"name": "UI Tests", "icon": "📱"},
            {"name": "Performance", "icon": "⚡"},
            {"name": "Kompatibilität", "icon": "📲"},
        ],
        "api_testing": [
            {"name": "Endpoint Tests", "icon": "🔗"},
            {"name": "Authentifizierung", "icon": "🔐"},
            {"name": "Daten-Validierung", "icon": "✅"},
        ]
    }
    
    test_statuses = ["success", "error", "warning", "skipped"]
    
    for project_id, template_type in project_ids:
        suites = suite_templates.get(template_type, suite_templates["web_app_qa"])
        tests_per_suite = tests_per_company // len(suites)
        
        for suite_idx, suite_data in enumerate(suites):
            suite = {
                "id": str(uuid.uuid4()),
                "project_id": project_id,
                "name": suite_data["name"],
                "description": None,
                "icon": suite_data["icon"],
                "sort_order": suite_idx,
                "created_at": datetime.utcnow()
            }
            await test_suites_collection.insert_one(suite)
            
            # Generate test cases
            for test_idx in range(tests_per_suite):
                test_case = {
                    "id": str(uuid.uuid4()),
                    "test_suite_id": suite["id"],
                    "test_id": f"T{suite_idx+1:02d}{test_idx+1:03d}",
                    "name": f"Testfall {test_idx+1}: {suite_data['name']}",
                    "description": f"Automatisch generierter Testfall",
                    "priority": random.randint(1, 5),
                    "expected_result": "Test sollte erfolgreich durchlaufen",
                    "sort_order": test_idx,
                    "is_predefined": True,
                    "created_by": current_user.id,
                    "created_at": datetime.utcnow()
                }
                await test_cases_collection.insert_one(test_case)
                total_test_cases += 1
                
                # Generate some test results (50% of cases)
                if random.random() > 0.5:
                    result = {
                        "id": str(uuid.uuid4()),
                        "test_case_id": test_case["id"],
                        "status": random.choice(test_statuses),
                        "notes": f"Automatisch generiertes Testergebnis",
                        "executed_by": current_user.id,
                        "execution_date": datetime.utcnow(),
                        "session_id": None
                    }
                    await test_results_collection.insert_one(result)
    
    return {
        "message": "Testdaten erfolgreich generiert",
        "companies": companies_count,
        "projects": len(project_ids),
        "testCases": total_test_cases
    }

@router.delete("/clear-database")
async def clear_database(current_user: User = Depends(require_admin)):
    """
    DANGER: Clear all projects, test data, and companies (except ID2 GmbH)
    ID2 GmbH is required for system operation (protected company)
    """
    
    # Delete ALL projects (including ID2 projects)
    deleted_projects = await projects_collection.delete_many({})
    
    # Delete all test data
    await test_suites_collection.delete_many({})
    await test_cases_collection.delete_many({})
    await test_results_collection.delete_many({})
    await archives_collection.delete_many({})
    await project_users_collection.delete_many({})
    await reports_collection.delete_many({})
    
    # Delete all companies EXCEPT ID2 GmbH (system requirement)
    deleted_companies = await companies_collection.delete_many({
        "id": {"$ne": "ID2"}  # Keep ID2 GmbH
    })
    
    # Keep admin users, delete others
    deleted_users = await users_collection.delete_many({"role": {"$ne": "admin"}})
    
    return {
        "message": "Datenbank erfolgreich geleert",
        "deleted_projects": deleted_projects.deleted_count,
        "deleted_companies": deleted_companies.deleted_count,
        "deleted_users": deleted_users.deleted_count,
        "preserved": "ID2 GmbH Firma und Admin-Benutzer beibehalten"
    }


@router.post("/optimize-database")
async def optimize_database(current_user: User = Depends(require_admin)):
    """
    Optimize MongoDB collections (similar to MySQL OPTIMIZE TABLE)
    Compacts collections to reduce disk space and improve performance
    """
    try:
        from database import db
        
        # Get list of all collections
        collection_names = await db.list_collection_names()
        
        optimized_collections = []
        errors = []
        
        # Compact each collection (MongoDB equivalent of OPTIMIZE)
        for collection_name in collection_names:
            try:
                # Run compact command on collection
                result = await db.command("compact", collection_name)
                optimized_collections.append({
                    "collection": collection_name,
                    "status": "success",
                    "result": str(result)
                })
            except Exception as e:
                errors.append({
                    "collection": collection_name,
                    "error": str(e)
                })
        
        return {
            "message": "Datenbank-Optimierung abgeschlossen",
            "optimized": len(optimized_collections),
            "errors": len(errors),
            "details": {
                "optimized_collections": optimized_collections,
                "errors": errors
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler bei der Optimierung: {str(e)}")


@router.post("/generate-mass-data")
async def generate_mass_data(
    data: Dict,
    current_user: User = Depends(require_admin)
):
    """
    DEVELOPMENT ONLY: Generate massive test data for performance testing
    Creates: 50 companies, 50 test suites per company, 50 test cases per suite
    Total: 50 companies × 50 suites × 50 cases = 125,000 test cases
    
    SAFETY: Checks if projects exist in MongoDB AND/OR localStorage before generating
    """
    import uuid
    from datetime import datetime
    
    # SAFETY CHECK 1: Check MongoDB for existing projects
    existing_projects_count = await projects_collection.count_documents({})
    
    # SAFETY CHECK 2: Check if frontend reports localStorage projects
    has_local_storage_projects = data.get('hasLocalStorageProjects', False)
    
    # If projects exist in MongoDB OR localStorage → DENY
    if existing_projects_count > 0 or has_local_storage_projects:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "Masse-Daten-Import nicht möglich. Es sind bereits Projekte vorhanden. Bitte leeren Sie zuerst die Datenbank.",
                "existing_projects_mongodb": existing_projects_count,
                "has_local_storage_projects": has_local_storage_projects
            }
        )
    
    try:
        
        # Start time
        start_time = datetime.now()
        
        stats = {
            "companies": 0,
            "projects": 0,
            "test_suites": 0,
            "test_cases": 0
        }
        
        # Generate 50 companies
        for company_num in range(1, 51):
            company = {
                "id": f"PERF_COMP_{company_num:03d}",
                "name": f"Performance Test Firma {company_num}",
                "address": f"Teststraße {company_num}",
                "city": "Hamburg",
                "postalCode": "22117",
                "country": "Deutschland",
                "createdAt": datetime.utcnow().isoformat(),
                "usersCount": 1,
                "projectsCount": 1
            }
            await companies_collection.insert_one(company)
            stats["companies"] += 1
            
            # Create 1 project per company (with 50 test suites)
            project_id = f"PERF_PROJ_{company_num:03d}"
            project = {
                "id": project_id,
                "companyId": company["id"],
                "name": f"Performance Test Projekt {company_num}",
                "description": "Automatisch generiertes Performance-Test-Projekt",
                "status": "active",
                "createdBy": current_user.username,
                "createdAt": datetime.utcnow().isoformat()
            }
            await projects_collection.insert_one(project)
            stats["projects"] += 1
            
            # Generate 50 test suites per project
            for suite_num in range(1, 51):
                suite_id = f"SUITE_{company_num:03d}_{suite_num:03d}"
                suite = {
                    "id": suite_id,
                    "project_id": project_id,
                    "name": f"Testbereich {suite_num}",
                    "description": f"Performance Test Suite {suite_num}",
                    "icon": "file",
                    "created_by": current_user.username,
                    "created_at": datetime.utcnow().isoformat(),
                    "totalTests": 50,
                    "passedTests": 0,
                    "failedTests": 0,
                    "openTests": 50
                }
                await test_suites_collection.insert_one(suite)
                stats["test_suites"] += 1
                
                # Generate 50 test cases per suite
                test_cases_batch = []
                for test_num in range(1, 51):
                    test_case = {
                        "id": uuid.uuid4().hex,
                        "test_id": f"PERF{company_num:03d}{suite_num:03d}{test_num:03d}",
                        "suite_id": suite_id,
                        "project_id": project_id,
                        "title": f"Performance Testfall {test_num}",
                        "description": f"Automatisch generierter Testfall für Performance-Tests (Company {company_num}, Suite {suite_num}, Test {test_num})",
                        "status": "pending",
                        "note": "",
                        "created_at": datetime.utcnow().isoformat()
                    }
                    test_cases_batch.append(test_case)
                    stats["test_cases"] += 1
                
                # Bulk insert test cases for better performance
                if test_cases_batch:
                    await test_cases_collection.insert_many(test_cases_batch)
        
        # End time
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        return {
            "message": "Masse-Daten erfolgreich generiert",
            "stats": stats,
            "duration_seconds": duration,
            "warning": "Diese Daten sind NUR für Performance-Tests! Verwenden Sie 'Datenbank leeren' zum Entfernen."
        }
        
    except HTTPException:
        # Re-raise HTTPExceptions (like our 409 safety check)
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler bei der Masse-Daten Generierung: {str(e)}")
