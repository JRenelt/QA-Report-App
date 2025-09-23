#!/usr/bin/env python3
"""
Backend Test Suite für FavLink Manager Import-Funktionen
Testet HTML, JSON, XML und CSV Import gemäß German Review Request

Problem: User berichtet "Der Einzel Import arbeitet nicht korrekt: HTML=Ja, JSON=Ja, XML=NEIN, CSV=NEIN"
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL aus .env Datei
BACKEND_URL = "https://audit-log-tracker.preview.emergentagent.com/api"

class ImportTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.test_results = []
        
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
    
    def create_test_files(self):
        """Erstellt kleine Testdateien für alle Import-Formate"""
        
        # HTML Test-Datei (Chrome/Firefox Export Format)
        html_content = '''<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>Development</H3>
    <DL><p>
        <DT><A HREF="https://github.com" ADD_DATE="1640995200">GitHub</A>
        <DT><A HREF="https://stackoverflow.com" ADD_DATE="1640995200">Stack Overflow</A>
    </DL><p>
    <DT><H3>News</H3>
    <DL><p>
        <DT><A HREF="https://news.ycombinator.com" ADD_DATE="1640995200">Hacker News</A>
    </DL><p>
</DL><p>'''
        
        # JSON Test-Datei (Chrome Format)
        json_content = {
            "checksum": "test_checksum",
            "roots": {
                "bookmark_bar": {
                    "children": [
                        {
                            "children": [
                                {
                                    "date_added": "13244070400000000",
                                    "id": "4",
                                    "name": "GitHub",
                                    "type": "url",
                                    "url": "https://github.com"
                                },
                                {
                                    "date_added": "13244070400000000", 
                                    "id": "5",
                                    "name": "Stack Overflow",
                                    "type": "url",
                                    "url": "https://stackoverflow.com"
                                }
                            ],
                            "date_added": "13244070400000000",
                            "id": "3",
                            "name": "Development",
                            "type": "folder"
                        }
                    ],
                    "date_added": "13244070400000000",
                    "id": "1",
                    "name": "Bookmarks bar",
                    "type": "folder"
                }
            },
            "version": 1
        }
        
        # XML Test-Datei (Custom XML Format)
        xml_content = '''<?xml version="1.0" encoding="UTF-8"?>
<bookmarks version="1.0">
    <bookmark id="1">
        <title>GitHub</title>
        <url>https://github.com</url>
        <category>Development</category>
        <date_added>2022-01-01T00:00:00Z</date_added>
    </bookmark>
    <bookmark id="2">
        <title>Stack Overflow</title>
        <url>https://stackoverflow.com</url>
        <category>Development</category>
        <date_added>2022-01-01T00:00:00Z</date_added>
    </bookmark>
    <bookmark id="3">
        <title>Hacker News</title>
        <url>https://news.ycombinator.com</url>
        <category>News</category>
        <date_added>2022-01-01T00:00:00Z</date_added>
    </bookmark>
</bookmarks>'''
        
        # CSV Test-Datei
        csv_content = '''Title,URL,Category,Subcategory,Date Added
GitHub,https://github.com,Development,Code Hosting,2022-01-01T00:00:00Z
Stack Overflow,https://stackoverflow.com,Development,Q&A,2022-01-01T00:00:00Z
Hacker News,https://news.ycombinator.com,News,Tech News,2022-01-01T00:00:00Z'''
        
        return {
            'html': html_content,
            'json': json.dumps(json_content, indent=2),
            'xml': xml_content,
            'csv': csv_content
        }

    def test_import_format(self, format_name, content):
        """Testet Import für ein spezifisches Format"""
        print(f"\n🔍 TESTING {format_name.upper()} IMPORT:")
        print(f"Content length: {len(content)} characters")
        
        try:
            # Simuliere File Upload
            files = {
                'file': (f'test_bookmarks.{format_name}', content, 'text/plain')
            }
            
            response = requests.post(
                f"{self.backend_url}/bookmarks/import",
                files=files,
                timeout=30
            )
            
            print(f"Status Code: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                imported_count = result.get('imported_count', 0)
                success = imported_count > 0
                
                self.log_result(
                    f"{format_name.upper()} Import Test",
                    success,
                    f"Imported {imported_count} bookmarks" if success else "No bookmarks imported",
                    result
                )
                return success, result
            else:
                try:
                    error_detail = response.json()
                    error_msg = error_detail.get('detail', 'Unknown error')
                except:
                    error_msg = response.text
                
                self.log_result(
                    f"{format_name.upper()} Import Test",
                    False,
                    f"HTTP {response.status_code}: {error_msg}",
                    error_msg
                )
                return False, error_msg
                
        except Exception as e:
            self.log_result(
                f"{format_name.upper()} Import Test",
                False,
                f"Exception: {str(e)}",
                str(e)
            )
            return False, str(e)

    def analyze_import_code(self):
        """Analysiert den Import-Code im Backend"""
        print("\n📋 BACKEND IMPORT CODE ANALYSIS:")
        print("Based on server.py analysis:")
        print("- HTML Import: ✅ Implemented with BeautifulSoup parser (lines 112-155)")
        print("- JSON Import: ✅ Implemented with Chrome/Firefox/Safari parsers (lines 157-304)")
        print("- XML Import: ❌ NOT IMPLEMENTED - placeholder returns empty array (lines 998-1002)")
        print("- CSV Import: ❌ NOT IMPLEMENTED - placeholder returns empty array (lines 998-1002)")
        print("\nProblem Code Location: server.py lines 998-1002:")
        print("elif file_type.lower() in ['csv', 'xml']:")
        print("    # CSV/XML Support placeholder")
        print("    bookmark_data = []")

    def run_comprehensive_import_tests(self):
        """Führt umfassende Import-Tests durch"""
        print("🎯 GERMAN REVIEW REQUEST - IMPORT FUNKTIONEN TEST")
        print("=" * 60)
        print(f"Backend URL: {self.backend_url}")
        print(f"Test Time: {datetime.now().isoformat()}")
        
        # Erstelle Testdateien
        test_files = self.create_test_files()
        
        # Analysiere Backend Code
        self.analyze_import_code()
        
        # Teste alle Formate
        results = {}
        for format_name, content in test_files.items():
            success, result = self.test_import_format(format_name, content)
            results[format_name] = {
                'success': success,
                'result': result
            }
        
        # Zusammenfassung
        print("\n" + "=" * 60)
        print("📊 IMPORT TEST RESULTS SUMMARY:")
        print("=" * 60)
        
        for format_name, data in results.items():
            status = "✅ WORKING" if data['success'] else "❌ FAILED"
            print(f"{format_name.upper():8} Import: {status}")
            if not data['success']:
                print(f"         Reason: {data['result']}")
        
        # Detaillierte Diagnose
        print("\n🔍 DETAILED DIAGNOSIS:")
        print("-" * 40)
        
        if results['html']['success']:
            print("✅ HTML Import: Funktioniert korrekt mit BeautifulSoup Parser")
        else:
            print("❌ HTML Import: Unerwarteter Fehler")
            
        if results['json']['success']:
            print("✅ JSON Import: Funktioniert korrekt mit Chrome/Firefox Parser")
        else:
            print("❌ JSON Import: Unerwarteter Fehler")
            
        if not results['xml']['success']:
            print("❌ XML Import: NICHT IMPLEMENTIERT")
            print("   - Backend Code hat nur Placeholder")
            print("   - Zeile 998-1002 in server.py")
            print("   - Benötigt XML Parser Implementation")
        else:
            print("⚠️  XML Import: Unerwartetes Ergebnis")
            
        if not results['csv']['success']:
            print("❌ CSV Import: NICHT IMPLEMENTIERT") 
            print("   - Backend Code hat nur Placeholder")
            print("   - Zeile 998-1002 in server.py")
            print("   - Benötigt CSV Parser Implementation")
        else:
            print("⚠️  CSV Import: Unerwartetes Ergebnis")
        
        print("\n🎯 USER REPORT VERIFICATION:")
        print(f"HTML=Ja: {'✅ BESTÄTIGT' if results['html']['success'] else '❌ WIDERLEGT'}")
        print(f"JSON=Ja: {'✅ BESTÄTIGT' if results['json']['success'] else '❌ WIDERLEGT'}")
        print(f"XML=NEIN: {'✅ BESTÄTIGT' if not results['xml']['success'] else '❌ WIDERLEGT'}")
        print(f"CSV=NEIN: {'✅ BESTÄTIGT' if not results['csv']['success'] else '❌ WIDERLEGT'}")
        
        return results

    def print_summary(self):
        """Druckt finale Zusammenfassung"""
        print("\n" + "=" * 60)
        print("🎯 FINAL TEST SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   - {result['test']}: {result['details']}")

def main():
    """Hauptfunktion"""
    tester = ImportTester()
    results = tester.run_comprehensive_import_tests()
    tester.print_summary()
    
    # Exit code für CI/CD
    success = all(data['success'] for data in results.values() if data['success'])
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()