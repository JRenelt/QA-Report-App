#!/usr/bin/env python3

import requests
import json

class ExtendedExportTester:
    def __init__(self, base_url="https://log-inspector-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

    def run_test(self, name, method, endpoint, expected_status, data=None, expect_json=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)

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
                    print(f"   Response Length: {len(response.text)} characters")
                    print(f"   Content Type: {response.headers.get('content-type', 'unknown')}")
                    print(f"   Response Preview: {response.text[:200]}...")
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_export_html(self, category=None):
        """Test HTML export functionality"""
        export_data = {"format": "html"}
        if category:
            export_data["category"] = category
            
        success, response = self.run_test(
            f"Export HTML{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        return success, response

    def test_export_json(self, category=None):
        """Test JSON export functionality"""
        export_data = {"format": "json"}
        if category:
            export_data["category"] = category
            
        success, response = self.run_test(
            f"Export JSON{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        return success, response

    def test_export_error_handling(self):
        """Test error handling for unsupported export formats"""
        export_data = {"format": "unsupported"}
        
        success, response = self.run_test(
            "Export Unsupported Format (Error Handling)",
            "POST",
            "export",
            400,  # Expecting 400 Bad Request
            data=export_data,
            expect_json=True
        )
        return success, response

def main():
    print("🚀 Testing Extended Export Functionality (HTML/JSON)")
    print("🎯 FOCUS: HTML und JSON Export-Formate gemäß Review-Request")
    print("=" * 60)
    
    tester = ExtendedExportTester()
    
    print("\n📋 Phase 1: HTML Export Testing")
    html_success, html_response = tester.test_export_html()
    html_category_success, html_category_response = tester.test_export_html("Development")
    
    print("\n📋 Phase 2: JSON Export Testing")
    json_success, json_response = tester.test_export_json()
    json_category_success, json_category_response = tester.test_export_json("Development")
    
    print("\n📋 Phase 3: Error Handling Testing")
    error_success, error_response = tester.test_export_error_handling()
    
    # Print final results
    print("\n" + "=" * 60)
    print(f"📊 EXTENDED EXPORT TESTING RESULTS")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\n🎯 EXPORT FORMATS STATUS:")
    print(f"✅ HTML Export: {'PASS' if html_success else 'FAIL'}")
    print(f"✅ HTML Export (Category Filter): {'PASS' if html_category_success else 'FAIL'}")
    print(f"✅ JSON Export: {'PASS' if json_success else 'FAIL'}")
    print(f"✅ JSON Export (Category Filter): {'PASS' if json_category_success else 'FAIL'}")
    print(f"✅ Error Handling: {'PASS' if error_success else 'FAIL'}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All extended export tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed.")
        return 1

if __name__ == "__main__":
    main()