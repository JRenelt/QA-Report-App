"""
Initialize Database V2 mit initialen Daten
- Firma ID2.de (nicht löschbar)
- SysOp User: JR (nicht löschbar)
- Test_Firma mit Admin und QA-Tester
"""

import asyncio
import sys
sys.path.append('/app/backend')

from database import get_database
from auth import get_password_hash
import uuid
from datetime import datetime

async def init_db_v2():
    """Initialize database with V2 structure and initial data"""
    db = await get_database()
    
    companies_collection = db["companies_v2"]
    users_collection = db["users_v2"]
    
    print("🚀 Initialisiere Datenbank V2...")
    
    # =============================================================================
    # FIRMA 1: ID2.de (nicht löschbar)
    # =============================================================================
    
    id2_company = {
        "id": str(uuid.uuid4()),
        "name": "ID2.de",
        "description": "ID2 System Operator Firma",
        "logo_url": None,
        "short_code": "ID",
        "is_blocked": False,
        "is_deletable": False,  # NICHT LÖSCHBAR
        "created_by": "system",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if ID2.de already exists
    existing_id2 = await companies_collection.find_one({"name": "ID2.de"})
    if existing_id2:
        print("✅ Firma ID2.de existiert bereits")
        id2_company_id = existing_id2["id"]
    else:
        await companies_collection.insert_one(id2_company)
        id2_company_id = id2_company["id"]
        print("✅ Firma ID2.de angelegt")
    
    # =============================================================================
    # USER 1: SysOp JR (nicht löschbar)
    # =============================================================================
    
    sysop_user = {
        "id": str(uuid.uuid4()),
        "username": "JR",
        "email": "j.renelt@id2.de",
        "first_name": "Jörg",
        "last_name": "Renelt",
        "tel": "01637374570",
        "role": "sysop",
        "company_id": id2_company_id,
        "language_preference": "DE",
        "hashed_password": get_password_hash("3r7k03nI9"),
        "is_active": True,
        "is_blocked": False,
        "is_deletable": False,  # NICHT LÖSCHBAR
        "blocked_projects": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if SysOp already exists
    existing_sysop = await users_collection.find_one({"username": "JR"})
    if existing_sysop:
        print("✅ SysOp User JR existiert bereits")
    else:
        await users_collection.insert_one(sysop_user)
        print("✅ SysOp User JR angelegt (Passwort: 3r7k03nI9)")
    
    # =============================================================================
    # FIRMA 2: Test_Firma (löschbar)
    # =============================================================================
    
    test_company = {
        "id": str(uuid.uuid4()),
        "name": "Test_Firma",
        "description": "Test Firma für Admin und QA-Tester",
        "logo_url": None,
        "short_code": "TF",
        "is_blocked": False,
        "is_deletable": True,  # LÖSCHBAR
        "created_by": "system",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if Test_Firma already exists
    existing_test_company = await companies_collection.find_one({"name": "Test_Firma"})
    if existing_test_company:
        print("✅ Firma Test_Firma existiert bereits")
        test_company_id = existing_test_company["id"]
    else:
        await companies_collection.insert_one(test_company)
        test_company_id = test_company["id"]
        print("✅ Firma Test_Firma angelegt")
    
    # =============================================================================
    # USER 2: Admin AR (löschbar)
    # =============================================================================
    
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "AR",
        "email": "af@af.de",
        "first_name": "AFI",
        "last_name": "Renner",
        "tel": "1234567890",
        "role": "admin",
        "company_id": test_company_id,
        "language_preference": "DE",
        "hashed_password": get_password_hash("admin123"),
        "is_active": True,
        "is_blocked": False,
        "is_deletable": True,  # LÖSCHBAR
        "blocked_projects": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if Admin already exists
    existing_admin = await users_collection.find_one({"username": "AR"})
    if existing_admin:
        print("✅ Admin User AR existiert bereits")
    else:
        await users_collection.insert_one(admin_user)
        print("✅ Admin User AR angelegt (Passwort: admin123)")
    
    # =============================================================================
    # USER 3: QA-Tester AT (löschbar)
    # =============================================================================
    
    qa_user = {
        "id": str(uuid.uuid4()),
        "username": "AT",
        "email": "aT@af.de",
        "first_name": "AFB",
        "last_name": "Tester",
        "tel": "987654321",
        "role": "qa_tester",
        "company_id": test_company_id,
        "language_preference": "DE",
        "hashed_password": get_password_hash("tester123"),
        "is_active": True,
        "is_blocked": False,
        "is_deletable": True,  # LÖSCHBAR
        "blocked_projects": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if QA-Tester already exists
    existing_qa = await users_collection.find_one({"username": "AT"})
    if existing_qa:
        print("✅ QA-Tester User AT existiert bereits")
    else:
        await users_collection.insert_one(qa_user)
        print("✅ QA-Tester User AT angelegt (Passwort: tester123)")
    
    print("\n🎉 Datenbank V2 erfolgreich initialisiert!")
    print("\n📋 Zugangsdaten:")
    print("   SysOp:     JR / 3r7k03nI9")
    print("   Admin:     AR / admin123")
    print("   QA-Tester: AT / tester123")

if __name__ == "__main__":
    asyncio.run(init_db_v2())
