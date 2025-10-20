#!/usr/bin/env python3
"""
Debug script for mass data generation
"""

import asyncio
import sys
sys.path.append('./backend')
from backend.database import connect_db, test_suites_collection, test_cases_collection
from datetime import datetime
import uuid

async def debug_mass_data():
    await connect_db()
    
    # Clear existing data
    await test_suites_collection.delete_many({})
    await test_cases_collection.delete_many({})
    
    print("Testing suite creation for one project...")
    
    project_id = "PERF_PROJ_001_001"
    company_num = 1
    project_num = 1
    
    # Generate 50 test suites per project
    for suite_num in range(1, 51):
        suite_id = f"SUITE_{company_num:03d}_{project_num:03d}_{suite_num:03d}"
        suite = {
            "id": suite_id,
            "project_id": project_id,
            "name": f"Testbereich {suite_num}",
            "description": f"Performance Test Suite {suite_num}",
            "icon": "file",
            "created_by": "admin_user_id",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "sort_order": suite_num
        }
        
        try:
            result = await test_suites_collection.insert_one(suite)
            print(f"Created suite {suite_num}: {suite_id} -> {result.inserted_id}")
        except Exception as e:
            print(f"Error creating suite {suite_num}: {e}")
            break
        
        # Generate 50 test cases per suite
        test_cases_batch = []
        for test_num in range(1, 51):
            test_case = {
                "id": uuid.uuid4().hex,
                "test_id": f"PERF{company_num:03d}{project_num:03d}{suite_num:03d}{test_num:03d}",
                "test_suite_id": suite_id,
                "project_id": project_id,
                "title": f"Performance Testfall {test_num}",
                "description": f"Automatisch generierter Testfall (Suite {suite_num}, Test {test_num})",
                "status": "pending",
                "note": "",
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            test_cases_batch.append(test_case)
        
        # Bulk insert test cases for this suite
        if test_cases_batch:
            try:
                result = await test_cases_collection.insert_many(test_cases_batch)
                print(f"  Created {len(result.inserted_ids)} test cases for suite {suite_num}")
            except Exception as e:
                print(f"  Error creating test cases for suite {suite_num}: {e}")
    
    # Check final counts
    suites_count = await test_suites_collection.count_documents({"project_id": project_id})
    cases_count = await test_cases_collection.count_documents({"project_id": project_id})
    
    print(f"\nFinal counts:")
    print(f"Suites: {suites_count}")
    print(f"Test Cases: {cases_count}")

if __name__ == "__main__":
    asyncio.run(debug_mass_data())