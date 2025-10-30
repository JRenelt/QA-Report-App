#!/usr/bin/env python3
"""
Backend Test für V2 Komplett-Projekt Import Funktionalität
Testet POST /api/v2/import/project-complete Endpoint

Test-Szenarien:
1. Neues Projekt importieren
2. Existierendes Projekt aktualisieren  
3. Neue Testfälle hinzufügen
"""

import requests
import json
import os
from pathlib import Path

# Backend URL aus Frontend .env lesen
def get_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "https://qa-report-v2.preview.emergentagent.com"

BASE_URL = get_backend_url()
API_URL = f"{BASE_URL}/api"

print(f"🔗 Testing Backend: {API_URL}")

class TestCompleteProjectImport:
    def __init__(self):
        self.auth_token = None
        self.company_id = None
        
    def login_sysop(self):
        """Login als SysOp (JR / 3r7k03nI9)"""
        print("\n🔐 Login als SysOp...")
        
        login_data = {
            "username": "JR",
            "password": "3r7k03nI9"
        }
        
        response = requests.post(f"{API_URL}/auth/login", json=login_data)
        print(f"Login Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            self.auth_token = data.get("access_token")
            print(f"✅ SysOp Login erfolgreich")
            print(f"   User: {data.get('user', {}).get('username')}")
            print(f"   Role: {data.get('user', {}).get('role')}")
            return True
        else:
            print(f"❌ SysOp Login fehlgeschlagen: {response.text}")
            return False
    
    def get_headers(self):
        """Auth Headers für API Calls"""
        return {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }
    
    def get_id2_company_id(self):
        """Hole company_id von "ID2.de" """
        print("\n🏢 Suche ID2.de Company...")
        
        response = requests.get(f"{API_URL}/companies-v2/", headers=self.get_headers())
        print(f"Companies Response: {response.status_code}")
        
        if response.status_code == 200:
            companies = response.json()
            print(f"   Gefundene Firmen: {len(companies)}")
            
            for company in companies:
                print(f"   - {company.get('name')} (ID: {company.get('id')})")
                if company.get("name") == "ID2.de":
                    self.company_id = company.get("id")
                    print(f"✅ ID2.de gefunden: {self.company_id}")
                    return True
            
            print("❌ ID2.de nicht gefunden")
            return False
        else:
            print(f"❌ Companies API Fehler: {response.text}")
            return False
    
    def test_scenario_1_new_project(self):
        """Test-Szenario 1: Neues Projekt importieren"""
        print("\n📋 TEST SZENARIO 1: Neues Projekt importieren")
        
        # Test-Datei laden
        test_file_path = "/app/test_complete_project.json"
        if not os.path.exists(test_file_path):
            print(f"❌ Test-Datei nicht gefunden: {test_file_path}")
            return False
        
        with open(test_file_path, 'rb') as f:
            files = {'file': ('test_complete_project.json', f, 'application/json')}
            data = {'company_id': self.company_id}
            
            response = requests.post(
                f"{API_URL}/v2/import/project-complete",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
        
        print(f"Import Response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Import erfolgreich")
            print(f"   Success: {result.get('success')}")
            print(f"   Project Action: {result.get('project', {}).get('action')}")
            print(f"   Project Title: {result.get('project', {}).get('title')}")
            print(f"   Test Cases Imported: {result.get('test_cases', {}).get('imported')}")
            print(f"   Test Cases Skipped: {result.get('test_cases', {}).get('skipped')}")
            print(f"   Message: {result.get('message')}")
            
            # Erwartete Werte prüfen
            expected_checks = [
                (result.get('success'), True, "success: true"),
                (result.get('project', {}).get('action'), "created", "project.action: 'created'"),
                (result.get('test_cases', {}).get('imported'), 3, "test_cases.imported: 3"),
                (result.get('test_cases', {}).get('skipped'), 0, "test_cases.skipped: 0")
            ]
            
            all_passed = True
            for actual, expected, description in expected_checks:
                if actual == expected:
                    print(f"   ✅ {description}")
                else:
                    print(f"   ❌ {description} - Erwartet: {expected}, Erhalten: {actual}")
                    all_passed = False
            
            return all_passed
        else:
            print(f"❌ Import fehlgeschlagen: {response.text}")
            return False
    
    def test_scenario_2_existing_project(self):
        """Test-Szenario 2: Existierendes Projekt aktualisieren"""
        print("\n📋 TEST SZENARIO 2: Existierendes Projekt aktualisieren")
        
        # Dieselbe Datei nochmal importieren
        test_file_path = "/app/test_complete_project.json"
        
        with open(test_file_path, 'rb') as f:
            files = {'file': ('test_complete_project.json', f, 'application/json')}
            data = {'company_id': self.company_id}
            
            response = requests.post(
                f"{API_URL}/v2/import/project-complete",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
        
        print(f"Import Response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Import erfolgreich")
            print(f"   Success: {result.get('success')}")
            print(f"   Project Action: {result.get('project', {}).get('action')}")
            print(f"   Test Cases Imported: {result.get('test_cases', {}).get('imported')}")
            print(f"   Test Cases Skipped: {result.get('test_cases', {}).get('skipped')}")
            print(f"   Message: {result.get('message')}")
            
            # Erwartete Werte prüfen
            expected_checks = [
                (result.get('project', {}).get('action'), "updated", "project.action: 'updated'"),
                (result.get('test_cases', {}).get('skipped'), 3, "test_cases.skipped: 3 (Duplikate)"),
                (result.get('test_cases', {}).get('imported'), 0, "test_cases.imported: 0")
            ]
            
            all_passed = True
            for actual, expected, description in expected_checks:
                if actual == expected:
                    print(f"   ✅ {description}")
                else:
                    print(f"   ❌ {description} - Erwartet: {expected}, Erhalten: {actual}")
                    all_passed = False
            
            return all_passed
        else:
            print(f"❌ Import fehlgeschlagen: {response.text}")
            return False
    
    def test_scenario_3_new_test_cases(self):
        """Test-Szenario 3: Neue Testfälle hinzufügen"""
        print("\n📋 TEST SZENARIO 3: Neue Testfälle hinzufügen")
        
        # Neue JSON mit zusätzlichen Testfällen erstellen
        extended_project_data = {
            "project": {
                "title": "Test Komplett-Import",
                "description": "Dies ist ein Test für den kompletten Projekt-Import - Erweitert",
                "notes": "Testnotizen für Import-Funktion - Erweitert"
            },
            "test_cases": [
                # Ursprüngliche Testfälle (sollten übersprungen werden)
                {
                    "name": "Login Test",
                    "area": "Authentifizierung",
                    "description": "Benutzer kann sich einloggen",
                    "priority": 1,
                    "expected_result": "Erfolgreicher Login",
                    "status": "pending"
                },
                {
                    "name": "Dashboard Test",
                    "area": "UI/UX",
                    "description": "Dashboard wird angezeigt",
                    "priority": 1,
                    "expected_result": "Dashboard sichtbar",
                    "status": "pending"
                },
                {
                    "name": "Navigation Test",
                    "area": "UI/UX",
                    "description": "Navigation funktioniert",
                    "priority": 2,
                    "expected_result": "Alle Links funktionieren",
                    "status": "pending"
                },
                # Neue Testfälle (sollten importiert werden)
                {
                    "name": "Logout Test",
                    "area": "Authentifizierung",
                    "description": "Benutzer kann sich ausloggen",
                    "priority": 1,
                    "expected_result": "Erfolgreicher Logout",
                    "status": "pending"
                },
                {
                    "name": "Settings Test",
                    "area": "Konfiguration",
                    "description": "Einstellungen können geändert werden",
                    "priority": 2,
                    "expected_result": "Einstellungen gespeichert",
                    "status": "pending"
                }
            ]
        }
        
        # Temporäre Datei erstellen
        temp_file_path = "/app/test_extended_project.json"
        with open(temp_file_path, 'w', encoding='utf-8') as f:
            json.dump(extended_project_data, f, ensure_ascii=False, indent=2)
        
        # Import durchführen
        with open(temp_file_path, 'rb') as f:
            files = {'file': ('test_extended_project.json', f, 'application/json')}
            data = {'company_id': self.company_id}
            
            response = requests.post(
                f"{API_URL}/v2/import/project-complete",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {self.auth_token}"}
            )
        
        # Temporäre Datei löschen
        os.remove(temp_file_path)
        
        print(f"Import Response: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Import erfolgreich")
            print(f"   Success: {result.get('success')}")
            print(f"   Project Action: {result.get('project', {}).get('action')}")
            print(f"   Test Cases Imported: {result.get('test_cases', {}).get('imported')}")
            print(f"   Test Cases Skipped: {result.get('test_cases', {}).get('skipped')}")
            print(f"   Test Cases Total: {result.get('test_cases', {}).get('total')}")
            print(f"   Message: {result.get('message')}")
            
            # Erwartete Werte prüfen
            expected_checks = [
                (result.get('project', {}).get('action'), "updated", "project.action: 'updated'"),
                (result.get('test_cases', {}).get('imported'), 2, "test_cases.imported: 2 (neue Testfälle)"),
                (result.get('test_cases', {}).get('skipped'), 3, "test_cases.skipped: 3 (alte Testfälle)"),
                (result.get('test_cases', {}).get('total'), 5, "test_cases.total: 5")
            ]
            
            all_passed = True
            for actual, expected, description in expected_checks:
                if actual == expected:
                    print(f"   ✅ {description}")
                else:
                    print(f"   ❌ {description} - Erwartet: {expected}, Erhalten: {actual}")
                    all_passed = False
            
            return all_passed
        else:
            print(f"❌ Import fehlgeschlagen: {response.text}")
            return False
    
    def run_all_tests(self):
        """Führe alle Tests aus"""
        print("🚀 STARTE V2 KOMPLETT-PROJEKT IMPORT TESTS")
        print("=" * 60)
        
        # Login
        if not self.login_sysop():
            return False
        
        # Company ID holen
        if not self.get_id2_company_id():
            return False
        
        # Tests ausführen
        test_results = []
        
        test_results.append(("Szenario 1: Neues Projekt", self.test_scenario_1_new_project()))
        test_results.append(("Szenario 2: Existierendes Projekt", self.test_scenario_2_existing_project()))
        test_results.append(("Szenario 3: Neue Testfälle", self.test_scenario_3_new_test_cases()))
        
        # Zusammenfassung
        print("\n" + "=" * 60)
        print("📊 TEST ZUSAMMENFASSUNG")
        print("=" * 60)
        
        passed = 0
        total = len(test_results)
        
        for test_name, result in test_results:
            status = "✅ BESTANDEN" if result else "❌ FEHLGESCHLAGEN"
            print(f"{test_name}: {status}")
            if result:
                passed += 1
        
        print(f"\nErgebnis: {passed}/{total} Tests bestanden")
        
        if passed == total:
            print("🎉 ALLE TESTS ERFOLGREICH!")
            return True
        else:
            print("⚠️  EINIGE TESTS FEHLGESCHLAGEN!")
            return False

if __name__ == "__main__":
    tester = TestCompleteProjectImport()
    success = tester.run_all_tests()
    
    if success:
        print("\n✅ V2 Komplett-Projekt Import Funktionalität arbeitet korrekt!")
    else:
        print("\n❌ V2 Komplett-Projekt Import Funktionalität hat Probleme!")