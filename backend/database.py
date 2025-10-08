"""
Database connection and configuration - MongoDB Version
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

# MongoDB Configuration
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "qa_report_db")

# MongoDB Client
client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# Collections
users_collection = db["users"]
companies_collection = db["companies"]
projects_collection = db["projects"]
test_suites_collection = db["test_suites"]
test_cases_collection = db["test_cases"]
test_results_collection = db["test_results"]
project_users_collection = db["project_users"]
reports_collection = db["reports"]
archives_collection = db["archives"]

async def init_db():
    """Initialize database indexes"""
    
    # Users indexes
    await users_collection.create_index("username", unique=True)
    await users_collection.create_index("email", unique=True)
    
    # Companies indexes
    await companies_collection.create_index("name")
    
    # Projects indexes
    await projects_collection.create_index("company_id")
    await projects_collection.create_index("name")
    
    # Test Suites indexes
    await test_suites_collection.create_index("project_id")
    
    # Test Cases indexes
    await test_cases_collection.create_index("test_suite_id")
    await test_cases_collection.create_index("test_id")
    
    # Test Results indexes
    await test_results_collection.create_index("test_case_id")
    await test_results_collection.create_index("executed_by")
    
    # Project Users indexes
    await project_users_collection.create_index([("project_id", 1), ("user_id", 1)], unique=True)
    
    # Reports indexes
    await reports_collection.create_index("project_id")
    
    # Archives indexes
    await archives_collection.create_index("project_id")

async def connect_db():
    """Connect to database"""
    await init_db()
    print(f"✅ Connected to MongoDB: {DB_NAME}")

async def disconnect_db():
    """Disconnect from database"""
    client.close()
    print("✅ Disconnected from MongoDB")
