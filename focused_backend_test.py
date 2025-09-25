#!/usr/bin/env python3
"""
Focused Backend Test for FavLink Manager
Tests all critical features mentioned in the review request
"""

import requests
import json
import sys
from datetime import datetime

class FocusedBackendTester:
    def __init__(self, base_url="https://pdf-report-boost.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_bookmark_id = None

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        if details and success:
            print(f"   {details}")

    def test_crud_operations(self):
        """Test all CRUD operations for bookmarks"""
        print("\n🔧 TESTING CRUD OPERATIONS")
        
        # CREATE
        create_data = {
            "title": "Test CRUD Bookmark",
            "url": "https://example.com/crud-test",
            "category": "CRUD Testing",
            "subcategory": "API Tests"
        }
        
        try:
            response = requests.post(f"{self.api_url}/bookmarks", json=create_data)
            if response.status_code == 200:
                bookmark_data = response.json()
                self.test_bookmark_id = bookmark_data.get('id')
                self.log_test("CREATE Bookmark", True, f"Created bookmark with ID: {self.test_bookmark_id}")
            else:
                self.log_test("CREATE Bookmark", False, f"Status: {response.status_code}")
                return
        except Exception as e:
            self.log_test("CREATE Bookmark", False, str(e))
            return

        # READ ALL
        try:
            response = requests.get(f"{self.api_url}/bookmarks")
            if response.status_code == 200:
                bookmarks = response.json()
                self.log_test("READ All Bookmarks", True, f"Retrieved {len(bookmarks)} bookmarks")
            else:
                self.log_test("READ All Bookmarks", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("READ All Bookmarks", False, str(e))

        # UPDATE
        if self.test_bookmark_id:
            update_data = {
                "title": "Updated CRUD Bookmark",
                "category": "Updated Category",
                "subcategory": "Updated Subcategory"
            }
            
            try:
                response = requests.put(f"{self.api_url}/bookmarks/{self.test_bookmark_id}", json=update_data)
                if response.status_code == 200:
                    self.log_test("UPDATE Bookmark", True, "Successfully updated bookmark")
                else:
                    self.log_test("UPDATE Bookmark", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("UPDATE Bookmark", False, str(e))

        # MOVE
        if self.test_bookmark_id:
            move_data = {
                "bookmark_ids": [self.test_bookmark_id],
                "target_category": "Moved Category",
                "target_subcategory": "Moved Subcategory"
            }
            
            try:
                response = requests.post(f"{self.api_url}/bookmarks/move", json=move_data)
                if response.status_code == 200:
                    result = response.json()
                    self.log_test("MOVE Bookmark", True, f"Moved {result.get('moved_count', 0)} bookmarks")
                else:
                    self.log_test("MOVE Bookmark", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("MOVE Bookmark", False, str(e))

        # DELETE
        if self.test_bookmark_id:
            try:
                response = requests.delete(f"{self.api_url}/bookmarks/{self.test_bookmark_id}")
                if response.status_code == 200:
                    self.log_test("DELETE Bookmark", True, "Successfully deleted bookmark")
                else:
                    self.log_test("DELETE Bookmark", False, f"Status: {response.status_code}")
            except Exception as e:
                self.log_test("DELETE Bookmark", False, str(e))

    def test_export_functionality(self):
        """Test export functionality with XML and CSV formats"""
        print("\n📤 TESTING EXPORT FUNCTIONALITY")
        
        # Test XML Export (All)
        try:
            response = requests.post(f"{self.api_url}/export", json={"format": "xml"})
            if response.status_code == 200 and response.text.startswith('<?xml'):
                self.log_test("Export XML (All)", True, f"Generated XML with {len(response.text)} characters")
            else:
                self.log_test("Export XML (All)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Export XML (All)", False, str(e))

        # Test CSV Export (All)
        try:
            response = requests.post(f"{self.api_url}/export", json={"format": "csv"})
            if response.status_code == 200 and 'ID,Title,URL' in response.text:
                lines = response.text.split('\n')
                self.log_test("Export CSV (All)", True, f"Generated CSV with {len(lines)} lines")
            else:
                self.log_test("Export CSV (All)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Export CSV (All)", False, str(e))

        # Test XML Export with Category Filter
        try:
            response = requests.post(f"{self.api_url}/export", json={"format": "xml", "category": "Development"})
            if response.status_code == 200 and response.text.startswith('<?xml'):
                self.log_test("Export XML (Category Filter)", True, "Successfully exported Development category as XML")
            else:
                self.log_test("Export XML (Category Filter)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Export XML (Category Filter)", False, str(e))

        # Test CSV Export with Category Filter
        try:
            response = requests.post(f"{self.api_url}/export", json={"format": "csv", "category": "Social Media"})
            if response.status_code == 200 and 'ID,Title,URL' in response.text:
                self.log_test("Export CSV (Category Filter)", True, "Successfully exported Social Media category as CSV")
            else:
                self.log_test("Export CSV (Category Filter)", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Export CSV (Category Filter)", False, str(e))

    def test_link_validation(self):
        """Test link validation functionality"""
        print("\n🔗 TESTING LINK VALIDATION")
        
        try:
            response = requests.post(f"{self.api_url}/bookmarks/validate")
            if response.status_code == 200:
                result = response.json()
                total_checked = result.get('total_checked', 0)
                dead_links = result.get('dead_links_found', 0)
                self.log_test("Link Validation", True, 
                             f"Checked {total_checked} links, found {dead_links} dead links")
            else:
                self.log_test("Link Validation", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Link Validation", False, str(e))

    def test_duplicate_detection(self):
        """Test duplicate detection and removal"""
        print("\n🔄 TESTING DUPLICATE DETECTION")
        
        try:
            response = requests.post(f"{self.api_url}/bookmarks/remove-duplicates")
            if response.status_code == 200:
                result = response.json()
                duplicates_found = result.get('duplicates_found', 0)
                removed_count = result.get('bookmarks_removed', 0)
                self.log_test("Duplicate Detection", True, 
                             f"Found {duplicates_found} duplicate groups, removed {removed_count} bookmarks")
            else:
                self.log_test("Duplicate Detection", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Duplicate Detection", False, str(e))

    def test_scripts_download(self):
        """Test ZIP download functionality"""
        print("\n📦 TESTING SCRIPTS DOWNLOAD")
        
        try:
            response = requests.get(f"{self.api_url}/download/collector")
            if response.status_code == 200:
                content_type = response.headers.get('content-type', '')
                if 'zip' in content_type or response.content.startswith(b'PK'):
                    self.log_test("Scripts ZIP Download", True, 
                                 f"Downloaded ZIP file ({len(response.content)} bytes)")
                else:
                    self.log_test("Scripts ZIP Download", False, "Response is not a ZIP file")
            else:
                self.log_test("Scripts ZIP Download", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Scripts ZIP Download", False, str(e))

    def test_statistics(self):
        """Test statistics endpoint"""
        print("\n📊 TESTING STATISTICS")
        
        try:
            response = requests.get(f"{self.api_url}/statistics")
            if response.status_code == 200:
                stats = response.json()
                required_fields = ['total_bookmarks', 'total_categories', 'active_links', 
                                 'dead_links', 'categories_distribution']
                
                missing_fields = [field for field in required_fields if field not in stats]
                if not missing_fields:
                    self.log_test("Statistics Endpoint", True, 
                                 f"Total: {stats['total_bookmarks']} bookmarks, "
                                 f"{stats['total_categories']} categories, "
                                 f"{stats['dead_links']} dead links")
                else:
                    self.log_test("Statistics Endpoint", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Statistics Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Statistics Endpoint", False, str(e))

    def run_all_tests(self):
        """Run all focused backend tests"""
        print("🚀 FOCUSED BACKEND TESTING - FavLink Manager")
        print("=" * 60)
        
        # Run all test categories
        self.test_crud_operations()
        self.test_export_functionality()
        self.test_link_validation()
        self.test_duplicate_detection()
        self.test_scripts_download()
        self.test_statistics()
        
        # Print results
        print("\n" + "=" * 60)
        print(f"📊 FOCUSED TEST RESULTS")
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All critical backend features are working correctly!")
            return 0
        else:
            print("⚠️  Some critical features failed. Check details above.")
            return 1

if __name__ == "__main__":
    tester = FocusedBackendTester()
    sys.exit(tester.run_all_tests())