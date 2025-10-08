"""
Pydantic Models for API - MongoDB Version
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserInDB(User):
    hashed_password: str

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
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Project Models
class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    template_type: TemplateType = TemplateType.custom
    status: ProjectStatus = ProjectStatus.active

class ProjectCreate(ProjectBase):
    company_id: str

class Project(ProjectBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Test Suite Models
class TestSuiteBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: str = "📂"
    sort_order: int = 0

class TestSuiteCreate(TestSuiteBase):
    project_id: str

class TestSuite(TestSuiteBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Test Case Models
class TestCaseBase(BaseModel):
    test_id: str  # AD0001, HB0002, etc.
    name: str
    description: Optional[str] = None
    priority: int = 3
    expected_result: Optional[str] = None
    sort_order: int = 0

class TestCaseCreate(TestCaseBase):
    test_suite_id: str

class TestCase(TestCaseBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_suite_id: str
    is_predefined: bool = False
    created_by: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Test Result Models
class TestResultBase(BaseModel):
    status: TestStatus
    notes: Optional[str] = None

class TestResultCreate(TestResultBase):
    test_case_id: str
    session_id: Optional[str] = None

class TestResult(TestResultBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_case_id: str
    executed_by: str
    execution_date: datetime = Field(default_factory=datetime.utcnow)
    session_id: Optional[str] = None

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Project Sharing Models
class ProjectUserBase(BaseModel):
    access_level: AccessLevel

class ProjectUserCreate(ProjectUserBase):
    project_id: str
    user_id: str

class ProjectUser(ProjectUserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    user_id: str
    granted_by: str
    granted_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Report Models
class ReportBase(BaseModel):
    report_name: str
    report_type: str
    report_data: Dict[str, Any]

class ReportCreate(ReportBase):
    project_id: str

class Report(ReportBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Archive Models
class ArchiveBase(BaseModel):
    name: str
    description: Optional[str] = None
    archive_data: Dict[str, Any]

class ArchiveCreate(ArchiveBase):
    project_id: str

class Archive(ArchiveBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Import/Export Models
class ImportData(BaseModel):
    data: List[Dict[str, Any]]
    format_type: str  # "json" or "csv"
    project_id: str

class ExportRequest(BaseModel):
    project_id: str
    format_type: str  # "json", "csv", "pdf"
    include_results: bool = True
