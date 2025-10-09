"""
QA-Report-App FastAPI Backend - MongoDB Version
Multi-Projekt QA Management System
"""

from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from contextlib import asynccontextmanager
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Database imports
from database import connect_db, disconnect_db
from models import User
from auth import get_current_user

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Database connection management"""
    await connect_db()
    yield
    await disconnect_db()

# FastAPI App (without prefix for health check)
app = FastAPI(
    title="QA-Report-App",
    description="Multi-Projekt QA Management System",
    version=os.getenv("APP_VERSION", "1.0.0"),
    lifespan=lifespan
)

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# CORS Middleware
allowed_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Health Check (no /api prefix)
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "QA-Report-App",
        "version": os.getenv("APP_VERSION", "1.0.0"),
        "database": "MongoDB"
    }

# Protected Route Example
@api_router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "language": current_user.language_preference
    }

# Import routes dynamically after MongoDB connection
try:
    from routes import auth as auth_routes
    from routes import users
    from routes import companies
    from routes import projects
    from routes import test_suites
    from routes import test_cases
    from routes import test_results
    from routes import import_export
    from routes import pdf_reports
    from routes import archive
    from routes import admin
    from routes import qa_management
    
    # Include API Routes with /api prefix via router
    api_router.include_router(auth_routes.router, prefix="/auth", tags=["Authentication"])
    api_router.include_router(users.router, prefix="/users", tags=["User Management"])
    api_router.include_router(companies.router, prefix="/companies", tags=["Companies"])
    api_router.include_router(projects.router, prefix="/projects", tags=["Projects"])
    api_router.include_router(test_suites.router, prefix="/test-suites", tags=["Test Suites"])
    api_router.include_router(test_cases.router, prefix="/test-cases", tags=["Test Cases"])
    api_router.include_router(test_results.router, prefix="/test-results", tags=["Test Results"])
    api_router.include_router(import_export.router, prefix="/import-export", tags=["Import/Export"])
    api_router.include_router(pdf_reports.router, prefix="/pdf-reports", tags=["PDF Reports"])
    api_router.include_router(archive.router, prefix="/archive", tags=["Archive Management"])
    api_router.include_router(admin.router, prefix="/admin", tags=["Admin Operations"])
except ImportError as e:
    print(f"⚠️  Warning: Could not import route: {e}")
    print("Routes will be loaded after dependencies are installed")

# Include the API router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8001,
        reload=True
    )
