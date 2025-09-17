#!/usr/bin/env python3
"""
FavOrg Comprehensive Duplikat-Workflow Test
Teste den kompletten Duplikat-Workflow der FavOrg-App

WORKFLOW:
1. POST /api/bookmarks/find-duplicates - Duplikate finden und markieren
2. GET /api/statistics - Prüfe duplicate_links Counter
3. DELETE /api/bookmarks/duplicates - Markierte Duplikate entfernen
4. GET /api/statistics - Prüfe aktualisierte Statistiken

ZUSÄTZLICH:
- POST /api/bookmarks/remove-duplicates - Direkter Duplikat-Entfernung
- Teste Response-Strukturen und Counter-Updates
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

def create_test_duplicates_comprehensive(backend_url):
    """Erstelle umfassende Test-Duplikate für Workflow-Test"""
    print("\n🔧 Erstelle umfassende Test-Duplikate...")
    
    # Erstelle mehrere Sets von Duplikaten
    test_bookmarks = [
        # Set 1: GitHub Duplikate (4 Stück)
        {"title": "GitHub Repository", "url": "https://github.com", "category": "Development"},
        {"title": "GitHub - Code Hosting", "url": "https://github.com", "category": "Development"},
        {"title": "GitHub Main", "url": "https://github.com", "category": "Development"},
        {"title": "GitHub Platform", "url": "https://github.com", "category": "Development"},
        
        # Set 2: Google Duplikate (3 Stück)
        {"title": "Google Search", "url": "https://google.com", "category": "Tools"},
        {"title": "Google Homepage", "url": "https://google.com", "category": "Tools"},
        {"title": "Google Main", "url": "https://google.com", "category": "Tools"},
        
        # Set 3: YouTube Duplikate (2 Stück)
        {"title": "YouTube Videos", "url": "https://youtube.com", "category": "Entertainment"},
        {"title": "YouTube Platform", "url": "https://youtube.com", "category": "Entertainment"},
        
        # Set 4: Unique Bookmarks (keine Duplikate)
        {"title": "Unique Site 1", "url": "https://unique1.com", "category": "Testing"},
        {"title": "Unique Site 2", "url": "https://unique2.com", "category": "Testing"},
        {"title": "Unique Site 3", "url": "https://unique3.com", "category": "Testing"},
    ]
    
    created_count = 0
    for bookmark in test_bookmarks:
        try:
            response = requests.post(f"{backend_url}/bookmarks", json=bookmark, timeout=10)
            if response.status_code == 200:
                created_count += 1
                print(f"   ✅ Erstellt: {bookmark['title']}")
            else:
                print(f"   ⚠️ Fehler bei {bookmark['title']}: {response.status_code}")
        except Exception as e:
            print(f"   ❌ Exception bei {bookmark['title']}: {e}")
    
    print(f"📊 {created_count} Test-Bookmarks erstellt")
    return created_count

def test_comprehensive_duplicate_workflow():
    """
    Teste den kompletten Duplikat-Workflow
    """
    BACKEND_URL = get_backend_url()
    print(f"🔗 Backend URL: {BACKEND_URL}")
    
    print("\n" + "="*80)
    print("🔄 COMPREHENSIVE DUPLIKAT-WORKFLOW TEST")
    print("="*80)
    
    try:
        # 1. Erstelle Test-Duplikate
        create_test_duplicates_comprehensive(BACKEND_URL)
        
        # 2. Prüfe initiale Statistiken
        print("\n2️⃣ Prüfe initiale Statistiken...")
        initial_stats_response = requests.get(f"{BACKEND_URL}/statistics", timeout=30)
        
        if initial_stats_response.status_code != 200:
            print(f"❌ Fehler beim Abrufen der initialen Statistiken: {initial_stats_response.status_code}")
            return False
        
        initial_stats = initial_stats_response.json()
        print(f"📊 Initiale Statistiken:")
        print(f"   📚 Total Bookmarks: {initial_stats.get('total_bookmarks', 'N/A')}")
        print(f"   🔄 Duplicate Links: {initial_stats.get('duplicate_links', 'N/A')}")
        print(f"   ✅ Active Links: {initial_stats.get('active_links', 'N/A')}")
        
        # 3. WORKFLOW SCHRITT 1: Duplikate finden und markieren
        print("\n3️⃣ WORKFLOW SCHRITT 1: POST /api/bookmarks/find-duplicates...")
        
        find_duplicates_response = requests.post(f"{BACKEND_URL}/bookmarks/find-duplicates", timeout=30)
        
        if find_duplicates_response.status_code != 200:
            print(f"❌ Find-Duplicates fehlgeschlagen: {find_duplicates_response.status_code}")
            print(f"Response: {find_duplicates_response.text}")
            return False
        
        find_result = find_duplicates_response.json()
        print(f"✅ Find-Duplicates Response: {json.dumps(find_result, indent=2)}")
        
        duplicate_groups = find_result.get('duplicate_groups', 0)
        marked_count = find_result.get('marked_count', 0)
        
        # 4. WORKFLOW SCHRITT 2: Statistiken nach Markierung prüfen
        print("\n4️⃣ WORKFLOW SCHRITT 2: Statistiken nach Duplikat-Markierung...")
        
        marked_stats_response = requests.get(f"{BACKEND_URL}/statistics", timeout=30)
        
        if marked_stats_response.status_code != 200:
            print(f"❌ Fehler beim Abrufen der Statistiken nach Markierung: {marked_stats_response.status_code}")
            return False
        
        marked_stats = marked_stats_response.json()
        print(f"📊 Statistiken nach Markierung:")
        print(f"   📚 Total Bookmarks: {marked_stats.get('total_bookmarks', 'N/A')}")
        print(f"   🔄 Duplicate Links: {marked_stats.get('duplicate_links', 'N/A')}")
        print(f"   ✅ Active Links: {marked_stats.get('active_links', 'N/A')}")
        
        # Prüfe ob duplicate_links Counter korrekt aktualisiert wurde
        expected_duplicates = marked_count
        actual_duplicates = marked_stats.get('duplicate_links', 0)
        
        if actual_duplicates == expected_duplicates:
            print(f"✅ Duplicate Counter korrekt aktualisiert: {actual_duplicates}")
        else:
            print(f"⚠️ Duplicate Counter Mismatch: Erwartet {expected_duplicates}, Erhalten {actual_duplicates}")
        
        # 5. WORKFLOW SCHRITT 3: Markierte Duplikate entfernen
        print("\n5️⃣ WORKFLOW SCHRITT 3: DELETE /api/bookmarks/duplicates...")
        
        delete_duplicates_response = requests.delete(f"{BACKEND_URL}/bookmarks/duplicates", timeout=30)
        
        if delete_duplicates_response.status_code != 200:
            print(f"❌ Delete-Duplicates fehlgeschlagen: {delete_duplicates_response.status_code}")
            print(f"Response: {delete_duplicates_response.text}")
            return False
        
        delete_result = delete_duplicates_response.json()
        print(f"✅ Delete-Duplicates Response: {json.dumps(delete_result, indent=2)}")
        
        removed_count = delete_result.get('removed_count', 0)
        
        # 6. WORKFLOW SCHRITT 4: Finale Statistiken prüfen
        print("\n6️⃣ WORKFLOW SCHRITT 4: Finale Statistiken nach Entfernung...")
        
        final_stats_response = requests.get(f"{BACKEND_URL}/statistics", timeout=30)
        
        if final_stats_response.status_code != 200:
            print(f"❌ Fehler beim Abrufen der finalen Statistiken: {final_stats_response.status_code}")
            return False
        
        final_stats = final_stats_response.json()
        print(f"📊 Finale Statistiken:")
        print(f"   📚 Total Bookmarks: {final_stats.get('total_bookmarks', 'N/A')}")
        print(f"   🔄 Duplicate Links: {final_stats.get('duplicate_links', 'N/A')}")
        print(f"   ✅ Active Links: {final_stats.get('active_links', 'N/A')}")
        
        # 7. Prüfe Bookmark-Anzahl Änderungen
        print("\n7️⃣ Prüfe Bookmark-Anzahl Änderungen...")
        
        initial_total = initial_stats.get('total_bookmarks', 0)
        final_total = final_stats.get('total_bookmarks', 0)
        actual_removed = initial_total - final_total
        
        print(f"📊 Bookmark-Anzahl Änderungen:")
        print(f"   📈 Initial: {initial_total}")
        print(f"   📉 Final: {final_total}")
        print(f"   🗑️ Tatsächlich entfernt: {actual_removed}")
        print(f"   🗑️ API berichtet entfernt: {removed_count}")
        
        # 8. Teste direkten Duplikat-Entfernung Endpunkt
        print("\n8️⃣ Teste direkten POST /api/bookmarks/remove-duplicates Endpunkt...")
        
        # Erstelle neue Duplikate für direkten Test
        direct_test_bookmarks = [
            {"title": "Direct Test 1", "url": "https://directtest.com", "category": "Testing"},
            {"title": "Direct Test 2", "url": "https://directtest.com", "category": "Testing"},  # Duplikat
        ]
        
        for bookmark in direct_test_bookmarks:
            requests.post(f"{BACKEND_URL}/bookmarks", json=bookmark, timeout=10)
        
        # Teste direkten Endpunkt
        direct_remove_response = requests.post(f"{BACKEND_URL}/bookmarks/remove-duplicates", timeout=30)
        
        if direct_remove_response.status_code == 200:
            direct_result = direct_remove_response.json()
            print(f"✅ Direct Remove-Duplicates Response: {json.dumps(direct_result, indent=2)}")
        else:
            print(f"⚠️ Direct Remove-Duplicates fehlgeschlagen: {direct_remove_response.status_code}")
        
        # 9. Zusammenfassung
        print("\n" + "="*80)
        print("📋 COMPREHENSIVE DUPLIKAT-WORKFLOW TEST ZUSAMMENFASSUNG")
        print("="*80)
        
        success_criteria = []
        
        # Kriterium 1: Find-Duplicates funktioniert
        if find_duplicates_response.status_code == 200 and duplicate_groups > 0:
            success_criteria.append(f"✅ POST /api/bookmarks/find-duplicates: {duplicate_groups} Gruppen, {marked_count} markiert")
        else:
            success_criteria.append("❌ POST /api/bookmarks/find-duplicates fehlgeschlagen")
        
        # Kriterium 2: Duplicate Counter Update
        if actual_duplicates == expected_duplicates and expected_duplicates > 0:
            success_criteria.append("✅ Duplicate Counter korrekt aktualisiert")
        else:
            success_criteria.append(f"⚠️ Duplicate Counter: Erwartet {expected_duplicates}, Erhalten {actual_duplicates}")
        
        # Kriterium 3: Delete-Duplicates funktioniert
        if delete_duplicates_response.status_code == 200 and removed_count > 0:
            success_criteria.append(f"✅ DELETE /api/bookmarks/duplicates: {removed_count} entfernt")
        else:
            success_criteria.append("❌ DELETE /api/bookmarks/duplicates fehlgeschlagen")
        
        # Kriterium 4: Finale Statistiken korrekt
        final_duplicates = final_stats.get('duplicate_links', 0)
        if final_duplicates == 0:
            success_criteria.append("✅ Finale Statistiken: Keine Duplikate verbleibend")
        else:
            success_criteria.append(f"⚠️ Finale Statistiken: {final_duplicates} Duplikate verbleibend")
        
        # Kriterium 5: Direkter Endpunkt funktioniert
        if direct_remove_response.status_code == 200:
            success_criteria.append("✅ POST /api/bookmarks/remove-duplicates funktioniert")
        else:
            success_criteria.append("❌ POST /api/bookmarks/remove-duplicates fehlgeschlagen")
        
        for criterion in success_criteria:
            print(criterion)
        
        # Gesamtergebnis
        failed_criteria = [c for c in success_criteria if c.startswith("❌")]
        warning_criteria = [c for c in success_criteria if c.startswith("⚠️")]
        
        if not failed_criteria:
            if not warning_criteria:
                print("\n🎉 ALLE TESTS BESTANDEN - DUPLIKAT-WORKFLOW FUNKTIONIERT PERFEKT!")
                return True
            else:
                print(f"\n✅ TESTS BESTANDEN MIT {len(warning_criteria)} WARNUNGEN - DUPLIKAT-WORKFLOW FUNKTIONIERT!")
                return True
        else:
            print(f"\n❌ {len(failed_criteria)} VON {len(success_criteria)} KRITERIEN FEHLGESCHLAGEN")
            return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Netzwerk-Fehler: {e}")
        return False
    except Exception as e:
        print(f"❌ Unerwarteter Fehler: {e}")
        return False

if __name__ == "__main__":
    print("🚀 FavOrg Comprehensive Duplikat-Workflow Test gestartet...")
    print(f"⏰ Zeitstempel: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = test_comprehensive_duplicate_workflow()
    
    if success:
        print("\n✅ TEST ERFOLGREICH ABGESCHLOSSEN")
        sys.exit(0)
    else:
        print("\n❌ TEST FEHLGESCHLAGEN")
        sys.exit(1)