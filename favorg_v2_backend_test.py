#!/usr/bin/env python3
"""
FavOrg V2.2.0 Backend API Test Suite
Tests all new locked features and existing functionality
"""

import requests
import sys
import json
from datetime import datetime
import time

class FavOrgAPITester:
    def __init__(self, base_url="https://bookmark-central.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_bookmarks = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        if details and success:
            print(f"   ℹ️  {details}")

    def run_test(self, name, method, endpoint, expected_status=200, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            
            if success:
                try:
                    response_data = response.json() if response.content else {}
                    self.log_test(name, True, f"Status: {response.status_code}")
                    return True, response_data
                except:
                    self.log_test(name, True, f"Status: {response.status_code} (No JSON)")
                    return True, {}
            else:
                try:
                    error_detail = response.json().get('detail', 'Unknown error')
                except:
                    error_detail = response.text[:100] if response.text else 'No error details'
                self.log_test(name, False, f"Expected {expected_status}, got {response.status_code}: {error_detail}")
                return False, {}

        except Exception as e:
            self.log_test(name, False, f"Exception: {str(e)}")
            return False, {}

    def test_basic_connectivity(self):
        """Test basic API connectivity"""
        print("\n🔗 Testing Basic Connectivity...")
        success, data = self.run_test("API Health Check", "GET", "statistics")
        return success

    def test_statistics_locked_field(self):
        """Test that statistics include locked_links field"""
        print("\n📊 Testing Statistics with Locked Links...")
        success, data = self.run_test("Statistics API", "GET", "statistics")
        
        if success:
            if 'locked_links' in data:
                self.log_test("Statistics has locked_links field", True, f"locked_links: {data['locked_links']}")
                return True
            else:
                self.log_test("Statistics missing locked_links field", False, f"Available fields: {list(data.keys())}")
                return False
        return False

    def test_create_locked_bookmark(self):
        """Test creating a bookmark with is_locked=True"""
        print("\n🔒 Testing Locked Bookmark Creation...")
        
        bookmark_data = {
            "title": "Test Locked Bookmark",
            "url": "https://example.com/locked",
            "category": "Testing",
            "subcategory": "Locked Tests"
        }
        
        success, data = self.run_test("Create Normal Bookmark", "POST", "bookmarks", 200, bookmark_data)
        
        if success and 'id' in data:
            bookmark_id = data['id']
            self.test_bookmarks.append(bookmark_id)
            
            # Now update it to be locked
            update_data = {"is_locked": True}
            success2, data2 = self.run_test("Update Bookmark to Locked", "PUT", f"bookmarks/{bookmark_id}", 200, update_data)
            
            if success2:
                # Verify it's locked
                success3, data3 = self.run_test("Verify Bookmark is Locked", "GET", "bookmarks")
                if success3:
                    locked_bookmark = next((b for b in data3 if b.get('id') == bookmark_id), None)
                    if locked_bookmark and (locked_bookmark.get('is_locked') or locked_bookmark.get('status_type') == 'locked'):
                        self.log_test("Bookmark Successfully Locked", True, f"is_locked: {locked_bookmark.get('is_locked')}, status_type: {locked_bookmark.get('status_type')}")
                        return True
                    else:
                        self.log_test("Bookmark Not Properly Locked", False, f"Bookmark data: {locked_bookmark}")
                        return False
        return False

    def test_locked_status_filter(self):
        """Test filtering bookmarks by locked status"""
        print("\n🔍 Testing Locked Status Filter...")
        
        # First ensure we have a locked bookmark
        self.test_create_locked_bookmark()
        
        # Test the status filter endpoint - this might not exist yet
        success, data = self.run_test("Get Locked Bookmarks", "GET", "bookmarks?status=locked")
        
        if not success:
            # Try alternative approach - get all bookmarks and filter manually
            success2, all_data = self.run_test("Get All Bookmarks for Manual Filter", "GET", "bookmarks")
            if success2:
                locked_bookmarks = [b for b in all_data if b.get('is_locked') or b.get('status_type') == 'locked']
                if locked_bookmarks:
                    self.log_test("Found Locked Bookmarks (Manual Filter)", True, f"Count: {len(locked_bookmarks)}")
                    return True
                else:
                    self.log_test("No Locked Bookmarks Found", False, "Expected at least one locked bookmark")
                    return False
        else:
            locked_count = len(data) if isinstance(data, list) else 0
            self.log_test("Status Filter for Locked Works", True, f"Found {locked_count} locked bookmarks")
            return True
        
        return False

    def test_bookmark_lock_unlock_cycle(self):
        """Test locking and unlocking a bookmark"""
        print("\n🔄 Testing Lock/Unlock Cycle...")
        
        # Create a test bookmark
        bookmark_data = {
            "title": "Test Lock/Unlock Bookmark",
            "url": "https://example.com/lockunlock",
            "category": "Testing"
        }
        
        success, data = self.run_test("Create Bookmark for Lock Test", "POST", "bookmarks", 200, bookmark_data)
        
        if success and 'id' in data:
            bookmark_id = data['id']
            self.test_bookmarks.append(bookmark_id)
            
            # Lock it
            lock_data = {"is_locked": True}
            success2, _ = self.run_test("Lock Bookmark", "PUT", f"bookmarks/{bookmark_id}", 200, lock_data)
            
            if success2:
                # Unlock it
                unlock_data = {"is_locked": False}
                success3, _ = self.run_test("Unlock Bookmark", "PUT", f"bookmarks/{bookmark_id}", 200, unlock_data)
                
                if success3:
                    # Verify it's unlocked
                    success4, all_bookmarks = self.run_test("Verify Unlock", "GET", "bookmarks")
                    if success4:
                        bookmark = next((b for b in all_bookmarks if b.get('id') == bookmark_id), None)
                        if bookmark and not bookmark.get('is_locked') and bookmark.get('status_type') != 'locked':
                            self.log_test("Lock/Unlock Cycle Complete", True, "Bookmark successfully unlocked")
                            return True
                        else:
                            self.log_test("Unlock Failed", False, f"Bookmark still locked: {bookmark}")
                            return False
        return False

    def test_create_bookmark_with_lock_field(self):
        """Test creating a bookmark directly with is_locked field"""
        print("\n🆕 Testing Direct Locked Bookmark Creation...")
        
        bookmark_data = {
            "title": "Direct Locked Bookmark",
            "url": "https://example.com/directlocked",
            "category": "Testing",
            "is_locked": True
        }
        
        # This might not work if the create endpoint doesn't support is_locked
        success, data = self.run_test("Create Directly Locked Bookmark", "POST", "bookmarks", 200, bookmark_data)
        
        if success and 'id' in data:
            bookmark_id = data['id']
            self.test_bookmarks.append(bookmark_id)
            
            # Verify it was created as locked
            success2, all_bookmarks = self.run_test("Verify Direct Lock Creation", "GET", "bookmarks")
            if success2:
                bookmark = next((b for b in all_bookmarks if b.get('id') == bookmark_id), None)
                if bookmark and (bookmark.get('is_locked') or bookmark.get('status_type') == 'locked'):
                    self.log_test("Direct Locked Creation Works", True, f"Created locked: {bookmark.get('is_locked')}")
                    return True
                else:
                    self.log_test("Direct Locked Creation Failed", False, f"Bookmark not locked: {bookmark}")
                    return False
        else:
            self.log_test("Direct Locked Creation Not Supported", False, "API doesn't support is_locked in create")
            return False

    def test_locked_bookmark_protection(self):
        """Test that locked bookmarks cannot be deleted (if implemented)"""
        print("\n🛡️ Testing Locked Bookmark Protection...")
        
        # Create and lock a bookmark
        bookmark_data = {
            "title": "Protected Locked Bookmark",
            "url": "https://example.com/protected",
            "category": "Testing"
        }
        
        success, data = self.run_test("Create Bookmark for Protection Test", "POST", "bookmarks", 200, bookmark_data)
        
        if success and 'id' in data:
            bookmark_id = data['id']
            self.test_bookmarks.append(bookmark_id)
            
            # Lock it
            lock_data = {"is_locked": True}
            success2, _ = self.run_test("Lock Bookmark for Protection", "PUT", f"bookmarks/{bookmark_id}", 200, lock_data)
            
            if success2:
                # Try to delete it - this should fail if protection is implemented
                success3, _ = self.run_test("Try Delete Locked Bookmark", "DELETE", f"bookmarks/{bookmark_id}", expected_status=403)
                
                if success3:
                    self.log_test("Locked Bookmark Protection Works", True, "Delete was properly blocked")
                    return True
                else:
                    # If delete succeeded, protection might not be implemented yet
                    success4, _ = self.run_test("Delete Succeeded (No Protection)", "DELETE", f"bookmarks/{bookmark_id}", expected_status=200)
                    if success4:
                        self.log_test("Locked Bookmark Protection Not Implemented", False, "Delete succeeded - protection missing")
                        # Remove from cleanup list since it's already deleted
                        if bookmark_id in self.test_bookmarks:
                            self.test_bookmarks.remove(bookmark_id)
                        return False
        return False

    def test_status_type_locked(self):
        """Test setting status_type to 'locked'"""
        print("\n🏷️ Testing Status Type 'Locked'...")
        
        # Create a bookmark
        bookmark_data = {
            "title": "Status Type Locked Test",
            "url": "https://example.com/statuslocked",
            "category": "Testing"
        }
        
        success, data = self.run_test("Create Bookmark for Status Test", "POST", "bookmarks", 200, bookmark_data)
        
        if success and 'id' in data:
            bookmark_id = data['id']
            self.test_bookmarks.append(bookmark_id)
            
            # Set status_type to locked
            status_data = {"status_type": "locked"}
            success2, _ = self.run_test("Set Status Type to Locked", "PUT", f"bookmarks/{bookmark_id}/status", 200, status_data)
            
            if success2:
                # Verify the status
                success3, all_bookmarks = self.run_test("Verify Status Type Locked", "GET", "bookmarks")
                if success3:
                    bookmark = next((b for b in all_bookmarks if b.get('id') == bookmark_id), None)
                    if bookmark and bookmark.get('status_type') == 'locked':
                        self.log_test("Status Type Locked Works", True, f"status_type: {bookmark.get('status_type')}")
                        return True
                    else:
                        self.log_test("Status Type Not Set", False, f"Expected 'locked', got: {bookmark.get('status_type') if bookmark else 'bookmark not found'}")
                        return False
        return False

    def cleanup_test_bookmarks(self):
        """Clean up test bookmarks"""
        print("\n🧹 Cleaning up test bookmarks...")
        
        for bookmark_id in self.test_bookmarks:
            try:
                # First unlock if locked
                unlock_data = {"is_locked": False}
                requests.put(f"{self.base_url}/api/bookmarks/{bookmark_id}", json=unlock_data, timeout=10)
                
                # Then delete
                response = requests.delete(f"{self.base_url}/api/bookmarks/{bookmark_id}", timeout=10)
                if response.status_code == 200:
                    print(f"   ✅ Cleaned up bookmark {bookmark_id}")
                else:
                    print(f"   ⚠️  Could not clean up bookmark {bookmark_id}: {response.status_code}")
            except Exception as e:
                print(f"   ⚠️  Error cleaning up bookmark {bookmark_id}: {e}")

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting FavOrg V2.2.0 Backend API Tests")
        print("=" * 60)
        
        # Basic connectivity
        if not self.test_basic_connectivity():
            print("❌ Basic connectivity failed. Stopping tests.")
            return False
        
        # Test new locked features
        self.test_statistics_locked_field()
        self.test_create_locked_bookmark()
        self.test_locked_status_filter()
        self.test_bookmark_lock_unlock_cycle()
        self.test_create_bookmark_with_lock_field()
        self.test_locked_bookmark_protection()
        self.test_status_type_locked()
        
        # Cleanup
        self.cleanup_test_bookmarks()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            failed = self.tests_run - self.tests_passed
            print(f"⚠️  {failed} tests failed")
            return False

def main():
    tester = FavOrgAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())