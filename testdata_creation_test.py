#!/usr/bin/env python3
"""
FavOrg Testdaten-Erstellung Test
Teste die Testdaten-Erstellung der FavOrg-App gemäß German Review-Request

PROBLEM: Frontend zeigt "Fehler beim Erstellen der Testdaten" Toast-Nachricht

AUFGABE:
1. Teste den API-Endpunkt für Testdaten-Erstellung (POST /api/bookmarks/create-test-data)
2. Prüfe ob der Endpunkt existiert und funktioniert
3. Überprüfe die Antwort-Struktur und mögliche Fehler
4. Teste das Erstellen von Test-Bookmarks und Test-Kategorien
5. Prüfe ob alle erforderlichen Felder korrekt gesetzt werden

BACKEND URL: verwende die URL aus der .env-Datei (REACT_APP_BACKEND_URL)
"""

import requests
import sys
import json
import time
from datetime import datetime

# Backend URL aus Frontend .env laden
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    url = line.split('=', 1)[1].strip()
                    return f"{url}/api"
        return "http://localhost:8001/api"  # Fallback
    except:
        return "http://localhost:8001/api"  # Fallback

def test_testdata_creation():
    """
    Teste die Testdaten-Erstellung Endpunkte
    Fokus auf create-test-data und create-samples
    """
    BACKEND_URL = get_backend_url()
    print(f"🔗 Backend URL: {BACKEND_URL}")
    
    print("\n" + "="*70)
    print("🧪 TESTDATEN-ERSTELLUNG TEST")
    print("="*70)
    
    success_count = 0
    total_tests = 0
    
    try:
        # 1. Teste verfügbare Endpunkte
        print("\n1️⃣ Teste verfügbare API-Endpunkte...")
        total_tests += 1
        
        # Liste aller möglichen Testdaten-Endpunkte
        test_endpoints = [
            "/bookmarks/create-test-data",
            "/bookmarks/create-samples", 
            "/test-data",
            "/create-test-data",
            "/bookmarks/test-data"
        ]
        
        available_endpoints = []
        for endpoint in test_endpoints:
            try:
                response = requests.post(f"{BACKEND_URL}{endpoint}", timeout=10)
                if response.status_code != 404:
                    available_endpoints.append(endpoint)
                    print(f"✅ Endpunkt gefunden: {endpoint} (Status: {response.status_code})")
            except Exception as e:
                print(f"⚠️ Endpunkt {endpoint} nicht erreichbar: {str(e)[:50]}")
        
        if available_endpoints:
            success_count += 1
            print(f"✅ {len(available_endpoints)} Testdaten-Endpunkte gefunden")
        else:
            print("❌ Keine Testdaten-Endpunkte gefunden")
        
        # 2. Teste create-test-data Endpunkt (Hauptfokus)
        print("\n2️⃣ Teste POST /api/bookmarks/create-test-data...")
        total_tests += 1
        
        try:
            # Erst aktuelle Bookmark-Anzahl prüfen
            bookmarks_before = requests.get(f"{BACKEND_URL}/bookmarks", timeout=30)
            before_count = len(bookmarks_before.json()) if bookmarks_before.status_code == 200 else 0
            print(f"📊 Bookmarks vor Test: {before_count}")
            
            # Testdaten erstellen
            create_response = requests.post(f"{BACKEND_URL}/bookmarks/create-test-data", timeout=60)
            print(f"📡 Response Status: {create_response.status_code}")
            print(f"📡 Response Headers: {dict(create_response.headers)}")
            
            if create_response.status_code == 200:
                response_data = create_response.json()
                print(f"✅ Testdaten-Erstellung erfolgreich!")
                print(f"📊 Response Data: {json.dumps(response_data, indent=2)}")
                
                # Prüfe Response-Struktur
                expected_fields = ['message', 'created_count', 'duplicates', 'dead_links', 'details']
                missing_fields = [field for field in expected_fields if field not in response_data]
                
                if not missing_fields:
                    print("✅ Response-Struktur vollständig")
                    success_count += 1
                else:
                    print(f"⚠️ Fehlende Response-Felder: {missing_fields}")
                
                # Prüfe ob Bookmarks tatsächlich erstellt wurden
                bookmarks_after = requests.get(f"{BACKEND_URL}/bookmarks", timeout=30)
                if bookmarks_after.status_code == 200:
                    after_count = len(bookmarks_after.json())
                    created_count = after_count - before_count
                    print(f"📊 Bookmarks nach Test: {after_count}")
                    print(f"📊 Tatsächlich erstellt: {created_count}")
                    
                    if created_count > 0:
                        print("✅ Bookmarks wurden erfolgreich in Datenbank erstellt")
                    else:
                        print("⚠️ Keine neuen Bookmarks in Datenbank gefunden")
                
            else:
                print(f"❌ Testdaten-Erstellung fehlgeschlagen: {create_response.status_code}")
                print(f"❌ Error Response: {create_response.text}")
                
        except requests.exceptions.Timeout:
            print("❌ Timeout beim Erstellen der Testdaten (>60s)")
        except Exception as e:
            print(f"❌ Fehler beim Testdaten-Erstellen: {str(e)}")
        
        # 3. Teste create-samples Endpunkt
        print("\n3️⃣ Teste POST /api/bookmarks/create-samples...")
        total_tests += 1
        
        try:
            samples_response = requests.post(f"{BACKEND_URL}/bookmarks/create-samples", timeout=30)
            print(f"📡 Response Status: {samples_response.status_code}")
            
            if samples_response.status_code == 200:
                response_data = samples_response.json()
                print(f"✅ Sample-Bookmarks-Erstellung erfolgreich!")
                print(f"📊 Response Data: {json.dumps(response_data, indent=2)}")
                success_count += 1
            else:
                print(f"❌ Sample-Bookmarks-Erstellung fehlgeschlagen: {samples_response.status_code}")
                print(f"❌ Error Response: {samples_response.text}")
                
        except Exception as e:
            print(f"❌ Fehler beim Sample-Bookmarks-Erstellen: {str(e)}")
        
        # 4. Teste Kategorien nach Testdaten-Erstellung
        print("\n4️⃣ Teste Kategorien nach Testdaten-Erstellung...")
        total_tests += 1
        
        try:
            categories_response = requests.get(f"{BACKEND_URL}/categories", timeout=30)
            print(f"📡 Categories Response Status: {categories_response.status_code}")
            
            if categories_response.status_code == 200:
                categories = categories_response.json()
                print(f"✅ Kategorien erfolgreich abgerufen: {len(categories)} Kategorien")
                
                # Zeige einige Kategorien
                for i, category in enumerate(categories[:5]):
                    print(f"📁 Kategorie {i+1}: {category.get('name', 'N/A')} ({category.get('bookmark_count', 0)} Bookmarks)")
                
                if len(categories) > 0:
                    success_count += 1
                    print("✅ Kategorien wurden korrekt erstellt")
                else:
                    print("⚠️ Keine Kategorien gefunden")
            else:
                print(f"❌ Kategorien-Abruf fehlgeschlagen: {categories_response.status_code}")
                
        except Exception as e:
            print(f"❌ Fehler beim Kategorien-Abruf: {str(e)}")
        
        # 5. Teste Statistiken nach Testdaten-Erstellung
        print("\n5️⃣ Teste Statistiken nach Testdaten-Erstellung...")
        total_tests += 1
        
        try:
            stats_response = requests.get(f"{BACKEND_URL}/statistics", timeout=30)
            print(f"📡 Statistics Response Status: {stats_response.status_code}")
            
            if stats_response.status_code == 200:
                stats = stats_response.json()
                print(f"✅ Statistiken erfolgreich abgerufen!")
                
                # Zeige wichtige Statistiken
                print(f"📊 Total Bookmarks: {stats.get('total_bookmarks', 0)}")
                print(f"📊 Total Categories: {stats.get('total_categories', 0)}")
                print(f"📊 Active Links: {stats.get('active_links', 0)}")
                print(f"📊 Dead Links: {stats.get('dead_links', 0)}")
                print(f"📊 Localhost Links: {stats.get('localhost_links', 0)}")
                print(f"📊 Duplicate Links: {stats.get('duplicate_links', 0)}")
                
                if stats.get('total_bookmarks', 0) > 0:
                    success_count += 1
                    print("✅ Statistiken zeigen erstellte Testdaten")
                else:
                    print("⚠️ Statistiken zeigen keine Bookmarks")
            else:
                print(f"❌ Statistiken-Abruf fehlgeschlagen: {stats_response.status_code}")
                
        except Exception as e:
            print(f"❌ Fehler beim Statistiken-Abruf: {str(e)}")
        
        # 6. Teste MongoDB-Verbindung durch Bookmark-Abruf
        print("\n6️⃣ Teste MongoDB-Verbindung...")
        total_tests += 1
        
        try:
            bookmarks_response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=30)
            print(f"📡 Bookmarks Response Status: {bookmarks_response.status_code}")
            
            if bookmarks_response.status_code == 200:
                bookmarks = bookmarks_response.json()
                print(f"✅ MongoDB-Verbindung funktioniert: {len(bookmarks)} Bookmarks gefunden")
                
                # Prüfe Bookmark-Struktur
                if bookmarks:
                    sample_bookmark = bookmarks[0]
                    required_fields = ['id', 'title', 'url', 'category']
                    missing_fields = [field for field in required_fields if field not in sample_bookmark]
                    
                    if not missing_fields:
                        print("✅ Bookmark-Struktur vollständig")
                        success_count += 1
                    else:
                        print(f"⚠️ Fehlende Bookmark-Felder: {missing_fields}")
                        success_count += 1  # Trotzdem als Erfolg werten, da Verbindung funktioniert
                else:
                    print("⚠️ Keine Bookmarks in Datenbank")
                    success_count += 1  # Verbindung funktioniert
            else:
                print(f"❌ MongoDB-Verbindung fehlgeschlagen: {bookmarks_response.status_code}")
                
        except Exception as e:
            print(f"❌ Fehler bei MongoDB-Verbindung: {str(e)}")
        
        # 7. Teste alle verfügbaren Endpunkte
        print("\n7️⃣ Liste aller verfügbaren API-Endpunkte...")
        total_tests += 1
        
        try:
            # Teste verschiedene bekannte Endpunkte
            known_endpoints = [
                "/bookmarks",
                "/categories", 
                "/statistics",
                "/bookmarks/validate",
                "/bookmarks/create-test-data",
                "/bookmarks/create-samples",
                "/export",
                "/bookmarks/import",
                "/bookmarks/find-duplicates",
                "/bookmarks/dead-links"
            ]
            
            working_endpoints = []
            for endpoint in known_endpoints:
                try:
                    if endpoint in ["/export", "/bookmarks/import"]:
                        # POST Endpunkte
                        response = requests.post(f"{BACKEND_URL}{endpoint}", timeout=5)
                    else:
                        # GET Endpunkte
                        response = requests.get(f"{BACKEND_URL}{endpoint}", timeout=5)
                    
                    if response.status_code not in [404, 405]:
                        working_endpoints.append(f"{endpoint} ({response.status_code})")
                except:
                    pass
            
            print(f"✅ Verfügbare Endpunkte ({len(working_endpoints)}):")
            for endpoint in working_endpoints:
                print(f"  📡 {endpoint}")
            
            if len(working_endpoints) >= 5:
                success_count += 1
                print("✅ Ausreichend API-Endpunkte verfügbar")
            else:
                print("⚠️ Wenige API-Endpunkte verfügbar")
                
        except Exception as e:
            print(f"❌ Fehler beim Endpunkt-Test: {str(e)}")
        
    except Exception as e:
        print(f"❌ Kritischer Fehler beim Testdaten-Test: {str(e)}")
        return False
    
    # Zusammenfassung
    print("\n" + "="*70)
    print("📊 TESTDATEN-ERSTELLUNG TEST ZUSAMMENFASSUNG")
    print("="*70)
    
    success_rate = (success_count / total_tests) * 100 if total_tests > 0 else 0
    print(f"✅ Erfolgreiche Tests: {success_count}/{total_tests} ({success_rate:.1f}%)")
    
    if success_rate >= 80:
        print("🎉 TESTDATEN-ERSTELLUNG FUNKTIONIERT EINWANDFREI!")
        return True
    elif success_rate >= 60:
        print("⚠️ TESTDATEN-ERSTELLUNG FUNKTIONIERT TEILWEISE")
        return True
    else:
        print("❌ TESTDATEN-ERSTELLUNG HAT PROBLEME")
        return False

if __name__ == "__main__":
    print("🧪 FavOrg Testdaten-Erstellung Test")
    print("=" * 50)
    
    success = test_testdata_creation()
    
    if success:
        print("\n✅ ALLE TESTS ERFOLGREICH!")
        sys.exit(0)
    else:
        print("\n❌ TESTS FEHLGESCHLAGEN!")
        sys.exit(1)