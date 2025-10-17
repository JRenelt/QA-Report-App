#!/usr/bin/env python3
"""
German Review Request: SysOp Login und Company Management Testing
Tests the two critical issues mentioned in the German review request.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://qa-report-fixer.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials as specified in the German review request
SYSOP_CREDENTIALS = {"username": "jre", "password": "sysop123"}
ADMIN_CREDENTIALS = {"username": "admin_techco", "password": "admin123"}

class GermanSysOpCompaniesTest:
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
    
    def test_sysop_login(self):
        """Test SysOp login with jre/sysop123 credentials"""
        print("\n🔐 Testing SysOp Login (jre/sysop123)...")
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
                    self.log_test("SysOp Login", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Check token type
                if data.get("token_type") != "bearer":
                    self.log_test("SysOp Login", False, 
                                f"Token type is not 'bearer': {data.get('token_type')}", data)
                    return False
                
                # Check user data
                user = data.get("user", {})
                if user.get("username") != "jre":
                    self.log_test("SysOp Login", False, 
                                f"Username mismatch: {user.get('username')}", data)
                    return False
                
                if user.get("role") != "sysop":
                    self.log_test("SysOp Login", False, 
                                f"Role mismatch - expected 'sysop', got: {user.get('role')}", data)
                    return False
                
                # Store token for authenticated requests
                self.sysop_token = data.get("access_token")
                
                self.log_test("SysOp Login", True, 
                            f"✅ SysOp login SUCCESSFUL - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("SysOp Login", False, 
                            f"❌ SysOp login FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("SysOp Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_admin_login_comparison(self):
        """Test admin login for comparison (should work according to test_result.md)"""
        print("\n🔐 Testing Admin Login (admin_techco/admin123) for comparison...")
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=ADMIN_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["access_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("Admin Login Comparison", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Check user data
                user = data.get("user", {})
                if user.get("username") != "admin_techco":
                    self.log_test("Admin Login Comparison", False, 
                                f"Username mismatch: {user.get('username')}", data)
                    return False
                
                # Store token for authenticated requests
                self.admin_token = data.get("access_token")
                
                self.log_test("Admin Login Comparison", True, 
                            f"✅ Admin login SUCCESSFUL - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("Admin Login Comparison", False, 
                            f"❌ Admin login FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Login Comparison", False, f"Request failed: {str(e)}")
            return False
    
    def test_companies_api_with_sysop(self):
        """Test Companies API with SysOp authentication"""
        if not self.sysop_token:
            self.log_test("Companies API (SysOp)", False, "No SysOp auth token available")
            return False
        
        print("\n🏢 Testing Companies API with SysOp token...")
        try:
            # Create session with SysOp token
            sysop_session = requests.Session()
            sysop_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {self.sysop_token}'
            })
            
            response = sysop_session.get(f"{API_BASE}/companies/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Expected companies from German review request
                expected_companies = [
                    "ID2.de", "TechCorp GmbH", "MediaDesign AG", 
                    "AutoParts Solutions", "HealthCare Systems", "FinTech Innovations"
                ]
                
                if isinstance(data, list):
                    company_count = len(data)
                    
                    if company_count == 6:
                        # Check if we can find the expected company names
                        company_names = [company.get('name', '') for company in data if isinstance(company, dict)]
                        
                        self.log_test("Companies API (SysOp)", True, 
                                    f"✅ Companies API SUCCESSFUL - Found {company_count} companies: {company_names}")
                        
                        # Log detailed company information
                        print("   📋 Company Details:")
                        for i, company in enumerate(data, 1):
                            if isinstance(company, dict):
                                print(f"      {i}. {company.get('name', 'Unknown')} (ID: {company.get('id', 'N/A')})")
                        
                        return True
                    else:
                        self.log_test("Companies API (SysOp)", False, 
                                    f"❌ Expected 6 companies, found {company_count} companies", data)
                        return False
                else:
                    self.log_test("Companies API (SysOp)", False, 
                                f"❌ Expected array of companies, got: {type(data)}", data)
                    return False
            else:
                self.log_test("Companies API (SysOp)", False, 
                            f"❌ Companies API FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Companies API (SysOp)", False, f"Request failed: {str(e)}")
            return False
    
    def test_companies_api_with_admin(self):
        """Test Companies API with Admin authentication for comparison"""
        if not self.admin_token:
            self.log_test("Companies API (Admin)", False, "No Admin auth token available")
            return False
        
        print("\n🏢 Testing Companies API with Admin token for comparison...")
        try:
            # Create session with Admin token
            admin_session = requests.Session()
            admin_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': f'Bearer {self.admin_token}'
            })
            
            response = admin_session.get(f"{API_BASE}/companies/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                if isinstance(data, list):
                    company_count = len(data)
                    company_names = [company.get('name', '') for company in data if isinstance(company, dict)]
                    
                    self.log_test("Companies API (Admin)", True, 
                                f"✅ Companies API (Admin) SUCCESSFUL - Found {company_count} companies: {company_names}")
                    return True
                else:
                    self.log_test("Companies API (Admin)", False, 
                                f"❌ Expected array of companies, got: {type(data)}", data)
                    return False
            else:
                self.log_test("Companies API (Admin)", False, 
                            f"❌ Companies API (Admin) FAILED - HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Companies API (Admin)", False, f"Request failed: {str(e)}")
            return False
    
    def test_curl_commands_verification(self):
        """Verify the exact curl commands from the German review request"""
        print("\n🔧 Verifying curl commands from German review request...")
        
        # Test 1: SysOp Login curl command
        print("   Testing: curl -X POST .../api/auth/login with jre/sysop123")
        try:
            response = requests.post(
                f"{API_BASE}/auth/login",
                headers={'Content-Type': 'application/json'},
                json=SYSOP_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                
                if token:
                    print(f"   ✅ SysOp login curl command works - Token received")
                    
                    # Test 2: Companies API curl command with token
                    print("   Testing: curl -X GET .../api/companies/ with Bearer token")
                    companies_response = requests.get(
                        f"{API_BASE}/companies/",
                        headers={
                            'Authorization': f'Bearer {token}',
                            'Content-Type': 'application/json'
                        },
                        timeout=10
                    )
                    
                    if companies_response.status_code == 200:
                        companies_data = companies_response.json()
                        if isinstance(companies_data, list) and len(companies_data) == 6:
                            self.log_test("Curl Commands Verification", True, 
                                        f"✅ Both curl commands work correctly - 6 companies found")
                            return True
                        else:
                            self.log_test("Curl Commands Verification", False, 
                                        f"❌ Companies curl command: Expected 6 companies, got {len(companies_data) if isinstance(companies_data, list) else 'non-array'}")
                            return False
                    else:
                        self.log_test("Curl Commands Verification", False, 
                                    f"❌ Companies curl command failed: HTTP {companies_response.status_code}")
                        return False
                else:
                    self.log_test("Curl Commands Verification", False, 
                                "❌ SysOp login curl command: No access_token in response")
                    return False
            else:
                self.log_test("Curl Commands Verification", False, 
                            f"❌ SysOp login curl command failed: HTTP {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Curl Commands Verification", False, f"Request failed: {str(e)}")
            return False
    
    def run_german_tests(self):
        """Run the specific German review request tests"""
        print("🇩🇪 GERMAN REVIEW REQUEST: SysOp Login und Company Management Testing")
        print("=" * 80)
        print("Testing the two critical issues:")
        print("1. SysOp Login Test (jre/sysop123) - should now work")
        print("2. Companies API Test - should return 6 companies")
        print("=" * 80)
        
        tests = [
            ("1. SysOp Login Test", self.test_sysop_login),
            ("2. Admin Login Comparison", self.test_admin_login_comparison),
            ("3. Companies API (SysOp)", self.test_companies_api_with_sysop),
            ("4. Companies API (Admin)", self.test_companies_api_with_admin),
            ("5. Curl Commands Verification", self.test_curl_commands_verification),
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
        print(f"🏁 German Review Test Results: {passed}/{total} tests passed")
        
        # Detailed analysis
        print("\n📊 DETAILED ANALYSIS:")
        
        sysop_login_success = any(r['success'] for r in self.test_results if 'SysOp Login' in r['test'])
        companies_api_success = any(r['success'] for r in self.test_results if 'Companies API (SysOp)' in r['test'])
        
        if sysop_login_success:
            print("✅ ISSUE 1 RESOLVED: SysOp login (jre/sysop123) now works correctly")
        else:
            print("❌ ISSUE 1 PERSISTS: SysOp login (jre/sysop123) still fails with 401 error")
        
        if companies_api_success:
            print("✅ ISSUE 2 RESOLVED: Companies API returns 6 companies as expected")
        else:
            print("❌ ISSUE 2 PERSISTS: Companies API does not return the expected 6 companies")
        
        if passed == total:
            print("\n🎉 ALL GERMAN REVIEW ISSUES RESOLVED!")
        else:
            print(f"\n⚠️  {total - passed} issues still need attention")
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
            'results': self.test_results,
            'german_review_focus': {
                'sysop_login_resolved': any(r['success'] for r in self.test_results if 'SysOp Login' in r['test']),
                'companies_api_resolved': any(r['success'] for r in self.test_results if 'Companies API (SysOp)' in r['test'])
            }
        }
        
        return summary

def main():
    """Main test execution"""
    tester = GermanSysOpCompaniesTest()
    
    try:
        success = tester.run_german_tests()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/german_sysop_companies_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: /app/german_sysop_companies_test_results.json")
        
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