#!/usr/bin/env python3
"""
Phase 2.5 Backend Testing - German Review Request
Fokus auf 100 Testdaten-Generierung, Status-Integration, Statistiken und Lock/Unlock
"""

import requests
import json
import time
from datetime import datetime

# Backend URL aus .env
BACKEND_URL = "https://bookmark-hub-4.preview.emergentagent.com/api"

class Phase25BackendTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_data=None):
        """Test-Ergebnis protokollieren"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {details}")
        
    def test_clear_existing_data(self):
        """Bestehende Daten löschen für sauberen Test"""
        try:
            response = self.session.delete(f"{self.backend_url}/bookmarks/all")
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Clear Existing Data", 
                    True, 
                    f"Deleted {data.get('deleted_count', 0)} existing bookmarks",
                    data
                )
                return True
            else:
                self.log_test("Clear Existing Data", False, f"HTTP {response.status_code}: {response.text}")
                return False
        except Exception as e:
            self.log_test("Clear Existing Data", False, f"Exception: {str(e)}")
            return False
    
    def test_create_100_test_data(self):
        """HAUPTTEST: 100 Testdaten erstellen (65 normal, 20 Duplikate, 15 tote Links)"""
        try:
            response = self.session.post(f"{self.backend_url}/bookmarks/create-test-data")
            
            if response.status_code == 200:
                data = response.json()
                
                # Validiere Response-Struktur
                required_fields = ['message', 'created_count', 'details']
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "100 Testdaten Erstellung", 
                        False, 
                        f"Missing fields in response: {missing_fields}",
                        data
                    )
                    return False
                
                # Validiere created_count = 100 (nicht 50)
                created_count = data.get('created_count', 0)
                if created_count != 100:
                    self.log_test(
                        "100 Testdaten Erstellung", 
                        False, 
                        f"FEHLER: created_count ist {created_count}, erwartet 100",
                        data
                    )
                    return False
                
                # Validiere details
                details = data.get('details', {})
                expected_details = {
                    'total': 100,
                    'normal_links': 65,
                    'duplicate_links': 20,
                    'dead_links': 15
                }
                
                validation_errors = []
                for key, expected_value in expected_details.items():
                    actual_value = details.get(key, 0)
                    if actual_value != expected_value:
                        validation_errors.append(f"{key}: erwartet {expected_value}, erhalten {actual_value}")
                
                if validation_errors:
                    self.log_test(
                        "100 Testdaten Erstellung", 
                        False, 
                        f"Details-Validierung fehlgeschlagen: {'; '.join(validation_errors)}",
                        data
                    )
                    return False
                
                self.log_test(
                    "100 Testdaten Erstellung", 
                    True, 
                    f"✅ Erfolgreich 100 Testdaten erstellt: {created_count} total, Details: {details}",
                    data
                )
                return True
                
            else:
                self.log_test(
                    "100 Testdaten Erstellung", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("100 Testdaten Erstellung", False, f"Exception: {str(e)}")
            return False
    
    def test_status_integration(self):
        """Status-Integration: Überprüfe dass Testdaten korrekte status_type Felder haben"""
        try:
            response = self.session.get(f"{self.backend_url}/bookmarks")
            
            if response.status_code == 200:
                bookmarks = response.json()
                
                if not isinstance(bookmarks, list):
                    self.log_test("Status Integration", False, "Response ist keine Liste")
                    return False
                
                # Zähle Status-Typen
                status_counts = {}
                dead_links_with_correct_status = 0
                total_bookmarks = len(bookmarks)
                
                for bookmark in bookmarks:
                    status_type = bookmark.get('status_type', 'unknown')
                    status_counts[status_type] = status_counts.get(status_type, 0) + 1
                    
                    # Überprüfe dass tote Links status_type='dead' haben
                    if bookmark.get('is_dead_link', False) and status_type == 'dead':
                        dead_links_with_correct_status += 1
                
                # Validiere dass wir 100 Bookmarks haben
                if total_bookmarks != 100:
                    self.log_test(
                        "Status Integration", 
                        False, 
                        f"Erwartet 100 Bookmarks, erhalten {total_bookmarks}"
                    )
                    return False
                
                # Überprüfe Status-Verteilung
                expected_dead = 15
                actual_dead = status_counts.get('dead', 0)
                
                if actual_dead != expected_dead:
                    self.log_test(
                        "Status Integration", 
                        False, 
                        f"Erwartet {expected_dead} dead links, erhalten {actual_dead}. Status-Verteilung: {status_counts}"
                    )
                    return False
                
                self.log_test(
                    "Status Integration", 
                    True, 
                    f"✅ Status-Integration korrekt: {total_bookmarks} Bookmarks, Status-Verteilung: {status_counts}",
                    {"total_bookmarks": total_bookmarks, "status_counts": status_counts}
                )
                return True
                
            else:
                self.log_test("Status Integration", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Status Integration", False, f"Exception: {str(e)}")
            return False
    
    def test_statistics_update(self):
        """Statistiken-Update: Verificiere dass GET /api/statistics die neuen 100 Testdaten korrekt zählt"""
        try:
            response = self.session.get(f"{self.backend_url}/statistics")
            
            if response.status_code == 200:
                stats = response.json()
                
                # Validiere Hauptfelder
                total_bookmarks = stats.get('total_bookmarks', 0)
                dead_links = stats.get('dead_links', 0)
                active_links = stats.get('active_links', 0)
                duplicate_links = stats.get('duplicate_links', 0)
                localhost_links = stats.get('localhost_links', 0)
                locked_links = stats.get('locked_links', 0)
                unchecked_links = stats.get('unchecked_links', 0)
                
                validation_errors = []
                
                # total_bookmarks sollte 100 sein
                if total_bookmarks != 100:
                    validation_errors.append(f"total_bookmarks: erwartet 100, erhalten {total_bookmarks}")
                
                # dead_links sollte mindestens 15 sein (kann mehr sein nach Validierung)
                if dead_links < 15:
                    validation_errors.append(f"dead_links: erwartet mindestens 15, erhalten {dead_links}")
                
                # Überprüfe dass Summe stimmt
                counted_total = active_links + dead_links + localhost_links + duplicate_links + locked_links + unchecked_links
                
                # Debug output
                print(f"DEBUG: active={active_links}, dead={dead_links}, localhost={localhost_links}, duplicate={duplicate_links}, locked={locked_links}, unchecked={unchecked_links}")
                print(f"DEBUG: counted_total={counted_total}, total_bookmarks={total_bookmarks}")
                
                if counted_total != total_bookmarks:
                    validation_errors.append(f"Status-Summe ({counted_total}) stimmt nicht mit total_bookmarks ({total_bookmarks}) überein")
                
                if validation_errors:
                    self.log_test(
                        "Statistiken Update", 
                        False, 
                        f"Validierung fehlgeschlagen: {'; '.join(validation_errors)}",
                        stats
                    )
                    return False
                
                self.log_test(
                    "Statistiken Update", 
                    True, 
                    f"✅ Statistiken korrekt: {total_bookmarks} total, {dead_links} dead, {active_links} active, {duplicate_links} duplicate",
                    {
                        "total_bookmarks": total_bookmarks,
                        "dead_links": dead_links,
                        "active_links": active_links,
                        "duplicate_links": duplicate_links
                    }
                )
                return True
                
            else:
                self.log_test("Statistiken Update", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Statistiken Update", False, f"Exception: {str(e)}")
            return False
    
    def test_lock_unlock_functionality(self):
        """Lock/Unlock Funktionalität: Teste PUT /api/bookmarks/{id}/lock"""
        try:
            # Erst ein Bookmark holen
            response = self.session.get(f"{self.backend_url}/bookmarks")
            if response.status_code != 200:
                self.log_test("Lock/Unlock Funktionalität", False, "Konnte keine Bookmarks abrufen")
                return False
            
            bookmarks = response.json()
            if not bookmarks:
                self.log_test("Lock/Unlock Funktionalität", False, "Keine Bookmarks verfügbar")
                return False
            
            # Nimm das erste Bookmark
            test_bookmark = bookmarks[0]
            bookmark_id = test_bookmark.get('id')
            
            if not bookmark_id:
                self.log_test("Lock/Unlock Funktionalität", False, "Bookmark hat keine ID")
                return False
            
            # Test 1: Bookmark sperren
            lock_response = self.session.put(f"{self.backend_url}/bookmarks/{bookmark_id}/lock")
            
            if lock_response.status_code == 200:
                lock_data = lock_response.json()
                
                # Überprüfe dass is_locked = True
                if not lock_data.get('is_locked', False):
                    self.log_test(
                        "Lock/Unlock Funktionalität", 
                        False, 
                        "Bookmark wurde nicht als gesperrt markiert",
                        lock_data
                    )
                    return False
                
                # Überprüfe status_type = 'locked'
                if lock_data.get('status_type') != 'locked':
                    self.log_test(
                        "Lock/Unlock Funktionalität", 
                        False, 
                        f"status_type ist '{lock_data.get('status_type')}', erwartet 'locked'",
                        lock_data
                    )
                    return False
                
                # Test 2: Bookmark entsperren
                unlock_response = self.session.put(f"{self.backend_url}/bookmarks/{bookmark_id}/unlock")
                
                if unlock_response.status_code == 200:
                    unlock_data = unlock_response.json()
                    
                    # Überprüfe dass is_locked = False
                    if unlock_data.get('is_locked', True):
                        self.log_test(
                            "Lock/Unlock Funktionalität", 
                            False, 
                            "Bookmark wurde nicht entsperrt",
                            unlock_data
                        )
                        return False
                    
                    self.log_test(
                        "Lock/Unlock Funktionalität", 
                        True, 
                        f"✅ Lock/Unlock funktioniert: Bookmark {bookmark_id} erfolgreich gesperrt und entsperrt",
                        {"lock_data": lock_data, "unlock_data": unlock_data}
                    )
                    return True
                    
                else:
                    self.log_test(
                        "Lock/Unlock Funktionalität", 
                        False, 
                        f"Unlock fehlgeschlagen: HTTP {unlock_response.status_code}: {unlock_response.text}"
                    )
                    return False
                    
            else:
                self.log_test(
                    "Lock/Unlock Funktionalität", 
                    False, 
                    f"Lock fehlgeschlagen: HTTP {lock_response.status_code}: {lock_response.text}"
                )
                return False
                
        except Exception as e:
            self.log_test("Lock/Unlock Funktionalität", False, f"Exception: {str(e)}")
            return False
    
    def test_additional_validations(self):
        """Zusätzliche Validierungen für Phase 2.5"""
        try:
            # Test Link-Validierung
            validation_response = self.session.post(f"{self.backend_url}/bookmarks/validate")
            
            if validation_response.status_code == 200:
                validation_data = validation_response.json()
                
                total_checked = validation_data.get('total_checked', 0)
                dead_links_found = validation_data.get('dead_links_found', 0)
                
                # Sollte 100 Links geprüft haben
                if total_checked != 100:
                    self.log_test(
                        "Link-Validierung", 
                        False, 
                        f"Erwartet 100 geprüfte Links, erhalten {total_checked}"
                    )
                    return False
                
                self.log_test(
                    "Link-Validierung", 
                    True, 
                    f"✅ Link-Validierung erfolgreich: {total_checked} Links geprüft, {dead_links_found} tote Links gefunden",
                    validation_data
                )
                
            else:
                self.log_test("Link-Validierung", False, f"HTTP {validation_response.status_code}")
                return False
            
            # Test Duplikat-Erkennung
            duplicates_response = self.session.post(f"{self.backend_url}/bookmarks/find-duplicates")
            
            if duplicates_response.status_code == 200:
                duplicates_data = duplicates_response.json()
                
                duplicate_groups = duplicates_data.get('duplicate_groups', 0)
                marked_count = duplicates_data.get('marked_count', 0)
                
                # Handle both integer count and list format for duplicate_groups
                if isinstance(duplicate_groups, int):
                    group_count = duplicate_groups
                else:
                    group_count = len(duplicate_groups)
                
                # Sollte Duplikate finden (20 Duplikate erwartet)
                if marked_count < 15:  # Mindestens 15 Duplikate erwartet
                    self.log_test(
                        "Duplikat-Erkennung", 
                        False, 
                        f"Zu wenige Duplikate gefunden: {marked_count}, erwartet mindestens 15"
                    )
                    return False
                
                self.log_test(
                    "Duplikat-Erkennung", 
                    True, 
                    f"✅ Duplikat-Erkennung erfolgreich: {group_count} Gruppen, {marked_count} Duplikate markiert",
                    duplicates_data
                )
                
            else:
                self.log_test("Duplikat-Erkennung", False, f"HTTP {duplicates_response.status_code}")
                return False
            
            return True
            
        except Exception as e:
            self.log_test("Zusätzliche Validierungen", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Alle Phase 2.5 Tests ausführen"""
        print("🎯 PHASE 2.5 BACKEND TESTING GESTARTET")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 80)
        
        # Test-Reihenfolge für Phase 2.5
        tests = [
            ("Daten löschen", self.test_clear_existing_data),
            ("100 Testdaten erstellen", self.test_create_100_test_data),
            ("Status-Integration", self.test_status_integration),
            ("Statistiken-Update", self.test_statistics_update),
            ("Lock/Unlock Funktionalität", self.test_lock_unlock_functionality),
            ("Zusätzliche Validierungen", self.test_additional_validations)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Testing: {test_name}")
            try:
                if test_func():
                    passed_tests += 1
                time.sleep(1)  # Kurze Pause zwischen Tests
            except Exception as e:
                print(f"❌ Test {test_name} failed with exception: {e}")
        
        # Zusammenfassung
        print("\n" + "=" * 80)
        print("🎯 PHASE 2.5 TESTING ZUSAMMENFASSUNG")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"Tests bestanden: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            print("✅ PHASE 2.5 FIXES ERFOLGREICH - Alle kritischen Tests bestanden!")
        elif success_rate >= 70:
            print("⚠️  PHASE 2.5 FIXES TEILWEISE ERFOLGREICH - Einige Tests fehlgeschlagen")
        else:
            print("❌ PHASE 2.5 FIXES FEHLGESCHLAGEN - Kritische Probleme gefunden")
        
        # Detaillierte Ergebnisse
        print("\nDetaillierte Test-Ergebnisse:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        return success_rate >= 90

if __name__ == "__main__":
    tester = Phase25BackendTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ALLE PHASE 2.5 ANFORDERUNGEN ERFÜLLT!")
    else:
        print("\n⚠️  PHASE 2.5 BENÖTIGT WEITERE FIXES")