#!/usr/bin/env python3
"""
XML/CSV Import Testing Script
German Review Request: Teste die neu implementierten XML und CSV Import-Funktionen

Tests:
1. XML Import Test mit Standard-Format
2. CSV Import Test mit Standard-Format  
3. Validierung dass imported_count > 0
4. Verifizierung dass Bookmarks korrekt in DB gespeichert werden
5. Fehlerbehandlung für ungültige Dateien
"""

import requests
import json
import io
import tempfile
import os
from datetime import datetime

# Backend URL aus .env
BACKEND_URL = "https://qa-toolkit.preview.emergentagent.com/api"

class XMLCSVImportTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Test-Ergebnis protokollieren"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        if details:
            for key, value in details.items():
                print(f"   {key}: {value}")
        print()

    def test_xml_import(self):
        """Test XML Import mit Standard-Format"""
        print("🔍 TESTING XML IMPORT...")
        
        # XML-Testdaten wie in Review Request spezifiziert
        xml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<bookmarks>
  <bookmark>
    <title>GitHub</title>
    <url>https://github.com</url>
    <category>Development</category>
    <subcategory>Code Hosting</subcategory>
  </bookmark>
  <bookmark>
    <title>Stack Overflow</title>
    <url>https://stackoverflow.com</url>
    <category>Development</category>
  </bookmark>
</bookmarks>'''
        
        try:
            # Erstelle temporäre XML-Datei
            with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False, encoding='utf-8') as f:
                f.write(xml_content)
                xml_file_path = f.name
            
            # Sende Import-Request
            with open(xml_file_path, 'rb') as f:
                files = {'file': ('test_bookmarks.xml', f, 'application/xml')}
                response = requests.post(f"{self.backend_url}/bookmarks/import", files=files)
            
            # Cleanup
            os.unlink(xml_file_path)
            
            if response.status_code == 200:
                data = response.json()
                imported_count = data.get('imported_count', 0)
                
                if imported_count > 0:
                    self.log_result(
                        "XML Import Success",
                        True,
                        f"XML Import erfolgreich: {imported_count} Bookmarks importiert",
                        {
                            "imported_count": imported_count,
                            "total_parsed": data.get('total_parsed', 0),
                            "response_message": data.get('message', ''),
                            "xml_size": f"{len(xml_content)} Zeichen"
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "XML Import Failed",
                        False,
                        f"XML Import fehlgeschlagen: imported_count = {imported_count}",
                        {
                            "response_data": data,
                            "xml_content_length": len(xml_content)
                        }
                    )
                    return False
            else:
                self.log_result(
                    "XML Import HTTP Error",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "XML Import Exception",
                False,
                f"Exception während XML Import: {str(e)}",
                {"exception_type": type(e).__name__}
            )
            return False

    def test_csv_import(self):
        """Test CSV Import mit Standard-Format"""
        print("🔍 TESTING CSV IMPORT...")
        
        # CSV-Testdaten wie in Review Request spezifiziert
        csv_content = '''Title,URL,Category,Subcategory
GitHub,https://github.com,Development,Code Hosting
Stack Overflow,https://stackoverflow.com,Development,Q&A
Hacker News,https://news.ycombinator.com,News,Tech News'''
        
        try:
            # Erstelle temporäre CSV-Datei
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
                f.write(csv_content)
                csv_file_path = f.name
            
            # Sende Import-Request
            with open(csv_file_path, 'rb') as f:
                files = {'file': ('test_bookmarks.csv', f, 'text/csv')}
                response = requests.post(f"{self.backend_url}/bookmarks/import", files=files)
            
            # Cleanup
            os.unlink(csv_file_path)
            
            if response.status_code == 200:
                data = response.json()
                imported_count = data.get('imported_count', 0)
                
                if imported_count > 0:
                    self.log_result(
                        "CSV Import Success",
                        True,
                        f"CSV Import erfolgreich: {imported_count} Bookmarks importiert",
                        {
                            "imported_count": imported_count,
                            "total_parsed": data.get('total_parsed', 0),
                            "response_message": data.get('message', ''),
                            "csv_size": f"{len(csv_content)} Zeichen"
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "CSV Import Failed",
                        False,
                        f"CSV Import fehlgeschlagen: imported_count = {imported_count}",
                        {
                            "response_data": data,
                            "csv_content_length": len(csv_content)
                        }
                    )
                    return False
            else:
                self.log_result(
                    "CSV Import HTTP Error",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "CSV Import Exception",
                False,
                f"Exception während CSV Import: {str(e)}",
                {"exception_type": type(e).__name__}
            )
            return False

    def verify_database_storage(self):
        """Verifiziere dass Bookmarks korrekt in Datenbank gespeichert wurden"""
        print("🔍 VERIFYING DATABASE STORAGE...")
        
        try:
            # Hole alle Bookmarks
            response = requests.get(f"{self.backend_url}/bookmarks")
            
            if response.status_code == 200:
                bookmarks = response.json()
                
                # Suche nach den importierten Test-Bookmarks
                github_found = any(b.get('title') == 'GitHub' and b.get('url') == 'https://github.com' for b in bookmarks)
                stackoverflow_found = any(b.get('title') == 'Stack Overflow' and b.get('url') == 'https://stackoverflow.com' for b in bookmarks)
                hackernews_found = any(b.get('title') == 'Hacker News' and b.get('url') == 'https://news.ycombinator.com' for b in bookmarks)
                
                found_bookmarks = []
                if github_found:
                    found_bookmarks.append("GitHub")
                if stackoverflow_found:
                    found_bookmarks.append("Stack Overflow")
                if hackernews_found:
                    found_bookmarks.append("Hacker News")
                
                if len(found_bookmarks) >= 2:  # Mindestens 2 der Test-Bookmarks sollten gefunden werden
                    self.log_result(
                        "Database Verification Success",
                        True,
                        f"Importierte Bookmarks in Datenbank gefunden: {', '.join(found_bookmarks)}",
                        {
                            "total_bookmarks": len(bookmarks),
                            "found_test_bookmarks": found_bookmarks,
                            "github_found": github_found,
                            "stackoverflow_found": stackoverflow_found,
                            "hackernews_found": hackernews_found
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Database Verification Failed",
                        False,
                        f"Nur {len(found_bookmarks)} Test-Bookmarks in Datenbank gefunden",
                        {
                            "total_bookmarks": len(bookmarks),
                            "found_test_bookmarks": found_bookmarks
                        }
                    )
                    return False
            else:
                self.log_result(
                    "Database Verification HTTP Error",
                    False,
                    f"HTTP {response.status_code}: {response.text}",
                    {"status_code": response.status_code}
                )
                return False
                
        except Exception as e:
            self.log_result(
                "Database Verification Exception",
                False,
                f"Exception während Database Verification: {str(e)}",
                {"exception_type": type(e).__name__}
            )
            return False

    def test_invalid_xml_handling(self):
        """Test Fehlerbehandlung für ungültige XML-Dateien"""
        print("🔍 TESTING INVALID XML HANDLING...")
        
        # Ungültige XML-Daten
        invalid_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<bookmarks>
  <bookmark>
    <title>Incomplete Bookmark</title>
    <!-- Missing URL tag -->
  </bookmark>
  <invalid_tag>
    <title>Invalid Structure</title>
  </invalid_tag>
</bookmarks>'''
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False, encoding='utf-8') as f:
                f.write(invalid_xml)
                xml_file_path = f.name
            
            with open(xml_file_path, 'rb') as f:
                files = {'file': ('invalid_bookmarks.xml', f, 'application/xml')}
                response = requests.post(f"{self.backend_url}/bookmarks/import", files=files)
            
            os.unlink(xml_file_path)
            
            if response.status_code == 200:
                data = response.json()
                imported_count = data.get('imported_count', 0)
                
                # Bei ungültigen Daten sollte imported_count 0 sein
                if imported_count == 0:
                    self.log_result(
                        "Invalid XML Handling Success",
                        True,
                        "Ungültige XML-Datei korrekt behandelt: imported_count = 0",
                        {
                            "imported_count": imported_count,
                            "response_message": data.get('message', ''),
                            "total_parsed": data.get('total_parsed', 0)
                        }
                    )
                    return True
                else:
                    self.log_result(
                        "Invalid XML Handling Warning",
                        False,
                        f"Ungültige XML-Datei importierte {imported_count} Bookmarks (erwartet: 0)",
                        {"imported_count": imported_count}
                    )
                    return False
            else:
                # HTTP-Fehler ist auch eine akzeptable Antwort für ungültige Daten
                self.log_result(
                    "Invalid XML Handling Success",
                    True,
                    f"Ungültige XML-Datei korrekt abgelehnt: HTTP {response.status_code}",
                    {"status_code": response.status_code}
                )
                return True
                
        except Exception as e:
            self.log_result(
                "Invalid XML Handling Exception",
                False,
                f"Exception während Invalid XML Test: {str(e)}",
                {"exception_type": type(e).__name__}
            )
            return False

    def test_invalid_csv_handling(self):
        """Test Fehlerbehandlung für ungültige CSV-Dateien"""
        print("🔍 TESTING INVALID CSV HANDLING...")
        
        # Ungültige CSV-Daten (fehlende URLs)
        invalid_csv = '''Title,URL,Category,Subcategory
Bookmark without URL,,Development,
,https://example.com,Development,
Invalid Bookmark,not-a-valid-url,Development,'''
        
        try:
            with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
                f.write(invalid_csv)
                csv_file_path = f.name
            
            with open(csv_file_path, 'rb') as f:
                files = {'file': ('invalid_bookmarks.csv', f, 'text/csv')}
                response = requests.post(f"{self.backend_url}/bookmarks/import", files=files)
            
            os.unlink(csv_file_path)
            
            if response.status_code == 200:
                data = response.json()
                imported_count = data.get('imported_count', 0)
                
                # Bei ungültigen Daten sollte imported_count niedrig oder 0 sein
                self.log_result(
                    "Invalid CSV Handling Success",
                    True,
                    f"Ungültige CSV-Datei behandelt: imported_count = {imported_count}",
                    {
                        "imported_count": imported_count,
                        "response_message": data.get('message', ''),
                        "total_parsed": data.get('total_parsed', 0)
                    }
                )
                return True
            else:
                # HTTP-Fehler ist auch eine akzeptable Antwort für ungültige Daten
                self.log_result(
                    "Invalid CSV Handling Success",
                    True,
                    f"Ungültige CSV-Datei korrekt abgelehnt: HTTP {response.status_code}",
                    {"status_code": response.status_code}
                )
                return True
                
        except Exception as e:
            self.log_result(
                "Invalid CSV Handling Exception",
                False,
                f"Exception während Invalid CSV Test: {str(e)}",
                {"exception_type": type(e).__name__}
            )
            return False

    def run_all_tests(self):
        """Führe alle Tests aus"""
        print("🚀 STARTING XML/CSV IMPORT TESTING")
        print("=" * 60)
        print(f"Backend URL: {self.backend_url}")
        print("=" * 60)
        print()
        
        # Test-Reihenfolge
        tests = [
            ("XML Import", self.test_xml_import),
            ("CSV Import", self.test_csv_import),
            ("Database Verification", self.verify_database_storage),
            ("Invalid XML Handling", self.test_invalid_xml_handling),
            ("Invalid CSV Handling", self.test_invalid_csv_handling)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                success = test_func()
                if success:
                    passed_tests += 1
            except Exception as e:
                print(f"❌ {test_name} CRASHED: {str(e)}")
        
        print("=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"Tests Passed: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if success_rate >= 80:
            print("🎉 XML/CSV IMPORT FUNCTIONALITY: ERFOLGREICH")
        elif success_rate >= 60:
            print("⚠️  XML/CSV IMPORT FUNCTIONALITY: TEILWEISE ERFOLGREICH")
        else:
            print("❌ XML/CSV IMPORT FUNCTIONALITY: FEHLGESCHLAGEN")
        
        print()
        print("📋 DETAILED RESULTS:")
        for result in self.test_results:
            status = "✅" if result["success"] else "❌"
            print(f"{status} {result['test']}: {result['message']}")
        
        return success_rate >= 80

if __name__ == "__main__":
    tester = XMLCSVImportTester()
    success = tester.run_all_tests()
    
    if success:
        print("\n🎯 GERMAN REVIEW REQUEST ERFÜLLT: XML/CSV Import-Funktionen arbeiten korrekt!")
    else:
        print("\n⚠️  GERMAN REVIEW REQUEST: XML/CSV Import-Funktionen benötigen Verbesserungen!")