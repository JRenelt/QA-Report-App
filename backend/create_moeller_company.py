"""
Erstelle Möller Industriedienstleistungen GmbH mit Admin und QA-Tester
"""

import asyncio
import sys
sys.path.append('/app/backend')

from database import get_database
from auth import get_password_hash
import uuid
from datetime import datetime

async def create_moeller_company():
    """Erstelle Möller Firma und User"""
    db = await get_database()
    
    companies_collection = db["companies_v2"]
    users_collection = db["users_v2"]
    
    print("🚀 Erstelle Möller Industriedienstleistungen GmbH...")
    
    # =============================================================================
    # FIRMA: Möller Industriedienstleistungen GmbH
    # =============================================================================
    
    moeller_company = {
        "id": str(uuid.uuid4()),
        "name": "Möller Industriedienstleistungen GmbH",
        "description": "Industriedienstleistungen",
        "logo_url": None,
        "short_code": "MI",
        "street": "Halskestrasse 67",
        "postal_code": "22113",
        "city": "Hamburg",
        "country": "Deutschland",
        "contact_person_name": "Andreas Diedriechs",
        "contact_person_email": "x@moellerdienst.de",
        "contact_person_phone": "+49 40 9707769-60",
        "is_blocked": False,
        "is_deletable": True,
        "created_by": "system",
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if company already exists
    existing_company = await companies_collection.find_one({"name": "Möller Industriedienstleistungen GmbH"})
    if existing_company:
        print("✅ Firma Möller Industriedienstleistungen GmbH existiert bereits")
        moeller_company_id = existing_company["id"]
    else:
        await companies_collection.insert_one(moeller_company)
        moeller_company_id = moeller_company["id"]
        print("✅ Firma Möller Industriedienstleistungen GmbH angelegt")
        print(f"   Adresse: Halskestrasse 67, 22113 Hamburg")
        print(f"   Tel: +49 40 9707769-60")
        print(f"   Email: x@moellerdienst.de")
    
    # =============================================================================
    # USER 1: Admin - Andreas Diedriechs (AD)
    # =============================================================================
    
    admin_user = {
        "id": str(uuid.uuid4()),
        "username": "AD",
        "email": "x@moellerdienst.de",
        "first_name": "Andreas",
        "last_name": "Diedriechs",
        "tel": "+49 40 9707769-60",
        "role": "admin",
        "company_id": moeller_company_id,
        "language_preference": "DE",
        "hashed_password": get_password_hash("AD123"),
        "is_active": True,
        "is_blocked": False,
        "is_deletable": True,
        "blocked_projects": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if Admin already exists
    existing_admin = await users_collection.find_one({"username": "AD"})
    if existing_admin:
        print("✅ Admin User AD existiert bereits")
    else:
        await users_collection.insert_one(admin_user)
        print("✅ Admin User AD angelegt")
        print(f"   Name: Andreas Diedriechs")
        print(f"   Login: AD / AD123")
    
    # =============================================================================
    # USER 2: QA-Tester - Martin Möller (MM)
    # =============================================================================
    
    qa_user = {
        "id": str(uuid.uuid4()),
        "username": "MM",
        "email": "m.moeller@moellerdienst.de",
        "first_name": "Martin",
        "last_name": "Möller",
        "tel": "+49 40 9707769-60",
        "role": "qa_tester",
        "company_id": moeller_company_id,
        "language_preference": "DE",
        "hashed_password": get_password_hash("mm123"),
        "is_active": True,
        "is_blocked": False,
        "is_deletable": True,
        "blocked_projects": [],
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat()
    }
    
    # Check if QA-Tester already exists
    existing_qa = await users_collection.find_one({"username": "MM"})
    if existing_qa:
        print("✅ QA-Tester User MM existiert bereits")
    else:
        await users_collection.insert_one(qa_user)
        print("✅ QA-Tester User MM angelegt")
        print(f"   Name: Martin Möller")
        print(f"   Login: MM / mm123")
    
    print("\n🎉 Möller Industriedienstleistungen GmbH erfolgreich erstellt!")
    print("\n📋 Zugangsdaten:")
    print("   Admin:     AD / AD123 (Andreas Diedriechs)")
    print("   QA-Tester: MM / mm123 (Martin Möller)")

if __name__ == "__main__":
    asyncio.run(create_moeller_company())
