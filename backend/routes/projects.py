"""
Project Management Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from datetime import datetime
import uuid
from database import projects_collection, companies_collection, project_users_collection, test_suites_collection
from models import User, Project, ProjectCreate
from auth import get_current_user, require_qa_or_admin

router = APIRouter()

@router.get("/", response_model=List[Project])
async def get_projects(current_user: User = Depends(get_current_user)):
    """Get all projects user has access to"""
    
    if current_user.role == "admin":
        # Admins see all projects
        projects = await projects_collection.find().sort("updated_at", -1).to_list(1000)
    else:
        # Get projects where user is creator or has access
        user_access = await project_users_collection.find({"user_id": current_user.id}).to_list(1000)
        accessible_project_ids = [p["project_id"] for p in user_access]
        
        projects = await projects_collection.find({
            "$or": [
                {"created_by": current_user.id},
                {"id": {"$in": accessible_project_ids}}
            ]
        }).sort("updated_at", -1).to_list(1000)
    
    return [Project(**{k: v for k, v in project.items() if k != "_id"}) for project in projects]

@router.post("/", response_model=Project) 
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_qa_or_admin)
):
    """Create new project with template"""
    
    # Verify company access
    company = await companies_collection.find_one({"id": project_data.company_id})
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    if current_user.role != "admin" and company["created_by"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this company"
        )
    
    # Create project
    new_project = {
        "id": str(uuid.uuid4()),
        "company_id": project_data.company_id,
        "name": project_data.name,
        "description": project_data.description,
        "template_type": project_data.template_type,
        "status": project_data.status,
        "created_by": current_user.id,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await projects_collection.insert_one(new_project)
    
    project = Project(**{k: v for k, v in new_project.items() if k != "_id"})
    
    # Create default test suites based on template
    await create_default_test_suites(project.id, project_data.template_type)
    
    return project

@router.get("/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: User = Depends(get_current_user)):
    """Get specific project"""
    
    project = await projects_collection.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check access
    if current_user.role != "admin" and project["created_by"] != current_user.id:
        user_access = await project_users_collection.find_one({
            "project_id": project_id,
            "user_id": current_user.id
        })
        if not user_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
    
    return Project(**{k: v for k, v in project.items() if k != "_id"})

@router.put("/{project_id}", response_model=Project)
async def update_project(
    project_id: str,
    project_data: ProjectCreate,
    current_user: User = Depends(require_qa_or_admin)
):
    """Update project"""
    
    project = await projects_collection.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and project["created_by"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project creator or admin can update"
        )
    
    update_data = {
        "name": project_data.name,
        "description": project_data.description,
        "template_type": project_data.template_type,
        "status": project_data.status,
        "updated_at": datetime.utcnow()
    }
    
    result = await projects_collection.find_one_and_update(
        {"id": project_id},
        {"$set": update_data},
        return_document=True
    )
    
    return Project(**{k: v for k, v in result.items() if k != "_id"})

@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user: User = Depends(require_qa_or_admin)):
    """Delete project and all associated data"""
    
    project = await projects_collection.find_one({"id": project_id})
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check permissions
    if current_user.role != "admin" and project["created_by"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only project creator or admin can delete"
        )
    
    # Delete project and associated data
    await projects_collection.delete_one({"id": project_id})
    await test_suites_collection.delete_many({"project_id": project_id})
    await project_users_collection.delete_many({"project_id": project_id})
    
    return {"message": "Project deleted successfully"}

async def create_default_test_suites(project_id: str, template_type: str):
    """Create default test suites based on template"""
    
    templates = {
        "web_app_qa": [
            {"name": "UI/UX Tests", "icon": "🎨", "order": 1},
            {"name": "Funktionalität", "icon": "⚙️", "order": 2},
            {"name": "Performance", "icon": "⚡", "order": 3},
            {"name": "Sicherheit", "icon": "🔒", "order": 4},
            {"name": "Kompatibilität", "icon": "🌐", "order": 5}
        ],
        "mobile_app_qa": [
            {"name": "UI Tests", "icon": "📱", "order": 1},
            {"name": "Performance", "icon": "⚡", "order": 2},
            {"name": "Geräte-Kompatibilität", "icon": "📲", "order": 3},
            {"name": "Netzwerk-Tests", "icon": "📶", "order": 4},
            {"name": "App Store Richtlinien", "icon": "🏪", "order": 5}
        ],
        "api_testing": [
            {"name": "Endpoint Tests", "icon": "🔗", "order": 1},
            {"name": "Authentifizierung", "icon": "🔐", "order": 2}, 
            {"name": "Daten-Validierung", "icon": "✅", "order": 3},
            {"name": "Fehlerbehandlung", "icon": "❌", "order": 4},
            {"name": "Performance", "icon": "⚡", "order": 5}
        ]
    }
    
    suites = templates.get(template_type, [])
    
    for suite in suites:
        new_suite = {
            "id": str(uuid.uuid4()),
            "project_id": project_id,
            "name": suite["name"],
            "description": None,
            "icon": suite["icon"],
            "sort_order": suite["order"],
            "created_at": datetime.utcnow()
        }
        await test_suites_collection.insert_one(new_suite)
