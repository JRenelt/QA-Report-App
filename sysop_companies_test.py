#!/usr/bin/env python3
"""
SysOp Companies Access Test - Nach Backend Fix
Tests the specific fix for SysOp role having same company access as Admin
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://qa-report-fixer.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_CREDENTIALS = {"username": "admin_techco", "password": "admin123"}
SYSOP_CREDENTIALS = {"username": "jre", "password": "sysop123"}

class SysOpCompaniesTest:
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
    
    def login_user(self, credentials, role_name):
        """Login and get JWT token"""
        try:
            response = self.session.post(f"{API_BASE}/auth/login", 
                                       json=credentials, 
                                       timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('access_token')
                user_info = data.get('user', {})
                
                self.log_test(f"{role_name} Login", True, 
                            f"Login successful. User: {user_info.get('username')}, Role: {user_info.get('role')}")
                return token
            else:
                self.log_test(f"{role_name} Login", False, 
                            f"Login failed with status {response.status_code}", 
                            response.json() if response.content else None)
                return None
                
        except Exception as e:
            self.log_test(f"{role_name} Login", False, f"Login error: {str(e)}")
            return None
    
    def get_companies(self, token, role_name):
        """Get companies list with authentication"""
        try:
            headers = {'Authorization': f'Bearer {token}'}
            response = self.session.get(f"{API_BASE}/companies/", 
                                      headers=headers, 
                                      timeout=10)
            
            if response.status_code == 200:
                companies = response.json()
                company_count = len(companies)
                company_names = [comp.get('name', 'Unknown') for comp in companies]
                
                self.log_test(f"{role_name} Companies Access", True, 
                            f"Retrieved {company_count} companies: {', '.join(company_names)}")
                return companies
            else:
                self.log_test(f"{role_name} Companies Access", False, 
                            f"Companies access failed with status {response.status_code}", 
                            response.json() if response.content else None)
                return None
                
        except Exception as e:
            self.log_test(f"{role_name} Companies Access", False, f"Companies access error: {str(e)}")
            return None
    
    def run_sysop_companies_test(self):
        """Main test: SysOp should have same company access as Admin"""
        print("🇩🇪 GERMAN BACKEND RE-TEST: SysOp Companies Access nach Fix")
        print("=" * 70)
        
        # Test 1: SysOp Login
        print("\n📋 Test 1: SysOp Login (jre/sysop123)")
        sysop_token = self.login_user(SYSOP_CREDENTIALS, "SysOp")
        
        if not sysop_token:
            print("❌ SysOp Login failed - cannot continue with companies test")
            return False
        
        # Test 2: SysOp Companies Access (HAUPT-TEST)
        print("\n📋 Test 2: SysOp Companies Access (HAUPT-TEST)")
        sysop_companies = self.get_companies(sysop_token, "SysOp")
        
        # Test 3: Admin Login for comparison
        print("\n📋 Test 3: Admin Login für Vergleich")
        admin_token = self.login_user(ADMIN_CREDENTIALS, "Admin")
        
        if admin_token:
            print("\n📋 Test 4: Admin Companies Access für Vergleich")
            admin_companies = self.get_companies(admin_token, "Admin")
            
            # Compare results
            print("\n📊 VERGLEICH Admin vs SysOp:")
            if admin_companies and sysop_companies:
                admin_count = len(admin_companies)
                sysop_count = len(sysop_companies)
                
                print(f"   Admin Firmen: {admin_count}")
                print(f"   SysOp Firmen: {sysop_count}")
                
                if admin_count == sysop_count and admin_count == 6:
                    self.log_test("SysOp vs Admin Gleichberechtigung", True, 
                                f"✅ ERFOLG! Beide Rollen haben {admin_count} Firmen (erwartet: 6)")
                    return True
                elif sysop_count == 0:
                    self.log_test("SysOp vs Admin Gleichberechtigung", False, 
                                f"❌ BUG NICHT BEHOBEN! SysOp hat {sysop_count} Firmen, Admin hat {admin_count}")
                    return False
                else:
                    self.log_test("SysOp vs Admin Gleichberechtigung", False, 
                                f"❌ UNERWARTETES ERGEBNIS! SysOp: {sysop_count}, Admin: {admin_count}, erwartet: 6")
                    return False
        
        return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 70)
        print("📊 TEST ZUSAMMENFASSUNG:")
        print("=" * 70)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        for result in self.test_results:
            status = "✅" if result['success'] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        print(f"\n📈 ERGEBNIS: {passed}/{total} Tests bestanden")
        
        if passed == total:
            print("🎉 ALLE TESTS ERFOLGREICH - SysOp Companies Access Fix funktioniert!")
            return True
        else:
            print("⚠️  EINIGE TESTS FEHLGESCHLAGEN - Fix benötigt weitere Arbeit")
            return False

def main():
    """Run SysOp Companies Access test"""
    tester = SysOpCompaniesTest()
    
    try:
        success = tester.run_sysop_companies_test()
        final_success = tester.print_summary()
        
        # Exit with appropriate code
        sys.exit(0 if final_success else 1)
        
    except KeyboardInterrupt:
        print("\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()