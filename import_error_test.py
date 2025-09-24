#!/usr/bin/env python3

import requests
import json

class ImportErrorTester:
    def __init__(self, base_url="https://log-inspector-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, files=None, expect_json=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
                    response = requests.post(url)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if expect_json:
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
                        return success, response_data
                    except:
                        print(f"   Response: {response.text[:200]}...")
                        return success, {}
                else:
                    print(f"   Response: {response.text[:200]}...")
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_import_no_file(self):
        """Test import with no file provided"""
        success, response = self.run_test(
            "Import No File (Error Handling)",
            "POST",
            "bookmarks/import",
            422,  # Expecting validation error
            files=None
        )
        return success, response

    def test_import_empty_file(self):
        """Test import with empty file"""
        files = {'file': ('empty.html', '', 'text/html')}
        
        success, response = self.run_test(
            "Import Empty File",
            "POST",
            "bookmarks/import",
            200,  # Should handle gracefully
            files=files
        )
        return success, response

    def test_import_invalid_html(self):
        """Test import with invalid HTML"""
        invalid_html = "<html><body>This is not a valid bookmark file</body></html>"
        files = {'file': ('invalid.html', invalid_html, 'text/html')}
        
        success, response = self.run_test(
            "Import Invalid HTML",
            "POST",
            "bookmarks/import",
            200,  # Should handle gracefully
            files=files
        )
        return success, response

    def test_import_invalid_json(self):
        """Test import with invalid JSON"""
        invalid_json = '{"invalid": "json", "missing": bracket'
        files = {'file': ('invalid.json', invalid_json, 'application/json')}
        
        success, response = self.run_test(
            "Import Invalid JSON",
            "POST",
            "bookmarks/import",
            500,  # Expecting server error for malformed JSON
            files=files
        )
        return success, response

    def test_import_valid_html(self):
        """Test import with valid HTML bookmarks"""
        valid_html = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>

<DL><p>
    <DT><H3>Test Category</H3>
    <DL><p>
        <DT><A HREF="https://example.com/">Example Site</A>
        <DT><A HREF="https://test.com/">Test Site</A>
    </DL><p>
</DL><p>"""
        files = {'file': ('valid.html', valid_html, 'text/html')}
        
        success, response = self.run_test(
            "Import Valid HTML",
            "POST",
            "bookmarks/import",
            200,
            files=files
        )
        return success, response

    def test_import_valid_json(self):
        """Test import with valid JSON bookmarks"""
        valid_json = {
            "children": [
                {
                    "name": "Test Category",
                    "children": [
                        {"name": "Example Site", "url": "https://example.org/"},
                        {"name": "Test Site", "url": "https://test.org/"}
                    ]
                }
            ]
        }
        files = {'file': ('valid.json', json.dumps(valid_json), 'application/json')}
        
        success, response = self.run_test(
            "Import Valid JSON",
            "POST",
            "bookmarks/import",
            200,
            files=files
        )
        return success, response

def main():
    print("🚀 Testing Import Functionality & Error Handling")
    print("🎯 FOCUS: Import-Endpunkt mit verschiedenen Szenarien")
    print("=" * 60)
    
    tester = ImportErrorTester()
    
    print("\n📋 Phase 1: Error Handling Tests")
    no_file_success, no_file_response = tester.test_import_no_file()
    empty_file_success, empty_file_response = tester.test_import_empty_file()
    invalid_html_success, invalid_html_response = tester.test_import_invalid_html()
    invalid_json_success, invalid_json_response = tester.test_import_invalid_json()
    
    print("\n📋 Phase 2: Valid Import Tests")
    valid_html_success, valid_html_response = tester.test_import_valid_html()
    valid_json_success, valid_json_response = tester.test_import_valid_json()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 IMPORT & ERROR HANDLING RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\n🎯 IMPORT FUNCTIONALITY STATUS:")
    print(f"✅ No File Error Handling: {'PASS' if no_file_success else 'FAIL'}")
    print(f"✅ Empty File Handling: {'PASS' if empty_file_success else 'FAIL'}")
    print(f"✅ Invalid HTML Handling: {'PASS' if invalid_html_success else 'FAIL'}")
    print(f"✅ Invalid JSON Handling: {'PASS' if invalid_json_success else 'FAIL'}")
    print(f"✅ Valid HTML Import: {'PASS' if valid_html_success else 'FAIL'}")
    print(f"✅ Valid JSON Import: {'PASS' if valid_json_success else 'FAIL'}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All import tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed.")
        return 1

if __name__ == "__main__":
    main()