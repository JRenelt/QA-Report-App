#!/usr/bin/env python3
"""
Phase 2 System Rebuild - Schritt 2 Testing
Modulares Category CRUD mit Lock-Funktionalität

Testet das neue objektorientierte Category Lock-System:
- Category Lock/Unlock Funktionalität
- Lock-Protection CRUD Operationen
- Modulare Kategorie-Verwaltung
- Deutsche Fehlermeldungen
- Bookmark-Schutz beim Löschen
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv('/app/frontend/.env')
BACKEND_URL = os.getenv('REACT_APP_BACKEND_URL', 'https://favorg-rebuild.preview.emergentagent.com')
API_BASE = f"{BACKEND_URL}/api"

class Phase2CategoryLockTester:
    """Phase 2 Category Lock System Tester"""
    
    def __init__(self):
        self.session = None
        self.test_results = []
        self.test_category_id = None
        self.locked_category_id = None
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: dict = None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"{status}: {test_name}")
        if details:
            print(f"    Details: {details}")
        if not success and response_data:
            print(f"    Response: {response_data}")
        print()
    
    async def setup_test_data(self):
        """Setup test categories for lock testing"""
        print("🔧 Setting up test data for Phase 2 Category Lock System...")
        
        # Create test category for locking tests
        test_category_data = {
            "name": "Phase2TestCategory",
            "parent_category": None,
            "is_locked": False,
            "lock_reason": ""
        }
        
        try:
            async with self.session.post(
                f"{API_BASE}/categories/create-with-lock",
                json=test_category_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    self.test_category_id = data["category"]["id"]
                    print(f"✅ Created test category with ID: {self.test_category_id}")
                else:
                    print(f"❌ Failed to create test category: {response.status}")
                    
        except Exception as e:
            print(f"❌ Error setting up test data: {e}")
    
    async def test_category_lock_functionality(self):
        """Test Category Lock/Unlock functionality"""
        print("🔒 Testing Category Lock/Unlock Functionality...")
        
        if not self.test_category_id:
            self.log_test("Category Lock Setup", False, "No test category ID available")
            return
        
        # Test 1: Lock Category
        lock_data = {
            "lock_reason": "Phase 2 Testing - Administrativ gesperrt für Testzwecke"
        }
        
        try:
            async with self.session.put(
                f"{API_BASE}/categories/{self.test_category_id}/lock",
                json=lock_data
            ) as response:
                data = await response.json()
                
                if response.status == 200 and data.get("is_locked") == True:
                    self.log_test(
                        "PUT /api/categories/{id}/lock",
                        True,
                        f"Category successfully locked with reason: {lock_data['lock_reason']}",
                        data
                    )
                    self.locked_category_id = self.test_category_id
                else:
                    self.log_test(
                        "PUT /api/categories/{id}/lock",
                        False,
                        f"Lock failed - Status: {response.status}",
                        data
                    )
        except Exception as e:
            self.log_test("PUT /api/categories/{id}/lock", False, f"Exception: {e}")
        
        # Test 2: Unlock Category
        try:
            async with self.session.put(
                f"{API_BASE}/categories/{self.test_category_id}/unlock"
            ) as response:
                data = await response.json()
                
                if response.status == 200 and data.get("is_locked") == False:
                    self.log_test(
                        "PUT /api/categories/{id}/unlock",
                        True,
                        "Category successfully unlocked",
                        data
                    )
                else:
                    self.log_test(
                        "PUT /api/categories/{id}/unlock",
                        False,
                        f"Unlock failed - Status: {response.status}",
                        data
                    )
        except Exception as e:
            self.log_test("PUT /api/categories/{id}/unlock", False, f"Exception: {e}")
        
        # Test 3: Re-lock for protection tests
        try:
            async with self.session.put(
                f"{API_BASE}/categories/{self.test_category_id}/lock",
                json={"lock_reason": "Locked for protection testing"}
            ) as response:
                if response.status == 200:
                    self.locked_category_id = self.test_category_id
                    print("🔒 Re-locked category for protection tests")
        except Exception as e:
            print(f"❌ Error re-locking category: {e}")
    
    async def test_lock_status_retrieval(self):
        """Test GET /api/categories/with-lock-status"""
        print("📋 Testing Lock Status Retrieval...")
        
        try:
            async with self.session.get(
                f"{API_BASE}/categories/with-lock-status"
            ) as response:
                data = await response.json()
                
                if response.status == 200:
                    categories = data.get("categories", [])
                    total_count = data.get("total_count", 0)
                    locked_count = data.get("locked_count", 0)
                    
                    # Check if our test category is in the list with correct lock info
                    test_category_found = False
                    for category in categories:
                        if category.get("id") == self.test_category_id:
                            test_category_found = True
                            lock_info = category.get("lock_info", {})
                            
                            if (lock_info.get("is_locked") == True and 
                                lock_info.get("can_edit") == False and 
                                lock_info.get("can_delete") == False):
                                
                                self.log_test(
                                    "GET /api/categories/with-lock-status",
                                    True,
                                    f"Lock status correctly retrieved - Total: {total_count}, Locked: {locked_count}",
                                    {
                                        "total_categories": total_count,
                                        "locked_categories": locked_count,
                                        "test_category_lock_info": lock_info
                                    }
                                )
                            else:
                                self.log_test(
                                    "GET /api/categories/with-lock-status",
                                    False,
                                    "Lock info incorrect for test category",
                                    lock_info
                                )
                            break
                    
                    if not test_category_found:
                        self.log_test(
                            "GET /api/categories/with-lock-status",
                            False,
                            "Test category not found in lock status response"
                        )
                else:
                    self.log_test(
                        "GET /api/categories/with-lock-status",
                        False,
                        f"Failed to retrieve lock status - Status: {response.status}",
                        data
                    )
                    
        except Exception as e:
            self.log_test("GET /api/categories/with-lock-status", False, f"Exception: {e}")
    
    async def test_lock_protection_crud(self):
        """Test Lock-Protection CRUD Operations"""
        print("🛡️ Testing Lock-Protection CRUD Operations...")
        
        if not self.locked_category_id:
            self.log_test("Lock Protection Setup", False, "No locked category available for testing")
            return
        
        # Test 1: Protected Update (should return 403)
        update_data = {
            "name": "UpdatedLockedCategory"
        }
        
        try:
            async with self.session.put(
                f"{API_BASE}/categories/{self.locked_category_id}/update-protected",
                json=update_data
            ) as response:
                data = await response.json()
                
                if response.status == 403:
                    detail = data.get("detail", "")
                    if "Gesperrte Kategorie kann nicht bearbeitet werden" in detail:
                        self.log_test(
                            "PUT /api/categories/{id}/update-protected (403 Expected)",
                            True,
                            f"Correct German error message: {detail}",
                            data
                        )
                    else:
                        self.log_test(
                            "PUT /api/categories/{id}/update-protected (403 Expected)",
                            False,
                            f"Wrong error message format: {detail}",
                            data
                        )
                else:
                    self.log_test(
                        "PUT /api/categories/{id}/update-protected (403 Expected)",
                        False,
                        f"Expected 403, got {response.status}",
                        data
                    )
        except Exception as e:
            self.log_test("PUT /api/categories/{id}/update-protected", False, f"Exception: {e}")
        
        # Test 2: Protected Delete (should return 403)
        try:
            async with self.session.delete(
                f"{API_BASE}/categories/{self.locked_category_id}/delete-protected"
            ) as response:
                data = await response.json()
                
                if response.status == 403:
                    detail = data.get("detail", "")
                    if "Gesperrte Kategorie kann nicht gelöscht werden" in detail:
                        self.log_test(
                            "DELETE /api/categories/{id}/delete-protected (403 Expected)",
                            True,
                            f"Correct German error message: {detail}",
                            data
                        )
                    else:
                        self.log_test(
                            "DELETE /api/categories/{id}/delete-protected (403 Expected)",
                            False,
                            f"Wrong error message format: {detail}",
                            data
                        )
                else:
                    self.log_test(
                        "DELETE /api/categories/{id}/delete-protected (403 Expected)",
                        False,
                        f"Expected 403, got {response.status}",
                        data
                    )
        except Exception as e:
            self.log_test("DELETE /api/categories/{id}/delete-protected", False, f"Exception: {e}")
    
    async def test_create_with_lock(self):
        """Test POST /api/categories/create-with-lock"""
        print("➕ Testing Create Category with Lock...")
        
        # Test 1: Create unlocked category
        unlocked_category_data = {
            "name": "Phase2UnlockedCategory",
            "parent_category": None,
            "is_locked": False,
            "lock_reason": ""
        }
        
        try:
            async with self.session.post(
                f"{API_BASE}/categories/create-with-lock",
                json=unlocked_category_data
            ) as response:
                data = await response.json()
                
                if response.status == 200:
                    category = data.get("category", {})
                    if category.get("is_locked") == False:
                        self.log_test(
                            "POST /api/categories/create-with-lock (Unlocked)",
                            True,
                            f"Unlocked category created: {category.get('name')}",
                            data
                        )
                    else:
                        self.log_test(
                            "POST /api/categories/create-with-lock (Unlocked)",
                            False,
                            "Category should be unlocked but is_locked=True",
                            data
                        )
                else:
                    self.log_test(
                        "POST /api/categories/create-with-lock (Unlocked)",
                        False,
                        f"Failed to create unlocked category - Status: {response.status}",
                        data
                    )
        except Exception as e:
            self.log_test("POST /api/categories/create-with-lock (Unlocked)", False, f"Exception: {e}")
        
        # Test 2: Create locked category
        locked_category_data = {
            "name": "Phase2LockedCategory",
            "parent_category": None,
            "is_locked": True,
            "lock_reason": "Created locked for Phase 2 testing"
        }
        
        try:
            async with self.session.post(
                f"{API_BASE}/categories/create-with-lock",
                json=locked_category_data
            ) as response:
                data = await response.json()
                
                if response.status == 200:
                    category = data.get("category", {})
                    if (category.get("is_locked") == True and 
                        category.get("lock_reason") == locked_category_data["lock_reason"]):
                        self.log_test(
                            "POST /api/categories/create-with-lock (Locked)",
                            True,
                            f"Locked category created: {category.get('name')} with reason: {category.get('lock_reason')}",
                            data
                        )
                    else:
                        self.log_test(
                            "POST /api/categories/create-with-lock (Locked)",
                            False,
                            "Category lock settings incorrect",
                            data
                        )
                else:
                    self.log_test(
                        "POST /api/categories/create-with-lock (Locked)",
                        False,
                        f"Failed to create locked category - Status: {response.status}",
                        data
                    )
        except Exception as e:
            self.log_test("POST /api/categories/create-with-lock (Locked)", False, f"Exception: {e}")
    
    async def test_modular_category_manager_structure(self):
        """Test Modular Category Manager Object-Oriented Structure"""
        print("🏗️ Testing Modular Category Manager Structure...")
        
        # Test timestamp management by checking created categories
        try:
            async with self.session.get(
                f"{API_BASE}/categories/with-lock-status"
            ) as response:
                data = await response.json()
                
                if response.status == 200:
                    categories = data.get("categories", [])
                    
                    # Check for proper timestamp fields
                    timestamp_fields_found = 0
                    lock_fields_found = 0
                    
                    for category in categories:
                        # Check timestamp management
                        if "created_at" in category:
                            timestamp_fields_found += 1
                        if "updated_at" in category:
                            timestamp_fields_found += 1
                        
                        # Check lock-related fields
                        lock_info = category.get("lock_info", {})
                        if "is_locked" in lock_info:
                            lock_fields_found += 1
                        if "lock_reason" in lock_info:
                            lock_fields_found += 1
                        if "can_edit" in lock_info:
                            lock_fields_found += 1
                        if "can_delete" in lock_info:
                            lock_fields_found += 1
                    
                    if timestamp_fields_found > 0 and lock_fields_found > 0:
                        self.log_test(
                            "Modular Category Manager Structure",
                            True,
                            f"Object-oriented structure verified - Timestamp fields: {timestamp_fields_found}, Lock fields: {lock_fields_found}",
                            {
                                "total_categories": len(categories),
                                "timestamp_fields": timestamp_fields_found,
                                "lock_fields": lock_fields_found
                            }
                        )
                    else:
                        self.log_test(
                            "Modular Category Manager Structure",
                            False,
                            f"Missing required fields - Timestamp: {timestamp_fields_found}, Lock: {lock_fields_found}"
                        )
                else:
                    self.log_test(
                        "Modular Category Manager Structure",
                        False,
                        f"Failed to retrieve categories for structure test - Status: {response.status}"
                    )
                    
        except Exception as e:
            self.log_test("Modular Category Manager Structure", False, f"Exception: {e}")
    
    async def test_bookmark_protection_on_delete(self):
        """Test Bookmark Protection when deleting categories"""
        print("🔖 Testing Bookmark Protection on Category Delete...")
        
        # First, create a test category and add a bookmark to it
        test_category_data = {
            "name": "BookmarkProtectionTest",
            "parent_category": None,
            "is_locked": False
        }
        
        try:
            # Create category
            async with self.session.post(
                f"{API_BASE}/categories/create-with-lock",
                json=test_category_data
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    test_cat_id = data["category"]["id"]
                    
                    # Create a bookmark in this category
                    bookmark_data = {
                        "title": "Test Bookmark for Protection",
                        "url": "https://test-bookmark-protection.example.com",
                        "category": "BookmarkProtectionTest",
                        "description": "Testing bookmark protection during category deletion"
                    }
                    
                    async with self.session.post(
                        f"{API_BASE}/bookmarks",
                        json=bookmark_data
                    ) as bookmark_response:
                        if bookmark_response.status == 200:
                            # Now delete the category and check if bookmark is moved to Uncategorized
                            async with self.session.delete(
                                f"{API_BASE}/categories/{test_cat_id}/delete-protected"
                            ) as delete_response:
                                delete_data = await delete_response.json()
                                
                                if delete_response.status == 200:
                                    message = delete_data.get("message", "")
                                    moved_bookmarks = delete_data.get("moved_bookmarks", 0)
                                    
                                    if "moved to Uncategorized" in message and moved_bookmarks > 0:
                                        self.log_test(
                                            "Bookmark Protection on Category Delete",
                                            True,
                                            f"Category deleted and {moved_bookmarks} bookmarks moved to Uncategorized",
                                            delete_data
                                        )
                                    else:
                                        self.log_test(
                                            "Bookmark Protection on Category Delete",
                                            False,
                                            f"Bookmark protection unclear - Message: {message}",
                                            delete_data
                                        )
                                else:
                                    self.log_test(
                                        "Bookmark Protection on Category Delete",
                                        False,
                                        f"Category deletion failed - Status: {delete_response.status}",
                                        delete_data
                                    )
                        else:
                            self.log_test(
                                "Bookmark Protection Setup",
                                False,
                                "Failed to create test bookmark"
                            )
                else:
                    self.log_test(
                        "Bookmark Protection Setup",
                        False,
                        "Failed to create test category for bookmark protection"
                    )
                    
        except Exception as e:
            self.log_test("Bookmark Protection on Category Delete", False, f"Exception: {e}")
    
    async def run_all_tests(self):
        """Run all Phase 2 Category Lock System tests"""
        print("🚀 Starting Phase 2 System Rebuild - Schritt 2 Testing")
        print("=" * 60)
        
        await self.setup_test_data()
        await self.test_category_lock_functionality()
        await self.test_lock_status_retrieval()
        await self.test_lock_protection_crud()
        await self.test_create_with_lock()
        await self.test_modular_category_manager_structure()
        await self.test_bookmark_protection_on_delete()
        
        # Summary
        print("=" * 60)
        print("📊 PHASE 2 CATEGORY LOCK SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Success Rate: {success_rate:.1f}%")
        print()
        
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  - {test['test']}: {test['details']}")
            print()
        
        print("✅ PASSED TESTS:")
        for test in self.test_results:
            if test["success"]:
                print(f"  - {test['test']}")
        
        print("\n" + "=" * 60)
        print("🎯 PHASE 2 SYSTEM REBUILD - SCHRITT 2 TESTING COMPLETE")
        print("=" * 60)
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": success_rate,
            "test_results": self.test_results
        }

async def main():
    """Main test execution"""
    async with Phase2CategoryLockTester() as tester:
        results = await tester.run_all_tests()
        return results

if __name__ == "__main__":
    results = asyncio.run(main())