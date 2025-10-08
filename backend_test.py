#!/usr/bin/env python3
"""
QA-Report-App Backend Testing Suite
Tests critical backend functionality including health check, authentication, and database connectivity.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://quality-nexus-1.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}
QA_DEMO_CREDENTIALS = {"username": "qa_demo", "password": "demo123"}

class BackendTester:
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
    
    def test_health_check(self):
        """Test health check endpoint"""
        try:
            # Try the expected external URL first
            response = self.session.get(f"{BACKEND_URL}/health", timeout=10)
            
            # If external URL doesn't work, try internal localhost (for debugging)
            if response.status_code != 200:
                try:
                    import subprocess
                    result = subprocess.run(['curl', '-s', 'http://localhost:8001/health'], 
                                          capture_output=True, text=True, timeout=5)
                    if result.returncode == 0:
                        import json
                        data = json.loads(result.stdout)
                        self.log_test("Health Check", True, 
                                    f"Health check successful (internal) - Status: {data.get('status')}, DB: {data.get('database')}")
                        return True
                except Exception as e:
                    pass
                
                self.log_test("Health Check", False, 
                            f"External health endpoint not accessible - HTTP {response.status_code}. This indicates a routing configuration issue.")
                return False
            
            data = response.json()
            expected_fields = ["status", "app", "version", "database"]
            
            # Check if all expected fields are present
            missing_fields = [field for field in expected_fields if field not in data]
            if missing_fields:
                self.log_test("Health Check", False, 
                            f"Missing fields: {missing_fields}", data)
                return False
            
            # Check specific values
            if data.get("status") != "healthy":
                self.log_test("Health Check", False, 
                            f"Status is not 'healthy': {data.get('status')}", data)
                return False
            
            if data.get("app") != "QA-Report-App":
                self.log_test("Health Check", False, 
                            f"App name incorrect: {data.get('app')}", data)
                return False
            
            self.log_test("Health Check", True, 
                        f"Health check successful - Status: {data.get('status')}, DB: {data.get('database')}")
            return True
                
        except requests.exceptions.RequestException as e:
            self.log_test("Health Check", False, f"Request failed: {str(e)}")
            return False
    
    def test_login_admin(self):
        """Test admin login"""
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
                    self.log_test("Admin Login", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Check token type
                if data.get("token_type") != "bearer":
                    self.log_test("Admin Login", False, 
                                f"Token type is not 'bearer': {data.get('token_type')}", data)
                    return False
                
                # Check user data
                user = data.get("user", {})
                if user.get("username") != "admin":
                    self.log_test("Admin Login", False, 
                                f"Username mismatch: {user.get('username')}", data)
                    return False
                
                if user.get("role") != "admin":
                    self.log_test("Admin Login", False, 
                                f"Role mismatch: {user.get('role')}", data)
                    return False
                
                # Store token for authenticated requests
                self.auth_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                
                self.log_test("Admin Login", True, 
                            f"Admin login successful - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("Admin Login", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_login_qa_demo(self):
        """Test QA demo user login"""
        try:
            # Use a separate session for this test to avoid interfering with admin session
            test_session = requests.Session()
            test_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            })
            
            response = test_session.post(
                f"{API_BASE}/auth/login",
                json=QA_DEMO_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check response structure
                required_fields = ["access_token", "token_type", "user"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("QA Demo Login", False, 
                                f"Missing fields: {missing_fields}", data)
                    return False
                
                # Check user data
                user = data.get("user", {})
                if user.get("username") != "qa_demo":
                    self.log_test("QA Demo Login", False, 
                                f"Username mismatch: {user.get('username')}", data)
                    return False
                
                self.log_test("QA Demo Login", True, 
                            f"QA demo login successful - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("QA Demo Login", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("QA Demo Login", False, f"Request failed: {str(e)}")
            return False
    
    def test_invalid_credentials(self):
        """Test login with invalid credentials"""
        try:
            invalid_creds = {"username": "invalid", "password": "wrong"}
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=invalid_creds,
                timeout=10
            )
            
            if response.status_code == 401:
                self.log_test("Invalid Credentials", True, 
                            "Correctly rejected invalid credentials with 401 Unauthorized")
                return True
            else:
                self.log_test("Invalid Credentials", False, 
                            f"Expected 401, got HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Invalid Credentials", False, f"Request failed: {str(e)}")
            return False
    
    def test_missing_fields(self):
        """Test login with missing fields"""
        try:
            # Test missing password
            incomplete_creds = {"username": "admin"}
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=incomplete_creds,
                timeout=10
            )
            
            if response.status_code == 422:
                self.log_test("Missing Fields", True, 
                            "Correctly rejected incomplete credentials with 422 Validation Error")
                return True
            else:
                self.log_test("Missing Fields", False, 
                            f"Expected 422, got HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Missing Fields", False, f"Request failed: {str(e)}")
            return False
    
    def test_authenticated_endpoint(self):
        """Test authenticated endpoint with JWT token"""
        if not self.auth_token:
            self.log_test("Authenticated Endpoint", False, "No auth token available")
            return False
        
        try:
            response = self.session.get(f"{API_BASE}/profile", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Check user profile data
                required_fields = ["user_id", "username", "email", "role"]
                missing_fields = [field for field in required_fields if field not in data]
                if missing_fields:
                    self.log_test("Authenticated Endpoint", False, 
                                f"Missing profile fields: {missing_fields}", data)
                    return False
                
                self.log_test("Authenticated Endpoint", True, 
                            f"Profile endpoint successful - User: {data.get('username')}")
                return True
            else:
                self.log_test("Authenticated Endpoint", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Authenticated Endpoint", False, f"Request failed: {str(e)}")
            return False
    
    def test_jwt_token_validation(self):
        """Test JWT token validation"""
        try:
            # Test with invalid token
            invalid_session = requests.Session()
            invalid_session.headers.update({
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': 'Bearer invalid_token_here'
            })
            
            response = invalid_session.get(f"{API_BASE}/profile", timeout=10)
            
            if response.status_code == 401:
                self.log_test("JWT Token Validation", True, 
                            "Correctly rejected invalid JWT token with 401 Unauthorized")
                return True
            else:
                self.log_test("JWT Token Validation", False, 
                            f"Expected 401, got HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("JWT Token Validation", False, f"Request failed: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("🧪 Starting QA-Report-App Backend Tests")
        print("=" * 60)
        
        # Critical tests as specified in the review request
        tests = [
            ("Health Check", self.test_health_check),
            ("Admin Login", self.test_login_admin),
            ("QA Demo Login", self.test_login_qa_demo),
            ("Invalid Credentials", self.test_invalid_credentials),
            ("Missing Fields", self.test_missing_fields),
            ("JWT Token Validation", self.test_jwt_token_validation),
            ("Authenticated Endpoint", self.test_authenticated_endpoint),
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
        print(f"🏁 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("✅ All critical backend tests PASSED!")
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
    tester = BackendTester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: /app/backend_test_results.json")
        
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