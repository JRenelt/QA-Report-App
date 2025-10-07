#!/usr/bin/env python3
"""
Extended Search Functionality Test - German Review Request
Teste die erweiterte Suchfunktion die jetzt auch in Beschreibungen sucht
"""

import requests
import json
import time
from datetime import datetime

# Backend URL aus .env
BACKEND_URL = "https://qa-testing-hub.preview.emergentagent.com/api"

class ExtendedSearchTester:
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
        
    def test_search_endpoint_availability(self):
        """Teste ob der Search-Endpunkt verfügbar ist"""
        try:
            # Test mit einfachem Query
            response = self.session.get(f"{self.backend_url}/bookmarks/search/test")
            
            if response.status_code == 200:
                data = response.json()
                self.log_test(
                    "Search Endpoint Verfügbarkeit", 
                    True, 
                    f"Endpunkt verfügbar, {len(data)} Ergebnisse für 'test'",
                    {"result_count": len(data)}
                )
                return True
            elif response.status_code == 404:
                self.log_test("Search Endpoint Verfügbarkeit", False, "Endpunkt nicht gefunden (404)")
                return False
            else:
                self.log_test("Search Endpoint Verfügbarkeit", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Search Endpoint Verfügbarkeit", False, f"Exception: {str(e)}")
            return False
    
    def test_search_in_title(self):
        """Teste Suche in Titel-Feld"""
        try:
            # Suche nach "GitHub" - sollte in Titeln gefunden werden
            response = self.session.get(f"{self.backend_url}/bookmarks/search/GitHub")
            
            if response.status_code == 200:
                results = response.json()
                
                if not isinstance(results, list):
                    self.log_test("Suche in Titel", False, "Response ist keine Liste")
                    return False
                
                # Überprüfe ob Ergebnisse gefunden wurden
                if len(results) == 0:
                    self.log_test("Suche in Titel", False, "Keine Ergebnisse für 'GitHub' gefunden")
                    return False
                
                # Überprüfe ob mindestens ein Ergebnis "GitHub" im Titel hat
                title_matches = [r for r in results if "github" in r.get('title', '').lower()]
                
                if len(title_matches) == 0:
                    self.log_test("Suche in Titel", False, "Keine Titel-Matches für 'GitHub' gefunden")
                    return False
                
                self.log_test(
                    "Suche in Titel", 
                    True, 
                    f"✅ {len(results)} Ergebnisse gefunden, {len(title_matches)} Titel-Matches für 'GitHub'",
                    {"total_results": len(results), "title_matches": len(title_matches)}
                )
                return True
                
            else:
                self.log_test("Suche in Titel", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Suche in Titel", False, f"Exception: {str(e)}")
            return False
    
    def test_search_in_url(self):
        """Teste Suche in URL-Feld"""
        try:
            # Suche nach "google" - sollte in URLs gefunden werden
            response = self.session.get(f"{self.backend_url}/bookmarks/search/google")
            
            if response.status_code == 200:
                results = response.json()
                
                if len(results) == 0:
                    self.log_test("Suche in URL", False, "Keine Ergebnisse für 'google' gefunden")
                    return False
                
                # Überprüfe ob mindestens ein Ergebnis "google" in der URL hat
                url_matches = [r for r in results if "google" in r.get('url', '').lower()]
                
                if len(url_matches) == 0:
                    self.log_test("Suche in URL", False, "Keine URL-Matches für 'google' gefunden")
                    return False
                
                self.log_test(
                    "Suche in URL", 
                    True, 
                    f"✅ {len(results)} Ergebnisse gefunden, {len(url_matches)} URL-Matches für 'google'",
                    {"total_results": len(results), "url_matches": len(url_matches)}
                )
                return True
                
            else:
                self.log_test("Suche in URL", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Suche in URL", False, f"Exception: {str(e)}")
            return False
    
    def test_search_in_category(self):
        """Teste Suche in Kategorie-Feld"""
        try:
            # Suche nach "Development" - sollte in Kategorien gefunden werden
            response = self.session.get(f"{self.backend_url}/bookmarks/search/Development")
            
            if response.status_code == 200:
                results = response.json()
                
                if len(results) == 0:
                    self.log_test("Suche in Kategorie", False, "Keine Ergebnisse für 'Development' gefunden")
                    return False
                
                # Überprüfe ob mindestens ein Ergebnis "Development" in der Kategorie hat
                category_matches = [r for r in results if "development" in r.get('category', '').lower()]
                
                if len(category_matches) == 0:
                    self.log_test("Suche in Kategorie", False, "Keine Kategorie-Matches für 'Development' gefunden")
                    return False
                
                self.log_test(
                    "Suche in Kategorie", 
                    True, 
                    f"✅ {len(results)} Ergebnisse gefunden, {len(category_matches)} Kategorie-Matches für 'Development'",
                    {"total_results": len(results), "category_matches": len(category_matches)}
                )
                return True
                
            else:
                self.log_test("Suche in Kategorie", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Suche in Kategorie", False, f"Exception: {str(e)}")
            return False
    
    def test_search_in_subcategory(self):
        """Teste Suche in Unterkategorie-Feld"""
        try:
            # Suche nach "Code" - sollte in Unterkategorien gefunden werden
            response = self.session.get(f"{self.backend_url}/bookmarks/search/Code")
            
            if response.status_code == 200:
                results = response.json()
                
                if len(results) == 0:
                    self.log_test("Suche in Unterkategorie", False, "Keine Ergebnisse für 'Code' gefunden")
                    return False
                
                # Überprüfe ob mindestens ein Ergebnis "Code" in der Unterkategorie hat
                subcategory_matches = [r for r in results if r.get('subcategory') and "code" in r.get('subcategory', '').lower()]
                
                if len(subcategory_matches) == 0:
                    self.log_test("Suche in Unterkategorie", False, "Keine Unterkategorie-Matches für 'Code' gefunden")
                    return False
                
                self.log_test(
                    "Suche in Unterkategorie", 
                    True, 
                    f"✅ {len(results)} Ergebnisse gefunden, {len(subcategory_matches)} Unterkategorie-Matches für 'Code'",
                    {"total_results": len(results), "subcategory_matches": len(subcategory_matches)}
                )
                return True
                
            else:
                self.log_test("Suche in Unterkategorie", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Suche in Unterkategorie", False, f"Exception: {str(e)}")
            return False
    
    def test_search_in_description(self):
        """HAUPTTEST: Teste Suche in Beschreibung-Feld (NEUE FUNKTIONALITÄT)"""
        try:
            # Erst prüfen ob Bookmarks mit Beschreibungen existieren
            all_bookmarks_response = self.session.get(f"{self.backend_url}/bookmarks")
            if all_bookmarks_response.status_code != 200:
                self.log_test("Suche in Beschreibung", False, "Konnte Bookmarks nicht abrufen")
                return False
            
            all_bookmarks = all_bookmarks_response.json()
            bookmarks_with_description = [b for b in all_bookmarks if b.get('description')]
            
            if len(bookmarks_with_description) == 0:
                self.log_test("Suche in Beschreibung", False, "Keine Bookmarks mit Beschreibungen gefunden")
                return False
            
            # Suche nach einem Begriff der wahrscheinlich in Beschreibungen vorkommt
            search_terms = ["repository", "platform", "tool", "service", "website"]
            
            for term in search_terms:
                response = self.session.get(f"{self.backend_url}/bookmarks/search/{term}")
                
                if response.status_code == 200:
                    results = response.json()
                    
                    if len(results) > 0:
                        # Überprüfe ob mindestens ein Ergebnis den Begriff in der Beschreibung hat
                        description_matches = [r for r in results if r.get('description') and term.lower() in r.get('description', '').lower()]
                        
                        if len(description_matches) > 0:
                            self.log_test(
                                "Suche in Beschreibung", 
                                True, 
                                f"✅ NEUE FUNKTIONALITÄT FUNKTIONIERT: {len(results)} Ergebnisse für '{term}', {len(description_matches)} Beschreibung-Matches",
                                {"search_term": term, "total_results": len(results), "description_matches": len(description_matches)}
                            )
                            return True
            
            # Wenn keine Beschreibung-Matches gefunden wurden, teste mit einem spezifischen Begriff
            # Erstelle ein Test-Bookmark mit Beschreibung
            test_bookmark = {
                "title": "Test Bookmark für Beschreibungssuche",
                "url": "https://test-description-search.example.com",
                "category": "Testing",
                "description": "Dies ist eine Testbeschreibung mit dem Wort BESCHREIBUNGSTEST"
            }
            
            create_response = self.session.post(f"{self.backend_url}/bookmarks", json=test_bookmark)
            if create_response.status_code == 200:
                # Suche nach dem spezifischen Begriff
                search_response = self.session.get(f"{self.backend_url}/bookmarks/search/BESCHREIBUNGSTEST")
                
                if search_response.status_code == 200:
                    search_results = search_response.json()
                    description_matches = [r for r in search_results if r.get('description') and "BESCHREIBUNGSTEST" in r.get('description', '')]
                    
                    if len(description_matches) > 0:
                        self.log_test(
                            "Suche in Beschreibung", 
                            True, 
                            f"✅ NEUE FUNKTIONALITÄT FUNKTIONIERT: Test-Bookmark mit Beschreibung gefunden",
                            {"description_matches": len(description_matches)}
                        )
                        return True
            
            self.log_test("Suche in Beschreibung", False, "Keine Beschreibung-Matches gefunden - Funktionalität möglicherweise nicht implementiert")
            return False
                
        except Exception as e:
            self.log_test("Suche in Beschreibung", False, f"Exception: {str(e)}")
            return False
    
    def test_case_insensitive_search(self):
        """Teste Case-Insensitive Suche"""
        try:
            # Teste verschiedene Schreibweisen
            test_cases = [
                ("github", "GitHub"),
                ("DEVELOPMENT", "development"),
                ("Google", "GOOGLE")
            ]
            
            for lowercase_term, uppercase_term in test_cases:
                # Suche mit Kleinschreibung
                lower_response = self.session.get(f"{self.backend_url}/bookmarks/search/{lowercase_term}")
                # Suche mit Großschreibung
                upper_response = self.session.get(f"{self.backend_url}/bookmarks/search/{uppercase_term}")
                
                if lower_response.status_code == 200 and upper_response.status_code == 200:
                    lower_results = lower_response.json()
                    upper_results = upper_response.json()
                    
                    # Beide Suchen sollten die gleiche Anzahl Ergebnisse liefern
                    if len(lower_results) == len(upper_results) and len(lower_results) > 0:
                        self.log_test(
                            "Case-Insensitive Suche", 
                            True, 
                            f"✅ Case-Insensitive funktioniert: '{lowercase_term}' und '{uppercase_term}' liefern beide {len(lower_results)} Ergebnisse",
                            {"term_pair": f"{lowercase_term}/{uppercase_term}", "result_count": len(lower_results)}
                        )
                        return True
            
            self.log_test("Case-Insensitive Suche", False, "Case-Insensitive Suche funktioniert nicht korrekt")
            return False
                
        except Exception as e:
            self.log_test("Case-Insensitive Suche", False, f"Exception: {str(e)}")
            return False
    
    def test_comprehensive_search_functionality(self):
        """Umfassender Test der erweiterten Suchfunktionalität"""
        try:
            # Teste verschiedene Suchbegriffe die in verschiedenen Feldern vorkommen sollten
            comprehensive_tests = [
                {
                    "term": "development",
                    "expected_fields": ["title", "category", "subcategory", "description"],
                    "min_results": 1
                },
                {
                    "term": "news",
                    "expected_fields": ["title", "category", "url"],
                    "min_results": 1
                },
                {
                    "term": "social",
                    "expected_fields": ["category", "subcategory"],
                    "min_results": 1
                }
            ]
            
            all_tests_passed = True
            
            for test_case in comprehensive_tests:
                term = test_case["term"]
                expected_fields = test_case["expected_fields"]
                min_results = test_case["min_results"]
                
                response = self.session.get(f"{self.backend_url}/bookmarks/search/{term}")
                
                if response.status_code == 200:
                    results = response.json()
                    
                    if len(results) < min_results:
                        self.log_test(
                            f"Umfassende Suche ({term})", 
                            False, 
                            f"Zu wenige Ergebnisse: {len(results)}, erwartet mindestens {min_results}"
                        )
                        all_tests_passed = False
                        continue
                    
                    # Überprüfe ob der Begriff in den erwarteten Feldern gefunden wird
                    field_matches = {}
                    for field in expected_fields:
                        field_matches[field] = 0
                        for result in results:
                            field_value = result.get(field, "")
                            if field_value and term.lower() in field_value.lower():
                                field_matches[field] += 1
                    
                    # Mindestens ein Feld sollte Matches haben
                    total_field_matches = sum(field_matches.values())
                    if total_field_matches == 0:
                        self.log_test(
                            f"Umfassende Suche ({term})", 
                            False, 
                            f"Keine Matches in erwarteten Feldern: {expected_fields}"
                        )
                        all_tests_passed = False
                    else:
                        self.log_test(
                            f"Umfassende Suche ({term})", 
                            True, 
                            f"✅ {len(results)} Ergebnisse, Matches in Feldern: {field_matches}",
                            {"term": term, "results": len(results), "field_matches": field_matches}
                        )
                else:
                    self.log_test(f"Umfassende Suche ({term})", False, f"HTTP {response.status_code}")
                    all_tests_passed = False
            
            return all_tests_passed
                
        except Exception as e:
            self.log_test("Umfassende Suche", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Alle Extended Search Tests ausführen"""
        print("🎯 EXTENDED SEARCH FUNCTIONALITY TESTING GESTARTET")
        print(f"Backend URL: {self.backend_url}")
        print("=" * 80)
        
        # Test-Reihenfolge für Extended Search
        tests = [
            ("Search Endpoint Verfügbarkeit", self.test_search_endpoint_availability),
            ("Suche in Titel", self.test_search_in_title),
            ("Suche in URL", self.test_search_in_url),
            ("Suche in Kategorie", self.test_search_in_category),
            ("Suche in Unterkategorie", self.test_search_in_subcategory),
            ("Suche in Beschreibung (NEU)", self.test_search_in_description),
            ("Case-Insensitive Suche", self.test_case_insensitive_search),
            ("Umfassende Suchfunktionalität", self.test_comprehensive_search_functionality)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 Testing: {test_name}")
            try:
                if test_func():
                    passed_tests += 1
                time.sleep(0.5)  # Kurze Pause zwischen Tests
            except Exception as e:
                print(f"❌ Test {test_name} failed with exception: {e}")
        
        # Zusammenfassung
        print("\n" + "=" * 80)
        print("🎯 EXTENDED SEARCH TESTING ZUSAMMENFASSUNG")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"Tests bestanden: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 90:
            print("✅ ERWEITERTE SUCHFUNKTION VOLLSTÄNDIG FUNKTIONAL!")
        elif success_rate >= 70:
            print("⚠️  ERWEITERTE SUCHFUNKTION TEILWEISE FUNKTIONAL")
        else:
            print("❌ ERWEITERTE SUCHFUNKTION FEHLGESCHLAGEN")
        
        # Detaillierte Ergebnisse
        print("\nDetaillierte Test-Ergebnisse:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['details']}")
        
        return success_rate >= 70

if __name__ == "__main__":
    tester = ExtendedSearchTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎉 ERWEITERTE SUCHFUNKTION ERFOLGREICH GETESTET!")
    else:
        print("\n⚠️  ERWEITERTE SUCHFUNKTION BENÖTIGT FIXES")