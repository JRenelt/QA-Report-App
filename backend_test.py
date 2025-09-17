#!/usr/bin/env python3
"""
FavOrg Backend Testing - German Review Request
Teste ausführlich TOTE Links und Duplikate Funktionen der FavOrg-App

PROBLEME zu untersuchen:
1. TOTE Links Counter zeigt 15 an obwohl keine toten Links vorhanden sind
2. TOTE Links Funktion soll manuell zugeordnete tote Links korrekt löschen
3. Duplikate Funktion vollständig testen
"""

import requests
import json
import time
from datetime import datetime
import uuid

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

class FavOrgTester:
    def __init__(self):
        self.backend_url = get_backend_url()
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        
    def log(self, message):
        """Log mit Timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def test_api_endpoint(self, method, endpoint, data=None, expected_status=200):
        """Generische API-Test-Funktion"""
        url = f"{self.backend_url}{endpoint}"
        self.log(f"Testing {method} {endpoint}")
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, timeout=30)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, timeout=30)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            self.log(f"Response: {response.status_code}")
            
            if response.status_code == expected_status:
                try:
                    return response.json()
                except:
                    return response.text
            else:
                self.log(f"❌ FEHLER: Expected {expected_status}, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return None
                
        except Exception as e:
            self.log(f"❌ EXCEPTION: {str(e)}")
            return None
    
    def get_statistics(self):
        """Hole aktuelle Statistiken"""
        return self.test_api_endpoint("GET", "/statistics")
    
    def create_test_bookmark(self, title, url, category="Testing", status_type="active", is_dead_link=False):
        """Erstelle Test-Bookmark"""
        bookmark_data = {
            "title": title,
            "url": url,
            "category": category,
            "status_type": status_type
        }
        return self.test_api_endpoint("POST", "/bookmarks", bookmark_data, 200)
    
    def update_bookmark_status(self, bookmark_id, status_type):
        """Update Bookmark Status"""
        status_data = {"status_type": status_type}
        return self.test_api_endpoint("PUT", f"/bookmarks/{bookmark_id}/status", status_data)
    
    def validate_links(self):
        """Validiere alle Links"""
        return self.test_api_endpoint("POST", "/bookmarks/validate")
    
    def remove_dead_links(self):
        """Entferne tote Links"""
        return self.test_api_endpoint("DELETE", "/bookmarks/dead-links")
    
    def find_duplicates(self):
        """Finde Duplikate"""
        return self.test_api_endpoint("POST", "/bookmarks/find-duplicates")
    
    def delete_duplicates(self):
        """Lösche Duplikate"""
        return self.test_api_endpoint("DELETE", "/bookmarks/duplicates")
    
    def get_all_bookmarks(self):
        """Hole alle Bookmarks"""
        return self.test_api_endpoint("GET", "/bookmarks")
    
    def delete_bookmark(self, bookmark_id):
        """Lösche einzelnes Bookmark"""
        return self.test_api_endpoint("DELETE", f"/bookmarks/{bookmark_id}")

def main():
    tester = FavOrgTester()
    
    print("=" * 80)
    print("🎯 FAVORG BACKEND TESTING - GERMAN REVIEW REQUEST")
    print("Teste TOTE Links und Duplikate Funktionen")
    print("=" * 80)
    
    # TEST 1: Aktuelle Statistiken prüfen
    print("\n📊 TEST 1: AKTUELLE STATISTIKEN PRÜFEN")
    print("-" * 50)
    
    initial_stats = tester.get_statistics()
    if initial_stats:
        tester.log("✅ Statistics API erreichbar")
        tester.log(f"📊 Gesamt Bookmarks: {initial_stats.get('total_bookmarks', 'N/A')}")
        tester.log(f"✅ Aktive Links: {initial_stats.get('active_links', 'N/A')}")
        tester.log(f"❌ Tote Links: {initial_stats.get('dead_links', 'N/A')}")
        tester.log(f"🏠 Localhost Links: {initial_stats.get('localhost_links', 'N/A')}")
        tester.log(f"🔄 Duplikat Links: {initial_stats.get('duplicate_links', 'N/A')}")
        tester.log(f"🔒 Gesperrte Links: {initial_stats.get('locked_links', 'N/A')}")
        tester.log(f"❓ Ungeprüfte Links: {initial_stats.get('unchecked_links', 'N/A')}")
        
        # PROBLEM 1 CHECK: Zeigt Counter 15 tote Links obwohl keine vorhanden?
        dead_links_count = initial_stats.get('dead_links', 0)
        if dead_links_count > 0:
            tester.log(f"⚠️  PROBLEM ERKANNT: Dead Links Counter zeigt {dead_links_count} an!")
        else:
            tester.log("✅ Dead Links Counter korrekt bei 0")
    else:
        tester.log("❌ FEHLER: Statistics API nicht erreichbar")
        return
    
    # TEST 2: Manuell totes Bookmark erstellen und prüfen
    print("\n🔴 TEST 2: MANUELL TOTES BOOKMARK ERSTELLEN")
    print("-" * 50)
    
    # Erstelle Bookmark mit status_type="dead"
    dead_bookmark = tester.create_test_bookmark(
        title="Manuell totes Bookmark",
        url="https://dead-link-test-12345.invalid",
        status_type="dead"
    )
    
    if dead_bookmark:
        dead_bookmark_id = dead_bookmark.get('id')
        tester.log(f"✅ Totes Bookmark erstellt: ID {dead_bookmark_id}")
        
        # Prüfe Statistiken nach Erstellung
        stats_after_dead = tester.get_statistics()
        if stats_after_dead:
            new_dead_count = stats_after_dead.get('dead_links', 0)
            tester.log(f"📊 Dead Links nach Erstellung: {new_dead_count}")
            
            if new_dead_count > dead_links_count:
                tester.log("✅ Dead Links Counter wurde korrekt erhöht")
            else:
                tester.log("❌ PROBLEM: Dead Links Counter nicht erhöht!")
    else:
        tester.log("❌ FEHLER: Konnte totes Bookmark nicht erstellen")
        dead_bookmark_id = None
    
    # TEST 3: Link-Validierung testen
    print("\n🔍 TEST 3: LINK-VALIDIERUNG TESTEN")
    print("-" * 50)
    
    # Erstelle verschiedene Test-Bookmarks
    test_bookmarks = []
    
    # Gültiger Link
    valid_bookmark = tester.create_test_bookmark(
        title="Gültiger Link Test",
        url="https://www.google.com",
        status_type="active"
    )
    if valid_bookmark:
        test_bookmarks.append(valid_bookmark)
        tester.log("✅ Gültiges Test-Bookmark erstellt")
    
    # Localhost Link
    localhost_bookmark = tester.create_test_bookmark(
        title="Localhost Test",
        url="http://localhost:3000",
        status_type="localhost"
    )
    if localhost_bookmark:
        test_bookmarks.append(localhost_bookmark)
        tester.log("✅ Localhost Test-Bookmark erstellt")
    
    # Toter Link
    dead_test_bookmark = tester.create_test_bookmark(
        title="Toter Link Test",
        url="https://nonexistent-domain-12345.com",
        status_type="active"  # Wird durch Validierung auf dead gesetzt
    )
    if dead_test_bookmark:
        test_bookmarks.append(dead_test_bookmark)
        tester.log("✅ Toter Link Test-Bookmark erstellt")
    
    # Führe Link-Validierung durch
    tester.log("🔍 Starte Link-Validierung...")
    validation_result = tester.validate_links()
    
    if validation_result:
        tester.log("✅ Link-Validierung erfolgreich")
        tester.log(f"📊 Geprüfte Links: {validation_result.get('total_checked', 'N/A')}")
        tester.log(f"❌ Gefundene tote Links: {validation_result.get('dead_links_found', 'N/A')}")
        tester.log(f"💬 Nachricht: {validation_result.get('message', 'N/A')}")
    else:
        tester.log("❌ FEHLER: Link-Validierung fehlgeschlagen")
    
    # Prüfe Statistiken nach Validierung
    stats_after_validation = tester.get_statistics()
    if stats_after_validation:
        tester.log(f"📊 Dead Links nach Validierung: {stats_after_validation.get('dead_links', 'N/A')}")
    
    # TEST 4: Tote Links entfernen
    print("\n🗑️  TEST 4: TOTE LINKS ENTFERNEN")
    print("-" * 50)
    
    # Hole alle Bookmarks vor Entfernung
    bookmarks_before = tester.get_all_bookmarks()
    if bookmarks_before:
        total_before = len(bookmarks_before)
        dead_before = len([b for b in bookmarks_before if b.get('status_type') == 'dead'])
        tester.log(f"📊 Bookmarks vor Entfernung: {total_before} (davon {dead_before} tote)")
    
    # Entferne tote Links
    removal_result = tester.remove_dead_links()
    if removal_result:
        tester.log("✅ Tote Links Entfernung erfolgreich")
        tester.log(f"🗑️  Entfernte Links: {removal_result.get('removed_count', 'N/A')}")
        tester.log(f"💬 Nachricht: {removal_result.get('message', 'N/A')}")
    else:
        tester.log("❌ FEHLER: Tote Links Entfernung fehlgeschlagen")
    
    # Prüfe Statistiken nach Entfernung
    stats_after_removal = tester.get_statistics()
    if stats_after_removal:
        tester.log(f"📊 Dead Links nach Entfernung: {stats_after_removal.get('dead_links', 'N/A')}")
        tester.log(f"📊 Gesamt Bookmarks nach Entfernung: {stats_after_removal.get('total_bookmarks', 'N/A')}")
    
    # Prüfe ob localhost Links verschont wurden
    bookmarks_after = tester.get_all_bookmarks()
    if bookmarks_after:
        localhost_after = len([b for b in bookmarks_after if b.get('status_type') == 'localhost'])
        tester.log(f"🏠 Localhost Links nach Entfernung: {localhost_after}")
        if localhost_after > 0:
            tester.log("✅ Localhost Links wurden korrekt verschont")
    
    # TEST 5: Duplikate-Workflow testen
    print("\n🔄 TEST 5: DUPLIKATE-WORKFLOW TESTEN")
    print("-" * 50)
    
    # Erstelle Duplikate für Test
    duplicate_url = "https://example-duplicate-test.com"
    
    duplicate1 = tester.create_test_bookmark(
        title="Duplikat 1",
        url=duplicate_url,
        category="Duplicate Test"
    )
    
    duplicate2 = tester.create_test_bookmark(
        title="Duplikat 2",
        url=duplicate_url,
        category="Duplicate Test"
    )
    
    duplicate3 = tester.create_test_bookmark(
        title="Duplikat 3",
        url=duplicate_url,
        category="Duplicate Test"
    )
    
    if duplicate1 and duplicate2 and duplicate3:
        tester.log("✅ Test-Duplikate erstellt")
        
        # Prüfe Statistiken vor Duplikat-Suche
        stats_before_duplicates = tester.get_statistics()
        if stats_before_duplicates:
            tester.log(f"📊 Duplikat Links vor Suche: {stats_before_duplicates.get('duplicate_links', 'N/A')}")
        
        # Finde Duplikate
        find_result = tester.find_duplicates()
        if find_result:
            tester.log("✅ Duplikat-Suche erfolgreich")
            tester.log(f"🔄 Gefundene Duplikat-Gruppen: {find_result.get('duplicate_groups', 'N/A')}")
            tester.log(f"🏷️  Markierte Duplikate: {find_result.get('marked_count', 'N/A')}")
            tester.log(f"💬 Nachricht: {find_result.get('message', 'N/A')}")
        else:
            tester.log("❌ FEHLER: Duplikat-Suche fehlgeschlagen")
        
        # Prüfe Statistiken nach Duplikat-Markierung
        stats_after_find = tester.get_statistics()
        if stats_after_find:
            tester.log(f"📊 Duplikat Links nach Markierung: {stats_after_find.get('duplicate_links', 'N/A')}")
        
        # Lösche Duplikate
        delete_result = tester.delete_duplicates()
        if delete_result:
            tester.log("✅ Duplikat-Löschung erfolgreich")
            tester.log(f"🗑️  Gelöschte Duplikate: {delete_result.get('removed_count', 'N/A')}")
            tester.log(f"💬 Nachricht: {delete_result.get('message', 'N/A')}")
        else:
            tester.log("❌ FEHLER: Duplikat-Löschung fehlgeschlagen")
        
        # Finale Statistiken nach Duplikat-Entfernung
        stats_after_delete = tester.get_statistics()
        if stats_after_delete:
            tester.log(f"📊 Duplikat Links nach Löschung: {stats_after_delete.get('duplicate_links', 'N/A')}")
            tester.log(f"📊 Gesamt Bookmarks nach Duplikat-Löschung: {stats_after_delete.get('total_bookmarks', 'N/A')}")
    else:
        tester.log("❌ FEHLER: Konnte Test-Duplikate nicht erstellen")
    
    # TEST 6: Status-Felder Konsistenz prüfen
    print("\n🔍 TEST 6: STATUS-FELDER KONSISTENZ PRÜFEN")
    print("-" * 50)
    
    # Erstelle Bookmark und teste verschiedene Status-Updates
    status_test_bookmark = tester.create_test_bookmark(
        title="Status Test Bookmark",
        url="https://status-test-example.com",
        status_type="active"
    )
    
    if status_test_bookmark:
        bookmark_id = status_test_bookmark.get('id')
        tester.log(f"✅ Status-Test-Bookmark erstellt: ID {bookmark_id}")
        
        # Teste verschiedene Status-Übergänge
        status_transitions = [
            ("dead", "Setze auf tot"),
            ("localhost", "Setze auf localhost"),
            ("duplicate", "Setze auf duplikat"),
            ("active", "Setze zurück auf aktiv")
        ]
        
        for status, description in status_transitions:
            tester.log(f"🔄 {description}")
            update_result = tester.update_bookmark_status(bookmark_id, status)
            if update_result:
                tester.log(f"✅ Status erfolgreich auf '{status}' gesetzt")
            else:
                tester.log(f"❌ FEHLER: Status-Update auf '{status}' fehlgeschlagen")
            
            # Kurze Pause zwischen Updates
            time.sleep(0.5)
    
    # FINALE STATISTIKEN
    print("\n📊 FINALE STATISTIKEN")
    print("-" * 50)
    
    final_stats = tester.get_statistics()
    if final_stats:
        tester.log("✅ Finale Statistiken:")
        tester.log(f"📊 Gesamt Bookmarks: {final_stats.get('total_bookmarks', 'N/A')}")
        tester.log(f"✅ Aktive Links: {final_stats.get('active_links', 'N/A')}")
        tester.log(f"❌ Tote Links: {final_stats.get('dead_links', 'N/A')}")
        tester.log(f"🏠 Localhost Links: {final_stats.get('localhost_links', 'N/A')}")
        tester.log(f"🔄 Duplikat Links: {final_stats.get('duplicate_links', 'N/A')}")
        tester.log(f"🔒 Gesperrte Links: {final_stats.get('locked_links', 'N/A')}")
        tester.log(f"❓ Ungeprüfte Links: {final_stats.get('unchecked_links', 'N/A')}")
    
    print("\n" + "=" * 80)
    print("🎯 FAVORG BACKEND TESTING ABGESCHLOSSEN")
    print("=" * 80)

if __name__ == "__main__":
    main()