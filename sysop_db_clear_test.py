#!/usr/bin/env python3
"""
🇩🇪 GERMAN REVIEW REQUEST: SysOp Database Clear Testing
Tests database clearing functionality and SysOp user persistence after fix.

Test Scenarios:
1. SysOp Login (jre/sysop123) - should return HTTP 200 with JWT token
2. Database clearing as SysOp - should return HTTP 200 and preserve SysOp users
3. Projects retrieval after DB clearing - should return empty list but token should still be valid
4. Re-login after DB clearing - should still work
5. Companies retrieval - should return ID2 GmbH
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://qa-report-fixer.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Credentials
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}
SYSOP_CREDENTIALS = {"username": "jre", "password": "sysop123"}

class SysOpDBClearTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.sysop_token = None
        self.admin_token = None
        
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
    
    def setup_sysop_user(self):
        """Setup: Login as admin and create SysOp user if it doesn't exist"""
        try:
            # Login as admin first
            admin_response = self.session.post(
                f"{API_BASE}/auth/login",
                json=ADMIN_CREDENTIALS,
                timeout=10
            )
            
            if admin_response.status_code != 200:
                self.log_test("Setup: Admin Login", False, 
                            f"❌ Admin login failed: HTTP {admin_response.status_code}")
                return False
            
            admin_data = admin_response.json()
            self.admin_token = admin_data.get("access_token")
            
            # Set admin token for user creation
            admin_session = requests.Session()
            admin_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {self.admin_token}'
            })
            
            # Try to create SysOp user
            sysop_user_data = {
                "username": "jre",
                "email": "jre@sysop.com",
                "password": "sysop123",
                "first_name": "SysOp",
                "last_name": "User",
                "role": "sysop",
                "companyId": None,
                "language_preference": "DE"
            }
            
            create_response = admin_session.post(
                f"{API_BASE}/users/",
                json=sysop_user_data,
                timeout=10
            )
            
            if create_response.status_code in [200, 201]:
                self.log_test("Setup: SysOp User Creation", True, 
                            "✅ SysOp user created successfully")
                return True
            elif create_response.status_code == 400 and "already exists" in create_response.text:
                self.log_test("Setup: SysOp User Creation", True, 
                            "✅ SysOp user already exists")
                return True
            else:
                self.log_test("Setup: SysOp User Creation", False, 
                            f"❌ Failed to create SysOp user: HTTP {create_response.status_code}: {create_response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Setup: SysOp User Creation", False, f"❌ Request failed: {str(e)}")
            return False

    def test_1_sysop_login(self):
        """Test 1: SysOp Login (jre/sysop123) - should return HTTP 200 with JWT token"""
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=SYSOP_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["access_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("Test 1: SysOp Login", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Check token type
                if data.get("token_type") != "bearer":
                    self.log_test("Test 1: SysOp Login", False, 
                                f"Token type is not 'bearer': {data.get('token_type')}", data)
                    return False
                
                # Check user data
                user = data.get("user", {})
                if user.get("username") != "jre":
                    self.log_test("Test 1: SysOp Login", False, 
                                f"Username mismatch: {user.get('username')}", data)
                    return False
                
                if user.get("role") != "sysop":
                    self.log_test("Test 1: SysOp Login", False, 
                                f"Role mismatch: {user.get('role')}", data)
                    return False
                
                # Store token for authenticated requests
                self.sysop_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.sysop_token}'
                })
                
                self.log_test("Test 1: SysOp Login", True, 
                            f"✅ SysOp login successful - User: {user.get('username')}, Role: {user.get('role')}, Token received")
                return True
            else:
                self.log_test("Test 1: SysOp Login", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 1: SysOp Login", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_2_database_clear_as_sysop(self):
        """Test 2: Database clearing as SysOp - should return HTTP 200 and preserve SysOp users"""
        if not self.sysop_token:
            self.log_test("Test 2: Database Clear", False, "❌ No SysOp token available")
            return False
        
        try:
            response = self.session.delete(f"{API_BASE}/admin/clear-database", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                
                # Check if message indicates SysOp users are preserved
                if "Admin- und SysOp-Benutzer beibehalten" in message or "SysOp" in message:
                    self.log_test("Test 2: Database Clear", True, 
                                f"✅ Database cleared successfully with SysOp preservation - Message: {message}")
                    return True
                else:
                    self.log_test("Test 2: Database Clear", True, 
                                f"✅ Database cleared successfully - Message: {message}")
                    return True
            elif response.status_code == 403:
                self.log_test("Test 2: Database Clear", False, 
                            "❌ Access denied - SysOp should have admin rights (403)")
                return False
            else:
                self.log_test("Test 2: Database Clear", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 2: Database Clear", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_3_projects_after_clear(self):
        """Test 3: Projects retrieval after DB clearing - should return empty list but token should still be valid"""
        if not self.sysop_token:
            self.log_test("Test 3: Projects After Clear", False, "❌ No SysOp token available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/projects/all", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Should be empty list after clearing
                if isinstance(data, list) and len(data) == 0:
                    self.log_test("Test 3: Projects After Clear", True, 
                                f"✅ Projects endpoint returns empty list after DB clear - Token still valid")
                    return True
                elif isinstance(data, list):
                    self.log_test("Test 3: Projects After Clear", False, 
                                f"❌ Expected empty list, got {len(data)} projects: {data}")
                    return False
                else:
                    self.log_test("Test 3: Projects After Clear", False, 
                                f"❌ Expected list, got: {type(data)} - {data}")
                    return False
            elif response.status_code == 401:
                self.log_test("Test 3: Projects After Clear", False, 
                            "❌ CRITICAL: Token became invalid after DB clear (401) - This should NOT happen!")
                return False
            else:
                self.log_test("Test 3: Projects After Clear", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 3: Projects After Clear", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_4_relogin_after_clear(self):
        """Test 4: Re-login after DB clearing - should still work"""
        try:
            # Create new session for re-login test
            relogin_session = requests.Session()
            relogin_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            
            response = relogin_session.post(
                f"{API_BASE}/auth/login",
                json=SYSOP_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                
                if user.get("username") == "jre" and user.get("role") == "sysop":
                    self.log_test("Test 4: Re-login After Clear", True, 
                                f"✅ SysOp re-login successful after DB clear - User still exists")
                    return True
                else:
                    self.log_test("Test 4: Re-login After Clear", False, 
                                f"❌ User data incorrect: {user}")
                    return False
            else:
                self.log_test("Test 4: Re-login After Clear", False, 
                            f"❌ Re-login failed: HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 4: Re-login After Clear", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_5_companies_retrieval(self):
        """Test 5: Companies retrieval - should return ID2 GmbH"""
        if not self.sysop_token:
            self.log_test("Test 5: Companies Retrieval", False, "❌ No SysOp token available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/companies/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    # Look for ID2 GmbH or similar company
                    company_names = [company.get('name', '') for company in data if isinstance(company, dict)]
                    
                    # Check for ID2 GmbH or ID2.de or similar
                    id2_found = any('ID2' in name for name in company_names)
                    
                    if id2_found:
                        id2_company = next((name for name in company_names if 'ID2' in name), 'ID2 company')
                        self.log_test("Test 5: Companies Retrieval", True, 
                                    f"✅ Companies retrieved successfully - Found {id2_company} among {len(data)} companies")
                        return True
                    elif len(data) > 0:
                        self.log_test("Test 5: Companies Retrieval", True, 
                                    f"✅ Companies retrieved successfully - Found {len(data)} companies: {company_names}")
                        return True
                    else:
                        self.log_test("Test 5: Companies Retrieval", False, 
                                    f"❌ No companies found - Expected ID2 GmbH to be preserved")
                        return False
                else:
                    self.log_test("Test 5: Companies Retrieval", False, 
                                f"❌ Expected list, got: {type(data)} - {data}")
                    return False
            else:
                self.log_test("Test 5: Companies Retrieval", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 5: Companies Retrieval", False, f"❌ Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all SysOp database clear tests"""
        print("🇩🇪 GERMAN REVIEW REQUEST: SysOp Database Clear Testing")
        print("Testing database clearing functionality and SysOp user persistence after fix")
        print("=" * 80)
        
        # Test sequence as specified in the German review request
        tests = [
            ("Test 1: SysOp Login (jre/sysop123)", self.test_1_sysop_login),
            ("Test 2: Database Clear as SysOp", self.test_2_database_clear_as_sysop),
            ("Test 3: Projects After DB Clear", self.test_3_projects_after_clear),
            ("Test 4: Re-login After DB Clear", self.test_4_relogin_after_clear),
            ("Test 5: Companies Retrieval", self.test_5_companies_retrieval),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running {test_name}...")
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        print("\n" + "=" * 80)
        print(f"🏁 SysOp Database Clear Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ ALL SYSOP DATABASE CLEAR TESTS PASSED!")
            print("🎉 SysOp users are correctly preserved after database clearing!")
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
            'test_type': 'SysOp Database Clear Testing',
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': self.test_results
        }
        
        return summary

def main():
    """Main test execution"""
    tester = SysOpDBClearTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/sysop_db_clear_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: /app/sysop_db_clear_test_results.json")
        
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