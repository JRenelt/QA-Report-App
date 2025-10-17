#!/usr/bin/env python3
"""
QA-Report-App German Review Request - Comprehensive Backend Testing
Tests specific functionality mentioned in the German review request with proper test creation testing.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://report-qa-portal.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials as specified in German review request
ADMIN_EMAIL_CREDENTIALS = {"username": "admin@test.com", "password": "admin123"}
ADMIN_USERNAME_CREDENTIALS = {"username": "admin", "password": "admin123"}

class ComprehensiveGermanReviewTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.auth_token = None
        self.project_id = None
        self.test_suite_id = None
        
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
    
    def test_admin_login(self):
        """Test admin login with both email and username"""
        # Try email first
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=ADMIN_EMAIL_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                
                user = data.get("user", {})
                self.log_test("Admin Login", True, 
                            f"✅ Admin login successful with EMAIL (admin@test.com) - User: {user.get('username')}, Role: {user.get('role')}")
                return True
        except:
            pass
        
        # Try username fallback
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=ADMIN_USERNAME_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                
                user = data.get("user", {})
                self.log_test("Admin Login", True, 
                            f"⚠️  Admin login successful with USERNAME (admin) - Email login failed but username works - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("Admin Login", False, 
                            f"❌ Both email and username login failed - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Login", False, f"❌ Login request failed: {str(e)}")
            return False
    
    def test_generate_test_data(self):
        """Test admin test data generation endpoint"""
        if not self.auth_token:
            self.log_test("Test Data Generation", False, "❌ No auth token available")
            return False
        
        try:
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
            else:
                self.log_test("Test Data Generation", False, 
                            f"❌ Test data generation FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test Data Generation", False, f"❌ Test data generation REQUEST FAILED: {str(e)}")
            return False
    
    def get_project_for_testing(self):
        """Get a project ID for testing test creation"""
        if not self.auth_token:
            return None
        
        try:
            response = self.session.get(f"{API_BASE}/projects/", timeout=10)
            if response.status_code == 200:
                projects = response.json()
                if projects and len(projects) > 0:
                    self.project_id = projects[0]["id"]
                    return self.project_id
        except:
            pass
        return None
    
    def get_test_suite_for_testing(self):
        """Get a test suite ID for testing test case creation"""
        if not self.auth_token or not self.project_id:
            return None
        
        try:
            response = self.session.get(f"{API_BASE}/test-suites/?project_id={self.project_id}", timeout=10)
            if response.status_code == 200:
                suites = response.json()
                if suites and len(suites) > 0:
                    self.test_suite_id = suites[0]["id"]
                    return self.test_suite_id
        except:
            pass
        return None
    
    def test_test_suite_creation(self):
        """Test test suite creation API"""
        if not self.auth_token:
            self.log_test("Test Suite Creation", False, "❌ No auth token available")
            return False
        
        # Get project ID
        if not self.get_project_for_testing():
            self.log_test("Test Suite Creation", False, "❌ No project available for testing")
            return False
        
        try:
            test_suite_data = {
                "project_id": self.project_id,
                "name": f"German Review Test Suite {datetime.now().strftime('%H%M%S')}",
                "description": "Test suite created during German review testing",
                "icon": "test-icon",
                "sort_order": 999
            }
            
            response = self.session.post(f"{API_BASE}/test-suites/", json=test_suite_data, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.test_suite_id = data.get("id")  # Store for test case creation
                self.log_test("Test Suite Creation", True, 
                            f"✅ Test suite creation WORKING - Created suite: {data.get('name')} (ID: {data.get('id')})")
                return True
            else:
                self.log_test("Test Suite Creation", False, 
                            f"❌ Test suite creation FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test Suite Creation", False, f"❌ Test suite creation REQUEST FAILED: {str(e)}")
            return False
    
    def test_test_case_creation(self):
        """Test test case creation API"""
        if not self.auth_token:
            self.log_test("Test Case Creation", False, "❌ No auth token available")
            return False
        
        # Ensure we have a test suite
        if not self.test_suite_id and not self.get_test_suite_for_testing():
            self.log_test("Test Case Creation", False, "❌ No test suite available for testing")
            return False
        
        try:
            test_case_data = {
                "test_suite_id": self.test_suite_id,
                "test_id": f"GR{datetime.now().strftime('%H%M%S')}",
                "name": f"German Review Test Case {datetime.now().strftime('%H%M%S')}",
                "description": "Test case created during German review testing",
                "priority": 2,  # Integer: 1=high, 2=medium, 3=low
                "expected_result": "Test case should be created successfully",
                "sort_order": 1
            }
            
            response = self.session.post(f"{API_BASE}/test-cases/", json=test_case_data, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log_test("Test Case Creation", True, 
                            f"✅ Test case creation WORKING - Created case: {data.get('name')} (ID: {data.get('test_id')})")
                return True
            else:
                self.log_test("Test Case Creation", False, 
                            f"❌ Test case creation FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test Case Creation", False, f"❌ Test case creation REQUEST FAILED: {str(e)}")
            return False
    
    def test_bulk_test_case_creation(self):
        """Test bulk test case creation API"""
        if not self.auth_token:
            self.log_test("Bulk Test Case Creation", False, "❌ No auth token available")
            return False
        
        # Ensure we have a test suite
        if not self.test_suite_id and not self.get_test_suite_for_testing():
            self.log_test("Bulk Test Case Creation", False, "❌ No test suite available for testing")
            return False
        
        try:
            timestamp = datetime.now().strftime('%H%M%S')
            bulk_test_cases = [
                {
                    "test_suite_id": self.test_suite_id,
                    "test_id": f"GRB{timestamp}01",
                    "name": f"Bulk Test Case 1 - {timestamp}",
                    "description": "First bulk test case created during German review testing",
                    "priority": 1,  # Integer: 1=high, 2=medium, 3=low
                    "expected_result": "Bulk test case 1 should be created successfully",
                    "sort_order": 1
                },
                {
                    "test_suite_id": self.test_suite_id,
                    "test_id": f"GRB{timestamp}02",
                    "name": f"Bulk Test Case 2 - {timestamp}",
                    "description": "Second bulk test case created during German review testing",
                    "priority": 2,  # Integer: 1=high, 2=medium, 3=low
                    "expected_result": "Bulk test case 2 should be created successfully",
                    "sort_order": 2
                }
            ]
            
            response = self.session.post(f"{API_BASE}/test-cases/bulk", json=bulk_test_cases, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.log_test("Bulk Test Case Creation", True, 
                            f"✅ Bulk test case creation WORKING - Created {len(data)} test cases")
                return True
            else:
                self.log_test("Bulk Test Case Creation", False, 
                            f"❌ Bulk test case creation FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Bulk Test Case Creation", False, f"❌ Bulk test case creation REQUEST FAILED: {str(e)}")
            return False
    
    def test_backend_health_internal(self):
        """Test backend health internally"""
        try:
            import subprocess
            result = subprocess.run(['curl', '-s', 'http://localhost:8001/health'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                data = json.loads(result.stdout)
                self.log_test("Backend Health (Internal)", True, 
                            f"✅ Backend healthy internally - Status: {data.get('status')}, DB: {data.get('database')}")
                return True
            else:
                self.log_test("Backend Health (Internal)", False, 
                            "❌ Internal health check failed")
                return False
        except Exception as e:
            self.log_test("Backend Health (Internal)", False, f"❌ Internal health check error: {str(e)}")
            return False
    
    def run_comprehensive_tests(self):
        """Run comprehensive tests for German review request"""
        print("🇩🇪 QA-Report-App German Review - COMPREHENSIVE Backend Testing")
        print("=" * 80)
        print("Testing requirements:")
        print("1. ✅ Login Test: admin@test.com/admin123 (with username fallback)")
        print("2. ✅ Test Data Generation: /api/admin/generate-test-data")
        print("3. ✅ Test Creation APIs: POST /api/test-suites/, POST /api/test-cases/, POST /api/test-cases/bulk")
        print("=" * 80)
        
        # Tests in priority order
        tests = [
            ("Backend Health (Internal)", self.test_backend_health_internal),
            ("Admin Login", self.test_admin_login),
            ("Test Data Generation", self.test_generate_test_data),
            ("Test Suite Creation", self.test_test_suite_creation),
            ("Test Case Creation", self.test_test_case_creation),
            ("Bulk Test Case Creation", self.test_bulk_test_case_creation),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        print("\n" + "=" * 80)
        print(f"🏁 German Review Comprehensive Test Results: {passed}/{total} tests passed")
        
        # Detailed analysis for German review
        print("\n📋 GERMAN REVIEW COMPREHENSIVE ANALYSIS:")
        
        # Check login
        login_result = next((r for r in self.test_results if r['test'] == 'Admin Login'), None)
        if login_result and login_result['success']:
            if "EMAIL" in login_result['message']:
                print("✅ LOGIN: admin@test.com/admin123 WORKING PERFECTLY")
            else:
                print("⚠️  LOGIN: admin@test.com/admin123 NOT WORKING, but admin/admin123 works as fallback")
        else:
            print("❌ LOGIN: BOTH admin@test.com and admin credentials FAILED")
        
        # Check test data generation
        test_data_result = next((r for r in self.test_results if r['test'] == 'Test Data Generation'), None)
        if test_data_result and test_data_result['success']:
            print("✅ TEST DATA GENERATION: /api/admin/generate-test-data WORKING PERFECTLY")
        else:
            print("❌ TEST DATA GENERATION: /api/admin/generate-test-data NOT WORKING")
        
        # Check test creation
        suite_result = next((r for r in self.test_results if r['test'] == 'Test Suite Creation'), None)
        case_result = next((r for r in self.test_results if r['test'] == 'Test Case Creation'), None)
        bulk_result = next((r for r in self.test_results if r['test'] == 'Bulk Test Case Creation'), None)
        
        creation_working = 0
        if suite_result and suite_result['success']:
            creation_working += 1
        if case_result and case_result['success']:
            creation_working += 1
        if bulk_result and bulk_result['success']:
            creation_working += 1
        
        if creation_working == 3:
            print("✅ TEST CREATION: ALL APIs WORKING PERFECTLY (test-suites, test-cases, bulk)")
        elif creation_working > 0:
            print(f"⚠️  TEST CREATION: {creation_working}/3 APIs working - Some functionality available")
        else:
            print("❌ TEST CREATION: NO APIs working - This matches user report 'New test creation OF'")
        
        # Summary for user reports
        print("\n🔍 USER REPORT VERIFICATION:")
        if test_data_result and test_data_result['success']:
            print("❗ USER REPORT 'Test data generation OF' - INCORRECT: Test data generation IS WORKING")
        else:
            print("✅ USER REPORT 'Test data generation OF' - CONFIRMED: Test data generation not working")
        
        if creation_working > 0:
            print("❗ USER REPORT 'New test creation OF' - INCORRECT: Test creation APIs ARE WORKING")
        else:
            print("✅ USER REPORT 'New test creation OF' - CONFIRMED: Test creation not working")
        
        return passed == total
    
    def get_summary(self):
        """Get comprehensive test summary"""
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        summary = {
            'german_review_comprehensive': True,
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': self.test_results,
            'user_reported_issues_verification': {
                'test_data_generation_off': not any(r['test'] == 'Test Data Generation' and r['success'] for r in self.test_results),
                'new_test_creation_off': not any(r['test'] in ['Test Suite Creation', 'Test Case Creation', 'Bulk Test Case Creation'] and r['success'] for r in self.test_results)
            }
        }
        
        return summary

def main():
    """Main test execution for comprehensive German review"""
    tester = ComprehensiveGermanReviewTester()
    
    try:
        success = tester.run_comprehensive_tests()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/comprehensive_german_review_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Comprehensive German review results saved to: /app/comprehensive_german_review_results.json")
        
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