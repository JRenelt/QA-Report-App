#!/usr/bin/env python3
"""
Phase 2 Bug Fix Validation Test
Testing status synchronization between test data creation and Statistics API

Critical Test Focus:
- Test data creation should use "unchecked" status instead of "checked"
- Statistics API should show unchecked_links: 10 instead of 0
- Status consistency between backend components
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime

# Get backend URL from environment
BACKEND_URL = "https://favorg-rebuild.preview.emergentagent.com/api"

class Phase2BugFixTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.session = None
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    async def clear_existing_data(self):
        """Clear existing bookmarks for clean test"""
        try:
            async with self.session.delete(f"{self.backend_url}/bookmarks/all") as response:
                if response.status == 200:
                    data = await response.json()
                    self.log_result("Clear Existing Data", True, f"Cleared existing bookmarks: {data.get('deleted_count', 0)}")
                    return True
                else:
                    self.log_result("Clear Existing Data", False, f"Failed to clear data: {response.status}")
                    return False
        except Exception as e:
            self.log_result("Clear Existing Data", False, f"Error clearing data: {str(e)}")
            return False
    
    async def test_create_test_data_api(self):
        """Test POST /api/bookmarks/create-test-data - should use 'unchecked' status"""
        try:
            async with self.session.post(f"{self.backend_url}/bookmarks/create-test-data") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check response structure
                    required_fields = ['message', 'created_count', 'status_distribution']
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result("Test Data Creation API", False, 
                                      f"Missing required fields: {missing_fields}", data)
                        return False
                    
                    # Check status distribution for unchecked links
                    status_dist = data.get('status_distribution', {})
                    unchecked_count = status_dist.get('unchecked', 0)
                    
                    if unchecked_count == 10:
                        self.log_result("Test Data Creation API", True, 
                                      f"✅ FIXED: Test data creation now uses 'unchecked' status correctly", 
                                      {"unchecked_links": unchecked_count, "status_distribution": status_dist})
                        return True
                    else:
                        self.log_result("Test Data Creation API", False, 
                                      f"❌ BUG STILL EXISTS: Expected 10 unchecked links, got {unchecked_count}", 
                                      {"status_distribution": status_dist})
                        return False
                        
                else:
                    error_text = await response.text()
                    self.log_result("Test Data Creation API", False, 
                                  f"API call failed: {response.status}", {"error": error_text})
                    return False
                    
        except Exception as e:
            self.log_result("Test Data Creation API", False, f"Exception: {str(e)}")
            return False
    
    async def test_statistics_api_unchecked_links(self):
        """Test GET /api/statistics - should show unchecked_links: 10"""
        try:
            async with self.session.get(f"{self.backend_url}/statistics") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Check if unchecked_links field exists
                    if 'unchecked_links' not in data:
                        self.log_result("Statistics API - Unchecked Links", False, 
                                      "unchecked_links field missing from Statistics API response", data)
                        return False
                    
                    unchecked_links = data.get('unchecked_links', 0)
                    
                    if unchecked_links == 10:
                        self.log_result("Statistics API - Unchecked Links", True, 
                                      f"✅ FIXED: Statistics API now shows unchecked_links: {unchecked_links}", 
                                      {"unchecked_links": unchecked_links, "total_bookmarks": data.get('total_bookmarks', 0)})
                        return True
                    else:
                        self.log_result("Statistics API - Unchecked Links", False, 
                                      f"❌ BUG STILL EXISTS: Expected unchecked_links: 10, got {unchecked_links}", 
                                      {"unchecked_links": unchecked_links, "all_stats": data})
                        return False
                        
                else:
                    error_text = await response.text()
                    self.log_result("Statistics API - Unchecked Links", False, 
                                  f"Statistics API failed: {response.status}", {"error": error_text})
                    return False
                    
        except Exception as e:
            self.log_result("Statistics API - Unchecked Links", False, f"Exception: {str(e)}")
            return False
    
    async def test_status_consistency(self):
        """Test status consistency between test data creation and statistics"""
        try:
            # Get all bookmarks to verify status_type field
            async with self.session.get(f"{self.backend_url}/bookmarks") as response:
                if response.status == 200:
                    bookmarks = await response.json()
                    
                    # Count bookmarks by status_type
                    status_counts = {}
                    unchecked_bookmarks = []
                    
                    for bookmark in bookmarks:
                        status_type = bookmark.get('status_type', 'unknown')
                        status_counts[status_type] = status_counts.get(status_type, 0) + 1
                        
                        if status_type == 'unchecked':
                            unchecked_bookmarks.append({
                                'id': bookmark.get('id'),
                                'title': bookmark.get('title'),
                                'status_type': status_type
                            })
                    
                    unchecked_count = status_counts.get('unchecked', 0)
                    
                    if unchecked_count == 10:
                        self.log_result("Status Consistency Check", True, 
                                      f"✅ CONSISTENT: Found {unchecked_count} bookmarks with status_type='unchecked'", 
                                      {"status_counts": status_counts, "sample_unchecked": unchecked_bookmarks[:3]})
                        return True
                    else:
                        self.log_result("Status Consistency Check", False, 
                                      f"❌ INCONSISTENT: Expected 10 unchecked bookmarks, found {unchecked_count}", 
                                      {"status_counts": status_counts})
                        return False
                        
                else:
                    error_text = await response.text()
                    self.log_result("Status Consistency Check", False, 
                                  f"Failed to get bookmarks: {response.status}", {"error": error_text})
                    return False
                    
        except Exception as e:
            self.log_result("Status Consistency Check", False, f"Exception: {str(e)}")
            return False
    
    async def test_all_status_groups(self):
        """Test that all 7 status groups are correctly counted"""
        try:
            async with self.session.get(f"{self.backend_url}/statistics") as response:
                if response.status == 200:
                    data = await response.json()
                    
                    # Expected status fields in Statistics API
                    expected_status_fields = [
                        'active_links', 'dead_links', 'localhost_links', 
                        'duplicate_links', 'locked_links', 'timeout_links', 'unchecked_links'
                    ]
                    
                    missing_fields = [field for field in expected_status_fields if field not in data]
                    
                    if missing_fields:
                        self.log_result("All Status Groups Check", False, 
                                      f"Missing status fields: {missing_fields}", data)
                        return False
                    
                    # Check that all fields have reasonable values
                    status_summary = {field: data.get(field, 0) for field in expected_status_fields}
                    total_status_links = sum(status_summary.values())
                    total_bookmarks = data.get('total_bookmarks', 0)
                    
                    if total_status_links == total_bookmarks:
                        self.log_result("All Status Groups Check", True, 
                                      f"✅ ALL 7 STATUS GROUPS CORRECTLY COUNTED: Total {total_bookmarks} bookmarks", 
                                      status_summary)
                        return True
                    else:
                        self.log_result("All Status Groups Check", False, 
                                      f"❌ STATUS COUNT MISMATCH: Status sum {total_status_links} != Total bookmarks {total_bookmarks}", 
                                      {"status_summary": status_summary, "total_bookmarks": total_bookmarks})
                        return False
                        
                else:
                    error_text = await response.text()
                    self.log_result("All Status Groups Check", False, 
                                  f"Statistics API failed: {response.status}", {"error": error_text})
                    return False
                    
        except Exception as e:
            self.log_result("All Status Groups Check", False, f"Exception: {str(e)}")
            return False
    
    async def run_phase2_validation(self):
        """Run complete Phase 2 bug fix validation"""
        print("🎯 PHASE 2 BUG FIX VALIDATION - Status Synchronization Test")
        print("=" * 70)
        
        # Step 1: Clear existing data for clean test
        print("\n📋 Step 1: Preparing clean test environment...")
        await self.clear_existing_data()
        
        # Step 2: Create new test data (should use 'unchecked' status)
        print("\n📋 Step 2: Testing new test data creation...")
        test_data_success = await self.test_create_test_data_api()
        
        # Step 3: Check Statistics API (should show unchecked_links: 10)
        print("\n📋 Step 3: Testing Statistics API unchecked_links...")
        stats_success = await self.test_statistics_api_unchecked_links()
        
        # Step 4: Verify status consistency
        print("\n📋 Step 4: Testing status consistency...")
        consistency_success = await self.test_status_consistency()
        
        # Step 5: Test all 7 status groups
        print("\n📋 Step 5: Testing all status groups...")
        all_status_success = await self.test_all_status_groups()
        
        # Summary
        print("\n" + "=" * 70)
        print("🎯 PHASE 2 BUG FIX VALIDATION SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {total_tests - passed_tests}")
        print(f"📈 Success Rate: {success_rate:.1f}%")
        
        # Critical bug fix status
        critical_tests = [test_data_success, stats_success, consistency_success]
        if all(critical_tests):
            print("\n🎉 PHASE 2 BUG FIX VALIDATION: ✅ SUCCESS")
            print("✅ Test data creation now uses 'unchecked' status")
            print("✅ Statistics API shows correct unchecked_links count")
            print("✅ Status synchronization between components working")
            return True
        else:
            print("\n❌ PHASE 2 BUG FIX VALIDATION: ❌ FAILED")
            if not test_data_success:
                print("❌ Test data creation still has issues")
            if not stats_success:
                print("❌ Statistics API unchecked_links bug not fixed")
            if not consistency_success:
                print("❌ Status consistency issues remain")
            return False

async def main():
    """Main test execution"""
    async with Phase2BugFixTester() as tester:
        success = await tester.run_phase2_validation()
        return success

if __name__ == "__main__":
    success = asyncio.run(main())
    exit(0 if success else 1)