#!/usr/bin/env python3
"""
QA-Report-App German Review Request - Focused Backend Testing
Tests specific functionality mentioned in the German review request:
1. Login Test with admin@test.com/admin123
2. Test Data Generation (/api/admin/generate-test-data)
3. Test Creation API (if exists)
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://qa-report-hub.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials as specified in German review request
ADMIN_EMAIL_CREDENTIALS = {"username": "admin@test.com", "password": "admin123"}
ADMIN_USERNAME_CREDENTIALS = {"username": "admin", "password": "admin123"}

class GermanReviewTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.auth_token = None
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_admin_login_email(self):
        """Test admin login with admin@test.com/admin123 as specified in German review"""
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=ADMIN_EMAIL_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["access_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("Admin Login (Email)", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Store token for authenticated requests
                self.auth_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                
                user = data.get("user", {})
                self.log_test("Admin Login (Email)", True, 
                            f"Admin login successful with email - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                # Try with username instead of email
                self.log_test("Admin Login (Email)", False, 
                            f"Login with admin@test.com failed - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Login (Email)", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_login_username_fallback(self):
        """Test admin login with username admin/admin123 as fallback"""
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=ADMIN_USERNAME_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Store token for authenticated requests
                self.auth_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                
                user = data.get("user", {})
                self.log_test("Admin Login (Username Fallback)", True, 
                            f"Admin login successful with username - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("Admin Login (Username Fallback)", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Login (Username Fallback)", False, f"Request failed: {str(e)}")
            return False
    
    def test_generate_test_data(self):
        """Test admin test data generation endpoint as specified in German review"""
        if not self.auth_token:
            self.log_test("Test Data Generation", False, "No auth token available")
            return False
        
        try:
            # Test the endpoint as specified: /api/admin/generate-test-data
            test_data = {
                "companies": 2,
                "testsPerCompany": 5
            }
            
            response = self.session.post(f"{API_BASE}/admin/generate-test-data", json=test_data, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Test Data Generation", True, 
                            f"✅ Test data generation WORKING - {data.get('message', 'Data generated')} - Companies: {data.get('companies', 0)}, Test Cases: {data.get('testCases', 0)}")
                return True
            elif response.status_code == 404:
                self.log_test("Test Data Generation", False, 
                            "❌ Test data generation endpoint NOT FOUND (404) - This matches user report 'Test data generation OF'")
                return False
            elif response.status_code == 403:
                self.log_test("Test Data Generation", False, 
                            "❌ Test data generation ACCESS DENIED (403) - Admin role required")
                return False
            elif response.status_code == 401:
                self.log_test("Test Data Generation", False, 
                            "❌ Test data generation UNAUTHORIZED (401) - Authentication failed")
                return False
            else:
                self.log_test("Test Data Generation", False, 
                            f"❌ Test data generation FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test Data Generation", False, f"❌ Test data generation REQUEST FAILED: {str(e)}")
            return False
    
    def test_test_creation_api(self):
        """Look for test creation API endpoints"""
        if not self.auth_token:
            self.log_test("Test Creation API", False, "No auth token available")
            return False
        
        # Try different possible test creation endpoints
        possible_endpoints = [
            "/api/test-cases/",
            "/api/tests/",
            "/api/test-creation/",
            "/api/create-test/",
            "/api/test-suites/"
        ]
        
        found_endpoints = []
        
        for endpoint in possible_endpoints:
            try:
                # Try GET first to see if endpoint exists
                response = self.session.get(f"{API_BASE}{endpoint.replace('/api', '')}", timeout=10)
                
                if response.status_code != 404:
                    found_endpoints.append(f"{endpoint} (GET: {response.status_code})")
                
                # Try POST to see if it accepts test creation
                test_data = {
                    "title": "Test Creation Check",
                    "description": "Checking if test creation works"
                }
                
                response = self.session.post(f"{API_BASE}{endpoint.replace('/api', '')}", json=test_data, timeout=10)
                
                if response.status_code not in [404, 405]:  # 405 = Method Not Allowed
                    found_endpoints.append(f"{endpoint} (POST: {response.status_code})")
                    
            except requests.exceptions.RequestException:
                continue
        
        if found_endpoints:
            self.log_test("Test Creation API", True, 
                        f"Found potential test creation endpoints: {', '.join(found_endpoints)}")
            return True
        else:
            self.log_test("Test Creation API", False, 
                        "❌ No test creation API endpoints found - This matches user report 'New test creation OF'")
            return False
    
    def test_backend_health(self):
        """Quick health check to ensure backend is accessible"""
        try:
            response = self.session.get(f"{BACKEND_URL}/health", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                self.log_test("Backend Health", True, 
                            f"Backend accessible - Status: {data.get('status')}")
                return True
            else:
                self.log_test("Backend Health", False, 
                            f"Backend health check failed - HTTP {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Backend Health", False, f"Backend not accessible: {str(e)}")
            return False
    
    def run_german_review_tests(self):
        """Run tests specific to German review request"""
        print("🇩🇪 Starting German Review Request - QA-Report-App Backend Tests")
        print("=" * 70)
        print("Testing specific requirements:")
        print("1. Login Test: admin@test.com/admin123")
        print("2. Test Data Generation: /api/admin/generate-test-data")
        print("3. Test Creation API: Looking for test creation endpoints")
        print("=" * 70)
        
        # Tests in priority order as specified
        tests = [
            ("Backend Health Check", self.test_backend_health),
            ("Admin Login (Email)", self.test_admin_login_email),
            ("Admin Login (Username Fallback)", self.test_admin_login_username_fallback),
            ("Test Data Generation", self.test_generate_test_data),
            ("Test Creation API Search", self.test_test_creation_api),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        print("\n" + "=" * 70)
        print(f"🏁 German Review Test Results: {passed}/{total} tests passed")
        
        # Specific analysis for German review
        print("\n📋 GERMAN REVIEW ANALYSIS:")
        
        # Check login
        login_email_result = next((r for r in self.test_results if r['test'] == 'Admin Login (Email)'), None)
        login_username_result = next((r for r in self.test_results if r['test'] == 'Admin Login (Username Fallback)'), None)
        
        if login_email_result and login_email_result['success']:
            print("✅ LOGIN: admin@test.com/admin123 WORKING")
        elif login_username_result and login_username_result['success']:
            print("⚠️  LOGIN: admin@test.com/admin123 NOT WORKING, but admin/admin123 works")
        else:
            print("❌ LOGIN: Both admin@test.com and admin credentials FAILED")
        
        # Check test data generation
        test_data_result = next((r for r in self.test_results if r['test'] == 'Test Data Generation'), None)
        if test_data_result and test_data_result['success']:
            print("✅ TEST DATA GENERATION: /api/admin/generate-test-data WORKING")
        else:
            print("❌ TEST DATA GENERATION: /api/admin/generate-test-data NOT WORKING - Matches user report")
        
        # Check test creation
        test_creation_result = next((r for r in self.test_results if r['test'] == 'Test Creation API Search'), None)
        if test_creation_result and test_creation_result['success']:
            print("✅ TEST CREATION: API endpoints found")
        else:
            print("❌ TEST CREATION: No API endpoints found - Matches user report")
        
        return passed == total
    
    def get_summary(self):
        """Get test summary for German review"""
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        summary = {
            'german_review_focus': True,
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': self.test_results,
            'user_reported_issues': {
                'new_test_creation_off': True,
                'test_data_generation_off': True
            }
        }
        
        return summary

def main():
    """Main test execution for German review"""
    tester = GermanReviewTester()
    
    try:
        success = tester.run_german_review_tests()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/german_review_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 German review results saved to: /app/german_review_test_results.json")
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Test execution failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())