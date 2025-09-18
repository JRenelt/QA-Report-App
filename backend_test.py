#!/usr/bin/env python3
"""
Backend Test Suite für FavLink Manager - Lock/Unlock System Testing
Teste das Sperre-System (Lock/Unlock Funktionalität) gemäß German Review Request

Problem: User berichtet "Die Sperre arbeitet nicht plausibel" und "Entsperren nicht möglich"
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL aus .env Datei
BACKEND_URL = "https://favlinks-2.preview.emergentagent.com/api"

class LockUnlockTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.locked_bookmark_ids = []
        self.unlocked_bookmark_ids = []
        
    def log_result(self, test_name, success, details="", response_data=None):
        """Protokolliert Testergebnisse"""
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
        
        if response_data and not success:
            print(f"   Response: {response_data}")
    
    def test_get_current_bookmarks(self):
        """1. Aktuelle Bookmarks abrufen und gesperrte identifizieren"""
        try:
            response = requests.get(f"{self.backend_url}/bookmarks", timeout=10)
            
            if response.status_code == 200:
                bookmarks = response.json()
                total_bookmarks = len(bookmarks)
                
                # Identifiziere gesperrte Bookmarks
                locked_bookmarks = [b for b in bookmarks if b.get('is_locked', False) or b.get('status_type') == 'locked']
                unlocked_bookmarks = [b for b in bookmarks if not b.get('is_locked', False) and b.get('status_type') != 'locked']
                
                self.locked_bookmark_ids = [b['id'] for b in locked_bookmarks]
                self.unlocked_bookmark_ids = [b['id'] for b in unlocked_bookmarks]
                
                # Konsistenz-Check zwischen is_locked und status_type
                inconsistent_bookmarks = []
                for bookmark in bookmarks:
                    is_locked = bookmark.get('is_locked', False)
                    status_type = bookmark.get('status_type', 'active')
                    
                    # Inkonsistenz: is_locked=True aber status_type != 'locked'
                    if is_locked and status_type != 'locked':
                        inconsistent_bookmarks.append(f"ID {bookmark['id']}: is_locked=True but status_type='{status_type}'")
                    # Inkonsistenz: is_locked=False aber status_type = 'locked'
                    elif not is_locked and status_type == 'locked':
                        inconsistent_bookmarks.append(f"ID {bookmark['id']}: is_locked=False but status_type='locked'")
                
                details = f"Total: {total_bookmarks}, Gesperrt: {len(locked_bookmarks)}, Entsperrt: {len(unlocked_bookmarks)}"
                if inconsistent_bookmarks:
                    details += f", INKONSISTENZEN: {len(inconsistent_bookmarks)}"
                
                self.log_result(
                    "GET /api/bookmarks - Aktuelle Bookmarks abrufen",
                    True,
                    details,
                    {
                        "total_bookmarks": total_bookmarks,
                        "locked_count": len(locked_bookmarks),
                        "unlocked_count": len(unlocked_bookmarks),
                        "locked_ids": self.locked_bookmark_ids[:3],  # Erste 3 für Tests
                        "unlocked_ids": self.unlocked_bookmark_ids[:3],  # Erste 3 für Tests
                        "inconsistencies": inconsistent_bookmarks
                    }
                )
                
                return True
            else:
                self.log_result(
                    "GET /api/bookmarks - Aktuelle Bookmarks abrufen",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/bookmarks - Aktuelle Bookmarks abrufen",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_lock_functionality(self):
        """2. Lock Funktionalität testen"""
        if not self.unlocked_bookmark_ids:
            self.log_result(
                "PUT /api/bookmarks/{id}/lock - Lock Funktionalität",
                False,
                "Keine entsperrten Bookmarks zum Testen verfügbar"
            )
            return False
        
        # Teste das Sperren eines entsperrten Bookmarks
        test_bookmark_id = self.unlocked_bookmark_ids[0]
        
        try:
            response = requests.put(f"{self.backend_url}/bookmarks/{test_bookmark_id}/lock", timeout=10)
            
            if response.status_code == 200:
                # Prüfe ob das Bookmark korrekt gesperrt wurde
                verify_response = requests.get(f"{self.backend_url}/bookmarks", timeout=10)
                if verify_response.status_code == 200:
                    bookmarks = verify_response.json()
                    updated_bookmark = next((b for b in bookmarks if b['id'] == test_bookmark_id), None)
                    
                    if updated_bookmark:
                        is_locked = updated_bookmark.get('is_locked', False)
                        status_type = updated_bookmark.get('status_type', 'active')
                        
                        if is_locked and status_type == 'locked':
                            self.log_result(
                                "PUT /api/bookmarks/{id}/lock - Lock Funktionalität",
                                True,
                                f"Bookmark {test_bookmark_id} erfolgreich gesperrt: is_locked=True, status_type='locked'",
                                {"bookmark_id": test_bookmark_id, "is_locked": is_locked, "status_type": status_type}
                            )
                            # Füge zur gesperrten Liste hinzu
                            if test_bookmark_id not in self.locked_bookmark_ids:
                                self.locked_bookmark_ids.append(test_bookmark_id)
                            return True
                        else:
                            self.log_result(
                                "PUT /api/bookmarks/{id}/lock - Lock Funktionalität",
                                False,
                                f"Bookmark nicht korrekt gesperrt: is_locked={is_locked}, status_type='{status_type}'",
                                {"bookmark_id": test_bookmark_id, "is_locked": is_locked, "status_type": status_type}
                            )
                            return False
                    else:
                        self.log_result(
                            "PUT /api/bookmarks/{id}/lock - Lock Funktionalität",
                            False,
                            f"Bookmark {test_bookmark_id} nach Lock-Operation nicht gefunden"
                        )
                        return False
            else:
                self.log_result(
                    "PUT /api/bookmarks/{id}/lock - Lock Funktionalität",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "PUT /api/bookmarks/{id}/lock - Lock Funktionalität",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_unlock_functionality(self):
        """3. Unlock Funktionalität testen"""
        if not self.locked_bookmark_ids:
            self.log_result(
                "PUT /api/bookmarks/{id}/unlock - Unlock Funktionalität",
                False,
                "Keine gesperrten Bookmarks zum Testen verfügbar"
            )
            return False
        
        # Teste das Entsperren eines gesperrten Bookmarks
        test_bookmark_id = self.locked_bookmark_ids[0]
        
        try:
            response = requests.put(f"{self.backend_url}/bookmarks/{test_bookmark_id}/unlock", timeout=10)
            
            if response.status_code == 200:
                # Prüfe ob das Bookmark korrekt entsperrt wurde
                verify_response = requests.get(f"{self.backend_url}/bookmarks", timeout=10)
                if verify_response.status_code == 200:
                    bookmarks = verify_response.json()
                    updated_bookmark = next((b for b in bookmarks if b['id'] == test_bookmark_id), None)
                    
                    if updated_bookmark:
                        is_locked = updated_bookmark.get('is_locked', False)
                        status_type = updated_bookmark.get('status_type', 'active')
                        
                        if not is_locked and status_type == 'active':
                            self.log_result(
                                "PUT /api/bookmarks/{id}/unlock - Unlock Funktionalität",
                                True,
                                f"Bookmark {test_bookmark_id} erfolgreich entsperrt: is_locked=False, status_type='active'",
                                {"bookmark_id": test_bookmark_id, "is_locked": is_locked, "status_type": status_type}
                            )
                            return True
                        else:
                            self.log_result(
                                "PUT /api/bookmarks/{id}/unlock - Unlock Funktionalität",
                                False,
                                f"Bookmark nicht korrekt entsperrt: is_locked={is_locked}, status_type='{status_type}'",
                                {"bookmark_id": test_bookmark_id, "is_locked": is_locked, "status_type": status_type}
                            )
                            return False
                    else:
                        self.log_result(
                            "PUT /api/bookmarks/{id}/unlock - Unlock Funktionalität",
                            False,
                            f"Bookmark {test_bookmark_id} nach Unlock-Operation nicht gefunden"
                        )
                        return False
            else:
                self.log_result(
                    "PUT /api/bookmarks/{id}/unlock - Unlock Funktionalität",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "PUT /api/bookmarks/{id}/unlock - Unlock Funktionalität",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_toggle_functionality(self):
        """4. Toggle-Funktionalität testen (mehrfaches Sperren/Entsperren)"""
        if not self.unlocked_bookmark_ids:
            self.log_result(
                "Toggle Lock/Unlock - Mehrfaches Sperren/Entsperren",
                False,
                "Keine entsperrten Bookmarks zum Testen verfügbar"
            )
            return False
        
        test_bookmark_id = self.unlocked_bookmark_ids[1] if len(self.unlocked_bookmark_ids) > 1 else self.unlocked_bookmark_ids[0]
        toggle_results = []
        
        try:
            # Schritt 1: Sperren
            lock_response = requests.put(f"{self.backend_url}/bookmarks/{test_bookmark_id}/lock", timeout=10)
            if lock_response.status_code == 200:
                # Verifikation nach Sperren
                verify_response = requests.get(f"{self.backend_url}/bookmarks", timeout=10)
                if verify_response.status_code == 200:
                    bookmarks = verify_response.json()
                    bookmark = next((b for b in bookmarks if b['id'] == test_bookmark_id), None)
                    if bookmark:
                        toggle_results.append(f"Nach LOCK: is_locked={bookmark.get('is_locked')}, status_type='{bookmark.get('status_type')}'")
            
            # Schritt 2: Entsperren
            unlock_response = requests.put(f"{self.backend_url}/bookmarks/{test_bookmark_id}/unlock", timeout=10)
            if unlock_response.status_code == 200:
                # Verifikation nach Entsperren
                verify_response = requests.get(f"{self.backend_url}/bookmarks", timeout=10)
                if verify_response.status_code == 200:
                    bookmarks = verify_response.json()
                    bookmark = next((b for b in bookmarks if b['id'] == test_bookmark_id), None)
                    if bookmark:
                        toggle_results.append(f"Nach UNLOCK: is_locked={bookmark.get('is_locked')}, status_type='{bookmark.get('status_type')}'")
            
            # Schritt 3: Erneut sperren
            lock2_response = requests.put(f"{self.backend_url}/bookmarks/{test_bookmark_id}/lock", timeout=10)
            if lock2_response.status_code == 200:
                # Verifikation nach erneutem Sperren
                verify_response = requests.get(f"{self.backend_url}/bookmarks", timeout=10)
                if verify_response.status_code == 200:
                    bookmarks = verify_response.json()
                    bookmark = next((b for b in bookmarks if b['id'] == test_bookmark_id), None)
                    if bookmark:
                        toggle_results.append(f"Nach 2. LOCK: is_locked={bookmark.get('is_locked')}, status_type='{bookmark.get('status_type')}'")
            
            success = len(toggle_results) == 3
            self.log_result(
                "Toggle Lock/Unlock - Mehrfaches Sperren/Entsperren",
                success,
                f"Toggle-Test für Bookmark {test_bookmark_id}: {' → '.join(toggle_results)}",
                {"bookmark_id": test_bookmark_id, "toggle_sequence": toggle_results}
            )
            return success
            
        except Exception as e:
            self.log_result(
                "Toggle Lock/Unlock - Mehrfaches Sperren/Entsperren",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_consistency_check(self):
        """5. Konsistenz-Prüfung zwischen is_locked und status_type"""
        try:
            response = requests.get(f"{self.backend_url}/bookmarks", timeout=10)
            
            if response.status_code == 200:
                bookmarks = response.json()
                inconsistencies = []
                
                for bookmark in bookmarks:
                    is_locked = bookmark.get('is_locked', False)
                    status_type = bookmark.get('status_type', 'active')
                    
                    # Prüfe Konsistenz
                    if is_locked and status_type != 'locked':
                        inconsistencies.append({
                            "id": bookmark['id'],
                            "title": bookmark.get('title', 'Unknown'),
                            "issue": f"is_locked=True but status_type='{status_type}'"
                        })
                    elif not is_locked and status_type == 'locked':
                        inconsistencies.append({
                            "id": bookmark['id'],
                            "title": bookmark.get('title', 'Unknown'),
                            "issue": f"is_locked=False but status_type='locked'"
                        })
                
                if len(inconsistencies) == 0:
                    self.log_result(
                        "Konsistenz-Prüfung is_locked ↔ status_type",
                        True,
                        f"Alle {len(bookmarks)} Bookmarks sind konsistent",
                        {"total_bookmarks": len(bookmarks), "inconsistencies": 0}
                    )
                    return True
                else:
                    self.log_result(
                        "Konsistenz-Prüfung is_locked ↔ status_type",
                        False,
                        f"{len(inconsistencies)} Inkonsistenzen gefunden von {len(bookmarks)} Bookmarks",
                        {"total_bookmarks": len(bookmarks), "inconsistencies": inconsistencies}
                    )
                    return False
            else:
                self.log_result(
                    "Konsistenz-Prüfung is_locked ↔ status_type",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Konsistenz-Prüfung is_locked ↔ status_type",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_delete_protection(self):
        """6. Löschschutz für gesperrte Bookmarks testen"""
        # Erstelle ein neues gesperrtes Bookmark für diesen Test
        if not self.unlocked_bookmark_ids:
            self.log_result(
                "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                False,
                "Keine entsperrten Bookmarks zum Sperren und Testen verfügbar"
            )
            return False
        
        # Verwende ein anderes Bookmark als die bereits getesteten
        available_bookmarks = [bid for bid in self.unlocked_bookmark_ids if bid not in self.locked_bookmark_ids]
        if not available_bookmarks:
            self.log_result(
                "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                False,
                "Keine verfügbaren Bookmarks für Delete Protection Test"
            )
            return False
            
        test_bookmark_id = available_bookmarks[0]
        
        # Erst das Bookmark sperren
        try:
            lock_response = requests.put(f"{self.backend_url}/bookmarks/{test_bookmark_id}/lock", timeout=10)
            if lock_response.status_code != 200:
                self.log_result(
                    "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                    False,
                    f"Konnte Bookmark {test_bookmark_id} nicht sperren für Test"
                )
                return False
        except Exception as e:
            self.log_result(
                "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                False,
                f"Exception beim Sperren: {str(e)}"
            )
            return False
        
        try:
            # Versuche das gesperrte Bookmark zu löschen
            response = requests.delete(f"{self.backend_url}/bookmarks/{test_bookmark_id}", timeout=10)
            
            if response.status_code == 403:
                # Erwarteter Fehler - Löschschutz funktioniert
                self.log_result(
                    "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                    True,
                    f"Löschschutz funktioniert: HTTP 403 für gesperrtes Bookmark {test_bookmark_id}",
                    {"bookmark_id": test_bookmark_id, "status_code": 403, "response": response.text}
                )
                return True
            elif response.status_code == 200:
                # Bookmark wurde gelöscht - Löschschutz funktioniert NICHT
                self.log_result(
                    "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                    False,
                    f"KRITISCH: Gesperrtes Bookmark {test_bookmark_id} wurde gelöscht! Löschschutz funktioniert nicht",
                    {"bookmark_id": test_bookmark_id, "status_code": 200, "response": response.text}
                )
                return False
            else:
                self.log_result(
                    "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                    False,
                    f"Unerwarteter HTTP Status {response.status_code}",
                    {"bookmark_id": test_bookmark_id, "status_code": response.status_code, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "DELETE Protection - Löschschutz für gesperrte Bookmarks",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def run_all_tests(self):
        """Führt alle Lock/Unlock Tests durch"""
        print("🔒 LOCK/UNLOCK SYSTEM TESTING - German Review Request")
        print("=" * 60)
        print(f"Backend URL: {self.backend_url}")
        print(f"Test Start: {datetime.now().isoformat()}")
        print()
        
        # Test-Sequenz
        tests = [
            ("1. Aktuelle gesperrte Bookmarks identifizieren", self.test_get_current_bookmarks),
            ("2. Lock Funktionalität testen", self.test_lock_functionality),
            ("3. Unlock Funktionalität testen", self.test_unlock_functionality),
            ("4. Toggle-Funktionalität testen", self.test_toggle_functionality),
            ("5. Konsistenz-Prüfung durchführen", self.test_consistency_check),
            ("6. Löschschutz testen", self.test_delete_protection)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n--- {test_name} ---")
            try:
                if test_func():
                    passed_tests += 1
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
        
        # Zusammenfassung
        print("\n" + "=" * 60)
        print("🔒 LOCK/UNLOCK SYSTEM TEST ZUSAMMENFASSUNG")
        print("=" * 60)
        print(f"Tests bestanden: {passed_tests}/{total_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("✅ ALLE TESTS BESTANDEN - Lock/Unlock System funktioniert korrekt")
        else:
            print("❌ TESTS FEHLGESCHLAGEN - Lock/Unlock System hat Probleme")
            print("\nFEHLERHAFTE TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print(f"\nTest Ende: {datetime.now().isoformat()}")
        return passed_tests == total_tests

def main():
    """Hauptfunktion"""
    tester = LockUnlockTester()
    success = tester.run_all_tests()
    
    # Exit code für CI/CD
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()