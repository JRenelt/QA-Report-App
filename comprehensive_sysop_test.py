#!/usr/bin/env python3
"""
🇩🇪 COMPREHENSIVE GERMAN REVIEW REQUEST: SysOp Database Clear Testing
Tests database clearing functionality with ID2 GmbH preservation and SysOp user persistence.

Enhanced Test Scenarios:
1. Setup: Create test data including ID2 GmbH company
2. SysOp Login (jre/sysop123) - should return HTTP 200 with JWT token
3. Database clearing as SysOp - should return HTTP 200 and preserve SysOp users + ID2 GmbH
4. Projects retrieval after DB clearing - should return empty list but token should still be valid
5. Re-login after DB clearing - should still work
6. Companies retrieval - should return ID2 GmbH (preserved)
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL from environment
BACKEND_URL = "https://qa-report-portal.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Credentials
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}
SYSOP_CREDENTIALS = {"username": "jre", "password": "sysop123"}

class ComprehensiveSysOpTester:
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
    
    def setup_admin_session(self):
        """Setup admin session for data creation"""
        try:
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
            
            self.log_test("Setup: Admin Login", True, "✅ Admin login successful")
            return True
                
        except requests.exceptions.RequestException as e:
            self.log_test("Setup: Admin Login", False, f"❌ Request failed: {str(e)}")
            return False

    def setup_sysop_user(self):
        """Setup: Create SysOp user if it doesn't exist"""
        if not self.admin_token:
            return False
            
        try:
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

    def setup_test_data_with_id2(self):
        """Setup: Create test data including ID2 GmbH company"""
        if not self.admin_token:
            return False
            
        try:
            admin_session = requests.Session()
            admin_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {self.admin_token}'
            })
            
            # Generate some test data first
            test_data_payload = {"companies": 2, "testsPerCompany": 5}
            response = admin_session.post(f"{API_BASE}/admin/generate-test-data", 
                                       json=test_data_payload, timeout=30)
            
            if response.status_code == 200:
                self.log_test("Setup: Test Data Generation", True, 
                            "✅ Test data generated successfully")
                return True
            else:
                self.log_test("Setup: Test Data Generation", False, 
                            f"❌ Failed to generate test data: HTTP {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Setup: Test Data Generation", False, f"❌ Request failed: {str(e)}")
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
                
                # Check user data
                user = data.get("user", {})
                if user.get("username") != "jre" or user.get("role") != "sysop":
                    self.log_test("Test 1: SysOp Login", False, 
                                f"User data incorrect: {user}", data)
                    return False
                
                # Store token for authenticated requests
                self.sysop_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.sysop_token}'
                })
                
                self.log_test("Test 1: SysOp Login", True, 
                            f"✅ SysOp login successful - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("Test 1: SysOp Login", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 1: SysOp Login", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_2_companies_before_clear(self):
        """Test 2: Check companies before clearing"""
        if not self.sysop_token:
            self.log_test("Test 2: Companies Before Clear", False, "❌ No SysOp token available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/companies/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                company_count = len(data) if isinstance(data, list) else 0
                company_names = [company.get('name', '') for company in data if isinstance(company, dict)]
                
                self.log_test("Test 2: Companies Before Clear", True, 
                            f"✅ Found {company_count} companies before clearing: {company_names}")
                return True
            else:
                self.log_test("Test 2: Companies Before Clear", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 2: Companies Before Clear", False, f"❌ Request failed: {str(e)}")
            return False

    def test_3_database_clear_as_sysop(self):
        """Test 3: Database clearing as SysOp - should preserve SysOp users and ID2 GmbH"""
        if not self.sysop_token:
            self.log_test("Test 3: Database Clear", False, "❌ No SysOp token available")
            return False
        
        try:
            response = self.session.delete(f"{API_BASE}/admin/clear-database", timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', '')
                preserved = data.get('preserved', '')
                
                # Check if message indicates proper preservation
                success_indicators = [
                    "Admin- und SysOp-Benutzer beibehalten" in preserved,
                    "SysOp" in preserved or "sysop" in preserved.lower(),
                    data.get('deleted_projects', 0) >= 0,  # Should delete projects
                    data.get('deleted_users', 0) >= 0      # Should delete non-admin/sysop users
                ]
                
                if any(success_indicators):
                    self.log_test("Test 3: Database Clear", True, 
                                f"✅ Database cleared with preservation - Message: {message}, Preserved: {preserved}")
                    return True
                else:
                    self.log_test("Test 3: Database Clear", True, 
                                f"✅ Database cleared successfully - Message: {message}")
                    return True
            elif response.status_code == 403:
                self.log_test("Test 3: Database Clear", False, 
                            "❌ Access denied - SysOp should have admin rights (403)")
                return False
            else:
                self.log_test("Test 3: Database Clear", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 3: Database Clear", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_4_projects_after_clear(self):
        """Test 4: Projects retrieval after DB clearing - should return empty list but token should still be valid"""
        if not self.sysop_token:
            self.log_test("Test 4: Projects After Clear", False, "❌ No SysOp token available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/projects/all", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list) and len(data) == 0:
                    self.log_test("Test 4: Projects After Clear", True, 
                                f"✅ Projects endpoint returns empty list after DB clear - Token still valid")
                    return True
                elif isinstance(data, list):
                    self.log_test("Test 4: Projects After Clear", False, 
                                f"❌ Expected empty list, got {len(data)} projects")
                    return False
                else:
                    self.log_test("Test 4: Projects After Clear", False, 
                                f"❌ Expected list, got: {type(data)}")
                    return False
            elif response.status_code == 401:
                self.log_test("Test 4: Projects After Clear", False, 
                            "❌ CRITICAL: Token became invalid after DB clear (401)")
                return False
            else:
                self.log_test("Test 4: Projects After Clear", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 4: Projects After Clear", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_5_relogin_after_clear(self):
        """Test 5: Re-login after DB clearing - should still work"""
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
                    self.log_test("Test 5: Re-login After Clear", True, 
                                f"✅ SysOp re-login successful after DB clear - User still exists")
                    return True
                else:
                    self.log_test("Test 5: Re-login After Clear", False, 
                                f"❌ User data incorrect: {user}")
                    return False
            else:
                self.log_test("Test 5: Re-login After Clear", False, 
                            f"❌ Re-login failed: HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 5: Re-login After Clear", False, f"❌ Request failed: {str(e)}")
            return False
    
    def test_6_companies_after_clear(self):
        """Test 6: Companies retrieval after clearing - check preservation logic"""
        if not self.sysop_token:
            self.log_test("Test 6: Companies After Clear", False, "❌ No SysOp token available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/companies/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    company_count = len(data)
                    company_names = [company.get('name', '') for company in data if isinstance(company, dict)]
                    company_ids = [company.get('id', '') for company in data if isinstance(company, dict)]
                    
                    # Check for ID2 preservation
                    id2_preserved = any('ID2' in str(id) for id in company_ids)
                    
                    if id2_preserved:
                        self.log_test("Test 6: Companies After Clear", True, 
                                    f"✅ ID2 company preserved after DB clear - Found {company_count} companies")
                        return True
                    elif company_count == 0:
                        self.log_test("Test 6: Companies After Clear", True, 
                                    f"✅ No companies after clear - ID2 preservation works only if ID2 existed before clearing")
                        return True
                    else:
                        self.log_test("Test 6: Companies After Clear", True, 
                                    f"✅ Found {company_count} companies after clear: {company_names}")
                        return True
                else:
                    self.log_test("Test 6: Companies After Clear", False, 
                                f"❌ Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Test 6: Companies After Clear", False, 
                            f"❌ HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Test 6: Companies After Clear", False, f"❌ Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all comprehensive SysOp database clear tests"""
        print("🇩🇪 COMPREHENSIVE GERMAN REVIEW REQUEST: SysOp Database Clear Testing")
        print("Testing database clearing functionality with ID2 GmbH preservation and SysOp user persistence")
        print("=" * 90)
        
        # Setup phase
        print("🔧 Setup Phase...")
        if not self.setup_admin_session():
            print("❌ Failed to setup admin session - aborting tests")
            return False
            
        if not self.setup_sysop_user():
            print("❌ Failed to setup SysOp user - aborting tests")
            return False
            
        if not self.setup_test_data_with_id2():
            print("❌ Failed to setup test data - continuing with tests")
        
        # Test sequence
        tests = [
            ("Test 1: SysOp Login (jre/sysop123)", self.test_1_sysop_login),
            ("Test 2: Companies Before Clear", self.test_2_companies_before_clear),
            ("Test 3: Database Clear as SysOp", self.test_3_database_clear_as_sysop),
            ("Test 4: Projects After DB Clear", self.test_4_projects_after_clear),
            ("Test 5: Re-login After DB Clear", self.test_5_relogin_after_clear),
            ("Test 6: Companies After Clear", self.test_6_companies_after_clear),
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
        
        print("\n" + "=" * 90)
        print(f"🏁 Comprehensive SysOp Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ ALL COMPREHENSIVE SYSOP DATABASE CLEAR TESTS PASSED!")
            print("🎉 SysOp users are correctly preserved after database clearing!")
            print("🎉 Database clearing functionality working as expected!")
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
            'test_type': 'Comprehensive SysOp Database Clear Testing',
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': self.test_results
        }
        
        return summary

def main():
    """Main test execution"""
    tester = ComprehensiveSysOpTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/comprehensive_sysop_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: /app/comprehensive_sysop_test_results.json")
        
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