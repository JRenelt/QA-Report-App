"""
Database connection and configuration
"""

import os
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.sql import func
from databases import Database
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/qa_report")

# SQLAlchemy
engine = create_engine(DATABASE_URL)
metadata = MetaData()

# Databases (for async)
database = Database(DATABASE_URL)

# Table Definitions
users_table = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("username", String(50), unique=True, index=True, nullable=False),
    Column("email", String(100), unique=True, index=True, nullable=False),
    Column("first_name", String(50)),
    Column("last_name", String(50)),
    Column("hashed_password", String(255), nullable=False),
    Column("role", String(20), nullable=False, default="qa_tester"),
    Column("language_preference", String(5), nullable=False, default="DE"),
    Column("is_active", Boolean, nullable=False, default=True),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column("updated_at", DateTime, nullable=False, server_default=func.now(), onupdate=func.now()),
)

companies_table = Table(
    "companies",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("name", String(100), nullable=False, index=True),
    Column("description", Text),
    Column("logo_url", String(255)),
    Column("created_by", Integer, ForeignKey("users.id"), nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column("updated_at", DateTime, nullable=False, server_default=func.now(), onupdate=func.now()),
)

projects_table = Table(
    "projects",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("name", String(100), nullable=False, index=True),
    Column("description", Text),
    Column("template_type", String(30), nullable=False, default="custom"),
    Column("status", String(20), nullable=False, default="active"),
    Column("company_id", Integer, ForeignKey("companies.id"), nullable=False),
    Column("created_by", Integer, ForeignKey("users.id"), nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
    Column("updated_at", DateTime, nullable=False, server_default=func.now(), onupdate=func.now()),
)

test_suites_table = Table(
    "test_suites",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("name", String(100), nullable=False, index=True),
    Column("description", Text),
    Column("icon", String(10), nullable=False, default="📂"),
    Column("sort_order", Integer, nullable=False, default=0),
    Column("project_id", Integer, ForeignKey("projects.id"), nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
)

test_cases_table = Table(
    "test_cases",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("test_id", String(20), nullable=False, index=True),
    Column("name", String(150), nullable=False),
    Column("description", Text),
    Column("priority", Integer, nullable=False, default=3),
    Column("expected_result", Text),
    Column("sort_order", Integer, nullable=False, default=0),
    Column("test_suite_id", Integer, ForeignKey("test_suites.id"), nullable=False),
    Column("is_predefined", Boolean, nullable=False, default=False),
    Column("created_by", Integer, ForeignKey("users.id")),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
)

test_results_table = Table(
    "test_results",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("status", String(20), nullable=False),
    Column("notes", Text),
    Column("test_case_id", Integer, ForeignKey("test_cases.id"), nullable=False),
    Column("executed_by", Integer, ForeignKey("users.id"), nullable=False),
    Column("execution_date", DateTime, nullable=False, server_default=func.now()),
    Column("session_id", String(100)),
)

project_users_table = Table(
    "project_users",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("project_id", Integer, ForeignKey("projects.id"), nullable=False),
    Column("user_id", Integer, ForeignKey("users.id"), nullable=False),
    Column("access_level", String(20), nullable=False),
    Column("granted_by", Integer, ForeignKey("users.id"), nullable=False),
    Column("granted_at", DateTime, nullable=False, server_default=func.now()),
)

reports_table = Table(
    "reports",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("report_name", String(100), nullable=False),
    Column("report_type", String(50), nullable=False),
    Column("report_data", Text, nullable=False),  # JSON as text
    Column("project_id", Integer, ForeignKey("projects.id"), nullable=False),
    Column("created_by", Integer, ForeignKey("users.id"), nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
)

archives_table = Table(
    "archives",
    metadata,
    Column("id", Integer, primary_key=True, index=True),
    Column("name", String(100), nullable=False),
    Column("description", Text),
    Column("project_id", Integer, ForeignKey("projects.id"), nullable=False),
    Column("archive_data", Text, nullable=False),  # JSON as text
    Column("created_by", Integer, ForeignKey("users.id"), nullable=False),
    Column("created_at", DateTime, nullable=False, server_default=func.now()),
)