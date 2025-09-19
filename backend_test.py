#!/usr/bin/env python3
"""
Backend Test Suite für FavLink Manager Drag & Drop System
Testet Kategorie Drag & Drop System umfassend gemäß German Review Request

Problem: User berichtet Verschieben funktioniert nicht (OF) und "Alle" Cross-Over funktioniert nicht.
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Backend URL aus .env Datei
BACKEND_URL = "https://favorg-rebuild.preview.emergentagent.com/api"

class DragDropTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        self.available_categories = []
        
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
    
    def test_categories_database_check(self):
        """1. Kategorien-Datenbank Prüfung - GET /api/categories"""
        try:
            response = requests.get(f"{self.backend_url}/categories", timeout=10)
            
            if response.status_code == 200:
                categories = response.json()
                self.available_categories = categories
                
                if len(categories) == 0:
                    self.log_result(
                        "GET /api/categories - Kategorien-Datenbank Prüfung",
                        False,
                        "Kategorien-Datenbank ist leer - Initialisierung erforderlich",
                        {"categories_count": 0, "needs_initialization": True}
                    )
                    return False
                else:
                    # Analysiere Kategorien-Struktur
                    root_categories = [c for c in categories if not c.get('parent_category')]
                    sub_categories = [c for c in categories if c.get('parent_category')]
                    
                    self.log_result(
                        "GET /api/categories - Kategorien-Datenbank Prüfung",
                        True,
                        f"Kategorien gefunden: {len(categories)} total ({len(root_categories)} Hauptkategorien, {len(sub_categories)} Unterkategorien)",
                        {
                            "total_categories": len(categories),
                            "root_categories": len(root_categories),
                            "sub_categories": len(sub_categories),
                            "category_names": [c.get('name', 'Unknown') for c in categories[:5]]  # Erste 5 für Debug
                        }
                    )
                    return True
            else:
                self.log_result(
                    "GET /api/categories - Kategorien-Datenbank Prüfung",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "GET /api/categories - Kategorien-Datenbank Prüfung",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_categories_initialization(self):
        """2. Kategorien-Initialisierung - POST /api/categories/initialize"""
        if len(self.available_categories) > 0:
            self.log_result(
                "POST /api/categories/initialize - Kategorien-Initialisierung",
                True,
                "Kategorien bereits vorhanden - Initialisierung übersprungen",
                {"categories_count": len(self.available_categories)}
            )
            return True
        
        try:
            response = requests.post(f"{self.backend_url}/categories/initialize", timeout=15)
            
            if response.status_code == 200:
                result = response.json()
                
                # Prüfe erneut die Kategorien nach Initialisierung
                verify_response = requests.get(f"{self.backend_url}/categories", timeout=10)
                if verify_response.status_code == 200:
                    self.available_categories = verify_response.json()
                    
                    self.log_result(
                        "POST /api/categories/initialize - Kategorien-Initialisierung",
                        True,
                        f"Kategorien erfolgreich initialisiert: {result.get('message', 'Success')}",
                        {
                            "initialization_result": result,
                            "categories_after_init": len(self.available_categories)
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "POST /api/categories/initialize - Kategorien-Initialisierung",
                        False,
                        "Initialisierung erfolgreich, aber Verifikation fehlgeschlagen"
                    )
                    return False
            else:
                self.log_result(
                    "POST /api/categories/initialize - Kategorien-Initialisierung",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result(
                "POST /api/categories/initialize - Kategorien-Initialisierung",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    def test_cross_level_sort_to_root(self):
        """3. Cross-Level Sort API Test - Verschiebung auf "root" level"""
        if len(self.available_categories) == 0:
            self.log_result(
                "PUT /api/categories/cross-level-sort - Verschiebung auf Root Level",
                False,
                "Keine Kategorien verfügbar für Test"
            )
            return False
        
        # Finde eine geeignete Kategorie zum Verschieben (bevorzugt Unterkategorie)
        test_category = None
        for category in self.available_categories:
            if category.get('parent_category'):  # Unterkategorie
                test_category = category
                break
        
        if not test_category:
            # Falls keine Unterkategorie, nimm erste verfügbare
            test_category = self.available_categories[0]
        
        test_payload = {
            "dragged_category": test_category.get('name', 'Testing'),
            "target_category": "Alle",
            "operation_mode": "standard",
            "target_level": "root"
        }
        
        try:
            response = requests.put(
                f"{self.backend_url}/categories/cross-level-sort",
                json=test_payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Verifikation: Prüfe ob Kategorie tatsächlich auf Root-Level verschoben wurde
                verify_response = requests.get(f"{self.backend_url}/categories", timeout=10)
                if verify_response.status_code == 200:
                    updated_categories = verify_response.json()
                    moved_category = next((c for c in updated_categories if c.get('name') == test_category.get('name')), None)
                    
                    if moved_category and not moved_category.get('parent_category'):
                        self.log_result(
                            "PUT /api/categories/cross-level-sort - Verschiebung auf Root Level",
                            True,
                            f"Kategorie '{test_category.get('name')}' erfolgreich auf Root-Level verschoben",
                            {
                                "test_payload": test_payload,
                                "api_response": result,
                                "verification": "Category moved to root level successfully"
                            }
                        )
                        return True
                    else:
                        self.log_result(
                            "PUT /api/categories/cross-level-sort - Verschiebung auf Root Level",
                            False,
                            f"Kategorie '{test_category.get('name')}' wurde nicht korrekt auf Root-Level verschoben",
                            {
                                "test_payload": test_payload,
                                "api_response": result,
                                "moved_category": moved_category
                            }
                        )
                        return False
                else:
                    self.log_result(
                        "PUT /api/categories/cross-level-sort - Verschiebung auf Root Level",
                        False,
                        "API-Aufruf erfolgreich, aber Verifikation fehlgeschlagen"
                    )
                    return False
            else:
                self.log_result(
                    "PUT /api/categories/cross-level-sort - Verschiebung auf Root Level",
                    False,
                    f"HTTP {response.status_code}",
                    {"test_payload": test_payload, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "PUT /api/categories/cross-level-sort - Verschiebung auf Root Level",
                False,
                f"Exception: {str(e)}",
                {"test_payload": test_payload}
            )
            return False
    
    def test_standard_drag_drop(self):
        """4. Standard Drag & Drop Test - Normale Kategorie-Verschiebung zwischen Ebenen"""
        if len(self.available_categories) < 2:
            self.log_result(
                "PUT /api/categories/cross-level-sort - Standard Drag & Drop",
                False,
                "Mindestens 2 Kategorien erforderlich für Standard Drag & Drop Test"
            )
            return False
        
        # Finde zwei verschiedene Kategorien für den Test
        dragged_category = None
        target_category = None
        
        for category in self.available_categories:
            if not dragged_category:
                dragged_category = category
            elif category.get('name') != dragged_category.get('name'):
                target_category = category
                break
        
        if not dragged_category or not target_category:
            self.log_result(
                "PUT /api/categories/cross-level-sort - Standard Drag & Drop",
                False,
                "Konnte keine geeigneten Kategorien für Test finden"
            )
            return False
        
        test_payload = {
            "dragged_category": dragged_category.get('name'),
            "target_category": target_category.get('name'),
            "operation_mode": "standard",
            "target_level": "child"
        }
        
        try:
            response = requests.put(
                f"{self.backend_url}/categories/cross-level-sort",
                json=test_payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Verifikation: Prüfe ob Kategorie als Unterkategorie verschoben wurde
                verify_response = requests.get(f"{self.backend_url}/categories", timeout=10)
                if verify_response.status_code == 200:
                    updated_categories = verify_response.json()
                    moved_category = next((c for c in updated_categories if c.get('name') == dragged_category.get('name')), None)
                    
                    if moved_category and moved_category.get('parent_category') == target_category.get('name'):
                        self.log_result(
                            "PUT /api/categories/cross-level-sort - Standard Drag & Drop",
                            True,
                            f"Kategorie '{dragged_category.get('name')}' erfolgreich als Unterkategorie von '{target_category.get('name')}' verschoben",
                            {
                                "test_payload": test_payload,
                                "api_response": result,
                                "verification": f"Category moved as child of {target_category.get('name')}"
                            }
                        )
                        return True
                    else:
                        self.log_result(
                            "PUT /api/categories/cross-level-sort - Standard Drag & Drop",
                            False,
                            f"Kategorie '{dragged_category.get('name')}' wurde nicht korrekt als Unterkategorie verschoben",
                            {
                                "test_payload": test_payload,
                                "api_response": result,
                                "moved_category": moved_category,
                                "expected_parent": target_category.get('name'),
                                "actual_parent": moved_category.get('parent_category') if moved_category else None
                            }
                        )
                        return False
                else:
                    self.log_result(
                        "PUT /api/categories/cross-level-sort - Standard Drag & Drop",
                        False,
                        "API-Aufruf erfolgreich, aber Verifikation fehlgeschlagen"
                    )
                    return False
            else:
                self.log_result(
                    "PUT /api/categories/cross-level-sort - Standard Drag & Drop",
                    False,
                    f"HTTP {response.status_code}",
                    {"test_payload": test_payload, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "PUT /api/categories/cross-level-sort - Standard Drag & Drop",
                False,
                f"Exception: {str(e)}",
                {"test_payload": test_payload}
            )
            return False
    
    def test_debug_backend_logs(self):
        """5. Debug Backend Logs - Prüfe Debug-Ausgaben in cross_level_sort_categories"""
        # Führe eine weitere Cross-Level Sort Operation durch und prüfe die Logs
        if len(self.available_categories) == 0:
            self.log_result(
                "Debug Backend Logs - Cross-Level Sort Debug-Ausgaben",
                False,
                "Keine Kategorien verfügbar für Debug-Test"
            )
            return False
        
        test_category = self.available_categories[0]
        
        test_payload = {
            "dragged_category": test_category.get('name'),
            "target_category": "Alle",
            "operation_mode": "standard",
            "target_level": "root"
        }
        
        try:
            # Führe Operation durch und prüfe Response für Debug-Informationen
            response = requests.put(
                f"{self.backend_url}/categories/cross-level-sort",
                json=test_payload,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                
                # Prüfe ob alle erwarteten Debug-Felder in der Response vorhanden sind
                expected_fields = ['message', 'operation_mode', 'target_level', 'new_parent', 'new_position']
                missing_fields = [field for field in expected_fields if field not in result]
                
                if len(missing_fields) == 0:
                    self.log_result(
                        "Debug Backend Logs - Cross-Level Sort Debug-Ausgaben",
                        True,
                        f"Debug-Informationen vollständig: {result}",
                        {
                            "test_payload": test_payload,
                            "debug_response": result,
                            "all_fields_present": True
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Debug Backend Logs - Cross-Level Sort Debug-Ausgaben",
                        False,
                        f"Debug-Informationen unvollständig - fehlende Felder: {missing_fields}",
                        {
                            "test_payload": test_payload,
                            "debug_response": result,
                            "missing_fields": missing_fields
                        }
                    )
                    return False
            else:
                self.log_result(
                    "Debug Backend Logs - Cross-Level Sort Debug-Ausgaben",
                    False,
                    f"HTTP {response.status_code}",
                    {"test_payload": test_payload, "response": response.text}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Debug Backend Logs - Cross-Level Sort Debug-Ausgaben",
                False,
                f"Exception: {str(e)}",
                {"test_payload": test_payload}
            )
            return False
    
    def test_alle_cross_over_functionality(self):
        """6. "Alle" Cross-Over Funktionalität - Spezialtest für "Alle" als target_category"""
        if len(self.available_categories) == 0:
            self.log_result(
                '"Alle" Cross-Over Funktionalität - Spezialtest',
                False,
                "Keine Kategorien verfügbar für 'Alle' Cross-Over Test"
            )
            return False
        
        # Teste verschiedene Kombinationen mit "Alle" als Target
        test_scenarios = [
            {
                "name": "Alle → Root Level",
                "payload": {
                    "dragged_category": self.available_categories[0].get('name'),
                    "target_category": "Alle",
                    "operation_mode": "standard",
                    "target_level": "root"
                }
            },
            {
                "name": "Alle → Same Level",
                "payload": {
                    "dragged_category": self.available_categories[0].get('name'),
                    "target_category": "Alle",
                    "operation_mode": "standard",
                    "target_level": "same"
                }
            }
        ]
        
        successful_scenarios = 0
        total_scenarios = len(test_scenarios)
        
        for scenario in test_scenarios:
            try:
                response = requests.put(
                    f"{self.backend_url}/categories/cross-level-sort",
                    json=scenario["payload"],
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    successful_scenarios += 1
                    print(f"  ✅ {scenario['name']}: {result.get('message', 'Success')}")
                else:
                    print(f"  ❌ {scenario['name']}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"  ❌ {scenario['name']}: Exception {str(e)}")
        
        success = successful_scenarios == total_scenarios
        self.log_result(
            '"Alle" Cross-Over Funktionalität - Spezialtest',
            success,
            f"'Alle' Cross-Over Tests: {successful_scenarios}/{total_scenarios} erfolgreich",
            {
                "successful_scenarios": successful_scenarios,
                "total_scenarios": total_scenarios,
                "success_rate": f"{(successful_scenarios/total_scenarios)*100:.1f}%"
            }
        )
        return success
    
    def run_all_tests(self):
        """Führt alle Drag & Drop Tests durch"""
        print("🎯 DRAG & DROP SYSTEM TESTING - German Review Request")
        print("=" * 70)
        print(f"Backend URL: {self.backend_url}")
        print(f"Test Start: {datetime.now().isoformat()}")
        print()
        print("Problem: User berichtet Verschieben funktioniert nicht (OF) und 'Alle' Cross-Over funktioniert nicht.")
        print()
        
        # Test-Sequenz
        tests = [
            ("1. Kategorien-Datenbank Prüfung", self.test_categories_database_check),
            ("2. Kategorien-Initialisierung (falls erforderlich)", self.test_categories_initialization),
            ("3. Cross-Level Sort auf Root Level", self.test_cross_level_sort_to_root),
            ("4. Standard Drag & Drop zwischen Ebenen", self.test_standard_drag_drop),
            ("5. Debug Backend Logs prüfen", self.test_debug_backend_logs),
            ("6. 'Alle' Cross-Over Funktionalität", self.test_alle_cross_over_functionality)
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
        print("\n" + "=" * 70)
        print("🎯 DRAG & DROP SYSTEM TEST ZUSAMMENFASSUNG")
        print("=" * 70)
        print(f"Tests bestanden: {passed_tests}/{total_tests}")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if passed_tests == total_tests:
            print("✅ ALLE TESTS BESTANDEN - Drag & Drop System funktioniert korrekt")
            print("   - Kategorien existieren in DB oder wurden initialisiert")
            print("   - Cross-Level Sort APIs funktionieren")
            print("   - MongoDB Updates werden korrekt ausgeführt")
            print("   - 'Alle' als target_category wird korrekt behandelt")
        else:
            print("❌ TESTS FEHLGESCHLAGEN - Drag & Drop System hat Probleme")
            print("\nFEHLERHAFTE TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['details']}")
        
        print(f"\nTest Ende: {datetime.now().isoformat()}")
        return passed_tests == total_tests

def main():
    """Hauptfunktion"""
    tester = DragDropTester()
    success = tester.run_all_tests()
    
    # Exit code für CI/CD
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()