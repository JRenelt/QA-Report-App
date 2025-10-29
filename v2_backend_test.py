#!/usr/bin/env python3
"""
QA-Report-App V2 Backend Testing Suite
Tests the new V2 endpoints with role-based permissions and the 3 new users.

German Test Request:
- SysOp: JR / 3r7k03nI9
- Admin: AR / admin123  
- QA-Tester: AT / tester123

Backend URL: https://qa-report-v2.preview.emergentagent.com
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from German test request
BACKEND_URL = "https://qa-report-v2.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials from German request
SYSOP_CREDENTIALS = {"username": "JR", "password": "3r7k03nI9"}
ADMIN_CREDENTIALS = {"username": "AR", "password": "admin123"}
QA_TESTER_CREDENTIALS = {"username": "AT", "password": "tester123"}

class V2BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.auth_tokens = {}  # Store tokens for each user
        
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
    
    def login_user(self, credentials, user_type):
        """Login user and store JWT token"""
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=credentials,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["access_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test(f"{user_type} Login", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Check user data
                user = data.get("user", {})
                expected_username = credentials["username"]
                if user.get("username") != expected_username:
                    self.log_test(f"{user_type} Login", False, 
                                f"Username mismatch: expected {expected_username}, got {user.get('username')}", data)
                    return False
                
                # Store token for this user
                self.auth_tokens[user_type] = data.get("access_token")
                
                self.log_test(f"{user_type} Login", True, 
                            f"Login successful - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test(f"{user_type} Login", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(f"{user_type} Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_with_auth(self, endpoint, user_type, test_name, expected_status=200, method="GET", json_data=None):
        """Make authenticated request and test response"""
        if user_type not in self.auth_tokens:
            self.log_test(test_name, False, f"No auth token for {user_type}")
            return False
        
        try:
            headers = {
                'Authorization': f'Bearer {self.auth_tokens[user_type]}',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            
            if method == "GET":
                response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
            elif method == "POST":
                response = requests.post(f"{API_BASE}{endpoint}", headers=headers, json=json_data, timeout=10)
            else:
                self.log_test(test_name, False, f"Unsupported method: {method}")
                return False
            
            if response.status_code == expected_status:
                try:
                    data = response.json()
                    self.log_test(test_name, True, 
                                f"HTTP {response.status_code} - Response received successfully")
                    return data
                except:
                    self.log_test(test_name, True, 
                                f"HTTP {response.status_code} - Non-JSON response (expected for some endpoints)")
                    return True
            else:
                try:
                    error_data = response.json()
                    self.log_test(test_name, False, 
                                f"Expected HTTP {expected_status}, got {response.status_code}: {error_data}")
                except:
                    self.log_test(test_name, False, 
                                f"Expected HTTP {expected_status}, got {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test(test_name, False, f"Request failed: {str(e)}")
            return False
    
    def test_sysop_login(self):
        """Test SysOp login (JR/3r7k03nI9)"""
        return self.login_user(SYSOP_CREDENTIALS, "SysOp")
    
    def test_admin_login(self):
        """Test Admin login (AR/admin123)"""
        return self.login_user(ADMIN_CREDENTIALS, "Admin")
    
    def test_qa_tester_login(self):
        """Test QA-Tester login (AT/tester123)"""
        return self.login_user(QA_TESTER_CREDENTIALS, "QA-Tester")
    
    def test_sysop_companies_v2(self):
        """Test SysOp companies access - should see 2 companies (ID2.de, Test_Firma)"""
        data = self.test_with_auth("/companies-v2/", "SysOp", "SysOp Companies V2 Access")
        if data:
            if isinstance(data, list):
                company_count = len(data)
                company_names = [c.get("name", "Unknown") for c in data]
                
                # Expected: 2 companies (ID2.de, Test_Firma)
                if company_count == 2:
                    self.log_test("SysOp Companies V2 Count", True, 
                                f"Correct count: {company_count} companies - {company_names}")
                else:
                    self.log_test("SysOp Companies V2 Count", False, 
                                f"Expected 2 companies, got {company_count} - {company_names}")
                return True
            else:
                self.log_test("SysOp Companies V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_admin_companies_v2(self):
        """Test Admin companies access - should see only 1 company (Test_Firma)"""
        data = self.test_with_auth("/companies-v2/", "Admin", "Admin Companies V2 Access")
        if data:
            if isinstance(data, list):
                company_count = len(data)
                company_names = [c.get("name", "Unknown") for c in data]
                
                # Expected: 1 company (Test_Firma - Admin's company)
                if company_count == 1:
                    self.log_test("Admin Companies V2 Count", True, 
                                f"Correct count: {company_count} company - {company_names}")
                else:
                    self.log_test("Admin Companies V2 Count", False, 
                                f"Expected 1 company, got {company_count} - {company_names}")
                return True
            else:
                self.log_test("Admin Companies V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_qa_tester_companies_v2(self):
        """Test QA-Tester companies access - should see only 1 company (Test_Firma)"""
        data = self.test_with_auth("/companies-v2/", "QA-Tester", "QA-Tester Companies V2 Access")
        if data:
            if isinstance(data, list):
                company_count = len(data)
                company_names = [c.get("name", "Unknown") for c in data]
                
                # Expected: 1 company (Test_Firma - QA-Tester's company)
                if company_count == 1:
                    self.log_test("QA-Tester Companies V2 Count", True, 
                                f"Correct count: {company_count} company - {company_names}")
                else:
                    self.log_test("QA-Tester Companies V2 Count", False, 
                                f"Expected 1 company, got {company_count} - {company_names}")
                return True
            else:
                self.log_test("QA-Tester Companies V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_sysop_users_v2(self):
        """Test SysOp users access - should see 3 users (JR, AR, AT)"""
        data = self.test_with_auth("/users-v2/", "SysOp", "SysOp Users V2 Access")
        if data:
            if isinstance(data, list):
                user_count = len(data)
                usernames = [u.get("username", "Unknown") for u in data]
                
                # Expected: 3 users (JR, AR, AT)
                if user_count == 3:
                    self.log_test("SysOp Users V2 Count", True, 
                                f"Correct count: {user_count} users - {usernames}")
                else:
                    self.log_test("SysOp Users V2 Count", False, 
                                f"Expected 3 users, got {user_count} - {usernames}")
                return True
            else:
                self.log_test("SysOp Users V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_admin_users_v2(self):
        """Test Admin users access - should see 2 users (AR, AT - only own company)"""
        data = self.test_with_auth("/users-v2/", "Admin", "Admin Users V2 Access")
        if data:
            if isinstance(data, list):
                user_count = len(data)
                usernames = [u.get("username", "Unknown") for u in data]
                
                # Expected: 2 users (AR, AT - same company, no SysOp JR)
                if user_count == 2:
                    self.log_test("Admin Users V2 Count", True, 
                                f"Correct count: {user_count} users - {usernames}")
                else:
                    self.log_test("Admin Users V2 Count", False, 
                                f"Expected 2 users, got {user_count} - {usernames}")
                return True
            else:
                self.log_test("Admin Users V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_qa_tester_users_v2(self):
        """Test QA-Tester users access - should see only 1 user (AT - only own profile)"""
        data = self.test_with_auth("/users-v2/", "QA-Tester", "QA-Tester Users V2 Access")
        if data:
            if isinstance(data, list):
                user_count = len(data)
                usernames = [u.get("username", "Unknown") for u in data]
                
                # Expected: 1 user (AT - only own profile)
                if user_count == 1 and "AT" in usernames:
                    self.log_test("QA-Tester Users V2 Count", True, 
                                f"Correct count: {user_count} user - {usernames}")
                else:
                    self.log_test("QA-Tester Users V2 Count", False, 
                                f"Expected 1 user (AT), got {user_count} - {usernames}")
                return True
            else:
                self.log_test("QA-Tester Users V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_sysop_projects_v2(self):
        """Test SysOp projects access - should be empty list (no projects yet)"""
        data = self.test_with_auth("/projects-v2/", "SysOp", "SysOp Projects V2 Access")
        if data:
            if isinstance(data, list):
                project_count = len(data)
                
                # Expected: 0 projects (empty list initially)
                if project_count == 0:
                    self.log_test("SysOp Projects V2 Count", True, 
                                f"Correct count: {project_count} projects (empty as expected)")
                else:
                    self.log_test("SysOp Projects V2 Count", False, 
                                f"Expected 0 projects, got {project_count}")
                return True
            else:
                self.log_test("SysOp Projects V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_admin_projects_v2(self):
        """Test Admin projects access - should be empty list"""
        data = self.test_with_auth("/projects-v2/", "Admin", "Admin Projects V2 Access")
        if data:
            if isinstance(data, list):
                project_count = len(data)
                
                # Expected: 0 projects (empty list initially)
                if project_count == 0:
                    self.log_test("Admin Projects V2 Count", True, 
                                f"Correct count: {project_count} projects (empty as expected)")
                else:
                    self.log_test("Admin Projects V2 Count", False, 
                                f"Expected 0 projects, got {project_count}")
                return True
            else:
                self.log_test("Admin Projects V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_qa_tester_projects_v2(self):
        """Test QA-Tester projects access - should be empty list (no assignments)"""
        data = self.test_with_auth("/projects-v2/", "QA-Tester", "QA-Tester Projects V2 Access")
        if data:
            if isinstance(data, list):
                project_count = len(data)
                
                # Expected: 0 projects (no assignments yet)
                if project_count == 0:
                    self.log_test("QA-Tester Projects V2 Count", True, 
                                f"Correct count: {project_count} projects (no assignments as expected)")
                else:
                    self.log_test("QA-Tester Projects V2 Count", False, 
                                f"Expected 0 projects, got {project_count}")
                return True
            else:
                self.log_test("QA-Tester Projects V2 Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def test_admin_generate_test_data_v2(self):
        """Test Admin test data generation - should create 2 projects with 10 and 15 test cases"""
        test_data = {"role": "admin"}
        
        data = self.test_with_auth("/admin-v2/generate-test-data", "Admin", "Admin Generate Test Data V2", 
                                 expected_status=200, method="POST", json_data=test_data)
        if data:
            if isinstance(data, dict):
                created_projects = data.get("created_projects", 0)
                created_test_cases = data.get("created_test_cases", 0)
                
                # Expected: 2 projects with 25 total test cases (10 + 15)
                if created_projects == 2 and created_test_cases == 25:
                    self.log_test("Admin Test Data Generation V2", True, 
                                f"Correct generation: {created_projects} projects, {created_test_cases} test cases")
                else:
                    self.log_test("Admin Test Data Generation V2", False, 
                                f"Expected 2 projects with 25 test cases, got {created_projects} projects, {created_test_cases} test cases")
                return True
            else:
                self.log_test("Admin Test Data Generation V2 Format", False, 
                            f"Expected dict, got {type(data)}")
                return False
        return False
    
    def test_projects_after_generation(self):
        """Test that projects are visible after generation"""
        data = self.test_with_auth("/projects-v2/", "Admin", "Admin Projects V2 After Generation")
        if data:
            if isinstance(data, list):
                project_count = len(data)
                
                # Expected: 2 projects after generation
                if project_count == 2:
                    self.log_test("Projects V2 After Generation", True, 
                                f"Correct count: {project_count} projects visible after generation")
                    return True
                else:
                    self.log_test("Projects V2 After Generation", False, 
                                f"Expected 2 projects after generation, got {project_count}")
                    return False
            else:
                self.log_test("Projects V2 After Generation Format", False, 
                            f"Expected list, got {type(data)}")
                return False
        return False
    
    def run_all_tests(self):
        """Run all V2 backend tests"""
        print("🧪 Starting QA-Report-App V2 Backend Tests")
        print("🇩🇪 GERMAN TEST REQUEST: V2 Endpoints with Role-Based Permissions")
        print("=" * 80)
        
        # Test sequence as specified in German request
        tests = [
            # 1. Login Tests
            ("🇩🇪 SysOp Login (JR/3r7k03nI9)", self.test_sysop_login),
            ("🇩🇪 Admin Login (AR/admin123)", self.test_admin_login),
            ("🇩🇪 QA-Tester Login (AT/tester123)", self.test_qa_tester_login),
            
            # 2. SysOp Tests (with JR Token)
            ("🇩🇪 SysOp Companies V2 - Should show 2 companies", self.test_sysop_companies_v2),
            ("🇩🇪 SysOp Users V2 - Should show 3 users", self.test_sysop_users_v2),
            ("🇩🇪 SysOp Projects V2 - Should be empty", self.test_sysop_projects_v2),
            
            # 3. Admin Tests (with AR Token)
            ("🇩🇪 Admin Companies V2 - Should show 1 company", self.test_admin_companies_v2),
            ("🇩🇪 Admin Users V2 - Should show 2 users", self.test_admin_users_v2),
            ("🇩🇪 Admin Projects V2 - Should be empty", self.test_admin_projects_v2),
            
            # 4. QA-Tester Tests (with AT Token)
            ("🇩🇪 QA-Tester Companies V2 - Should show 1 company", self.test_qa_tester_companies_v2),
            ("🇩🇪 QA-Tester Users V2 - Should show 1 user", self.test_qa_tester_users_v2),
            ("🇩🇪 QA-Tester Projects V2 - Should be empty", self.test_qa_tester_projects_v2),
            
            # 5. Test Data Generation (Admin AR)
            ("🇩🇪 Admin Generate Test Data V2 - 2 projects with 10+15 test cases", self.test_admin_generate_test_data_v2),
            ("🇩🇪 Projects V2 After Generation - Should show 2 projects", self.test_projects_after_generation),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        print("\n" + "=" * 60)
        print(f"🏁 V2 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All V2 backend tests PASSED!")
        else:
            print(f"❌ {total - passed} tests FAILED!")
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total
    
    def get_summary(self):
        """Get test summary"""
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        summary = {
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': self.test_results
        }
        
        return summary

def main():
    """Main test execution"""
    tester = V2BackendTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/v2_backend_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: /app/v2_backend_test_results.json")
        
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