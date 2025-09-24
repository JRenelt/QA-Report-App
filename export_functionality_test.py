#!/usr/bin/env python3
"""
FavOrg Export Functionality Test Suite
=====================================

Tests the extended export functionality as requested in the review:
- Export HTML: POST /api/export with format=html - for browser compatibility
- Export JSON: POST /api/export with format=json - for Chrome Bookmarks  
- Export XML: POST /api/export with format=xml - existing functionality
- Export CSV: POST /api/export with format=csv - existing functionality
- Response Headers: Content-Type and filenames correctly set
- Data Integrity: All bookmark data correctly in each format

Author: Testing Agent
Date: 2025-01-27
"""

import requests
import json
import xml.etree.ElementTree as ET
import csv
import io
from datetime import datetime
import sys

class ExportFunctionalityTester:
    def __init__(self, base_url="https://log-inspector-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test_result(self, test_name, success, details=""):
        """Log test result for summary"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
        
        self.test_results.append({
            "name": test_name,
            "success": success,
            "details": details
        })
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")

    def make_request(self, method, endpoint, data=None, expect_json=True):
        """Make HTTP request to API"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url)
            
            return response
        except Exception as e:
            print(f"❌ Request failed: {str(e)}")
            return None

    def ensure_test_data_exists(self):
        """Ensure we have bookmarks to export"""
        print("🔧 Ensuring test data exists...")
        
        # Get current bookmarks
        response = self.make_request('GET', 'bookmarks')
        if response and response.status_code == 200:
            bookmarks = response.json()
            if len(bookmarks) > 0:
                print(f"   Found {len(bookmarks)} existing bookmarks")
                return True
        
        # Create sample bookmarks if none exist
        print("   Creating sample bookmarks...")
        response = self.make_request('POST', 'bookmarks/create-samples')
        if response and response.status_code == 200:
            result = response.json()
            print(f"   Created {result.get('created_count', 0)} sample bookmarks")
            return True
        
        print("   ❌ Failed to create test data")
        return False

    def test_export_xml(self):
        """Test XML export functionality (existing)"""
        print("\n🧪 Testing XML Export...")
        
        export_data = {"format": "xml"}
        response = self.make_request('POST', 'export', data=export_data, expect_json=False)
        
        if not response:
            self.log_test_result("XML Export - Request", False, "Request failed")
            return False
        
        # Check status code
        if response.status_code != 200:
            self.log_test_result("XML Export - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        
        self.log_test_result("XML Export - Status Code", True, "HTTP 200 OK")
        
        # Check Content-Type header
        content_type = response.headers.get('content-type', '')
        if 'xml' in content_type.lower():
            self.log_test_result("XML Export - Content-Type", True, f"Content-Type: {content_type}")
        else:
            self.log_test_result("XML Export - Content-Type", False, f"Expected XML content-type, got: {content_type}")
        
        # Check Content-Disposition header for filename
        content_disposition = response.headers.get('content-disposition', '')
        if 'attachment' in content_disposition and 'xml' in content_disposition:
            self.log_test_result("XML Export - Content-Disposition", True, f"Filename header present: {content_disposition}")
        else:
            self.log_test_result("XML Export - Content-Disposition", False, f"Missing or invalid filename header: {content_disposition}")
        
        # Validate XML structure
        try:
            xml_content = response.text
            root = ET.fromstring(xml_content)
            
            if root.tag == 'bookmarks':
                bookmark_count = len(root.findall('bookmark'))
                self.log_test_result("XML Export - Structure", True, f"Valid XML with {bookmark_count} bookmarks")
                
                # Check if bookmarks have required fields
                if bookmark_count > 0:
                    first_bookmark = root.find('bookmark')
                    required_fields = ['title', 'url', 'category']
                    missing_fields = []
                    
                    for field in required_fields:
                        if first_bookmark.find(field) is None:
                            missing_fields.append(field)
                    
                    if not missing_fields:
                        self.log_test_result("XML Export - Data Integrity", True, "All required fields present")
                    else:
                        self.log_test_result("XML Export - Data Integrity", False, f"Missing fields: {missing_fields}")
                
                return True
            else:
                self.log_test_result("XML Export - Structure", False, f"Invalid root element: {root.tag}")
                return False
                
        except ET.ParseError as e:
            self.log_test_result("XML Export - Structure", False, f"Invalid XML: {str(e)}")
            return False

    def test_export_csv(self):
        """Test CSV export functionality (existing)"""
        print("\n🧪 Testing CSV Export...")
        
        export_data = {"format": "csv"}
        response = self.make_request('POST', 'export', data=export_data, expect_json=False)
        
        if not response:
            self.log_test_result("CSV Export - Request", False, "Request failed")
            return False
        
        # Check status code
        if response.status_code != 200:
            self.log_test_result("CSV Export - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        
        self.log_test_result("CSV Export - Status Code", True, "HTTP 200 OK")
        
        # Check Content-Type header
        content_type = response.headers.get('content-type', '')
        if 'csv' in content_type.lower():
            self.log_test_result("CSV Export - Content-Type", True, f"Content-Type: {content_type}")
        else:
            self.log_test_result("CSV Export - Content-Type", False, f"Expected CSV content-type, got: {content_type}")
        
        # Check Content-Disposition header for filename
        content_disposition = response.headers.get('content-disposition', '')
        if 'attachment' in content_disposition and 'csv' in content_disposition:
            self.log_test_result("CSV Export - Content-Disposition", True, f"Filename header present: {content_disposition}")
        else:
            self.log_test_result("CSV Export - Content-Disposition", False, f"Missing or invalid filename header: {content_disposition}")
        
        # Validate CSV structure
        try:
            csv_content = response.text
            csv_reader = csv.reader(io.StringIO(csv_content))
            rows = list(csv_reader)
            
            if len(rows) > 0:
                header_row = rows[0]
                data_rows = rows[1:]
                
                # Check for required columns
                required_columns = ['Title', 'URL', 'Category']
                missing_columns = []
                
                for col in required_columns:
                    if col not in header_row:
                        missing_columns.append(col)
                
                if not missing_columns:
                    self.log_test_result("CSV Export - Structure", True, f"Valid CSV with {len(data_rows)} data rows")
                    self.log_test_result("CSV Export - Data Integrity", True, "All required columns present")
                    return True
                else:
                    self.log_test_result("CSV Export - Structure", False, f"Missing columns: {missing_columns}")
                    return False
            else:
                self.log_test_result("CSV Export - Structure", False, "Empty CSV file")
                return False
                
        except Exception as e:
            self.log_test_result("CSV Export - Structure", False, f"Invalid CSV: {str(e)}")
            return False

    def test_export_html(self):
        """Test HTML export functionality (NEW - should be implemented)"""
        print("\n🧪 Testing HTML Export (NEW FEATURE)...")
        
        export_data = {"format": "html"}
        response = self.make_request('POST', 'export', data=export_data, expect_json=False)
        
        if not response:
            self.log_test_result("HTML Export - Request", False, "Request failed")
            return False
        
        # Check status code
        if response.status_code == 400:
            # This is expected if HTML export is not implemented yet
            error_msg = response.text
            if "Unsupported export format" in error_msg:
                self.log_test_result("HTML Export - Implementation", False, "HTML export not implemented yet (400 - Unsupported format)")
                return False
            else:
                self.log_test_result("HTML Export - Status Code", False, f"Unexpected 400 error: {error_msg}")
                return False
        elif response.status_code != 200:
            self.log_test_result("HTML Export - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        
        self.log_test_result("HTML Export - Status Code", True, "HTTP 200 OK")
        
        # Check Content-Type header
        content_type = response.headers.get('content-type', '')
        if 'html' in content_type.lower():
            self.log_test_result("HTML Export - Content-Type", True, f"Content-Type: {content_type}")
        else:
            self.log_test_result("HTML Export - Content-Type", False, f"Expected HTML content-type, got: {content_type}")
        
        # Check Content-Disposition header for filename
        content_disposition = response.headers.get('content-disposition', '')
        if 'attachment' in content_disposition and 'html' in content_disposition:
            self.log_test_result("HTML Export - Content-Disposition", True, f"Filename header present: {content_disposition}")
        else:
            self.log_test_result("HTML Export - Content-Disposition", False, f"Missing or invalid filename header: {content_disposition}")
        
        # Validate HTML structure
        try:
            html_content = response.text
            
            # Basic HTML validation
            if '<html' in html_content.lower() or '<!doctype' in html_content.lower():
                self.log_test_result("HTML Export - Structure", True, "Valid HTML document structure")
                
                # Check for bookmark links
                if '<a href=' in html_content:
                    link_count = html_content.count('<a href=')
                    self.log_test_result("HTML Export - Data Integrity", True, f"Contains {link_count} bookmark links")
                    return True
                else:
                    self.log_test_result("HTML Export - Data Integrity", False, "No bookmark links found in HTML")
                    return False
            else:
                self.log_test_result("HTML Export - Structure", False, "Invalid HTML document structure")
                return False
                
        except Exception as e:
            self.log_test_result("HTML Export - Structure", False, f"HTML validation error: {str(e)}")
            return False

    def test_export_json(self):
        """Test JSON export functionality (NEW - should be implemented)"""
        print("\n🧪 Testing JSON Export (NEW FEATURE)...")
        
        export_data = {"format": "json"}
        response = self.make_request('POST', 'export', data=export_data, expect_json=False)
        
        if not response:
            self.log_test_result("JSON Export - Request", False, "Request failed")
            return False
        
        # Check status code
        if response.status_code == 400:
            # This is expected if JSON export is not implemented yet
            error_msg = response.text
            if "Unsupported export format" in error_msg:
                self.log_test_result("JSON Export - Implementation", False, "JSON export not implemented yet (400 - Unsupported format)")
                return False
            else:
                self.log_test_result("JSON Export - Status Code", False, f"Unexpected 400 error: {error_msg}")
                return False
        elif response.status_code != 200:
            self.log_test_result("JSON Export - Status Code", False, f"Expected 200, got {response.status_code}")
            return False
        
        self.log_test_result("JSON Export - Status Code", True, "HTTP 200 OK")
        
        # Check Content-Type header
        content_type = response.headers.get('content-type', '')
        if 'json' in content_type.lower():
            self.log_test_result("JSON Export - Content-Type", True, f"Content-Type: {content_type}")
        else:
            self.log_test_result("JSON Export - Content-Type", False, f"Expected JSON content-type, got: {content_type}")
        
        # Check Content-Disposition header for filename
        content_disposition = response.headers.get('content-disposition', '')
        if 'attachment' in content_disposition and 'json' in content_disposition:
            self.log_test_result("JSON Export - Content-Disposition", True, f"Filename header present: {content_disposition}")
        else:
            self.log_test_result("JSON Export - Content-Disposition", False, f"Missing or invalid filename header: {content_disposition}")
        
        # Validate JSON structure
        try:
            json_content = response.text
            data = json.loads(json_content)
            
            # Check for Chrome bookmark format structure
            if isinstance(data, dict):
                if 'roots' in data:
                    # Chrome format
                    self.log_test_result("JSON Export - Structure", True, "Chrome-compatible JSON format")
                    self.log_test_result("JSON Export - Data Integrity", True, "Chrome bookmark structure present")
                    return True
                elif 'children' in data:
                    # Firefox format
                    self.log_test_result("JSON Export - Structure", True, "Firefox-compatible JSON format")
                    self.log_test_result("JSON Export - Data Integrity", True, "Firefox bookmark structure present")
                    return True
                else:
                    self.log_test_result("JSON Export - Structure", False, "Unknown JSON bookmark format")
                    return False
            elif isinstance(data, list):
                # Simple array format
                self.log_test_result("JSON Export - Structure", True, f"Simple JSON array with {len(data)} bookmarks")
                
                if len(data) > 0 and 'url' in data[0]:
                    self.log_test_result("JSON Export - Data Integrity", True, "Bookmark data structure valid")
                    return True
                else:
                    self.log_test_result("JSON Export - Data Integrity", False, "Invalid bookmark data structure")
                    return False
            else:
                self.log_test_result("JSON Export - Structure", False, "Invalid JSON structure")
                return False
                
        except json.JSONDecodeError as e:
            self.log_test_result("JSON Export - Structure", False, f"Invalid JSON: {str(e)}")
            return False

    def test_export_with_category_filter(self):
        """Test export functionality with category filter"""
        print("\n🧪 Testing Export with Category Filter...")
        
        # Test XML export with category filter
        export_data = {"format": "xml", "category": "Development"}
        response = self.make_request('POST', 'export', data=export_data, expect_json=False)
        
        if response and response.status_code == 200:
            self.log_test_result("XML Export with Category Filter", True, "Category filter works for XML")
        else:
            self.log_test_result("XML Export with Category Filter", False, f"Failed with status {response.status_code if response else 'No response'}")
        
        # Test CSV export with category filter
        export_data = {"format": "csv", "category": "Development"}
        response = self.make_request('POST', 'export', data=export_data, expect_json=False)
        
        if response and response.status_code == 200:
            self.log_test_result("CSV Export with Category Filter", True, "Category filter works for CSV")
        else:
            self.log_test_result("CSV Export with Category Filter", False, f"Failed with status {response.status_code if response else 'No response'}")

    def test_multi_format_export(self):
        """Test the 'Alle Formate exportieren' functionality"""
        print("\n🧪 Testing Multi-Format Export (All Formats)...")
        
        formats = ['xml', 'csv', 'html', 'json']
        successful_formats = []
        failed_formats = []
        
        for format_type in formats:
            export_data = {"format": format_type}
            response = self.make_request('POST', 'export', data=export_data, expect_json=False)
            
            if response and response.status_code == 200:
                successful_formats.append(format_type)
            else:
                failed_formats.append(format_type)
        
        if len(successful_formats) == len(formats):
            self.log_test_result("Multi-Format Export", True, f"All formats ({', '.join(successful_formats)}) work")
        else:
            self.log_test_result("Multi-Format Export", False, f"Working: {successful_formats}, Failed: {failed_formats}")

    def run_all_tests(self):
        """Run all export functionality tests"""
        print("🚀 Starting FavOrg Export Functionality Tests")
        print("🎯 Testing Extended Export Features as per Review Request")
        print("=" * 70)
        
        # Ensure test data exists
        if not self.ensure_test_data_exists():
            print("❌ Cannot proceed without test data")
            return False
        
        print("\n📋 Testing Export Formats:")
        
        # Test existing formats
        xml_success = self.test_export_xml()
        csv_success = self.test_export_csv()
        
        # Test new formats (expected to fail if not implemented)
        html_success = self.test_export_html()
        json_success = self.test_export_json()
        
        # Test additional functionality
        self.test_export_with_category_filter()
        self.test_multi_format_export()
        
        return True

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 EXPORT FUNCTIONALITY TEST RESULTS")
        print("=" * 70)
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        print("\n📋 Detailed Results:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['name']}")
            if result["details"]:
                print(f"    {result['details']}")
        
        # Summary by format
        print("\n🎯 Export Format Status:")
        xml_tests = [r for r in self.test_results if "XML Export" in r["name"]]
        csv_tests = [r for r in self.test_results if "CSV Export" in r["name"]]
        html_tests = [r for r in self.test_results if "HTML Export" in r["name"]]
        json_tests = [r for r in self.test_results if "JSON Export" in r["name"]]
        
        xml_success = all(r["success"] for r in xml_tests)
        csv_success = all(r["success"] for r in csv_tests)
        html_success = all(r["success"] for r in html_tests)
        json_success = all(r["success"] for r in json_tests)
        
        print(f"📄 XML Export: {'✅ WORKING' if xml_success else '❌ ISSUES'}")
        print(f"📊 CSV Export: {'✅ WORKING' if csv_success else '❌ ISSUES'}")
        print(f"🌐 HTML Export: {'✅ WORKING' if html_success else '❌ NOT IMPLEMENTED'}")
        print(f"📋 JSON Export: {'✅ WORKING' if json_success else '❌ NOT IMPLEMENTED'}")
        
        # Critical findings
        print("\n🔍 Critical Findings:")
        if not html_success:
            print("❌ HTML Export format is not implemented (required for browser compatibility)")
        if not json_success:
            print("❌ JSON Export format is not implemented (required for Chrome Bookmarks)")
        if xml_success and csv_success:
            print("✅ Existing XML and CSV export formats are working correctly")
        
        return xml_success, csv_success, html_success, json_success

def main():
    tester = ExportFunctionalityTester()
    
    # Run all tests
    tester.run_all_tests()
    
    # Print summary
    xml_ok, csv_ok, html_ok, json_ok = tester.print_summary()
    
    # Return appropriate exit code
    if xml_ok and csv_ok:
        if html_ok and json_ok:
            print("\n🎉 All export formats are working!")
            return 0
        else:
            print("\n⚠️  Existing formats work, but new formats need implementation")
            return 1
    else:
        print("\n❌ Critical issues with existing export formats")
        return 2

if __name__ == "__main__":
    sys.exit(main())