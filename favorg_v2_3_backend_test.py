#!/usr/bin/env python3
"""
FavOrg V2.3.0 Backend API Test Suite
Tests all new lock system features and existing functionality
"""

import requests
import sys
import json
from datetime import datetime
import time

class FavOrgV23BackendTester:
    def __init__(self, base_url="https://pdf-report-boost.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_bookmark_id = None
        self.created_bookmarks = []

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        self.log(f"🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}")
                try:
                    error_detail = response.json()
                    self.log(f"   Error details: {error_detail}")
                except:
                    self.log(f"   Response text: {response.text[:200]}")
                return False, {}

        except Exception as e:
            self.log(f"❌ FAILED - {name} - Error: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        self.log("🚀 Testing basic API connectivity...")
        success, response = self.run_test(
            "Basic API Health Check",
            "GET",
            "api/statistics",
            200
        )
        return success

    def test_statistics_with_locked_links(self):
        """Test that statistics include locked_links field"""
        self.log("📊 Testing statistics API for locked_links field...")
        success, response = self.run_test(
            "Statistics API with locked_links",
            "GET", 
            "api/statistics",
            200
        )
        
        if success:
            if 'locked_links' in response:
                self.log(f"✅ locked_links field found: {response['locked_links']}")
                return True
            else:
                self.log("❌ locked_links field missing from statistics")
                return False
        return False

    def test_create_test_bookmark(self):
        """Create a test bookmark for lock testing"""
        self.log("📝 Creating test bookmark for lock testing...")
        bookmark_data = {
            "title": "Test Bookmark for Lock System",
            "url": "https://example.com/test-lock",
            "category": "Testing"
        }
        
        success, response = self.run_test(
            "Create Test Bookmark",
            "POST",
            "api/bookmarks",
            201,
            bookmark_data
        )
        
        if success and 'id' in response:
            self.test_bookmark_id = response['id']
            self.created_bookmarks.append(response['id'])
            self.log(f"✅ Test bookmark created with ID: {self.test_bookmark_id}")
            return True
        return False

    def test_lock_bookmark_api(self):
        """Test the new lock system API - PUT /api/bookmarks/{id}"""
        if not self.test_bookmark_id:
            self.log("❌ No test bookmark available for lock testing")
            return False
            
        self.log("🔒 Testing bookmark lock API...")
        
        # Test locking a bookmark
        lock_data = {"is_locked": True}
        success, response = self.run_test(
            "Lock Bookmark API",
            "PUT",
            f"api/bookmarks/{self.test_bookmark_id}",
            200,
            lock_data
        )
        
        if success:
            # Verify the bookmark is locked
            if response.get('is_locked') == True:
                self.log("✅ Bookmark successfully locked")
                
                # Test unlocking the bookmark
                unlock_data = {"is_locked": False}
                success2, response2 = self.run_test(
                    "Unlock Bookmark API",
                    "PUT",
                    f"api/bookmarks/{self.test_bookmark_id}",
                    200,
                    unlock_data
                )
                
                if success2 and response2.get('is_locked') == False:
                    self.log("✅ Bookmark successfully unlocked")
                    return True
                else:
                    self.log("❌ Failed to unlock bookmark")
                    return False
            else:
                self.log("❌ Bookmark lock status not updated correctly")
                return False
        return False

    def test_status_type_locked(self):
        """Test setting status_type to 'locked'"""
        if not self.test_bookmark_id:
            return False
            
        self.log("🔐 Testing status_type 'locked'...")
        
        # Set status to locked
        status_data = {"status_type": "locked"}
        success, response = self.run_test(
            "Set Status Type to Locked",
            "PUT",
            f"api/bookmarks/{self.test_bookmark_id}",
            200,
            status_data
        )
        
        if success and response.get('status_type') == 'locked':
            self.log("✅ Status type successfully set to 'locked'")
            return True
        else:
            self.log("❌ Failed to set status_type to 'locked'")
            return False

    def test_get_bookmarks_by_status(self):
        """Test filtering bookmarks by status including locked"""
        self.log("🔍 Testing bookmark filtering by status...")
        
        # Test getting all bookmarks first
        success, response = self.run_test(
            "Get All Bookmarks",
            "GET",
            "api/bookmarks",
            200
        )
        
        if success:
            bookmarks = response if isinstance(response, list) else []
            self.log(f"✅ Retrieved {len(bookmarks)} total bookmarks")
            
            # Check if any bookmarks have locked status
            locked_bookmarks = [b for b in bookmarks if b.get('status_type') == 'locked' or b.get('is_locked') == True]
            self.log(f"📊 Found {len(locked_bookmarks)} locked bookmarks")
            return True
        return False

    def test_create_sample_data(self):
        """Create sample data for testing"""
        self.log("🎯 Creating sample test data...")
        success, response = self.run_test(
            "Create Sample Bookmarks",
            "POST",
            "api/bookmarks/create-samples",
            200
        )
        
        if success:
            created_count = response.get('created_count', 0)
            self.log(f"✅ Created {created_count} sample bookmarks")
            return True
        return False

    def test_comprehensive_test_data(self):
        """Create comprehensive test data with duplicates and dead links"""
        self.log("🧪 Creating comprehensive test data...")
        success, response = self.run_test(
            "Create Comprehensive Test Data",
            "POST",
            "api/bookmarks/create-test-data",
            200
        )
        
        if success:
            details = response.get('details', {})
            self.log(f"✅ Created comprehensive test data:")
            self.log(f"   - Normal links: {details.get('normal_links', 0)}")
            self.log(f"   - Duplicate links: {details.get('duplicate_links', 0)}")
            self.log(f"   - Dead links: {details.get('dead_links', 0)}")
            return True
        return False

    def test_link_validation(self):
        """Test link validation functionality"""
        self.log("🔗 Testing link validation...")
        success, response = self.run_test(
            "Validate All Links",
            "POST",
            "api/bookmarks/validate",
            200
        )
        
        if success:
            total_checked = response.get('total_checked', 0)
            dead_links_found = response.get('dead_links_found', 0)
            self.log(f"✅ Link validation completed:")
            self.log(f"   - Total checked: {total_checked}")
            self.log(f"   - Dead links found: {dead_links_found}")
            return True
        return False

    def test_duplicate_detection(self):
        """Test duplicate detection and management"""
        self.log("🔄 Testing duplicate detection...")
        success, response = self.run_test(
            "Find Duplicates",
            "POST",
            "api/bookmarks/find-duplicates",
            200
        )
        
        if success:
            duplicate_groups = response.get('duplicate_groups', 0)
            marked_count = response.get('marked_count', 0)
            self.log(f"✅ Duplicate detection completed:")
            self.log(f"   - Duplicate groups: {duplicate_groups}")
            self.log(f"   - Marked as duplicates: {marked_count}")
            return True
        return False

    def test_export_functionality(self):
        """Test export functionality for different formats"""
        self.log("📤 Testing export functionality...")
        
        formats = ['html', 'json', 'xml', 'csv']
        export_success = 0
        
        for format_type in formats:
            export_data = {"format": format_type}
            success, response = self.run_test(
                f"Export {format_type.upper()}",
                "POST",
                "api/export",
                200,
                export_data
            )
            if success:
                export_success += 1
        
        self.log(f"✅ Export tests completed: {export_success}/{len(formats)} formats successful")
        return export_success == len(formats)

    def test_category_management(self):
        """Test category management APIs"""
        self.log("📁 Testing category management...")
        success, response = self.run_test(
            "Get All Categories",
            "GET",
            "api/categories",
            200
        )
        
        if success:
            categories = response if isinstance(response, list) else []
            self.log(f"✅ Retrieved {len(categories)} categories")
            return True
        return False

    def cleanup_test_data(self):
        """Clean up created test bookmarks"""
        self.log("🧹 Cleaning up test data...")
        cleanup_success = 0
        
        for bookmark_id in self.created_bookmarks:
            success, _ = self.run_test(
                f"Delete Test Bookmark {bookmark_id}",
                "DELETE",
                f"api/bookmarks/{bookmark_id}",
                200
            )
            if success:
                cleanup_success += 1
        
        self.log(f"✅ Cleanup completed: {cleanup_success}/{len(self.created_bookmarks)} bookmarks deleted")

    def run_all_tests(self):
        """Run all backend tests"""
        self.log("🚀 Starting FavOrg V2.3.0 Backend Test Suite...")
        self.log(f"🎯 Testing against: {self.base_url}")
        
        test_results = []
        
        # Basic connectivity
        test_results.append(("Basic Connectivity", self.test_basic_connectivity()))
        
        # Statistics with locked_links
        test_results.append(("Statistics with locked_links", self.test_statistics_with_locked_links()))
        
        # Create test data
        test_results.append(("Create Sample Data", self.test_create_sample_data()))
        test_results.append(("Create Comprehensive Test Data", self.test_comprehensive_test_data()))
        
        # Create test bookmark for lock testing
        test_results.append(("Create Test Bookmark", self.test_create_test_bookmark()))
        
        # Lock system tests
        test_results.append(("Lock/Unlock Bookmark API", self.test_lock_bookmark_api()))
        test_results.append(("Status Type Locked", self.test_status_type_locked()))
        
        # Bookmark filtering and retrieval
        test_results.append(("Get Bookmarks by Status", self.test_get_bookmarks_by_status()))
        
        # Core functionality tests
        test_results.append(("Link Validation", self.test_link_validation()))
        test_results.append(("Duplicate Detection", self.test_duplicate_detection()))
        test_results.append(("Export Functionality", self.test_export_functionality()))
        test_results.append(("Category Management", self.test_category_management()))
        
        # Cleanup
        self.cleanup_test_data()
        
        # Print summary
        self.log("=" * 60)
        self.log("🏁 TEST SUMMARY")
        self.log("=" * 60)
        
        passed_tests = 0
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{status} - {test_name}")
            if result:
                passed_tests += 1
        
        self.log("=" * 60)
        self.log(f"📊 OVERALL RESULTS: {passed_tests}/{len(test_results)} tests passed")
        self.log(f"📈 Success Rate: {(passed_tests/len(test_results)*100):.1f}%")
        
        if passed_tests == len(test_results):
            self.log("🎉 ALL TESTS PASSED! Backend is ready for V2.3.0")
            return 0
        else:
            self.log("⚠️  Some tests failed. Please check the issues above.")
            return 1

def main():
    tester = FavOrgV23BackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())