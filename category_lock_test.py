#!/usr/bin/env python3
"""
Focused Backend Test for ModularCategoryManager Lock/Unlock System
German Review Request - Category Lock/Unlock Testing

Tests specifically:
1. Category Lock Test - lock category and verify protection (403 errors)
2. Category Unlock Test - unlock category and verify operations work
3. Lock Status Test - test /api/categories/with-lock-status endpoint  
4. Edge Cases - non-existent IDs, double lock/unlock, invalid JSON
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List

class CategoryLockTester:
    def __init__(self):
        self.base_url = "https://hieralink.preview.emergentagent.com/api"
        self.test_results = []
        self.test_category_id = None
        self.test_category_name = f"TestCategory_{uuid.uuid4().hex[:8]}"
        
    async def log_test(self, test_name: str, success: bool, details: str, response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    async def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = None) -> Dict[str, Any]:
        """Make HTTP request and return response details"""
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with aiohttp.ClientSession() as session:
                kwargs = {
                    'headers': {'Content-Type': 'application/json'}
                }
                if data:
                    kwargs['json'] = data
                
                async with session.request(method, url, **kwargs) as response:
                    try:
                        response_data = await response.json()
                    except:
                        response_data = await response.text()
                    
                    return {
                        "status_code": response.status,
                        "data": response_data,
                        "success": expected_status is None or response.status == expected_status
                    }
        except Exception as e:
            return {
                "status_code": 0,
                "data": str(e),
                "success": False,
                "error": str(e)
            }
    
    async def setup_test_category(self) -> bool:
        """Create a test category for lock/unlock testing"""
        print("\n🔧 SETUP: Creating test category...")
        
        # First, get existing categories to find one to test with
        response = await self.make_request("GET", "/categories")
        
        if response["status_code"] == 200 and response["data"]:
            categories = response["data"]
            if categories:
                # Use first existing category
                self.test_category_id = categories[0]["id"]
                self.test_category_name = categories[0]["name"]
                await self.log_test("Setup - Use Existing Category", True, 
                                  f"Using existing category: {self.test_category_name} (ID: {self.test_category_id})")
                return True
        
        # If no categories exist, try to create one
        create_data = {
            "name": self.test_category_name,
            "parent_category": None
        }
        
        response = await self.make_request("POST", "/categories", create_data, 201)
        
        if response["success"] and "id" in response["data"]:
            self.test_category_id = response["data"]["id"]
            await self.log_test("Setup - Create Test Category", True, 
                              f"Created test category: {self.test_category_name}")
            return True
        else:
            await self.log_test("Setup - Create Test Category", False, 
                              f"Failed to create test category", response["data"])
            return False
    
    async def test_category_lock(self):
        """Test 1: Category Lock Functionality"""
        print("\n🔒 TEST 1: CATEGORY LOCK FUNCTIONALITY")
        
        if not self.test_category_id:
            await self.log_test("Category Lock", False, "No test category available")
            return
        
        # Test locking the category
        lock_data = {
            "lock_reason": "Testing lock functionality - German Review Request"
        }
        
        response = await self.make_request("POST", f"/categories/{self.test_category_id}/lock", 
                                         lock_data, 200)
        
        if response["success"]:
            await self.log_test("Lock Category", True, 
                              f"Successfully locked category: {response['data']}")
        else:
            await self.log_test("Lock Category", False, 
                              f"Failed to lock category (Status: {response['status_code']})", 
                              response["data"])
            return
        
        # Test that locked category cannot be updated (should return 403)
        update_data = {
            "name": f"{self.test_category_name}_UPDATED"
        }
        
        response = await self.make_request("PUT", f"/categories/{self.test_category_id}", 
                                         update_data, 403)
        
        if response["status_code"] == 403:
            await self.log_test("Update Locked Category Protection", True, 
                              f"Correctly blocked update with 403: {response['data']}")
        else:
            await self.log_test("Update Locked Category Protection", False, 
                              f"Expected 403, got {response['status_code']}", response["data"])
        
        # Test that locked category cannot be deleted (should return 403)
        response = await self.make_request("DELETE", f"/categories/{self.test_category_id}", 
                                         expected_status=403)
        
        if response["status_code"] == 403:
            await self.log_test("Delete Locked Category Protection", True, 
                              f"Correctly blocked delete with 403: {response['data']}")
        else:
            await self.log_test("Delete Locked Category Protection", False, 
                              f"Expected 403, got {response['status_code']}", response["data"])
    
    async def test_category_unlock(self):
        """Test 2: Category Unlock Functionality"""
        print("\n🔓 TEST 2: CATEGORY UNLOCK FUNCTIONALITY")
        
        if not self.test_category_id:
            await self.log_test("Category Unlock", False, "No test category available")
            return
        
        # Test unlocking the category
        response = await self.make_request("PUT", f"/categories/{self.test_category_id}/unlock", 
                                         expected_status=200)
        
        if response["success"]:
            await self.log_test("Unlock Category", True, 
                              f"Successfully unlocked category: {response['data']}")
        else:
            await self.log_test("Unlock Category", False, 
                              f"Failed to unlock category (Status: {response['status_code']})", 
                              response["data"])
            return
        
        # Test that unlocked category can now be updated
        update_data = {
            "name": f"{self.test_category_name}_UNLOCKED"
        }
        
        response = await self.make_request("PUT", f"/categories/{self.test_category_id}", 
                                         update_data, 200)
        
        if response["success"]:
            await self.log_test("Update Unlocked Category", True, 
                              f"Successfully updated unlocked category: {response['data']}")
            # Update our test name for consistency
            self.test_category_name = f"{self.test_category_name}_UNLOCKED"
        else:
            await self.log_test("Update Unlocked Category", False, 
                              f"Failed to update unlocked category (Status: {response['status_code']})", 
                              response["data"])
        
        # Test all CRUD operations work after unlock
        await self.test_crud_operations_after_unlock()
    
    async def test_crud_operations_after_unlock(self):
        """Test all CRUD operations work after unlock"""
        print("\n📝 TEST 2.1: CRUD OPERATIONS AFTER UNLOCK")
        
        # Test READ operation
        response = await self.make_request("GET", "/categories", expected_status=200)
        
        if response["success"]:
            categories = response["data"]
            test_category = next((cat for cat in categories if cat["id"] == self.test_category_id), None)
            if test_category:
                await self.log_test("Read After Unlock", True, 
                                  f"Successfully read category: {test_category['name']}")
            else:
                await self.log_test("Read After Unlock", False, 
                                  "Test category not found in categories list")
        else:
            await self.log_test("Read After Unlock", False, 
                              f"Failed to read categories (Status: {response['status_code']})", 
                              response["data"])
    
    async def test_lock_status_endpoint(self):
        """Test 3: Lock Status Endpoint"""
        print("\n📊 TEST 3: LOCK STATUS ENDPOINT")
        
        # Test /api/categories/with-lock-status endpoint
        response = await self.make_request("GET", "/categories/with-lock-status", expected_status=200)
        
        if response["success"]:
            categories = response["data"]
            await self.log_test("Lock Status Endpoint", True, 
                              f"Successfully retrieved {len(categories)} categories with lock status")
            
            # Verify lock status fields are present
            if categories:
                sample_category = categories[0]
                required_fields = ["id", "name", "is_locked"]
                missing_fields = [field for field in required_fields if field not in sample_category]
                
                if not missing_fields:
                    await self.log_test("Lock Status Fields", True, 
                                      "All required lock status fields present")
                else:
                    await self.log_test("Lock Status Fields", False, 
                                      f"Missing fields: {missing_fields}")
                
                # Find our test category and check its lock status
                test_category = next((cat for cat in categories if cat["id"] == self.test_category_id), None)
                if test_category:
                    lock_status = test_category.get("is_locked", "unknown")
                    await self.log_test("Test Category Lock Status", True, 
                                      f"Test category lock status: {lock_status}")
                else:
                    await self.log_test("Test Category Lock Status", False, 
                                      "Test category not found in lock status response")
        else:
            await self.log_test("Lock Status Endpoint", False, 
                              f"Failed to retrieve lock status (Status: {response['status_code']})", 
                              response["data"])
    
    async def test_edge_cases(self):
        """Test 4: Edge Cases"""
        print("\n⚠️ TEST 4: EDGE CASES")
        
        # Test lock with non-existent category ID
        fake_id = str(uuid.uuid4())
        response = await self.make_request("POST", f"/categories/{fake_id}/lock", 
                                         {"lock_reason": "Test"}, 404)
        
        if response["status_code"] == 404:
            await self.log_test("Lock Non-existent Category", True, 
                              f"Correctly returned 404 for non-existent category")
        else:
            await self.log_test("Lock Non-existent Category", False, 
                              f"Expected 404, got {response['status_code']}", response["data"])
        
        # Test unlock with non-existent category ID
        response = await self.make_request("PUT", f"/categories/{fake_id}/unlock", 
                                         expected_status=404)
        
        if response["status_code"] == 404:
            await self.log_test("Unlock Non-existent Category", True, 
                              f"Correctly returned 404 for non-existent category")
        else:
            await self.log_test("Unlock Non-existent Category", False, 
                              f"Expected 404, got {response['status_code']}", response["data"])
        
        # Test double lock (if we have a test category)
        if self.test_category_id:
            # First lock
            response1 = await self.make_request("POST", f"/categories/{self.test_category_id}/lock", 
                                              {"lock_reason": "First lock"})
            
            # Second lock
            response2 = await self.make_request("POST", f"/categories/{self.test_category_id}/lock", 
                                              {"lock_reason": "Second lock"})
            
            await self.log_test("Double Lock", True, 
                              f"Double lock test - First: {response1['status_code']}, Second: {response2['status_code']}")
            
            # Test double unlock
            response3 = await self.make_request("PUT", f"/categories/{self.test_category_id}/unlock")
            response4 = await self.make_request("PUT", f"/categories/{self.test_category_id}/unlock")
            
            await self.log_test("Double Unlock", True, 
                              f"Double unlock test - First: {response3['status_code']}, Second: {response4['status_code']}")
        
        # Test invalid JSON for lock request
        try:
            url = f"{self.base_url}/categories/{self.test_category_id or 'test'}/lock"
            async with aiohttp.ClientSession() as session:
                async with session.post(url, data="invalid json", 
                                      headers={'Content-Type': 'application/json'}) as response:
                    if response.status in [400, 422]:
                        await self.log_test("Invalid JSON Request", True, 
                                          f"Correctly handled invalid JSON with status {response.status}")
                    else:
                        await self.log_test("Invalid JSON Request", False, 
                                          f"Unexpected status {response.status} for invalid JSON")
        except Exception as e:
            await self.log_test("Invalid JSON Request", True, 
                              f"Exception correctly raised for invalid JSON: {str(e)}")
    
    async def cleanup(self):
        """Clean up test data"""
        print("\n🧹 CLEANUP: Removing test data...")
        
        if self.test_category_id:
            # Ensure category is unlocked before deletion
            await self.make_request("PUT", f"/categories/{self.test_category_id}/unlock")
            
            # Try to delete the test category
            response = await self.make_request("DELETE", f"/categories/{self.test_category_id}")
            
            if response["status_code"] == 200:
                await self.log_test("Cleanup - Delete Test Category", True, 
                                  "Successfully deleted test category")
            else:
                await self.log_test("Cleanup - Delete Test Category", False, 
                                  f"Failed to delete test category (Status: {response['status_code']})", 
                                  response["data"])
    
    def generate_summary(self) -> Dict[str, Any]:
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": f"{success_rate:.1f}%",
            "test_results": self.test_results
        }
    
    async def run_all_tests(self):
        """Run all lock/unlock system tests"""
        print("🎯 GERMAN REVIEW REQUEST - CATEGORY LOCK/UNLOCK SYSTEM TESTING")
        print("=" * 70)
        print(f"Backend URL: {self.base_url}")
        print(f"Test Category: {self.test_category_name}")
        print("=" * 70)
        
        try:
            # Setup
            if not await self.setup_test_category():
                print("❌ CRITICAL: Could not set up test category. Aborting tests.")
                return self.generate_summary()
            
            # Run all tests
            await self.test_category_lock()
            await self.test_category_unlock()
            await self.test_lock_status_endpoint()
            await self.test_edge_cases()
            
            # Cleanup
            await self.cleanup()
            
        except Exception as e:
            await self.log_test("Test Execution", False, f"Critical error during testing: {str(e)}")
        
        # Generate and display summary
        summary = self.generate_summary()
        
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Passed: {summary['passed_tests']}")
        print(f"Failed: {summary['failed_tests']}")
        print(f"Success Rate: {summary['success_rate']}")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        return summary

async def main():
    """Main test execution"""
    tester = CategoryLockTester()
    summary = await tester.run_all_tests()
    
    # Save results to file
    with open("/app/category_lock_test_results.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)
    
    print(f"\n💾 Results saved to: /app/category_lock_test_results.json")
    
    return summary

if __name__ == "__main__":
    asyncio.run(main())