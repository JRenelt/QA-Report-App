#!/usr/bin/env python3
"""
SysOp Permissions Analysis
Analyzes the SysOp role permissions issue in the Companies API
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://qa-report-fixer.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
SYSOP_CREDENTIALS = {"username": "jre", "password": "sysop123"}
ADMIN_CREDENTIALS = {"username": "admin_techco", "password": "admin123"}

def analyze_sysop_permissions():
    """Analyze SysOp permissions vs Admin permissions"""
    print("🔍 SYSOP PERMISSIONS ANALYSIS")
    print("=" * 60)
    
    session = requests.Session()
    session.headers.update({
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    })
    
    # Test SysOp login
    print("1. Testing SysOp Login...")
    sysop_response = session.post(f"{API_BASE}/auth/login", json=SYSOP_CREDENTIALS, timeout=10)
    
    if sysop_response.status_code == 200:
        sysop_data = sysop_response.json()
        sysop_token = sysop_data.get("access_token")
        sysop_user = sysop_data.get("user", {})
        print(f"   ✅ SysOp login successful - Role: {sysop_user.get('role')}")
        
        # Test Admin login
        print("2. Testing Admin Login...")
        admin_response = session.post(f"{API_BASE}/auth/login", json=ADMIN_CREDENTIALS, timeout=10)
        
        if admin_response.status_code == 200:
            admin_data = admin_response.json()
            admin_token = admin_data.get("access_token")
            admin_user = admin_data.get("user", {})
            print(f"   ✅ Admin login successful - Role: {admin_user.get('role')}")
            
            # Compare API access
            print("\n3. Comparing API Access...")
            
            endpoints_to_test = [
                ("/companies/", "Companies API"),
                ("/projects/", "Projects API"),
                ("/users/", "Users API"),
            ]
            
            for endpoint, name in endpoints_to_test:
                print(f"\n   Testing {name} ({endpoint}):")
                
                # Test with SysOp token
                sysop_session = requests.Session()
                sysop_session.headers.update({
                    'Authorization': f'Bearer {sysop_token}',
                    'Content-Type': 'application/json'
                })
                
                sysop_resp = sysop_session.get(f"{API_BASE}{endpoint}", timeout=10)
                
                # Test with Admin token
                admin_session = requests.Session()
                admin_session.headers.update({
                    'Authorization': f'Bearer {admin_token}',
                    'Content-Type': 'application/json'
                })
                
                admin_resp = admin_session.get(f"{API_BASE}{endpoint}", timeout=10)
                
                # Compare results
                if sysop_resp.status_code == 200 and admin_resp.status_code == 200:
                    sysop_data = sysop_resp.json()
                    admin_data = admin_resp.json()
                    
                    sysop_count = len(sysop_data) if isinstance(sysop_data, list) else "N/A"
                    admin_count = len(admin_data) if isinstance(admin_data, list) else "N/A"
                    
                    if sysop_count == admin_count:
                        print(f"      ✅ EQUAL ACCESS: SysOp={sysop_count}, Admin={admin_count}")
                    else:
                        print(f"      ❌ UNEQUAL ACCESS: SysOp={sysop_count}, Admin={admin_count}")
                        print(f"         🐛 BUG IDENTIFIED: SysOp should have same access as Admin")
                        
                        if endpoint == "/companies/":
                            print(f"         📋 SysOp companies: {[c.get('name', 'Unknown') for c in sysop_data] if isinstance(sysop_data, list) else 'Error'}")
                            print(f"         📋 Admin companies: {[c.get('name', 'Unknown') for c in admin_data] if isinstance(admin_data, list) else 'Error'}")
                else:
                    print(f"      ❌ API ERROR: SysOp={sysop_resp.status_code}, Admin={admin_resp.status_code}")
            
            print("\n4. ROOT CAUSE ANALYSIS:")
            print("   📁 File: /app/backend/routes/companies.py")
            print("   🐛 Issue: Line 19 only checks for role == 'admin'")
            print("   💡 Solution: Should also check for role == 'sysop'")
            print("   📝 Evidence: auth.py line 104 states 'SysOp hat ALLE Admin-Rechte'")
            
            print("\n5. RECOMMENDED FIX:")
            print("   Change line 19 in companies.py from:")
            print("      if current_user.role == \"admin\":")
            print("   To:")
            print("      if current_user.role in [\"admin\", \"sysop\"]:")
            
        else:
            print(f"   ❌ Admin login failed: {admin_response.status_code}")
    else:
        print(f"   ❌ SysOp login failed: {sysop_response.status_code}")

if __name__ == "__main__":
    analyze_sysop_permissions()