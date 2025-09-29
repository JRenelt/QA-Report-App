"""
Pydantic Models for API
"""

from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

# Enums
class UserRole(str, Enum):
    admin = "admin"
    qa_tester = "qa_tester"
    reviewer = "reviewer"

class Language(str, Enum):
    DE = "DE"
    ENG = "ENG"

class ProjectStatus(str, Enum):
    active = "active"
    archived = "archived"
    draft = "draft"

class TestStatus(str, Enum):
    success = "success"
    error = "error"
    warning = "warning"
    skipped = "skipped"

class TemplateType(str, Enum):
    web_app_qa = "web_app_qa"
    mobile_app_qa = "mobile_app_qa"
    api_testing = "api_testing"
    custom = "custom"

class AccessLevel(str, Enum):
    owner = "owner"
    editor = "editor"
    viewer = "viewer"

# User Models
class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: UserRole
    language_preference: Language = Language.DE

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[UserRole] = None
    language_preference: Optional[Language] = None
    is_active: Optional[bool] = None

class User(UserBase):
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Auth Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class LoginForm(BaseModel):
    username: str
    password: str

# Company Models
class CompanyBase(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None

class CompanyCreate(CompanyBase):
    pass

class Company(CompanyBase):
    id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Project Models
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_type: TemplateType = TemplateType.custom
    status: ProjectStatus = ProjectStatus.active

class ProjectCreate(ProjectBase):
    company_id: int

class Project(ProjectBase):
    id: int
    company_id: int
    created_by: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Test Suite Models
class TestSuiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "📂"
    sort_order: int = 0

class TestSuiteCreate(TestSuiteBase):
    project_id: int

class TestSuite(TestSuiteBase):
    id: int
    project_id: int
    created_at: datetime

    class Config:
        from_attributes = True

# Test Case Models
class TestCaseBase(BaseModel):
    test_id: str  # AD0001, HB0002, etc.
    name: str
    description: Optional[str] = None
    priority: int = 3
    expected_result: Optional[str] = None
    sort_order: int = 0

class TestCaseCreate(TestCaseBase):
    test_suite_id: int

class TestCase(TestCaseBase):
    id: int
    test_suite_id: int
    is_predefined: bool
    created_by: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

# Test Result Models
class TestResultBase(BaseModel):
    status: TestStatus
    notes: Optional[str] = None

class TestResultCreate(TestResultBase):
    test_case_id: int
    session_id: Optional[str] = None

class TestResult(TestResultBase):
    id: int
    test_case_id: int
    executed_by: int
    execution_date: datetime
    session_id: Optional[str]

    class Config:
        from_attributes = True

# Project Sharing Models
class ProjectUserBase(BaseModel):
    access_level: AccessLevel

class ProjectUserCreate(ProjectUserBase):
    project_id: int
    user_id: int

class ProjectUser(ProjectUserBase):
    id: int
    project_id: int
    user_id: int
    granted_by: int
    granted_at: datetime

    class Config:
        from_attributes = True

# Report Models
class ReportBase(BaseModel):
    report_name: str
    report_type: str
    report_data: Dict[str, Any]

class ReportCreate(ReportBase):
    project_id: int

class Report(ReportBase):
    id: int
    project_id: int
    created_by: int
    created_at: datetime

    class Config:
        from_attributes = True

# Import/Export Models
class ImportData(BaseModel):
    data: List[Dict[str, Any]]
    format_type: str  # "json" or "csv"
    project_id: int

class ExportRequest(BaseModel):
    project_id: int
    format_type: str  # "json", "csv", "pdf"
    include_results: bool = True