"""
QA-Report-App FastAPI Backend
Multi-Projekt QA Management System
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database imports
from database import database, engine, metadata
from models import User
from auth import get_current_user

# Route imports
from routes import auth, users, companies, projects, test_suites, test_cases, test_results

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Database connection management"""
    await database.connect()
    yield
    await database.disconnect()

# FastAPI App
app = FastAPI(
    title="QA-Report-App",
    description="Multi-Projekt QA Management System",
    version=os.getenv("APP_VERSION", "1.0.0"),
    lifespan=lifespan
)

# CORS Middleware
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:3001", 
    "http://127.0.0.1:3001",
    "https://localhost:3001"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With"],
)

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "app": os.getenv("APP_NAME", "QA-Report-App"),
        "version": os.getenv("APP_VERSION", "1.0.0")
    }

# Protected Route Example
@app.get("/api/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return {
        "user_id": current_user.id,
        "username": current_user.username,
        "email": current_user.email,
        "role": current_user.role,
        "language": current_user.language_preference
    }

# Include API Routes
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["User Management"])
app.include_router(companies.router, prefix="/api/companies", tags=["Companies"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(test_suites.router, prefix="/api/test-suites", tags=["Test Suites"])
app.include_router(test_cases.router, prefix="/api/test-cases", tags=["Test Cases"])
app.include_router(test_results.router, prefix="/api/test-results", tags=["Test Results"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8002,  # Different port from FavOrg
        reload=os.getenv("DEBUG", "False").lower() == "true"
    )