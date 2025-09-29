#!/usr/bin/env python3
"""
Debug Category Lock Issues
"""

import asyncio
import aiohttp
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://test-suite-portal.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

async def debug_category_lock():
    async with aiohttp.ClientSession() as session:
        print("🔍 Debugging Category Lock Issues...")
        
        # 1. Create a test category
        print("\n1. Creating test category...")
        test_category_data = {
            "name": "DebugTestCategory",
            "parent_category": None,
            "is_locked": False,
            "lock_reason": ""
        }
        
        async with session.post(f"{API_BASE}/categories/create-with-lock", json=test_category_data) as response:
            data = await response.json()
            print(f"Status: {response.status}")
            print(f"Response: {json.dumps(data, indent=2)}")
            
            if response.status == 200:
                category_id = data["category"]["id"]
                print(f"Created category ID: {category_id}")
                
                # 2. Lock the category
                print("\n2. Locking category...")
                lock_data = {"lock_reason": "Debug test lock"}
                async with session.put(f"{API_BASE}/categories/{category_id}/lock", json=lock_data) as lock_response:
                    lock_result = await lock_response.json()
                    print(f"Lock Status: {lock_response.status}")
                    print(f"Lock Response: {json.dumps(lock_result, indent=2)}")
                
                # 3. Check lock status
                print("\n3. Checking lock status...")
                async with session.get(f"{API_BASE}/categories/with-lock-status") as status_response:
                    status_data = await status_response.json()
                    print(f"Status Response Code: {status_response.status}")
                    
                    # Find our test category
                    categories = status_data.get("categories", [])
                    for cat in categories:
                        if cat.get("id") == category_id:
                            print(f"Found test category:")
                            print(f"  Name: {cat.get('name')}")
                            print(f"  Lock Info: {json.dumps(cat.get('lock_info', {}), indent=4)}")
                            print(f"  Full Category: {json.dumps(cat, indent=4)}")
                            break
                    else:
                        print("❌ Test category not found in lock status response")
                
                # 4. Test create with lock variations
                print("\n4. Testing create with lock variations...")
                
                # Test unlocked creation
                unlocked_data = {
                    "name": "DebugUnlocked",
                    "is_locked": False
                }
                async with session.post(f"{API_BASE}/categories/create-with-lock", json=unlocked_data) as response:
                    data = await response.json()
                    print(f"Unlocked creation - Status: {response.status}")
                    print(f"Response: {json.dumps(data, indent=2)}")
                
                # Test locked creation
                locked_data = {
                    "name": "DebugLocked",
                    "is_locked": True,
                    "lock_reason": "Debug locked creation"
                }
                async with session.post(f"{API_BASE}/categories/create-with-lock", json=locked_data) as response:
                    data = await response.json()
                    print(f"Locked creation - Status: {response.status}")
                    print(f"Response: {json.dumps(data, indent=2)}")

if __name__ == "__main__":
    asyncio.run(debug_category_lock())