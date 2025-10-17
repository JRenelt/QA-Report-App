"""
Initialize MongoDB Database with Admin User
"""

import asyncio
import sys
from pathlib import Path

# Add backend directory to path
sys.path.insert(0, str(Path(__file__).parent))

from database import (
    users_collection, 
    companies_collection, 
    projects_collection,
    init_db
)
from auth import get_password_hash
from models import UserRole, Language
from datetime import datetime
import uuid

async def create_sysop_user():
    """Create SysOp user Jörg Renelt for ID2"""
    
    # Check if ID2 company exists
    id2_company = await companies_collection.find_one({"name": "ID2.de"})
    if not id2_company:
        # Create ID2 company first
        id2_company = {
            "id": str(uuid.uuid4()),
            "name": "ID2.de",
            "description": "System-Firma - DARF NICHT GELÖSCHT WERDEN",
            "logo_url": None,
            "created_by": "system",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        await companies_collection.insert_one(id2_company)
        print(f"✅ ID2 company created: {id2_company['name']}")
    
    # Check if SysOp already exists
    existing_sysop = await users_collection.find_one({"username": "jre"})
    if existing_sysop:
        print("✅ SysOp user 'jre' already exists")
    else:
        # Create SysOp user Jörg Renelt
        sysop_user = {
            "id": str(uuid.uuid4()),
            "username": "jre",
            "email": "joerg.renelt@id2.de",
            "first_name": "Jörg",
            "last_name": "Renelt",
            "hashed_password": get_password_hash("sysop123"),
            "role": UserRole.sysop.value,
            "companyId": id2_company["id"],
            "language_preference": Language.DE.value,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await users_collection.insert_one(sysop_user)
        print(f"✅ SysOp user created: username=jre, password=sysop123")

async def create_admin_user():
    """Create default admin user"""
    
    # Check if admin already exists
    existing_admin = await users_collection.find_one({"username": "admin"})
    if existing_admin:
        print("✅ Admin user already exists")
    else:
        # Get ID2 company for admin
        id2_company = await companies_collection.find_one({"name": "ID2.de"})
        
        # Create admin user
        admin_user = {
            "id": str(uuid.uuid4()),
            "username": "admin",
            "email": "admin@example.com",
            "first_name": "System",
            "last_name": "Administrator",
            "hashed_password": get_password_hash("admin123"),
            "role": UserRole.admin.value,
            "companyId": id2_company["id"] if id2_company else None,
            "language_preference": Language.DE.value,
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        await users_collection.insert_one(admin_user)
        print(f"✅ Admin user created: username=admin, password=admin123")

async def create_qa_demo_user():
    """Create QA demo user"""
    
    # Check if QA demo user already exists
    existing_qa_demo = await users_collection.find_one({"username": "qa_demo"})
    if existing_qa_demo:
        print("✅ QA demo user already exists")
        return
    
    # Create QA demo user
    qa_demo_user = {
        "id": str(uuid.uuid4()),
        "username": "qa_demo",
        "email": "qa_demo@example.com",
        "first_name": "QA",
        "last_name": "Demo",
        "hashed_password": get_password_hash("demo123"),
        "role": UserRole.qa_tester.value,
        "language_preference": Language.DE.value,
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await users_collection.insert_one(qa_demo_user)
    print(f"✅ QA demo user created: username=qa_demo, password=demo123")

async def create_sample_data():
    """Create sample company and project"""
    
    # Get admin user
    admin = await users_collection.find_one({"username": "admin"})
    if not admin:
        print("❌ Admin user not found")
        return
    
    # Check if sample company exists
    existing_company = await companies_collection.find_one({"name": "Demo Firma"})
    if existing_company:
        print("✅ Sample data already exists")
        return
    
    # Create sample company
    company = {
        "id": str(uuid.uuid4()),
        "name": "Demo Firma",
        "description": "Beispiel-Firma für QA-Testing",
        "logo_url": None,
        "created_by": admin["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await companies_collection.insert_one(company)
    print(f"✅ Sample company created: {company['name']}")
    
    # Create sample project
    project = {
        "id": str(uuid.uuid4()),
        "name": "Demo Projekt",
        "description": "Beispiel-Projekt für QA-Testing",
        "template_type": "web_app_qa",
        "status": "active",
        "company_id": company["id"],
        "created_by": admin["id"],
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    await projects_collection.insert_one(project)
    print(f"✅ Sample project created: {project['name']}")

async def main():
    """Main initialization function"""
    print("🔧 Initializing QA-Report Database...")
    
    try:
        # Initialize indexes
        await init_db()
        
        # Create admin user
        await create_admin_user()
        
        # Create QA demo user
        await create_qa_demo_user()
        
        # Create sample data
        await create_sample_data()
        
        print("\n✅ Database initialization complete!")
        print("\n📝 Login credentials:")
        print("   Admin - Username: admin, Password: admin123")
        print("   QA Demo - Username: qa_demo, Password: demo123")
        print("\n⚠️  Please change the admin password after first login!\n")
        
    except Exception as e:
        print(f"\n❌ Error during initialization: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
