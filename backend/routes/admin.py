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
