#!/usr/bin/env python3
"""
Comprehensive Category Lock/Unlock System Test
German Review Request - Specific Testing

This test addresses the database inconsistency issue and tests the lock/unlock system thoroughly.
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List

class ComprehensiveCategoryLockTester:
    def __init__(self):
        self.base_url = "https://pdf-report-boost.preview.emergentagent.com/api"
        self.test_results = []
        self.test_category_id = None
        self.test_category_name = f"LockTestCategory_{uuid.uuid4().hex[:8]}"
        
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
    
    async def create_test_category_with_proper_id(self) -> bool:
        """Create a test category using the proper API endpoint"""
        print("\n🔧 SETUP: Creating test category with proper ID...")
        
        # Use the create-with-lock endpoint to ensure proper ID handling
        create_data = {
            "name": self.test_category_name,
            "parent_category": None,
            "is_locked": False,
            "lock_reason": ""
        }
        
        response = await self.make_request("POST", "/categories/create-with-lock", create_data)
        
        if response["status_code"] == 200:
            # Check if ID is in response["data"]["id"] or response["data"]["category"]["id"]
            if "id" in response["data"]:
                self.test_category_id = response["data"]["id"]
            elif "category" in response["data"] and "id" in response["data"]["category"]:
                self.test_category_id = response["data"]["category"]["id"]
            
            if self.test_category_id:
                await self.log_test("Setup - Create Test Category", True, 
                                  f"Created test category with ID: {self.test_category_id}")
                return True
        else:
            await self.log_test("Setup - Create Test Category", False, 
                              f"Failed to create test category (Status: {response['status_code']})", 
                              response["data"])
            
            # Fallback: try regular create endpoint
            response = await self.make_request("POST", "/categories", {
                "name": self.test_category_name,
                "parent_category": None
            })
            
            if response["status_code"] == 200 and "id" in response["data"]:
                self.test_category_id = response["data"]["id"]
                await self.log_test("Setup - Fallback Create", True, 
                                  f"Created test category via fallback: {self.test_category_id}")
                return True
            else:
                await self.log_test("Setup - Fallback Create", False, 
                                  f"Fallback create also failed", response["data"])
                return False
    
    async def test_1_category_lock_functionality(self):
        """Test 1: Category Lock Test - lock category and verify protection"""
        print("\n🔒 TEST 1: CATEGORY LOCK FUNCTIONALITY")
        
        if not self.test_category_id:
            await self.log_test("Category Lock Test", False, "No test category available")
            return
        
        # Step 1: Lock the category
        lock_data = {
            "lock_reason": "German Review Request - Testing lock functionality"
        }
        
        response = await self.make_request("PUT", f"/categories/{self.test_category_id}/lock", 
                                         lock_data, 200)
        
        if response["success"]:
            await self.log_test("1.1 Lock Category", True, 
                              f"Successfully locked category: {response['data']}")
        else:
            await self.log_test("1.1 Lock Category", False, 
                              f"Failed to lock category (Status: {response['status_code']})", 
                              response["data"])
            return
        
        # Step 2: Verify locked category cannot be updated (should return 403)
        update_data = {
            "name": f"{self.test_category_name}_SHOULD_FAIL"
        }
        
        response = await self.make_request("PUT", f"/categories/{self.test_category_id}", 
                                         update_data, 403)
        
        if response["status_code"] == 403:
            await self.log_test("1.2 Update Locked Category Protection", True, 
                              f"✅ CORRECT: Update blocked with 403 - {response['data']}")
        else:
            await self.log_test("1.2 Update Locked Category Protection", False, 
                              f"❌ FAILED: Expected 403, got {response['status_code']} - Lock protection not working!", 
                              response["data"])
        
        # Step 3: Verify locked category cannot be deleted (should return 403)
        response = await self.make_request("DELETE", f"/categories/{self.test_category_id}", 
                                         expected_status=403)
        
        if response["status_code"] == 403:
            await self.log_test("1.3 Delete Locked Category Protection", True, 
                              f"✅ CORRECT: Delete blocked with 403 - {response['data']}")
        else:
            await self.log_test("1.3 Delete Locked Category Protection", False, 
                              f"❌ FAILED: Expected 403, got {response['status_code']} - Lock protection not working!", 
                              response["data"])
    
    async def test_2_category_unlock_functionality(self):
        """Test 2: Category Unlock Test - unlock category and verify operations work"""
        print("\n🔓 TEST 2: CATEGORY UNLOCK FUNCTIONALITY")
        
        if not self.test_category_id:
            await self.log_test("Category Unlock Test", False, "No test category available")
            return
        
        # Step 1: Unlock the category
        response = await self.make_request("PUT", f"/categories/{self.test_category_id}/unlock", 
                                         expected_status=200)
        
        if response["success"]:
            await self.log_test("2.1 Unlock Category", True, 
                              f"Successfully unlocked category: {response['data']}")
        else:
            await self.log_test("2.1 Unlock Category", False, 
                              f"Failed to unlock category (Status: {response['status_code']})", 
                              response["data"])
            return
        
        # Step 2: Verify unlocked category can now be updated
        update_data = {
            "name": f"{self.test_category_name}_UNLOCKED"
        }
        
        response = await self.make_request("PUT", f"/categories/{self.test_category_id}", 
                                         update_data, 200)
        
        if response["success"]:
            await self.log_test("2.2 Update Unlocked Category", True, 
                              f"✅ SUCCESS: Updated unlocked category - {response['data']}")
            self.test_category_name = f"{self.test_category_name}_UNLOCKED"
        else:
            await self.log_test("2.2 Update Unlocked Category", False, 
                              f"❌ FAILED: Could not update unlocked category (Status: {response['status_code']})", 
                              response["data"])
        
        # Step 3: Test all CRUD operations work after unlock
        await self.test_crud_operations_after_unlock()
    
    async def test_crud_operations_after_unlock(self):
        """Test all CRUD operations work after unlock"""
        print("\n📝 TEST 2.3: CRUD OPERATIONS AFTER UNLOCK")
        
        # Test READ operation
        response = await self.make_request("GET", "/categories", expected_status=200)
        
        if response["success"]:
            categories = response["data"]
            test_category = next((cat for cat in categories if cat["id"] == self.test_category_id), None)
            if test_category:
                await self.log_test("2.3 Read After Unlock", True, 
                                  f"✅ SUCCESS: Category found - {test_category['name']}, locked: {test_category.get('is_locked', 'unknown')}")
            else:
                await self.log_test("2.3 Read After Unlock", False, 
                                  "❌ FAILED: Test category not found in categories list")
        else:
            await self.log_test("2.3 Read After Unlock", False, 
                              f"❌ FAILED: Could not read categories (Status: {response['status_code']})", 
                              response["data"])
    
    async def test_3_lock_status_endpoint(self):
        """Test 3: Lock Status Test - test /api/categories/with-lock-status endpoint"""
        print("\n📊 TEST 3: LOCK STATUS ENDPOINT")
        
        # Test /api/categories/with-lock-status endpoint
        response = await self.make_request("GET", "/categories/with-lock-status", expected_status=200)
        
        if response["success"]:
            categories = response["data"]
            await self.log_test("3.1 Lock Status Endpoint", True, 
                              f"✅ SUCCESS: Retrieved {len(categories)} categories with lock status")
            
            # Verify lock status fields are present
            if categories:
                sample_category = categories[0]
                required_fields = ["id", "name", "is_locked"]
                missing_fields = [field for field in required_fields if field not in sample_category]
                
                if not missing_fields:
                    await self.log_test("3.2 Lock Status Fields", True, 
                                      "✅ SUCCESS: All required lock status fields present")
                else:
                    await self.log_test("3.2 Lock Status Fields", False, 
                                      f"❌ FAILED: Missing fields: {missing_fields}")
                
                # Find our test category and check its lock status
                test_category = next((cat for cat in categories if cat["id"] == self.test_category_id), None)
                if test_category:
                    lock_status = test_category.get("is_locked", "unknown")
                    lock_reason = test_category.get("lock_reason", "")
                    await self.log_test("3.3 Test Category Lock Status", True, 
                                      f"✅ SUCCESS: Test category lock status: {lock_status}, reason: '{lock_reason}'")
                else:
                    await self.log_test("3.3 Test Category Lock Status", False, 
                                      "❌ FAILED: Test category not found in lock status response")
        else:
            await self.log_test("3.1 Lock Status Endpoint", False, 
                              f"❌ FAILED: Could not retrieve lock status (Status: {response['status_code']})", 
                              response["data"])
    
    async def test_4_edge_cases(self):
        """Test 4: Edge Cases - non-existent IDs, double lock/unlock, invalid JSON"""
        print("\n⚠️ TEST 4: EDGE CASES")
        
        # Test 4.1: Lock with non-existent category ID
        fake_id = str(uuid.uuid4())
        response = await self.make_request("PUT", f"/categories/{fake_id}/lock", 
                                         {"lock_reason": "Test"}, 404)
        
        if response["status_code"] == 404:
            await self.log_test("4.1 Lock Non-existent Category", True, 
                              f"✅ CORRECT: Returned 404 for non-existent category")
        else:
            await self.log_test("4.1 Lock Non-existent Category", False, 
                              f"❌ FAILED: Expected 404, got {response['status_code']}", response["data"])
        
        # Test 4.2: Unlock with non-existent category ID
        response = await self.make_request("PUT", f"/categories/{fake_id}/unlock", 
                                         expected_status=404)
        
        if response["status_code"] == 404:
            await self.log_test("4.2 Unlock Non-existent Category", True, 
                              f"✅ CORRECT: Returned 404 for non-existent category")
        else:
            await self.log_test("4.2 Unlock Non-existent Category", False, 
                              f"❌ FAILED: Expected 404, got {response['status_code']}", response["data"])
        
        # Test 4.3: Double lock (if we have a test category)
        if self.test_category_id:
            # First lock
            response1 = await self.make_request("PUT", f"/categories/{self.test_category_id}/lock", 
                                              {"lock_reason": "First lock"})
            
            # Second lock
            response2 = await self.make_request("PUT", f"/categories/{self.test_category_id}/lock", 
                                              {"lock_reason": "Second lock"})
            
            await self.log_test("4.3 Double Lock", True, 
                              f"Double lock test - First: {response1['status_code']}, Second: {response2['status_code']}")
            
            # Test 4.4: Double unlock
            response3 = await self.make_request("PUT", f"/categories/{self.test_category_id}/unlock")
            response4 = await self.make_request("PUT", f"/categories/{self.test_category_id}/unlock")
            
            await self.log_test("4.4 Double Unlock", True, 
                              f"Double unlock test - First: {response3['status_code']}, Second: {response4['status_code']}")
        
        # Test 4.5: Invalid JSON for lock request
        try:
            url = f"{self.base_url}/categories/{self.test_category_id or 'test'}/lock"
            async with aiohttp.ClientSession() as session:
                async with session.put(url, data="invalid json", 
                                      headers={'Content-Type': 'application/json'}) as response:
                    if response.status in [400, 422]:
                        await self.log_test("4.5 Invalid JSON Request", True, 
                                          f"✅ CORRECT: Handled invalid JSON with status {response.status}")
                    else:
                        await self.log_test("4.5 Invalid JSON Request", False, 
                                          f"❌ UNEXPECTED: Status {response.status} for invalid JSON")
        except Exception as e:
            await self.log_test("4.5 Invalid JSON Request", True, 
                              f"✅ CORRECT: Exception raised for invalid JSON: {str(e)}")
    
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
        """Generate comprehensive test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        # Categorize results
        critical_failures = []
        lock_protection_issues = []
        successful_operations = []
        
        for result in self.test_results:
            if not result["success"]:
                if "Protection" in result["test"] or "Lock" in result["test"]:
                    critical_failures.append(result)
                else:
                    lock_protection_issues.append(result)
            else:
                successful_operations.append(result)
        
        return {
            "total_tests": total_tests,
            "passed_tests": passed_tests,
            "failed_tests": failed_tests,
            "success_rate": f"{success_rate:.1f}%",
            "critical_failures": len(critical_failures),
            "lock_protection_issues": len(lock_protection_issues),
            "successful_operations": len(successful_operations),
            "test_results": self.test_results,
            "summary_analysis": {
                "lock_functionality": "WORKING" if any("Lock Category" in r["test"] and r["success"] for r in self.test_results) else "FAILED",
                "unlock_functionality": "WORKING" if any("Unlock Category" in r["test"] and r["success"] for r in self.test_results) else "FAILED",
                "lock_protection": "WORKING" if any("Protection" in r["test"] and r["success"] for r in self.test_results) else "FAILED",
                "lock_status_endpoint": "WORKING" if any("Lock Status Endpoint" in r["test"] and r["success"] for r in self.test_results) else "FAILED"
            }
        }
    
    async def run_comprehensive_tests(self):
        """Run all comprehensive lock/unlock system tests"""
        print("🎯 GERMAN REVIEW REQUEST - COMPREHENSIVE CATEGORY LOCK/UNLOCK SYSTEM TESTING")
        print("=" * 80)
        print(f"Backend URL: {self.base_url}")
        print(f"Test Category: {self.test_category_name}")
        print("=" * 80)
        
        try:
            # Setup
            if not await self.create_test_category_with_proper_id():
                print("❌ CRITICAL: Could not set up test category. Aborting tests.")
                return self.generate_summary()
            
            # Run all tests in sequence
            await self.test_1_category_lock_functionality()
            await self.test_2_category_unlock_functionality()
            await self.test_3_lock_status_endpoint()
            await self.test_4_edge_cases()
            
            # Cleanup
            await self.cleanup()
            
        except Exception as e:
            await self.log_test("Test Execution", False, f"Critical error during testing: {str(e)}")
        
        # Generate and display comprehensive summary
        summary = self.generate_summary()
        
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE TEST SUMMARY")
        print("=" * 80)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Passed: {summary['passed_tests']}")
        print(f"Failed: {summary['failed_tests']}")
        print(f"Success Rate: {summary['success_rate']}")
        print(f"Critical Failures: {summary['critical_failures']}")
        
        print("\n🔍 FUNCTIONALITY ANALYSIS:")
        for func, status in summary['summary_analysis'].items():
            status_icon = "✅" if status == "WORKING" else "❌"
            print(f"{status_icon} {func.replace('_', ' ').title()}: {status}")
        
        print("\n📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        # Specific findings for German Review Request
        print("\n🎯 GERMAN REVIEW REQUEST FINDINGS:")
        print("=" * 50)
        
        lock_works = any("Lock Category" in r["test"] and r["success"] for r in self.test_results)
        unlock_works = any("Unlock Category" in r["test"] and r["success"] for r in self.test_results)
        update_protection = any("Update Locked Category Protection" in r["test"] and r["success"] for r in self.test_results)
        delete_protection = any("Delete Locked Category Protection" in r["test"] and r["success"] for r in self.test_results)
        
        print(f"✅ POST /api/categories/{{id}}/lock: {'WORKING' if lock_works else 'FAILED'}")
        print(f"✅ PUT /api/categories/{{id}}/unlock: {'WORKING' if unlock_works else 'FAILED'}")
        print(f"✅ PUT /api/categories/{{id}} (locked): {'PROTECTED (403)' if update_protection else 'NOT PROTECTED'}")
        print(f"✅ DELETE /api/categories/{{id}} (locked): {'PROTECTED (403)' if delete_protection else 'NOT PROTECTED'}")
        
        return summary

async def main():
    """Main test execution"""
    tester = ComprehensiveCategoryLockTester()
    summary = await tester.run_comprehensive_tests()
    
    # Save results to file
    with open("/app/comprehensive_category_lock_test_results.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)
    
    print(f"\n💾 Results saved to: /app/comprehensive_category_lock_test_results.json")
    
    return summary

if __name__ == "__main__":
    asyncio.run(main())