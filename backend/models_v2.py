"""
Neue Pydantic Models für komplett überarbeitete Verwaltung
- Erweiterte User-Felder (Tel, Sperr-Status)
- Neue Projekt-ID-Generierung
- Rollen: SysOp, Admin, QA-Tester
"""

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum
import uuid

# Enums
class UserRoleV2(str, Enum):
    sysop = "sysop"           # System Operator - höchste Rechte, nicht löschbar
    admin = "admin"           # Administrator - Firmenverwaltung
    qa_tester = "qa_tester"   # QA-Tester - nur eigene Projekte

class Language(str, Enum):
    DE = "DE"
    ENG = "ENG"

class ProjectStatus(str, Enum):
    active = "active"
    blocked = "blocked"
    archived = "archived"

# Company Models V2
class CompanyBaseV2(BaseModel):
    name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    # Postalische Adresse
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = "Deutschland"
    # Ansprechpartner
    contact_person_name: Optional[str] = None
    contact_person_email: Optional[str] = None
    contact_person_phone: Optional[str] = None

class CompanyCreateV2(CompanyBaseV2):
    pass

class CompanyUpdateV2(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    logo_url: Optional[str] = None
    # Postalische Adresse
    street: Optional[str] = None
    postal_code: Optional[str] = None
    city: Optional[str] = None
    country: Optional[str] = None
    # Ansprechpartner
    contact_person_name: Optional[str] = None
    contact_person_email: Optional[str] = None
    contact_person_phone: Optional[str] = None
    is_blocked: Optional[bool] = None

class CompanyV2(CompanyBaseV2):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    short_code: str  # 2 Buchstaben für Projekt-ID (z.B. "ID" für ID2.de)
    is_blocked: bool = False
    is_deletable: bool = True
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# User Models V2
class UserBaseV2(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    tel: str
    role: UserRoleV2
    company_id: str  # Firma-Zuordnung
    language_preference: Language = Language.DE

class UserCreateV2(UserBaseV2):
    password: str

class UserUpdateV2(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    tel: Optional[str] = None
    role: Optional[UserRoleV2] = None
    company_id: Optional[str] = None
    language_preference: Optional[Language] = None
    is_active: Optional[bool] = None
    is_blocked: Optional[bool] = None

class UserV2(UserBaseV2):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    is_active: bool = True
    is_blocked: bool = False
    is_deletable: bool = True  # SysOp-User nicht löschbar
    blocked_projects: List[str] = []  # Liste von Projekt-IDs
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserInDBV2(UserV2):
    hashed_password: str

# Project Models V2
class ProjectBaseV2(BaseModel):
    title: str  # Projekttitel
    description: str  # Projektbeschreibung
    notes: Optional[str] = None  # Projekt-Notizen (optional, änderbar für QA-Tester)

class ProjectCreateV2(ProjectBaseV2):
    company_id: str

class ProjectUpdateV2(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[ProjectStatus] = None
    is_blocked: Optional[bool] = None

class QATesterAssignment(BaseModel):
    """Zugeordneter QA-Tester mit Zeitstempel"""
    user_id: str
    username: str
    assigned_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectV2(ProjectBaseV2):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str  # Generierte ID: [2Buchst-Firma][1V][1N][UHRZEIT][LfdNr]
    company_id: str
    company_name: str  # Aus System (nicht änderbar)
    status: ProjectStatus = ProjectStatus.active
    is_blocked: bool = False
    assigned_testers: List[QATesterAssignment] = []  # Zugeordnete QA-Tester
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Test Case Models V2 (erweitert für neue Projektverwaltung)
class TestCaseBaseV2(BaseModel):
    test_id: str  # Generiert aus Projekt
    name: str
    description: Optional[str] = None
    status: str = "pending"  # success, error, warning, pending, skipped
    note: Optional[str] = None
    priority: int = 3
    expected_result: Optional[str] = None

class TestCaseCreateV2(TestCaseBaseV2):
    project_id: str  # Zuordnung zum Projekt

class TestCaseV2(TestCaseBaseV2):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Import Models
class ImportCompaniesV2(BaseModel):
    """CSV/JSON Import für Firmen"""
    companies: List[dict]  # Format: name, description, logo_url, short_code

class ImportUsersV2(BaseModel):
    """CSV/JSON Import für User"""
    users: List[dict]  # Format: username, email, first_name, last_name, tel, role, company_id, password

class ImportProjectsV2(BaseModel):
    """CSV/JSON Import für Projekte"""
    projects: List[dict]  # Format: title, description, company_id, notes

class ImportTestCasesV2(BaseModel):
    """CSV/JSON Import für Test Cases"""
    test_cases: List[dict]  # Format: name, description, project_id, status, priority

# Testdaten-Generierung Models
class GenerateTestDataV2(BaseModel):
    """Testdaten generieren für SysOp/Admin/QA-Tester"""
    role: UserRoleV2
    company_count: Optional[int] = 2  # Nur für SysOp
    projects_per_company: Optional[int] = 2
    test_cases_per_project: Optional[int] = 10
