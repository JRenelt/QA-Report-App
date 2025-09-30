"""
Database Initialization Script
"""

import asyncio
from sqlalchemy import text
from database import database, engine, metadata
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

async def create_tables():
    """Create all database tables"""
    try:
        # Create all tables
        metadata.create_all(bind=engine)
        print("✅ Database tables created successfully")
        return True
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        return False

async def seed_initial_data():
    """Seed database with initial data"""
    try:
        await database.connect()
        
        # Check if admin user already exists
        admin_check = await database.fetch_one(
            "SELECT id FROM users WHERE username = 'admin'"
        )
        
        if admin_check:
            print("✅ Admin user already exists")
            return True
            
        # Create admin user
        admin_password = "admin123"[:72]  # Truncate to 72 bytes for bcrypt
        admin_password_hash = pwd_context.hash(admin_password)
        
        admin_query = text("""
            INSERT INTO users (username, email, first_name, last_name, hashed_password, role, language_preference, is_active)
            VALUES (:username, :email, :first_name, :last_name, :hashed_password, :role, :language_preference, :is_active)
        """)
        
        await database.execute(admin_query, {
            "username": "admin",
            "email": "admin@qa-report-app.com",
            "first_name": "QA",
            "last_name": "Administrator",
            "hashed_password": admin_password_hash,
            "role": "admin",
            "language_preference": "DE",
            "is_active": True
        })
        
        # Create demo QA tester
        qa_password_hash = pwd_context.hash("demo123")
        
        await database.execute(admin_query, {
            "username": "qa_demo",
            "email": "qa@demo.com",
            "first_name": "Demo",
            "last_name": "QA-Tester",
            "hashed_password": qa_password_hash,
            "role": "qa_tester", 
            "language_preference": "DE",
            "is_active": True
        })
        
        # Create demo company
        company_query = text("""
            INSERT INTO companies (name, description, created_by)
            VALUES (:name, :description, :created_by)
        """)
        
        company_result = await database.execute(company_query, {
            "name": "Demo Unternehmen GmbH",
            "description": "Beispiel-Unternehmen für QA-Tests",
            "created_by": 1  # admin user
        })
        
        # Create demo project
        project_query = text("""
            INSERT INTO projects (name, description, template_type, status, company_id, created_by)
            VALUES (:name, :description, :template_type, :status, :company_id, :created_by)
        """)
        
        await database.execute(project_query, {
            "name": "Web-App QA Projekt",
            "description": "Demo-Projekt für Web-Applikations-Tests",
            "template_type": "web_app_qa",
            "status": "active",
            "company_id": 1,  # Demo company
            "created_by": 1   # admin user
        })
        
        # Create demo test suites
        test_suite_query = text("""
            INSERT INTO test_suites (name, description, icon, sort_order, project_id)
            VALUES (:name, :description, :icon, :sort_order, :project_id)
        """)
        
        test_suites = [
            {
                "name": "Allgemeines Design",
                "description": "Tests für UI/UX Design und Layout",
                "icon": "🎨",
                "sort_order": 1,
                "project_id": 1
            },
            {
                "name": "Header-Bereich", 
                "description": "Tests für Navigation und Header-Funktionalität",
                "icon": "📋", 
                "sort_order": 2,
                "project_id": 1
            },
            {
                "name": "Sidebar-Bereich",
                "description": "Tests für Seitenleiste und Kategorien",
                "icon": "📂",
                "sort_order": 3,
                "project_id": 1
            },
            {
                "name": "Main-Content",
                "description": "Tests für Hauptinhalt und Funktionen",
                "icon": "📄",
                "sort_order": 4,
                "project_id": 1
            }
        ]
        
        for suite in test_suites:
            await database.execute(test_suite_query, suite)
        
        # Create demo test cases
        test_case_query = text("""
            INSERT INTO test_cases (test_id, name, description, priority, expected_result, sort_order, test_suite_id, is_predefined)
            VALUES (:test_id, :name, :description, :priority, :expected_result, :sort_order, :test_suite_id, :is_predefined)
        """)
        
        test_cases = [
            # Allgemeines Design Tests
            {
                "test_id": "AD0001",
                "name": "Corporate Identity prüfen",
                "description": "Überprüfung der Einhaltung der Corporate Design Guidelines",
                "priority": 1,
                "expected_result": "Alle Farben, Fonts und Logos entsprechen dem Corporate Design",
                "sort_order": 1,
                "test_suite_id": 1,
                "is_predefined": True
            },
            {
                "test_id": "AD0002",
                "name": "Responsive Design testen",
                "description": "Test der Darstellung auf verschiedenen Bildschirmgrößen",
                "priority": 1,
                "expected_result": "Layout passt sich korrekt an Desktop, Tablet und Mobile an",
                "sort_order": 2,
                "test_suite_id": 1,
                "is_predefined": True
            },
            # Header Tests
            {
                "test_id": "HB0001",
                "name": "Navigation Links prüfen",
                "description": "Alle Navigations-Links funktionieren korrekt",
                "priority": 1,
                "expected_result": "Alle Links führen zur korrekten Seite ohne Fehler",
                "sort_order": 1,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "HB0002", 
                "name": "Benutzer-Dropdown testen",
                "description": "Benutzer-Menü öffnet und schließt korrekt",
                "priority": 2,
                "expected_result": "Dropdown öffnet sich bei Klick und zeigt korrekte Optionen",
                "sort_order": 2,
                "test_suite_id": 2,
                "is_predefined": True
            }
        ]
        
        for test_case in test_cases:
            await database.execute(test_case_query, test_case)
        
        print("✅ Initial demo data seeded successfully")
        print("👤 Admin User: admin / admin123")
        print("👤 QA User: qa_demo / demo123")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        return False
    finally:
        await database.disconnect()
        
    return True

async def init_database():
    """Initialize complete database"""
    print("🔄 Initializing QA-Report-App Database...")
    
    # Create tables
    if not await create_tables():
        return False
        
    # Seed initial data
    if not await seed_initial_data():
        return False
        
    print("✅ Database initialization completed successfully!")
    return True

if __name__ == "__main__":
    asyncio.run(init_database())