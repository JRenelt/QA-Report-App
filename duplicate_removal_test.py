#!/usr/bin/env python3
"""
FavOrg Duplikat-Entfernung Test
Teste die Duplikat-Entfernung der FavOrg-App gemäß German Review-Request

PROBLEM: Frontend Duplikate-Button löscht die Duplikate nicht nach der Bestätigung und aktualisiert Counter nicht

AUFGABE:
1. Teste den API-Endpunkt POST /api/bookmarks/remove-duplicates oder ähnlich
2. Prüfe ob Duplikate korrekt erkannt und entfernt werden
3. Überprüfe die Response-Struktur (removed_count, etc.)
4. Teste mit mehreren identischen Bookmarks
5. Prüfe ob die Statistiken nach Duplikat-Entfernung korrekt aktualisiert werden

FOKUS:
- API sollte Duplikate erfolgreich entfernen
- Response sollte korrekte removed_count zurückgeben
- Datenbank sollte nach Entfernung sauber sein
- Statistics-Endpunkt sollte aktualisierte Zahlen liefern

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

def create_test_duplicates(backend_url):
    """Erstelle Test-Duplikate für den Test"""
    print("\n🔧 Erstelle Test-Duplikate...")
    
    # Erstelle mehrere identische Bookmarks
    test_bookmarks = [
        {
            "title": "GitHub - Code Repository",
            "url": "https://github.com",
            "category": "Development",
            "subcategory": "Code Hosting"
        },
        {
            "title": "GitHub - Version Control",
            "url": "https://github.com",  # Gleiche URL = Duplikat
            "category": "Development",
            "subcategory": "Code Hosting"
        },
        {
            "title": "GitHub Main",
            "url": "https://github.com",  # Gleiche URL = Duplikat
            "category": "Development"
        },
        {
            "title": "Stack Overflow Q&A",
            "url": "https://stackoverflow.com",
            "category": "Development",
            "subcategory": "Q&A"
        },
        {
            "title": "Stack Overflow - Programming Help",
            "url": "https://stackoverflow.com",  # Gleiche URL = Duplikat
            "category": "Development",
            "subcategory": "Q&A"
        },
        {
            "title": "Google Search",
            "url": "https://google.com",
            "category": "Tools",
            "subcategory": "Search"
        },
        {
            "title": "Google Homepage",
            "url": "https://google.com",  # Gleiche URL = Duplikat
            "category": "Tools",
            "subcategory": "Search"
        }
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
    
    print(f"📊 {created_count} Test-Bookmarks erstellt (mit Duplikaten)")
    return created_count

def test_duplicate_removal():
    """
    Teste die Duplikat-Entfernung Funktionalität
    """
    BACKEND_URL = get_backend_url()
    print(f"🔗 Backend URL: {BACKEND_URL}")
    
    print("\n" + "="*70)
    print("🔄 DUPLIKAT-ENTFERNUNG TEST")
    print("="*70)
    
    try:
        # 1. Erstelle Test-Duplikate
        create_test_duplicates(BACKEND_URL)
        
        # 2. Prüfe aktuelle Bookmark-Anzahl vor Duplikat-Entfernung
        print("\n2️⃣ Prüfe Bookmarks vor Duplikat-Entfernung...")
        bookmarks_response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=30)
        
        if bookmarks_response.status_code != 200:
            print(f"❌ Fehler beim Abrufen der Bookmarks: {bookmarks_response.status_code}")
            return False
        
        bookmarks_before = bookmarks_response.json()
        print(f"📊 Bookmarks vor Entfernung: {len(bookmarks_before)}")
        
        # Zeige URLs für Duplikat-Analyse
        url_counts = {}
        for bookmark in bookmarks_before:
            url = bookmark.get('url', '')
            url_counts[url] = url_counts.get(url, 0) + 1
        
        duplicates_found = {url: count for url, count in url_counts.items() if count > 1}
        print(f"🔍 Potentielle Duplikate gefunden: {len(duplicates_found)} URLs")
        for url, count in duplicates_found.items():
            print(f"   📎 {url}: {count} mal vorhanden")
        
        # 3. Teste POST /api/bookmarks/remove-duplicates
        print("\n3️⃣ Teste POST /api/bookmarks/remove-duplicates...")
        
        duplicate_removal_response = requests.post(f"{BACKEND_URL}/bookmarks/remove-duplicates", timeout=30)
        
        if duplicate_removal_response.status_code != 200:
            print(f"❌ Duplikat-Entfernung fehlgeschlagen: {duplicate_removal_response.status_code}")
            print(f"Response: {duplicate_removal_response.text}")
            return False
        
        removal_result = duplicate_removal_response.json()
        print(f"✅ Duplikat-Entfernung Response: {json.dumps(removal_result, indent=2)}")
        
        # 4. Prüfe Response-Struktur
        print("\n4️⃣ Prüfe Response-Struktur...")
        required_fields = ['duplicates_found', 'bookmarks_removed', 'message']
        missing_fields = []
        
        for field in required_fields:
            if field not in removal_result:
                missing_fields.append(field)
            else:
                print(f"   ✅ {field}: {removal_result[field]}")
        
        if missing_fields:
            print(f"⚠️ Fehlende Felder in Response: {missing_fields}")
        
        removed_count = removal_result.get('bookmarks_removed', 0)
        duplicates_found_count = removal_result.get('duplicates_found', 0)
        
        # 5. Prüfe Bookmarks nach Duplikat-Entfernung
        print("\n5️⃣ Prüfe Bookmarks nach Duplikat-Entfernung...")
        bookmarks_after_response = requests.get(f"{BACKEND_URL}/bookmarks", timeout=30)
        
        if bookmarks_after_response.status_code != 200:
            print(f"❌ Fehler beim Abrufen der Bookmarks nach Entfernung: {bookmarks_after_response.status_code}")
            return False
        
        bookmarks_after = bookmarks_after_response.json()
        print(f"📊 Bookmarks nach Entfernung: {len(bookmarks_after)}")
        
        # Berechne tatsächliche Änderung
        actual_removed = len(bookmarks_before) - len(bookmarks_after)
        print(f"🔢 Tatsächlich entfernte Bookmarks: {actual_removed}")
        print(f"🔢 API berichtete entfernte Bookmarks: {removed_count}")
        
        # 6. Prüfe ob noch Duplikate vorhanden sind
        print("\n6️⃣ Prüfe verbleibende Duplikate...")
        url_counts_after = {}
        for bookmark in bookmarks_after:
            url = bookmark.get('url', '')
            url_counts_after[url] = url_counts_after.get(url, 0) + 1
        
        remaining_duplicates = {url: count for url, count in url_counts_after.items() if count > 1}
        print(f"🔍 Verbleibende Duplikate: {len(remaining_duplicates)} URLs")
        
        if remaining_duplicates:
            print("⚠️ WARNUNG: Es sind noch Duplikate vorhanden:")
            for url, count in remaining_duplicates.items():
                print(f"   📎 {url}: {count} mal vorhanden")
        else:
            print("✅ Keine Duplikate mehr vorhanden - Entfernung erfolgreich!")
        
        # 7. Teste Statistiken-Update
        print("\n7️⃣ Prüfe Statistiken-Update...")
        stats_response = requests.get(f"{BACKEND_URL}/statistics", timeout=30)
        
        if stats_response.status_code != 200:
            print(f"❌ Fehler beim Abrufen der Statistiken: {stats_response.status_code}")
            return False
        
        stats = stats_response.json()
        print(f"📊 Aktuelle Statistiken:")
        print(f"   📚 Total Bookmarks: {stats.get('total_bookmarks', 'N/A')}")
        print(f"   🔄 Duplicate Links: {stats.get('duplicate_links', 'N/A')}")
        print(f"   ✅ Active Links: {stats.get('active_links', 'N/A')}")
        print(f"   ❌ Dead Links: {stats.get('dead_links', 'N/A')}")
        
        # 8. Teste alternative Duplikat-Endpunkte
        print("\n8️⃣ Teste alternative Duplikat-Endpunkte...")
        
        # Teste POST /api/bookmarks/find-duplicates
        print("   🔍 Teste POST /api/bookmarks/find-duplicates...")
        find_duplicates_response = requests.post(f"{BACKEND_URL}/bookmarks/find-duplicates", timeout=30)
        
        if find_duplicates_response.status_code == 200:
            find_result = find_duplicates_response.json()
            print(f"   ✅ Find-Duplicates Response: {json.dumps(find_result, indent=2)}")
        else:
            print(f"   ⚠️ Find-Duplicates nicht verfügbar: {find_duplicates_response.status_code}")
        
        # Teste DELETE /api/bookmarks/duplicates
        print("   🗑️ Teste DELETE /api/bookmarks/duplicates...")
        delete_duplicates_response = requests.delete(f"{BACKEND_URL}/bookmarks/duplicates", timeout=30)
        
        if delete_duplicates_response.status_code == 200:
            delete_result = delete_duplicates_response.json()
            print(f"   ✅ Delete-Duplicates Response: {json.dumps(delete_result, indent=2)}")
        else:
            print(f"   ⚠️ Delete-Duplicates nicht verfügbar: {delete_duplicates_response.status_code}")
        
        # 9. Zusammenfassung
        print("\n" + "="*70)
        print("📋 DUPLIKAT-ENTFERNUNG TEST ZUSAMMENFASSUNG")
        print("="*70)
        
        success_criteria = []
        
        # Kriterium 1: API-Endpunkt funktioniert
        if duplicate_removal_response.status_code == 200:
            success_criteria.append("✅ POST /api/bookmarks/remove-duplicates funktioniert")
        else:
            success_criteria.append("❌ POST /api/bookmarks/remove-duplicates fehlgeschlagen")
        
        # Kriterium 2: Response-Struktur korrekt
        if not missing_fields:
            success_criteria.append("✅ Response-Struktur vollständig")
        else:
            success_criteria.append(f"❌ Response-Struktur unvollständig: {missing_fields}")
        
        # Kriterium 3: Duplikate wurden entfernt
        if actual_removed > 0:
            success_criteria.append(f"✅ {actual_removed} Duplikate erfolgreich entfernt")
        else:
            success_criteria.append("❌ Keine Duplikate entfernt")
        
        # Kriterium 4: Keine verbleibenden Duplikate
        if not remaining_duplicates:
            success_criteria.append("✅ Alle Duplikate erfolgreich entfernt")
        else:
            success_criteria.append(f"⚠️ {len(remaining_duplicates)} Duplikat-URLs verbleiben")
        
        # Kriterium 5: Statistiken aktualisiert
        if stats_response.status_code == 200:
            success_criteria.append("✅ Statistiken erfolgreich abgerufen")
        else:
            success_criteria.append("❌ Statistiken nicht verfügbar")
        
        for criterion in success_criteria:
            print(criterion)
        
        # Gesamtergebnis
        failed_criteria = [c for c in success_criteria if c.startswith("❌")]
        if not failed_criteria:
            print("\n🎉 ALLE TESTS BESTANDEN - DUPLIKAT-ENTFERNUNG FUNKTIONIERT EINWANDFREI!")
            return True
        else:
            print(f"\n⚠️ {len(failed_criteria)} VON {len(success_criteria)} KRITERIEN FEHLGESCHLAGEN")
            return False
        
    except requests.exceptions.RequestException as e:
        print(f"❌ Netzwerk-Fehler: {e}")
        return False
    except Exception as e:
        print(f"❌ Unerwarteter Fehler: {e}")
        return False

if __name__ == "__main__":
    print("🚀 FavOrg Duplikat-Entfernung Test gestartet...")
    print(f"⏰ Zeitstempel: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    success = test_duplicate_removal()
    
    if success:
        print("\n✅ TEST ERFOLGREICH ABGESCHLOSSEN")
        sys.exit(0)
    else:
        print("\n❌ TEST FEHLGESCHLAGEN")
        sys.exit(1)