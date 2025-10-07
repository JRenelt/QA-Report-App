"""
Database Initialization Script
"""

import asyncio
from sqlalchemy import text
from database import database, engine, metadata
import hashlib

def simple_hash_password(password: str) -> str:
    """Simple SHA256 password hashing for demo purposes"""
    return hashlib.sha256(password.encode()).hexdigest()

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
        admin_password_hash = simple_hash_password("admin123")
        
        admin_query = """
            INSERT INTO users (username, email, first_name, last_name, hashed_password, role, language_preference, is_active)
            VALUES (:username, :email, :first_name, :last_name, :hashed_password, :role, :language_preference, :is_active)
        """
        
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
        qa_password_hash = simple_hash_password("demo123")
        
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
        company_query = """
            INSERT INTO companies (name, description, created_by)
            VALUES (:name, :description, :created_by)
        """
        
        company_result = await database.execute(company_query, {
            "name": "Demo Unternehmen GmbH",
            "description": "Beispiel-Unternehmen für QA-Tests",
            "created_by": 1  # admin user
        })
        
        # Create demo project
        project_query = """
            INSERT INTO projects (name, description, template_type, status, company_id, created_by)
            VALUES (:name, :description, :template_type, :status, :company_id, :created_by)
        """
        
        await database.execute(project_query, {
            "name": "Web-App QA Projekt",
            "description": "Demo-Projekt für Web-Applikations-Tests",
            "template_type": "web_app_qa",
            "status": "active",
            "company_id": 1,  # Demo company
            "created_by": 1   # admin user
        })
        
        # Create demo test suites
        test_suite_query = """
            INSERT INTO test_suites (name, description, icon, sort_order, project_id)
            VALUES (:name, :description, :icon, :sort_order, :project_id)
        """
        
        test_suites = [
            {
                "name": "Responsive Design & Layout",
                "description": "Tests für responsive Darstellung und allgemeines Layout",
                "icon": "🎨",
                "sort_order": 1,
                "project_id": 1
            },
            {
                "name": "Kopfzeile (Header)", 
                "description": "Logo, Navigation, Buttons und Header-Funktionalität",
                "icon": "🔝", 
                "sort_order": 2,
                "project_id": 1
            },
            {
                "name": "Sidebar & Kategorien",
                "description": "Seitenleiste, Kategorie-Liste und Navigation",
                "icon": "📂",
                "sort_order": 3,
                "project_id": 1
            },
            {
                "name": "Hauptinhalt & Favoriten",
                "description": "Favoriten-Karten, Actions und Drag&Drop",
                "icon": "📄",
                "sort_order": 4,
                "project_id": 1
            }
        ]
        
        for suite in test_suites:
            await database.execute(test_suite_query, suite)
        
        # Create demo test cases - GUI-orientierte FavOrg Testpunkte
        test_case_query = """
            INSERT INTO test_cases (test_id, name, description, priority, expected_result, sort_order, test_suite_id, is_predefined)
            VALUES (:test_id, :name, :description, :priority, :expected_result, :sort_order, :test_suite_id, :is_predefined)
        """
        
        # GUI-orientierte Testpunkte für FavOrg
        test_cases = [
            # Testpunkt Kopfzeile (Test Suite 1 - Header-Bereich)
            {
                "test_id": "TK0001",
                "name": "Logo Ort: Links",
                "description": "Logo ist korrekt links in der Kopfzeile positioniert",
                "priority": 1,
                "expected_result": "Logo erscheint links im Header und ist erkennbar",
                "sort_order": 1,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "TK0002", 
                "name": "Logo Hover-Effekt",
                "description": "Logo reagiert bei Maus-Hover korrekt",
                "priority": 2,
                "expected_result": "Visueller Feedback bei Hover, keine Fehler",
                "sort_order": 2,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "TK0003",
                "name": "Logo Click-Funktion",
                "description": "Logo-Klick führt zur korrekten Aktion",
                "priority": 1,
                "expected_result": "Homepage-Redirect oder definierte Aktion wird ausgeführt",
                "sort_order": 3,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "BOM0001",
                "name": "Button Ort: Mittig",
                "description": "Haupt-Navigation-Buttons sind mittig platziert",
                "priority": 1,
                "expected_result": "Buttons befinden sich zentriert im Header-Bereich",
                "sort_order": 4,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "NFB0001",
                "name": "Neu Button - Neue Favorit",
                "description": "Button 'Neue Favorit' ist vorhanden und funktional",
                "priority": 1,
                "expected_result": "Button öffnet Dialog für neue Favoriten-Erstellung",
                "sort_order": 5,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "NFBD0001",
                "name": "Neu Button Design",
                "description": "Design und Styling des 'Neue Favorit' Buttons",
                "priority": 2,
                "expected_result": "Button hat korrektes Design, Farben und Abmessungen",
                "sort_order": 6,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "NFBH0001",
                "name": "Neu Button Hover-Effekt",
                "description": "Hover-Effekt des 'Neue Favorit' Buttons",
                "priority": 2,
                "expected_result": "Smooth Hover-Animation und Farbwechsel",
                "sort_order": 7,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "NFBC0001",
                "name": "Neu Button Click-Funktion",
                "description": "Click-Funktionalität des 'Neue Favorit' Buttons",
                "priority": 1,
                "expected_result": "Dialog öffnet sich korrekt ohne Fehler",
                "sort_order": 8,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "DW0001",
                "name": "Datei Wählen - Favoriten Import",
                "description": "Import-Button für Favoriten-Dateien",
                "priority": 1,
                "expected_result": "File-Dialog öffnet sich für Import-Funktionalität",
                "sort_order": 9,
                "test_suite_id": 2,
                "is_predefined": True
            },
            {
                "test_id": "FE0001",
                "name": "Fav Export Button",
                "description": "Export-Button für Favoriten",
                "priority": 1,
                "expected_result": "Export-Funktionen sind zugänglich",
                "sort_order": 10,
                "test_suite_id": 2,
                "is_predefined": True
            },
            
            # Sidebar-Bereich (Test Suite 3)
            {
                "test_id": "SB0001",
                "name": "Sidebar Sichtbarkeit",
                "description": "Sidebar ist korrekt sichtbar und positioniert",
                "priority": 1,
                "expected_result": "Sidebar ist vollständig sichtbar links im Layout",
                "sort_order": 1,
                "test_suite_id": 3,
                "is_predefined": True
            },
            {
                "test_id": "SBKL0001",
                "name": "Sidebar Kategorie-Liste",
                "description": "Kategorie-Liste wird korrekt angezeigt",
                "priority": 1,
                "expected_result": "Alle Kategorien sind sichtbar und auswählbar",
                "sort_order": 2,
                "test_suite_id": 3,
                "is_predefined": True
            },
            {
                "test_id": "SBKC0001",
                "name": "Sidebar Kategorie-Counter",
                "description": "Counter zeigen korrekte Anzahl je Kategorie",
                "priority": 1,
                "expected_result": "Counter entsprechen tatsächlicher Anzahl von Favoriten",
                "sort_order": 3,
                "test_suite_id": 3,
                "is_predefined": True
            },
            {
                "test_id": "SBKH0001",
                "name": "Sidebar Kategorie-Hover",
                "description": "Hover-Effekte bei Kategorie-Elementen",
                "priority": 2,
                "expected_result": "Visueller Feedback bei Hover über Kategorien",
                "sort_order": 4,
                "test_suite_id": 3,
                "is_predefined": True
            },
            {
                "test_id": "SBKK0001",
                "name": "Sidebar Kategorie-Klick",
                "description": "Klick auf Kategorie filtert Hauptinhalt",
                "priority": 1,
                "expected_result": "Hauptbereich zeigt nur Favoriten der gewählten Kategorie",
                "sort_order": 5,
                "test_suite_id": 3,
                "is_predefined": True
            },
            
            # Main-Content (Test Suite 4) 
            {
                "test_id": "HI0001",
                "name": "Hauptinhalt Layout",
                "description": "Gesamtlayout des Hauptinhalt-Bereichs",
                "priority": 1,
                "expected_result": "Hauptinhalt füllt verfügbaren Raum korrekt aus",
                "sort_order": 1,
                "test_suite_id": 4,
                "is_predefined": True
            },
            {
                "test_id": "HIFL0001",
                "name": "Hauptinhalt Favoriten-Liste",
                "description": "Liste der Favoriten wird korrekt dargestellt",
                "priority": 1,
                "expected_result": "Alle Favoriten sind sichtbar und korrekt formatiert",
                "sort_order": 2,
                "test_suite_id": 4,
                "is_predefined": True
            },
            {
                "test_id": "HIFK0001",
                "name": "Hauptinhalt Favoriten-Karten",
                "description": "Einzelne Favoriten-Karten Design und Layout",
                "priority": 1,
                "expected_result": "Jede Karte zeigt alle notwendigen Informationen",
                "sort_order": 3,
                "test_suite_id": 4,
                "is_predefined": True
            },
            {
                "test_id": "HIFAB0001",
                "name": "Hauptinhalt Favoriten Action-Buttons",
                "description": "Action-Buttons (Edit, Delete, Link) auf Karten",
                "priority": 1,
                "expected_result": "Alle Action-Buttons sind funktional",
                "sort_order": 4,
                "test_suite_id": 4,
                "is_predefined": True
            },
            {
                "test_id": "HIDR0001",
                "name": "Hauptinhalt Drag & Drop",
                "description": "Drag & Drop Funktionalität zwischen Kategorien",
                "priority": 1,
                "expected_result": "Favoriten können zwischen Kategorien verschoben werden",
                "sort_order": 5,
                "test_suite_id": 4,
                "is_predefined": True
            },
            
            # Allgemeines Design (Test Suite 1)
            {
                "test_id": "RD0001",
                "name": "Desktop Darstellung",
                "description": "Korrekte Darstellung auf Desktop-Bildschirmen",
                "priority": 1,
                "expected_result": "Layout nutzt Desktop-Platz optimal aus",
                "sort_order": 1,
                "test_suite_id": 1,
                "is_predefined": True
            },
            {
                "test_id": "RT0001",
                "name": "Tablet Darstellung",
                "description": "Responsive Darstellung auf Tablet-Geräten",
                "priority": 1,
                "expected_result": "Layout passt sich an Tablet-Bildschirme an",
                "sort_order": 2,
                "test_suite_id": 1,
                "is_predefined": True
            },
            {
                "test_id": "RM0001",
                "name": "Mobile Darstellung",
                "description": "Mobile-optimierte Darstellung",
                "priority": 1,
                "expected_result": "App ist auf Smartphones vollständig nutzbar",
                "sort_order": 3,
                "test_suite_id": 1,
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