from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone
import uuid
from ..auth import get_current_user
from ..database import get_db
from ..models import User

router = APIRouter()

# Pydantic Models
class TestCaseCreate(BaseModel):
    test_id: str
    suite_id: str
    title: str
    description: Optional[str] = ""
    status: str = "pending"
    note: Optional[str] = ""

class TestCaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    note: Optional[str] = None

class TestCase(BaseModel):
    id: str
    test_id: str
    suite_id: str
    title: str
    description: str
    status: str
    note: Optional[str] = ""
    created_by: str
    created_at: datetime
    updated_at: datetime

class TestSuiteCreate(BaseModel):
    name: str
    icon: str
    description: Optional[str] = ""

class TestSuite(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    created_by: str
    created_at: datetime

class UserSettingsCreate(BaseModel):
    tooltip_delay: str = "kurz"
    sidebar_width: int = 256
    entries_per_page: int = 10
    general_tooltips: bool = True

class UserSettingsUpdate(BaseModel):
    tooltip_delay: Optional[str] = None
    sidebar_width: Optional[int] = None
    entries_per_page: Optional[int] = None
    general_tooltips: Optional[bool] = None

class UserSettings(BaseModel):
    id: str
    user_id: str
    tooltip_delay: str
    sidebar_width: int
    entries_per_page: int
    general_tooltips: bool
    updated_at: datetime

# Helper functions
def prepare_for_mongo(data):
    """Prepare data for MongoDB storage"""
    if isinstance(data.get('created_at'), datetime):
        data['created_at'] = data['created_at'].isoformat()
    if isinstance(data.get('updated_at'), datetime):
        data['updated_at'] = data['updated_at'].isoformat()
    return data

def parse_from_mongo(item):
    """Parse data from MongoDB storage"""
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'].replace('Z', '+00:00'))
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'].replace('Z', '+00:00'))
    return item

# Test Cases Routes
@router.get("/test-cases", response_model=List[TestCase])
async def get_test_cases(
    suite_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get all test cases, optionally filtered by suite_id"""
    db = await get_db()
    
    query = {}
    if suite_id:
        query["suite_id"] = suite_id
    
    test_cases = await db.test_cases.find(query).to_list(length=None)
    return [TestCase(**parse_from_mongo(tc)) for tc in test_cases]

@router.post("/test-cases", response_model=TestCase)
async def create_test_case(
    test_case: TestCaseCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new test case"""
    db = await get_db()
    
    now = datetime.now(timezone.utc)
    test_case_data = {
        "id": str(uuid.uuid4()),
        "test_id": test_case.test_id,
        "suite_id": test_case.suite_id,
        "title": test_case.title,
        "description": test_case.description,
        "status": test_case.status,
        "note": test_case.note,
        "created_by": current_user.id,
        "created_at": now,
        "updated_at": now
    }
    
    test_case_data = prepare_for_mongo(test_case_data)
    result = await db.test_cases.insert_one(test_case_data)
    
    if result.inserted_id:
        created_test_case = await db.test_cases.find_one({"id": test_case_data["id"]})
        return TestCase(**parse_from_mongo(created_test_case))
    
    raise HTTPException(status_code=500, detail="Failed to create test case")

@router.put("/test-cases/{test_case_id}", response_model=TestCase)
async def update_test_case(
    test_case_id: str,
    updates: TestCaseUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a test case"""
    db = await get_db()
    
    # Check if test case exists
    existing_test_case = await db.test_cases.find_one({"id": test_case_id})
    if not existing_test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    # Prepare update data
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data = prepare_for_mongo(update_data)
    
    # Update test case
    result = await db.test_cases.update_one(
        {"id": test_case_id},
        {"$set": update_data}
    )
    
    if result.modified_count:
        updated_test_case = await db.test_cases.find_one({"id": test_case_id})
        return TestCase(**parse_from_mongo(updated_test_case))
    
    raise HTTPException(status_code=500, detail="Failed to update test case")

@router.delete("/test-cases/{test_case_id}")
async def delete_test_case(
    test_case_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a test case"""
    db = await get_db()
    
    result = await db.test_cases.delete_one({"id": test_case_id})
    
    if result.deleted_count:
        return {"message": "Test case deleted successfully"}
    
    raise HTTPException(status_code=404, detail="Test case not found")

# Test Suites Routes
@router.get("/test-suites", response_model=List[TestSuite])
async def get_test_suites(current_user: User = Depends(get_current_user)):
    """Get all test suites"""
    db = await get_db()
    
    test_suites = await db.test_suites.find().to_list(length=None)
    return [TestSuite(**parse_from_mongo(ts)) for ts in test_suites]

@router.post("/test-suites", response_model=TestSuite)
async def create_test_suite(
    test_suite: TestSuiteCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new test suite"""
    db = await get_db()
    
    now = datetime.now(timezone.utc)
    test_suite_data = {
        "id": str(uuid.uuid4()),
        "name": test_suite.name,
        "icon": test_suite.icon,
        "description": test_suite.description,
        "created_by": current_user.id,
        "created_at": now
    }
    
    test_suite_data = prepare_for_mongo(test_suite_data)
    result = await db.test_suites.insert_one(test_suite_data)
    
    if result.inserted_id:
        created_test_suite = await db.test_suites.find_one({"id": test_suite_data["id"]})
        return TestSuite(**parse_from_mongo(created_test_suite))
    
    raise HTTPException(status_code=500, detail="Failed to create test suite")

# User Settings Routes
@router.get("/user-settings/{user_id}", response_model=UserSettings)
async def get_user_settings(
    user_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get user settings"""
    # Users can only access their own settings, admins can access any
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = await get_db()
    settings = await db.user_settings.find_one({"user_id": user_id})
    
    if not settings:
        raise HTTPException(status_code=404, detail="User settings not found")
    
    return UserSettings(**parse_from_mongo(settings))

@router.post("/user-settings", response_model=UserSettings)
async def create_user_settings(
    settings: UserSettingsCreate,
    current_user: User = Depends(get_current_user)
):
    """Create user settings"""
    db = await get_db()
    
    # Check if settings already exist
    existing = await db.user_settings.find_one({"user_id": current_user.id})
    if existing:
        raise HTTPException(status_code=409, detail="User settings already exist")
    
    now = datetime.now(timezone.utc)
    settings_data = {
        "id": str(uuid.uuid4()),
        "user_id": current_user.id,
        "tooltip_delay": settings.tooltip_delay,
        "sidebar_width": settings.sidebar_width,
        "entries_per_page": settings.entries_per_page,
        "general_tooltips": settings.general_tooltips,
        "updated_at": now
    }
    
    settings_data = prepare_for_mongo(settings_data)
    result = await db.user_settings.insert_one(settings_data)
    
    if result.inserted_id:
        created_settings = await db.user_settings.find_one({"id": settings_data["id"]})
        return UserSettings(**parse_from_mongo(created_settings))
    
    raise HTTPException(status_code=500, detail="Failed to create user settings")

@router.put("/user-settings/{user_id}", response_model=UserSettings)
async def update_user_settings(
    user_id: str,
    updates: UserSettingsUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user settings"""
    # Users can only update their own settings, admins can update any
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    db = await get_db()
    
    # Check if settings exist
    existing = await db.user_settings.find_one({"user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="User settings not found")
    
    # Prepare update data
    update_data = {k: v for k, v in updates.dict().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc)
    update_data = prepare_for_mongo(update_data)
    
    # Update settings
    result = await db.user_settings.update_one(
        {"user_id": user_id},
        {"$set": update_data}
    )
    
    if result.modified_count:
        updated_settings = await db.user_settings.find_one({"user_id": user_id})
        return UserSettings(**parse_from_mongo(updated_settings))
    
    raise HTTPException(status_code=500, detail="Failed to update user settings")

# Statistics Route
@router.get("/test-statistics")
async def get_test_statistics(
    suite_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get test statistics"""
    db = await get_db()
    
    query = {}
    if suite_id:
        query["suite_id"] = suite_id
    
    test_cases = await db.test_cases.find(query).to_list(length=None)
    
    stats = {
        "total": len(test_cases),
        "success": len([tc for tc in test_cases if tc.get("status") == "success"]),
        "error": len([tc for tc in test_cases if tc.get("status") == "error"]),
        "warning": len([tc for tc in test_cases if tc.get("status") == "warning"]),
        "pending": len([tc for tc in test_cases if tc.get("status") == "pending"]),
        "skipped": len([tc for tc in test_cases if tc.get("status") == "skipped"])
    }
    
    return stats