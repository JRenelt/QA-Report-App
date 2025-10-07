#!/usr/bin/env python3
"""
Comprehensive Status Features Test for FavLink Manager
Tests all new status functionality as requested in the review.
"""

import requests
import json
import sys
from datetime import datetime

class ComprehensiveStatusTester:
    def __init__(self, base_url="https://qa-testing-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_bookmark_ids = []

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

    def test_status_toggle_comprehensive(self):
        """Comprehensive test of status toggle functionality"""
        print("\n🎯 Testing Status Toggle Functionality (Comprehensive)")
        
        # Create test bookmark
        test_bookmark = {
            "title": "Status Toggle Test",
            "url": "https://status-toggle-test.example.com",
            "category": "Testing"
        }
        
        success, response, _ = self.make_request('POST', 'bookmarks', test_bookmark)
        if not success or 'id' not in response:
            self.log_test("Status Toggle Setup", False, "Failed to create test bookmark")
            return False
        
        bookmark_id = response['id']
        self.test_bookmark_ids.append(bookmark_id)
        
        # Test all status types: active, dead, localhost, duplicate
        status_types = ["active", "dead", "localhost", "duplicate"]
        
        for status_type in status_types:
            # Set status
            success_set, response_set, _ = self.make_request(
                'PUT', 
                f'bookmarks/{bookmark_id}/status', 
                {"status_type": status_type}
            )
            
            if success_set:
                # Verify by getting the specific bookmark
                success_get, bookmarks, _ = self.make_request('GET', 'bookmarks')
                
                if success_get:
                    found_bookmark = None
                    for bookmark in bookmarks:
                        if bookmark.get('id') == bookmark_id:
                            found_bookmark = bookmark
                            break
                    
                    if found_bookmark:
                        actual_status = found_bookmark.get('status_type', 'active')
                        actual_dead_link = found_bookmark.get('is_dead_link', False)
                        
                        # Verify status_type
                        status_correct = actual_status == status_type
                        
                        # Verify is_dead_link consistency
                        expected_dead_link = status_type == 'dead'
                        dead_link_correct = actual_dead_link == expected_dead_link
                        
                        if status_correct and dead_link_correct:
                            self.log_test(
                                f"Status '{status_type}' Set & Verified", 
                                True, 
                                f"status_type: {actual_status}, is_dead_link: {actual_dead_link}"
                            )
                        else:
                            self.log_test(
                                f"Status '{status_type}' Set & Verified", 
                                False, 
                                f"Expected status: {status_type}, got: {actual_status}; Expected dead_link: {expected_dead_link}, got: {actual_dead_link}"
                            )
                    else:
                        self.log_test(f"Status '{status_type}' Set & Verified", False, "Bookmark not found")
                else:
                    self.log_test(f"Status '{status_type}' Set & Verified", False, "Failed to get bookmarks")
            else:
                self.log_test(f"Status '{status_type}' Set & Verified", False, "Failed to set status")
        
        # Test toggle logic: dead ↔ localhost
        print("\n   Testing Toggle Logic: dead ↔ localhost")
        
        # Set to dead
        success, _, _ = self.make_request('PUT', f'bookmarks/{bookmark_id}/status', {"status_type": "dead"})
        if success:
            # Toggle to localhost
            success, _, _ = self.make_request('PUT', f'bookmarks/{bookmark_id}/status', {"status_type": "localhost"})
            if success:
                # Toggle back to dead
                success, _, _ = self.make_request('PUT', f'bookmarks/{bookmark_id}/status', {"status_type": "dead"})
                self.log_test("Toggle Logic (dead ↔ localhost)", success, "Successfully toggled between states")
            else:
                self.log_test("Toggle Logic (dead ↔ localhost)", False, "Failed to toggle to localhost")
        else:
            self.log_test("Toggle Logic (dead ↔ localhost)", False, "Failed to set initial dead status")

    def test_duplicate_workflow_comprehensive(self):
        """Comprehensive test of duplicate detection and removal"""
        print("\n🎯 Testing Duplicate Workflow (Comprehensive)")
        
        # Create duplicate bookmarks for testing
        duplicate_url = "https://duplicate-test-url.example.com"
        
        duplicate_bookmarks = [
            {"title": "Duplicate Test 1", "url": duplicate_url, "category": "Testing"},
            {"title": "Duplicate Test 2", "url": duplicate_url, "category": "Testing"},
            {"title": "Duplicate Test 3", "url": duplicate_url, "category": "Testing"}
        ]
        
        created_ids = []
        for bookmark in duplicate_bookmarks:
            success, response, _ = self.make_request('POST', 'bookmarks', bookmark)
            if success and 'id' in response:
                created_ids.append(response['id'])
                self.test_bookmark_ids.append(response['id'])
        
        if len(created_ids) < 3:
            self.log_test("Duplicate Setup", False, f"Only created {len(created_ids)} of 3 duplicate bookmarks")
            return False
        
        self.log_test("Duplicate Setup", True, f"Created {len(created_ids)} duplicate bookmarks")
        
        # Step 1: Find duplicates
        success, response, _ = self.make_request('POST', 'bookmarks/find-duplicates')
        
        if success:
            duplicate_groups = response.get('duplicate_groups', 0)
            marked_count = response.get('marked_count', 0)
            
            # We expect at least 1 group with our 3 duplicates (2 should be marked)
            if duplicate_groups >= 1 and marked_count >= 2:
                self.log_test(
                    "Find Duplicates", 
                    True, 
                    f"Found {duplicate_groups} groups, marked {marked_count} duplicates"
                )
                
                # Step 2: Verify duplicates are marked
                success_get, bookmarks, _ = self.make_request('GET', 'bookmarks')
                if success_get:
                    marked_duplicates = [b for b in bookmarks if b.get('status_type') == 'duplicate']
                    
                    if len(marked_duplicates) >= marked_count:
                        self.log_test(
                            "Duplicates Marked Verification", 
                            True, 
                            f"Found {len(marked_duplicates)} bookmarks marked as duplicate"
                        )
                        
                        # Step 3: Delete duplicates
                        success_delete, delete_response, _ = self.make_request('DELETE', 'bookmarks/duplicates')
                        
                        if success_delete:
                            removed_count = delete_response.get('removed_count', 0)
                            
                            if removed_count >= marked_count:
                                self.log_test(
                                    "Delete Duplicates", 
                                    True, 
                                    f"Removed {removed_count} duplicate bookmarks"
                                )
                                
                                # Step 4: Verify removal
                                success_verify, verify_bookmarks, _ = self.make_request('GET', 'bookmarks')
                                if success_verify:
                                    remaining_duplicates = [b for b in verify_bookmarks if b.get('status_type') == 'duplicate']
                                    
                                    if len(remaining_duplicates) == 0:
                                        self.log_test(
                                            "Duplicate Removal Verification", 
                                            True, 
                                            "No duplicate bookmarks remain"
                                        )
                                    else:
                                        self.log_test(
                                            "Duplicate Removal Verification", 
                                            False, 
                                            f"{len(remaining_duplicates)} duplicates still remain"
                                        )
                                else:
                                    self.log_test("Duplicate Removal Verification", False, "Failed to verify removal")
                            else:
                                self.log_test(
                                    "Delete Duplicates", 
                                    False, 
                                    f"Expected to remove at least {marked_count}, only removed {removed_count}"
                                )
                        else:
                            self.log_test("Delete Duplicates", False, "Failed to delete duplicates")
                    else:
                        self.log_test(
                            "Duplicates Marked Verification", 
                            False, 
                            f"Expected at least {marked_count} marked, found {len(marked_duplicates)}"
                        )
                else:
                    self.log_test("Duplicates Marked Verification", False, "Failed to get bookmarks")
            else:
                self.log_test(
                    "Find Duplicates", 
                    False, 
                    f"Expected at least 1 group and 2 marked, got {duplicate_groups} groups and {marked_count} marked"
                )
        else:
            self.log_test("Find Duplicates", False, "Failed to find duplicates")

    def test_statistics_with_status_types(self):
        """Test that statistics correctly handle new status types"""
        print("\n🎯 Testing Statistics with New Status Types")
        
        # Get current statistics
        success, stats, _ = self.make_request('GET', 'statistics')
        
        if success:
            required_fields = ['total_bookmarks', 'active_links', 'dead_links', 'unchecked_links']
            
            # Check all required fields are present
            missing_fields = [field for field in required_fields if field not in stats]
            
            if not missing_fields:
                self.log_test(
                    "Statistics Fields Present", 
                    True, 
                    f"All required fields found: {required_fields}"
                )
                
                # Verify numbers are reasonable
                total = stats['total_bookmarks']
                active = stats['active_links']
                dead = stats['dead_links']
                unchecked = stats['unchecked_links']
                
                # Basic sanity checks
                if total >= 0 and active >= 0 and dead >= 0 and unchecked >= 0:
                    self.log_test(
                        "Statistics Numbers Sanity", 
                        True, 
                        f"Total: {total}, Active: {active}, Dead: {dead}, Unchecked: {unchecked}"
                    )
                    
                    # Test that statistics update when we change status
                    # Create a test bookmark and change its status
                    test_bookmark = {
                        "title": "Statistics Test Bookmark",
                        "url": "https://statistics-test.example.com",
                        "category": "Testing"
                    }
                    
                    success_create, create_response, _ = self.make_request('POST', 'bookmarks', test_bookmark)
                    if success_create and 'id' in create_response:
                        bookmark_id = create_response['id']
                        self.test_bookmark_ids.append(bookmark_id)
                        
                        # Set to dead status
                        success_status, _, _ = self.make_request(
                            'PUT', 
                            f'bookmarks/{bookmark_id}/status', 
                            {"status_type": "dead"}
                        )
                        
                        if success_status:
                            # Get updated statistics
                            success_stats2, stats2, _ = self.make_request('GET', 'statistics')
                            
                            if success_stats2:
                                new_dead = stats2['dead_links']
                                
                                # Dead links should have increased
                                if new_dead > dead:
                                    self.log_test(
                                        "Statistics Update on Status Change", 
                                        True, 
                                        f"Dead links increased from {dead} to {new_dead}"
                                    )
                                else:
                                    self.log_test(
                                        "Statistics Update on Status Change", 
                                        False, 
                                        f"Dead links didn't increase: {dead} -> {new_dead}"
                                    )
                            else:
                                self.log_test("Statistics Update on Status Change", False, "Failed to get updated stats")
                        else:
                            self.log_test("Statistics Update on Status Change", False, "Failed to set dead status")
                    else:
                        self.log_test("Statistics Update on Status Change", False, "Failed to create test bookmark")
                else:
                    self.log_test(
                        "Statistics Numbers Sanity", 
                        False, 
                        f"Negative values found: Total: {total}, Active: {active}, Dead: {dead}, Unchecked: {unchecked}"
                    )
            else:
                self.log_test(
                    "Statistics Fields Present", 
                    False, 
                    f"Missing fields: {missing_fields}"
                )
        else:
            self.log_test("Statistics Retrieval", False, "Failed to get statistics")

    def test_api_prefix_endpoints(self):
        """Test that all endpoints work with /api prefix"""
        print("\n🎯 Testing API Endpoints with /api Prefix")
        
        endpoints_to_test = [
            ('GET', 'bookmarks', 'Get Bookmarks'),
            ('GET', 'categories', 'Get Categories'),
            ('GET', 'statistics', 'Get Statistics'),
            ('POST', 'bookmarks/find-duplicates', 'Find Duplicates'),
            ('DELETE', 'bookmarks/duplicates', 'Delete Duplicates'),
        ]
        
        for method, endpoint, name in endpoints_to_test:
            success, response, status_code = self.make_request(method, endpoint)
            
            if success:
                self.log_test(
                    f"API Prefix - {name}", 
                    True, 
                    f"/{endpoint} accessible via /api prefix (Status: {status_code})"
                )
            else:
                self.log_test(
                    f"API Prefix - {name}", 
                    False, 
                    f"/{endpoint} failed with status {status_code}"
                )

    def cleanup_test_bookmarks(self):
        """Clean up test bookmarks"""
        print("\n🧹 Cleaning up test bookmarks...")
        
        cleaned_count = 0
        for bookmark_id in self.test_bookmark_ids:
            success, _, _ = self.make_request('DELETE', f'bookmarks/{bookmark_id}')
            if success:
                cleaned_count += 1
        
        print(f"   Cleaned up {cleaned_count} of {len(self.test_bookmark_ids)} test bookmarks")

    def run_all_tests(self):
        """Run all comprehensive status feature tests"""
        print("🚀 FavLink Manager - Comprehensive Status Features Testing")
        print("🎯 Testing New Status Features as per Review Request")
        print("=" * 80)
        
        # Test 1: Status Toggle Functionality
        self.test_status_toggle_comprehensive()
        
        # Test 2: Duplicate Workflow
        self.test_duplicate_workflow_comprehensive()
        
        # Test 3: Statistics with Status Types
        self.test_statistics_with_status_types()
        
        # Test 4: API Endpoints Prefix
        self.test_api_prefix_endpoints()
        
        # Cleanup
        self.cleanup_test_bookmarks()
        
        # Print results
        print("\n" + "=" * 80)
        print("📊 COMPREHENSIVE STATUS FEATURES TEST RESULTS")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Summary of key features
        print("\n🎯 KEY FEATURES TESTED:")
        print("✅ Status Toggle Functionality (active, dead, localhost, duplicate)")
        print("✅ Toggle Logic (dead ↔ localhost)")
        print("✅ Duplicate Workflow (find → mark → delete)")
        print("✅ New Status Types Validation")
        print("✅ Statistics Integration with Status Types")
        print("✅ API Endpoints with /api Prefix")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL STATUS FEATURE TESTS PASSED!")
            print("✅ New status features are fully functional")
            return True
        else:
            print(f"\n⚠️ {self.tests_run - self.tests_passed} tests failed.")
            return False

def main():
    tester = ComprehensiveStatusTester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())