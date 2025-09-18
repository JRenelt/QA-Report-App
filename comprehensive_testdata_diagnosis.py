#!/usr/bin/env python3
"""
FavOrg Comprehensive Testdaten-Diagnose
Umfassende Diagnose der Testdaten-Erstellung um die Frontend-Fehlermeldung zu verstehen

PROBLEM: Frontend zeigt "Fehler beim Erstellen der Testdaten" Toast-Nachricht
ZIEL: Identifiziere die genaue Ursache des Frontend-Fehlers
"""

import requests
import sys
import json
import time
from datetime import datetime

def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    url = line.split('=', 1)[1].strip()
                    return f"{url}/api"
        return "http://localhost:8001/api"
    except:
        return "http://localhost:8001/api"

def comprehensive_testdata_diagnosis():
    """
    Umfassende Diagnose der Testdaten-Erstellung
    """
    BACKEND_URL = get_backend_url()
    print(f"🔗 Backend URL: {BACKEND_URL}")
    
    print("\n" + "="*80)
    print("🔍 COMPREHENSIVE TESTDATEN-DIAGNOSE")
    print("="*80)
    
    diagnosis_results = {
        "backend_status": "unknown",
        "api_endpoints": [],
        "error_scenarios": [],
        "success_scenarios": [],
        "potential_issues": []
    }
    
    # 1. Backend Gesundheitscheck
    print("\n1️⃣ Backend Gesundheitscheck...")
    try:
        health_response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=10)
        if health_response.status_code == 200:
            diagnosis_results["backend_status"] = "healthy"
            print("✅ Backend ist erreichbar und funktionsfähig")
        else:
            diagnosis_results["backend_status"] = "unhealthy"
            print(f"⚠️ Backend antwortet mit Status: {health_response.status_code}")
    except Exception as e:
        diagnosis_results["backend_status"] = "unreachable"
        print(f"❌ Backend nicht erreichbar: {str(e)}")
        return diagnosis_results
    
    # 2. Teste alle Testdaten-Endpunkte
    print("\n2️⃣ Teste alle Testdaten-Endpunkte...")
    testdata_endpoints = [
        ("/bookmarks/create-test-data", "POST"),
        ("/bookmarks/create-samples", "POST"),
        ("/test-data", "POST"),
        ("/create-test-data", "POST")
    ]
    
    for endpoint, method in testdata_endpoints:
        try:
            if method == "POST":
                response = requests.post(f"{BACKEND_URL}{endpoint}", timeout=30)
            else:
                response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=30)
            
            endpoint_info = {
                "endpoint": endpoint,
                "method": method,
                "status": response.status_code,
                "working": response.status_code == 200
            }
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    endpoint_info["response_data"] = data
                    print(f"✅ {method} {endpoint}: {response.status_code} - {data.get('message', 'Success')}")
                    diagnosis_results["success_scenarios"].append(endpoint_info)
                except:
                    print(f"✅ {method} {endpoint}: {response.status_code} - Response OK")
                    diagnosis_results["success_scenarios"].append(endpoint_info)
            else:
                endpoint_info["error"] = response.text[:100]
                print(f"❌ {method} {endpoint}: {response.status_code} - {response.text[:50]}")
                diagnosis_results["error_scenarios"].append(endpoint_info)
            
            diagnosis_results["api_endpoints"].append(endpoint_info)
            
        except Exception as e:
            error_info = {
                "endpoint": endpoint,
                "method": method,
                "error": str(e),
                "working": False
            }
            print(f"❌ {method} {endpoint}: Exception - {str(e)[:50]}")
            diagnosis_results["error_scenarios"].append(error_info)
            diagnosis_results["api_endpoints"].append(error_info)
    
    # 3. Simuliere Frontend-Request exakt
    print("\n3️⃣ Simuliere exakten Frontend-Request...")
    try:
        # Exakte Simulation des Frontend-Requests
        frontend_headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Origin': 'https://favlinks-2.preview.emergentagent.com',
            'Referer': 'https://favlinks-2.preview.emergentagent.com/',
            'User-Agent': 'Mozilla/5.0 (Frontend Simulation)'
        }
        
        print("📡 Sende Frontend-ähnlichen Request...")
        frontend_response = requests.post(
            f"{BACKEND_URL}/bookmarks/create-test-data", 
            headers=frontend_headers,
            timeout=60
        )
        
        print(f"📡 Frontend Response Status: {frontend_response.status_code}")
        print(f"📡 Frontend Response Headers: {dict(frontend_response.headers)}")
        
        if frontend_response.status_code == 200:
            response_data = frontend_response.json()
            print("✅ Frontend-Simulation erfolgreich!")
            print(f"📊 Response: {json.dumps(response_data, indent=2)}")
            
            # Prüfe ob Response-Format dem Frontend-erwarteten Format entspricht
            expected_fields = ['message', 'created_count']
            missing_fields = [field for field in expected_fields if field not in response_data]
            
            if not missing_fields:
                print("✅ Response-Format entspricht Frontend-Erwartungen")
            else:
                diagnosis_results["potential_issues"].append(f"Missing response fields: {missing_fields}")
                print(f"⚠️ Fehlende Response-Felder: {missing_fields}")
                
        else:
            error_text = frontend_response.text
            diagnosis_results["potential_issues"].append(f"Frontend request failed: {frontend_response.status_code} - {error_text}")
            print(f"❌ Frontend-Simulation fehlgeschlagen: {frontend_response.status_code}")
            print(f"❌ Error Response: {error_text}")
            
    except requests.exceptions.Timeout:
        diagnosis_results["potential_issues"].append("Request timeout (>60s)")
        print("❌ Frontend-Request Timeout (>60s)")
    except Exception as e:
        diagnosis_results["potential_issues"].append(f"Frontend request exception: {str(e)}")
        print(f"❌ Frontend-Simulation Fehler: {str(e)}")
    
    # 4. Teste verschiedene Fehlerszenarien
    print("\n4️⃣ Teste verschiedene Fehlerszenarien...")
    
    error_scenarios = [
        ("Ungültiger Content-Type", {"Content-Type": "invalid/type"}),
        ("Fehlende Headers", {}),
        ("Ungültiger JSON Body", {"Content-Type": "application/json"}, '{"invalid": json}'),
        ("Sehr großer Request", {"Content-Type": "application/json"}, '{"data": "' + 'x' * 10000 + '"}')
    ]
    
    for scenario_name, headers, *body in error_scenarios:
        try:
            request_body = body[0] if body else None
            if request_body:
                response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", headers=headers, data=request_body, timeout=10)
            else:
                response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", headers=headers, timeout=10)
            
            print(f"📊 {scenario_name}: Status {response.status_code}")
            
            if response.status_code != 200:
                diagnosis_results["potential_issues"].append(f"{scenario_name} causes {response.status_code}")
                
        except Exception as e:
            print(f"❌ {scenario_name}: Exception - {str(e)[:50]}")
            diagnosis_results["potential_issues"].append(f"{scenario_name} causes exception: {str(e)[:50]}")
    
    # 5. Teste Database-Zustand vor und nach Request
    print("\n5️⃣ Teste Database-Zustand...")
    try:
        # Vor Request
        before_response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=10)
        before_count = len(before_response.json()) if before_response.status_code == 200 else 0
        print(f"📊 Bookmarks vor Request: {before_count}")
        
        # Request ausführen
        create_response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", timeout=60)
        
        # Nach Request
        after_response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=10)
        after_count = len(after_response.json()) if after_response.status_code == 200 else 0
        print(f"📊 Bookmarks nach Request: {after_count}")
        
        created_count = after_count - before_count
        print(f"📊 Tatsächlich erstellt: {created_count}")
        
        if create_response.status_code == 200 and created_count > 0:
            print("✅ Database-Operation erfolgreich")
        elif create_response.status_code == 200 and created_count == 0:
            diagnosis_results["potential_issues"].append("API returns 200 but no data created")
            print("⚠️ API gibt 200 zurück, aber keine Daten erstellt")
        else:
            diagnosis_results["potential_issues"].append(f"Database operation failed: {create_response.status_code}")
            print(f"❌ Database-Operation fehlgeschlagen: {create_response.status_code}")
            
    except Exception as e:
        diagnosis_results["potential_issues"].append(f"Database test failed: {str(e)}")
        print(f"❌ Database-Test Fehler: {str(e)}")
    
    # 6. Teste MongoDB-Verbindung
    print("\n6️⃣ Teste MongoDB-Verbindung...")
    try:
        # Teste verschiedene MongoDB-abhängige Endpunkte
        mongo_endpoints = [
            "/bookmarks",
            "/categories", 
            "/statistics"
        ]
        
        mongo_working = 0
        for endpoint in mongo_endpoints:
            try:
                response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=10)
                if response.status_code == 200:
                    mongo_working += 1
                    print(f"✅ MongoDB Endpoint {endpoint}: OK")
                else:
                    print(f"❌ MongoDB Endpoint {endpoint}: {response.status_code}")
            except Exception as e:
                print(f"❌ MongoDB Endpoint {endpoint}: {str(e)[:30]}")
        
        if mongo_working == len(mongo_endpoints):
            print("✅ MongoDB-Verbindung funktioniert einwandfrei")
        elif mongo_working > 0:
            diagnosis_results["potential_issues"].append("Partial MongoDB connectivity issues")
            print("⚠️ Teilweise MongoDB-Verbindungsprobleme")
        else:
            diagnosis_results["potential_issues"].append("MongoDB connection completely failed")
            print("❌ MongoDB-Verbindung komplett fehlgeschlagen")
            
    except Exception as e:
        diagnosis_results["potential_issues"].append(f"MongoDB test exception: {str(e)}")
        print(f"❌ MongoDB-Test Fehler: {str(e)}")
    
    # 7. Finale Diagnose
    print("\n" + "="*80)
    print("🔍 FINALE DIAGNOSE")
    print("="*80)
    
    working_endpoints = len(diagnosis_results["success_scenarios"])
    total_endpoints = len(diagnosis_results["api_endpoints"])
    
    print(f"📊 Backend Status: {diagnosis_results['backend_status']}")
    print(f"📊 Funktionierende Endpunkte: {working_endpoints}/{total_endpoints}")
    print(f"📊 Erfolgreiche Szenarien: {len(diagnosis_results['success_scenarios'])}")
    print(f"📊 Fehlerhafte Szenarien: {len(diagnosis_results['error_scenarios'])}")
    print(f"📊 Potentielle Probleme: {len(diagnosis_results['potential_issues'])}")
    
    print("\n🎯 SCHLUSSFOLGERUNG:")
    print("-" * 50)
    
    if working_endpoints > 0 and diagnosis_results["backend_status"] == "healthy":
        print("✅ BACKEND FUNKTIONIERT EINWANDFREI")
        print("💡 Das Problem liegt wahrscheinlich im Frontend:")
        print("   - JavaScript Error Handling")
        print("   - Falsche Error-Toast-Anzeige")
        print("   - Frontend-Code-Logik-Fehler")
        print("   - Asynchrone Request-Behandlung")
        
        if diagnosis_results["potential_issues"]:
            print("\n⚠️ Mögliche zusätzliche Probleme:")
            for issue in diagnosis_results["potential_issues"]:
                print(f"   - {issue}")
        
        return True
    else:
        print("❌ BACKEND HAT PROBLEME")
        print("💡 Backend-Probleme gefunden:")
        for issue in diagnosis_results["potential_issues"]:
            print(f"   - {issue}")
        return False

if __name__ == "__main__":
    print("🔍 FavOrg Comprehensive Testdaten-Diagnose")
    print("=" * 60)
    
    success = comprehensive_testdata_diagnosis()
    
    if success:
        print("\n✅ DIAGNOSE ABGESCHLOSSEN - BACKEND OK!")
        print("💡 EMPFEHLUNG: Prüfe Frontend-Code und JavaScript-Konsole")
        sys.exit(0)
    else:
        print("\n❌ DIAGNOSE ABGESCHLOSSEN - BACKEND PROBLEME!")
        print("💡 EMPFEHLUNG: Behebe Backend-Probleme zuerst")
        sys.exit(1)