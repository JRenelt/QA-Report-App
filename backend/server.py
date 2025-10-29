"""
QA-Report-App FastAPI Backend - MongoDB Version
Multi-Projekt QA Management System
"""

from fastapi import FastAPI, Depends, HTTPException, status, APIRouter, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.responses import Response
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
    version=os.getenv("APP_VERSION", "1.0.1"),
    lifespan=lifespan
)

# Global No Cache Middleware - KRITISCH für Browser-Cache-Probleme
@app.middleware("http")
async def add_nocache_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


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

# Health Check (with /api prefix for consistency)
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "app": "QA-Report-App",
        "version": os.getenv("APP_VERSION", "1.0.1"),
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
    print("✅ Imported auth routes")
    from routes import users
    print("✅ Imported users routes")
    from routes import companies
    print("✅ Imported companies routes")
    from routes import projects
    print("✅ Imported projects routes")
    from routes import test_suites
    print("✅ Imported test_suites routes")
    from routes import test_cases
    print("✅ Imported test_cases routes")
    from routes import test_results
    print("✅ Imported test_results routes")
    from routes import import_export
    print("✅ Imported import_export routes")
    from routes import pdf_reports
    print("✅ Imported pdf_reports routes")
    from routes import archive
    print("✅ Imported archive routes")
    from routes import admin
    print("✅ Imported admin routes")
    
    # Import NEW V2 Routes
    from routes import users_v2
    print("✅ Imported users_v2 routes")
    from routes import companies_v2
    print("✅ Imported companies_v2 routes")
    from routes import projects_v2
    print("✅ Imported projects_v2 routes")
    from routes import admin_v2
    print("✅ Imported admin_v2 routes")
    from routes import templates
    print("✅ Imported templates routes")
    from routes import import_v2
    print("✅ Imported import_v2 routes")
    from routes import archives_v2
    print("✅ Imported archives_v2 routes")
    
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
    
    # Include NEW V2 Routes
    api_router.include_router(users_v2.router, tags=["User Management V2"])
    api_router.include_router(companies_v2.router, tags=["Companies V2"])
    api_router.include_router(projects_v2.router, tags=["Projects V2"])
    api_router.include_router(admin_v2.router, tags=["Admin Operations V2"])
    api_router.include_router(templates.router, prefix="/templates", tags=["Templates"])
    api_router.include_router(import_v2.router, prefix="/import-v2", tags=["Import V2"])
    api_router.include_router(archives_v2.router, prefix="/archives-v2", tags=["Archives V2"])
    
    print("✅ All routes imported and registered successfully")
except ImportError as e:
    print(f"⚠️  Warning: Could not import route: {e}")
    print("Routes will be loaded after dependencies are installed")

# Include the API router in the main app
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    import os
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=int(os.getenv('PORT', 8001)),  # Deployment-ready: configurable via environment
        reload=True
    )
