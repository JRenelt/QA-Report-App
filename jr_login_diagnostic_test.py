#!/usr/bin/env python3
"""
JR Login Diagnostic Test
DRINGEND: Login-Problem diagnostizieren für User "JR" mit Passwort "3r7k03nI9"
"""

import requests
import json
import sys
import subprocess
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://qa-report-v2.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

class JRLoginDiagnostic:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        
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
    
    def test_admin_login_baseline(self):
        """Test admin/admin123 login as baseline (should work)"""
        try:
            credentials = {"username": "admin", "password": "admin123"}
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=credentials,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                self.log_test("Admin Login Baseline", True, 
                            f"Admin login successful - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("Admin Login Baseline", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("Admin Login Baseline", False, f"Request failed: {str(e)}")
            return False
    
    def test_jr_login_uppercase(self):
        """Test JR/3r7k03nI9 login (uppercase JR)"""
        try:
            credentials = {"username": "JR", "password": "3r7k03nI9"}
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=credentials,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                self.log_test("JR Login (Uppercase)", True, 
                            f"JR login successful - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("JR Login (Uppercase)", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("JR Login (Uppercase)", False, f"Request failed: {str(e)}")
            return False
    
    def test_jr_login_lowercase(self):
        """Test jr/3r7k03nI9 login (lowercase jr)"""
        try:
            credentials = {"username": "jr", "password": "3r7k03nI9"}
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=credentials,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user", {})
                self.log_test("JR Login (Lowercase)", True, 
                            f"jr login successful - User: {user.get('username')}, Role: {user.get('role')}")
                return True
            else:
                self.log_test("JR Login (Lowercase)", False, 
                            f"HTTP {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.log_test("JR Login (Lowercase)", False, f"Request failed: {str(e)}")
            return False
    
    def check_mongodb_users_v2(self):
        """Check MongoDB users_v2 collection directly"""
        try:
            # Use MongoDB shell to check users_v2 collection
            mongo_cmd = [
                'mongosh', 
                'mongodb://localhost:27017/qa_report_db',
                '--eval',
                'db.users_v2.find({}, {username: 1, is_active: 1, is_blocked: 1, role: 1}).pretty()'
            ]
            
            result = subprocess.run(mongo_cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                output = result.stdout
                self.log_test("MongoDB users_v2 Check", True, 
                            f"MongoDB query successful. Output:\n{output}")
                
                # Check if JR user exists in output
                if "JR" in output or "jr" in output:
                    self.log_test("JR User Exists in MongoDB", True, 
                                "JR user found in users_v2 collection")
                else:
                    self.log_test("JR User Exists in MongoDB", False, 
                                "JR user NOT found in users_v2 collection")
                return True
            else:
                self.log_test("MongoDB users_v2 Check", False, 
                            f"MongoDB query failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("MongoDB users_v2 Check", False, f"MongoDB check failed: {str(e)}")
            return False
    
    def check_mongodb_all_users(self):
        """Check all users in both collections"""
        try:
            # Check users_v2 collection
            mongo_cmd_v2 = [
                'mongosh', 
                'mongodb://localhost:27017/qa_report_db',
                '--eval',
                'print("=== USERS_V2 COLLECTION ==="); db.users_v2.find({}).forEach(function(doc) { print("Username: " + doc.username + ", Active: " + doc.is_active + ", Blocked: " + doc.is_blocked + ", Role: " + doc.role); });'
            ]
            
            result_v2 = subprocess.run(mongo_cmd_v2, capture_output=True, text=True, timeout=10)
            
            # Check users collection (old)
            mongo_cmd_old = [
                'mongosh', 
                'mongodb://localhost:27017/qa_report_db',
                '--eval',
                'print("=== USERS COLLECTION (OLD) ==="); db.users.find({}).forEach(function(doc) { print("Username: " + doc.username + ", Active: " + doc.is_active + ", Role: " + doc.role); });'
            ]
            
            result_old = subprocess.run(mongo_cmd_old, capture_output=True, text=True, timeout=10)
            
            combined_output = f"V2 Collection:\n{result_v2.stdout}\n\nOld Collection:\n{result_old.stdout}"
            
            if result_v2.returncode == 0 or result_old.returncode == 0:
                self.log_test("MongoDB All Users Check", True, 
                            f"MongoDB collections checked:\n{combined_output}")
                return True
            else:
                self.log_test("MongoDB All Users Check", False, 
                            f"MongoDB queries failed: V2={result_v2.stderr}, Old={result_old.stderr}")
                return False
                
        except Exception as e:
            self.log_test("MongoDB All Users Check", False, f"MongoDB check failed: {str(e)}")
            return False
    
    def test_curl_jr_uppercase(self):
        """Test JR login using curl directly"""
        try:
            curl_cmd = [
                'curl', '-X', 'POST',
                f'{API_BASE}/auth/login',
                '-H', 'Content-Type: application/json',
                '-d', '{"username": "JR", "password": "3r7k03nI9"}',
                '-w', '\\nHTTP_CODE:%{http_code}\\n',
                '-s'
            ]
            
            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                output = result.stdout
                if "HTTP_CODE:200" in output:
                    self.log_test("Curl JR Login (Uppercase)", True, 
                                f"Curl login successful:\n{output}")
                    return True
                else:
                    self.log_test("Curl JR Login (Uppercase)", False, 
                                f"Curl login failed:\n{output}")
                    return False
            else:
                self.log_test("Curl JR Login (Uppercase)", False, 
                            f"Curl command failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Curl JR Login (Uppercase)", False, f"Curl test failed: {str(e)}")
            return False
    
    def test_curl_jr_lowercase(self):
        """Test jr login using curl directly"""
        try:
            curl_cmd = [
                'curl', '-X', 'POST',
                f'{API_BASE}/auth/login',
                '-H', 'Content-Type: application/json',
                '-d', '{"username": "jr", "password": "3r7k03nI9"}',
                '-w', '\\nHTTP_CODE:%{http_code}\\n',
                '-s'
            ]
            
            result = subprocess.run(curl_cmd, capture_output=True, text=True, timeout=10)
            
            if result.returncode == 0:
                output = result.stdout
                if "HTTP_CODE:200" in output:
                    self.log_test("Curl JR Login (Lowercase)", True, 
                                f"Curl login successful:\n{output}")
                    return True
                else:
                    self.log_test("Curl JR Login (Lowercase)", False, 
                                f"Curl login failed:\n{output}")
                    return False
            else:
                self.log_test("Curl JR Login (Lowercase)", False, 
                            f"Curl command failed: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Curl JR Login (Lowercase)", False, f"Curl test failed: {str(e)}")
            return False
    
    def check_backend_logs(self):
        """Check backend logs for authentication errors"""
        try:
            # Check supervisor backend logs
            log_cmd = ['tail', '-n', '50', '/var/log/supervisor/backend.err.log']
            result = subprocess.run(log_cmd, capture_output=True, text=True, timeout=5)
            
            if result.returncode == 0:
                logs = result.stdout
                self.log_test("Backend Error Logs", True, 
                            f"Backend error logs (last 50 lines):\n{logs}")
                return True
            else:
                self.log_test("Backend Error Logs", False, 
                            f"Could not read backend logs: {result.stderr}")
                return False
                
        except Exception as e:
            self.log_test("Backend Error Logs", False, f"Log check failed: {str(e)}")
            return False
    
    def run_diagnostic(self):
        """Run complete JR login diagnostic"""
        print("🔍 JR LOGIN DIAGNOSTIC TEST")
        print("DRINGEND: Login-Problem diagnostizieren für User JR/3r7k03nI9")
        print("=" * 80)
        
        # Run all diagnostic tests
        tests = [
            ("1. Admin Login Baseline (admin/admin123)", self.test_admin_login_baseline),
            ("2. JR Login Test (JR/3r7k03nI9)", self.test_jr_login_uppercase),
            ("3. JR Login Test (jr/3r7k03nI9)", self.test_jr_login_lowercase),
            ("4. Curl JR Login Test (JR/3r7k03nI9)", self.test_curl_jr_uppercase),
            ("5. Curl JR Login Test (jr/3r7k03nI9)", self.test_curl_jr_lowercase),
            ("6. MongoDB users_v2 Collection Check", self.check_mongodb_users_v2),
            ("7. MongoDB All Users Check", self.check_mongodb_all_users),
            ("8. Backend Error Logs Check", self.check_backend_logs),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            try:
                if test_func():
                    passed += 1
            except Exception as e:
                self.log_test(test_name, False, f"Test execution error: {str(e)}")
        
        print("\n" + "=" * 80)
        print(f"🏁 Diagnostic Results: {passed}/{total} tests completed")
        
        # Analyze results
        print("\n📋 DIAGNOSTIC SUMMARY:")
        print("=" * 40)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}")
            if not result['success']:
                print(f"   └─ {result['message']}")
        
        return self.test_results

def main():
    """Main diagnostic execution"""
    diagnostic = JRLoginDiagnostic()
    
    try:
        results = diagnostic.run_diagnostic()
        
        # Save detailed results
        with open('/app/jr_login_diagnostic_results.json', 'w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: /app/jr_login_diagnostic_results.json")
        
        return 0
        
    except KeyboardInterrupt:
        print("\n⚠️  Diagnostic interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Diagnostic execution failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())