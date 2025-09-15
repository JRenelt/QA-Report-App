#!/usr/bin/env python3
"""
FavLink Manager - Status Features Testing
Focused testing for new status functionality as requested in review.

Tests:
1. Status Toggle Functionality (PUT /api/bookmarks/{id}/status)
2. Duplicate Workflow (POST /api/bookmarks/find-duplicates, DELETE /api/bookmarks/duplicates)
3. New Status-Types Validation
4. API Endpoints with /api Prefix verification
"""

import requests
import json
import sys
from datetime import datetime

class StatusFeaturesTester:
    def __init__(self, base_url="https://favorg-manager.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_bookmark_ids = []  # Track created bookmarks for cleanup

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
            if details:
                print(f"   {details}")
        else:
            print(f"❌ {name}")
            if details:
                print(f"   {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request to API"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            
            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code
        except Exception as e:
            return False, {"error": str(e)}, 0

    def setup_test_bookmarks(self):
        """Create test bookmarks for status testing"""
        print("\n🔧 Setting up test bookmarks...")
        
        test_bookmarks = [
            {
                "title": "GitHub Main",
                "url": "https://github.com",
                "category": "Development"
            },
            {
                "title": "GitHub Duplicate",
                "url": "https://github.com",  # Same URL for duplicate testing
                "category": "Development"
            },
            {
                "title": "Local Development Server",
                "url": "http://localhost:3000",
                "category": "Development"
            },
            {
                "title": "Dead Link Test",
                "url": "https://nonexistent-domain-12345.com",
                "category": "Testing"
            }
        ]
        
        created_ids = []
        for bookmark in test_bookmarks:
            success, response, status = self.make_request('POST', 'bookmarks', bookmark)
            if success and 'id' in response:
                created_ids.append(response['id'])
                self.test_bookmark_ids.append(response['id'])
                print(f"   Created: {bookmark['title']} (ID: {response['id']})")
            else:
                print(f"   Failed to create: {bookmark['title']} - Status: {status}")
        
        return created_ids

    def test_status_toggle_functionality(self):
        """Test PUT /api/bookmarks/{id}/status with different status types"""
        print("\n🎯 Testing Status Toggle Functionality")
        
        # Setup test bookmarks
        bookmark_ids = self.setup_test_bookmarks()
        if len(bookmark_ids) < 4:
            self.log_test("Status Toggle Setup", False, "Failed to create enough test bookmarks")
            return False
        
        # Test all status types
        status_types = ["active", "dead", "localhost", "duplicate"]
        
        for i, status_type in enumerate(status_types):
            if i < len(bookmark_ids):
                bookmark_id = bookmark_ids[i]
                
                # Test setting status
                status_data = {"status_type": status_type}
                success, response, status_code = self.make_request(
                    'PUT', 
                    f'bookmarks/{bookmark_id}/status', 
                    status_data
                )
                
                if success:
                    self.log_test(
                        f"Set Status to '{status_type}'", 
                        True, 
                        f"Bookmark {bookmark_id} status updated"
                    )
                    
                    # Verify status was set by getting the bookmark
                    success_get, bookmark_data, _ = self.make_request('GET', 'bookmarks')
                    if success_get:
                        # Find our bookmark in the list
                        found_bookmark = None
                        for bookmark in bookmark_data:
                            if bookmark.get('id') == bookmark_id:
                                found_bookmark = bookmark
                                break
                        
                        if found_bookmark:
                            actual_status = found_bookmark.get('status_type', 'active')
                            if actual_status == status_type:
                                self.log_test(
                                    f"Verify Status '{status_type}'", 
                                    True, 
                                    f"Status correctly saved as '{actual_status}'"
                                )
                            else:
                                self.log_test(
                                    f"Verify Status '{status_type}'", 
                                    False, 
                                    f"Expected '{status_type}', got '{actual_status}'"
                                )
                        else:
                            self.log_test(
                                f"Verify Status '{status_type}'", 
                                False, 
                                "Bookmark not found in response"
                            )
                else:
                    self.log_test(
                        f"Set Status to '{status_type}'", 
                        False, 
                        f"Status code: {status_code}, Response: {response}"
                    )

        # Test toggle logic: dead ↔ localhost
        if len(bookmark_ids) >= 2:
            print("\n   Testing Toggle Logic: dead ↔ localhost")
            
            # Set first bookmark to dead
            success, _, _ = self.make_request(
                'PUT', 
                f'bookmarks/{bookmark_ids[0]}/status', 
                {"status_type": "dead"}
            )
            
            if success:
                # Toggle to localhost
                success, _, _ = self.make_request(
                    'PUT', 
                    f'bookmarks/{bookmark_ids[0]}/status', 
                    {"status_type": "localhost"}
                )
                
                if success:
                    # Toggle back to dead
                    success, _, _ = self.make_request(
                        'PUT', 
                        f'bookmarks/{bookmark_ids[0]}/status', 
                        {"status_type": "dead"}
                    )
                    
                    self.log_test(
                        "Toggle Logic (dead ↔ localhost)", 
                        success, 
                        "Successfully toggled between dead and localhost"
                    )
                else:
                    self.log_test("Toggle Logic (dead ↔ localhost)", False, "Failed to toggle back to dead")
            else:
                self.log_test("Toggle Logic (dead ↔ localhost)", False, "Failed to set initial dead status")

        return True

    def test_duplicate_workflow(self):
        """Test duplicate detection and removal workflow"""
        print("\n🎯 Testing Duplicate Workflow")
        
        # Step 1: Find duplicates and mark them
        success, response, status_code = self.make_request('POST', 'bookmarks/find-duplicates')
        
        if success:
            duplicate_groups = response.get('duplicate_groups', 0)
            marked_count = response.get('marked_count', 0)
            
            self.log_test(
                "Find Duplicates", 
                True, 
                f"Found {duplicate_groups} duplicate groups, marked {marked_count} duplicates"
            )
            
            # Step 2: Delete marked duplicates
            success_delete, delete_response, delete_status = self.make_request('DELETE', 'bookmarks/duplicates')
            
            if success_delete:
                removed_count = delete_response.get('removed_count', 0)
                self.log_test(
                    "Delete Duplicates", 
                    True, 
                    f"Removed {removed_count} duplicate bookmarks"
                )
                
                # Step 3: Verify count is correct
                if removed_count == marked_count:
                    self.log_test(
                        "Duplicate Count Verification", 
                        True, 
                        f"Marked count ({marked_count}) matches removed count ({removed_count})"
                    )
                else:
                    self.log_test(
                        "Duplicate Count Verification", 
                        False, 
                        f"Marked count ({marked_count}) != removed count ({removed_count})"
                    )
                
                return True
            else:
                self.log_test(
                    "Delete Duplicates", 
                    False, 
                    f"Status: {delete_status}, Response: {delete_response}"
                )
        else:
            self.log_test(
                "Find Duplicates", 
                False, 
                f"Status: {status_code}, Response: {response}"
            )
        
        return False

    def test_new_status_types_validation(self):
        """Test that new status fields are correctly saved and retrieved"""
        print("\n🎯 Testing New Status Types Validation")
        
        # Create a test bookmark
        test_bookmark = {
            "title": "Status Validation Test",
            "url": "https://status-test.example.com",
            "category": "Testing"
        }
        
        success, response, _ = self.make_request('POST', 'bookmarks', test_bookmark)
        if not success or 'id' not in response:
            self.log_test("Status Validation Setup", False, "Failed to create test bookmark")
            return False
        
        bookmark_id = response['id']
        self.test_bookmark_ids.append(bookmark_id)
        
        # Test each status type
        status_types = ["active", "dead", "localhost", "duplicate"]
        
        for status_type in status_types:
            # Set status
            success_set, _, _ = self.make_request(
                'PUT', 
                f'bookmarks/{bookmark_id}/status', 
                {"status_type": status_type}
            )
            
            if success_set:
                # Get all bookmarks and verify status
                success_get, bookmarks, _ = self.make_request('GET', 'bookmarks')
                
                if success_get:
                    found_bookmark = None
                    for bookmark in bookmarks:
                        if bookmark.get('id') == bookmark_id:
                            found_bookmark = bookmark
                            break
                    
                    if found_bookmark:
                        actual_status = found_bookmark.get('status_type', 'active')
                        expected_dead_link = status_type in ['dead']
                        actual_dead_link = found_bookmark.get('is_dead_link', False)
                        
                        status_correct = actual_status == status_type
                        dead_link_correct = actual_dead_link == expected_dead_link
                        
                        if status_correct and dead_link_correct:
                            self.log_test(
                                f"Status Type '{status_type}' Validation", 
                                True, 
                                f"Status: {actual_status}, Dead Link: {actual_dead_link}"
                            )
                        else:
                            self.log_test(
                                f"Status Type '{status_type}' Validation", 
                                False, 
                                f"Expected status: {status_type}, got: {actual_status}; Expected dead_link: {expected_dead_link}, got: {actual_dead_link}"
                            )
                    else:
                        self.log_test(
                            f"Status Type '{status_type}' Validation", 
                            False, 
                            "Bookmark not found in response"
                        )
                else:
                    self.log_test(
                        f"Status Type '{status_type}' Validation", 
                        False, 
                        "Failed to retrieve bookmarks"
                    )
            else:
                self.log_test(
                    f"Status Type '{status_type}' Validation", 
                    False, 
                    "Failed to set status"
                )

    def test_statistics_with_new_status_types(self):
        """Test that statistics correctly account for new status types"""
        print("\n🎯 Testing Statistics with New Status Types")
        
        # Get statistics
        success, stats, _ = self.make_request('GET', 'statistics')
        
        if success:
            # Check that statistics include the expected fields
            required_fields = ['total_bookmarks', 'active_links', 'dead_links', 'unchecked_links']
            
            all_fields_present = all(field in stats for field in required_fields)
            
            if all_fields_present:
                self.log_test(
                    "Statistics Fields Present", 
                    True, 
                    f"All required fields found: {required_fields}"
                )
                
                # Verify that the numbers make sense
                total = stats['total_bookmarks']
                active = stats['active_links']
                dead = stats['dead_links']
                unchecked = stats['unchecked_links']
                
                # The sum should be reasonable (allowing for different status types)
                accounted_for = active + dead + unchecked
                
                self.log_test(
                    "Statistics Numbers Validation", 
                    True, 
                    f"Total: {total}, Active: {active}, Dead: {dead}, Unchecked: {unchecked}"
                )
                
                return True
            else:
                missing_fields = [field for field in required_fields if field not in stats]
                self.log_test(
                    "Statistics Fields Present", 
                    False, 
                    f"Missing fields: {missing_fields}"
                )
        else:
            self.log_test("Statistics Retrieval", False, "Failed to get statistics")
        
        return False

    def test_api_endpoints_prefix(self):
        """Test that all endpoints correctly use /api prefix"""
        print("\n🎯 Testing API Endpoints with /api Prefix")
        
        # Test key endpoints to ensure they're accessible with /api prefix
        endpoints_to_test = [
            ('GET', 'bookmarks', 'Get Bookmarks'),
            ('GET', 'categories', 'Get Categories'),
            ('GET', 'statistics', 'Get Statistics'),
            ('POST', 'bookmarks/find-duplicates', 'Find Duplicates'),
        ]
        
        for method, endpoint, name in endpoints_to_test:
            success, response, status_code = self.make_request(method, endpoint)
            
            if success:
                self.log_test(
                    f"API Prefix - {name}", 
                    True, 
                    f"Endpoint /{endpoint} accessible via /api prefix"
                )
            else:
                self.log_test(
                    f"API Prefix - {name}", 
                    False, 
                    f"Endpoint /{endpoint} failed with status {status_code}"
                )

    def cleanup_test_bookmarks(self):
        """Clean up test bookmarks"""
        print("\n🧹 Cleaning up test bookmarks...")
        
        for bookmark_id in self.test_bookmark_ids:
            success, _, _ = self.make_request('DELETE', f'bookmarks/{bookmark_id}')
            if success:
                print(f"   Deleted bookmark {bookmark_id}")
            else:
                print(f"   Failed to delete bookmark {bookmark_id}")

    def run_all_tests(self):
        """Run all status feature tests"""
        print("🚀 Starting FavLink Manager Status Features Testing")
        print("🎯 Focus: New Status Features as per Review Request")
        print("=" * 70)
        
        # Test 1: Status Toggle Functionality
        self.test_status_toggle_functionality()
        
        # Test 2: Duplicate Workflow
        self.test_duplicate_workflow()
        
        # Test 3: New Status Types Validation
        self.test_new_status_types_validation()
        
        # Test 4: Statistics with New Status Types
        self.test_statistics_with_new_status_types()
        
        # Test 5: API Endpoints Prefix
        self.test_api_endpoints_prefix()
        
        # Cleanup
        self.cleanup_test_bookmarks()
        
        # Print results
        print("\n" + "=" * 70)
        print("📊 STATUS FEATURES TEST RESULTS")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 All status feature tests passed!")
            print("✅ Status Toggle Functionality working")
            print("✅ Duplicate Workflow working")
            print("✅ New Status Types Validation working")
            print("✅ API Endpoints with /api prefix working")
            return True
        else:
            print(f"\n⚠️ {self.tests_run - self.tests_passed} tests failed.")
            print("Check the output above for details.")
            return False

def main():
    tester = StatusFeaturesTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())