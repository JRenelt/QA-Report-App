"""
Project Management Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from database import database
from models import User, Project, ProjectCreate
from auth import get_current_user, require_qa_or_admin

router = APIRouter()

@router.get("/", response_model=List[Project])
async def get_projects(current_user: User = Depends(get_current_user)):
    """Get all projects user has access to"""
    query = """
        SELECT DISTINCT p.id, p.company_id, p.name, p.description, p.template_type, 
               p.status, p.created_by, p.created_at, p.updated_at
        FROM projects p
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE p.created_by = :user_id 
           OR pu.user_id = :user_id 
           OR :user_role = 'admin'
        ORDER BY p.updated_at DESC
    """
    result = await database.fetch_all(query, {
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    return [Project(**dict(row)) for row in result]

@router.post("/", response_model=Project) 
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(require_qa_or_admin)
):
    """Create new project with template"""
    # Verify company access
    company_check = """
        SELECT id FROM companies 
        WHERE id = :company_id AND (created_by = :user_id OR :user_role = 'admin')
    """
    company = await database.fetch_one(company_check, {
        "company_id": project_data.company_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No access to this company"
        )
    
    # Create project
    query = text("""
        INSERT INTO projects (company_id, name, description, template_type, status, created_by)
        VALUES (:company_id, :name, :description, :template_type, :status, :created_by)
        RETURNING id, company_id, name, description, template_type, status, created_by, created_at, updated_at
    """)
    
    result = await database.fetch_one(query, {
        "company_id": project_data.company_id,
        "name": project_data.name,
        "description": project_data.description,
        "template_type": project_data.template_type,
        "status": project_data.status,
        "created_by": current_user.id
    })
    
    project = Project(**dict(result))
    
    # Create default test suites based on template
    await create_default_test_suites(project.id, project_data.template_type)
    
    return project

async def create_default_test_suites(project_id: int, template_type: str):
    """Create default test suites based on template"""
    templates = {
        "web_app_qa": [
            {"name": "UI/UX Tests", "icon": "🎨", "order": 1},
            {"name": "Functionality", "icon": "⚙️", "order": 2},
            {"name": "Performance", "icon": "⚡", "order": 3},
            {"name": "Security", "icon": "🔒", "order": 4},
            {"name": "Compatibility", "icon": "🌐", "order": 5}
        ],
        "mobile_app_qa": [
            {"name": "UI Tests", "icon": "📱", "order": 1},
            {"name": "Performance", "icon": "⚡", "order": 2},
            {"name": "Device Compatibility", "icon": "📲", "order": 3},
            {"name": "Network Tests", "icon": "📶", "order": 4},
            {"name": "App Store Guidelines", "icon": "🏪", "order": 5}
        ],
        "api_testing": [
            {"name": "Endpoint Tests", "icon": "🔗", "order": 1},
            {"name": "Authentication", "icon": "🔐", "order": 2}, 
            {"name": "Data Validation", "icon": "✅", "order": 3},
            {"name": "Error Handling", "icon": "❌", "order": 4},
            {"name": "Performance", "icon": "⚡", "order": 5}
        ]
    }
    
    suites = templates.get(template_type, [])
    
    for suite in suites:
        query = text("""
            INSERT INTO test_suites (project_id, name, icon, sort_order)
            VALUES (:project_id, :name, :icon, :sort_order)
        """)
        await database.execute(query, {
            "project_id": project_id,
            "name": suite["name"],
            "icon": suite["icon"],
            "sort_order": suite["order"]
        })