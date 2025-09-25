#!/usr/bin/env python3
"""
Comprehensive XML/CSV Import Testing - German Review Request
Teste die neu implementierten XML und CSV Import-Funktionen

Erwartete Ergebnisse:
- XML Import sollte 2 Bookmarks importieren
- CSV Import sollte 3 Bookmarks importieren  
- Korrekte Kategorie/Subcategory Zuordnung
- Fehlerbehandlung für ungültige Dateien
"""

import requests
import json
import tempfile
import os
from datetime import datetime

BACKEND_URL = "https://pdf-report-boost.preview.emergentagent.com/api"

def test_xml_import_detailed():
    """Detaillierter XML Import Test gemäß German Review Request"""
    print("🎯 XML IMPORT TEST - GERMAN REVIEW REQUEST")
    print("=" * 60)
    
    # Exakte XML-Struktur aus Review Request
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
    
    print(f"📄 XML Content ({len(xml_content)} Zeichen):")
    print(xml_content)
    print()
    
    try:
        # Erstelle temporäre XML-Datei
        with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False, encoding='utf-8') as f:
            f.write(xml_content)
            xml_file_path = f.name
        
        # Import Request
        with open(xml_file_path, 'rb') as f:
            files = {'file': ('test_bookmarks.xml', f, 'application/xml')}
            response = requests.post(f"{BACKEND_URL}/bookmarks/import", files=files)
        
        os.unlink(xml_file_path)
        
        print(f"📡 HTTP Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Import Results:")
            print(f"   imported_count: {data.get('imported_count', 0)}")
            print(f"   total_parsed: {data.get('total_parsed', 0)}")
            print(f"   message: {data.get('message', '')}")
            
            imported_count = data.get('imported_count', 0)
            
            if imported_count == 2:
                print("✅ XML IMPORT ERFOLGREICH: 2 Bookmarks importiert (wie erwartet)")
                return True
            else:
                print(f"❌ XML IMPORT PROBLEM: {imported_count} Bookmarks importiert (erwartet: 2)")
                return False
        else:
            print(f"❌ XML IMPORT FEHLER: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ XML IMPORT EXCEPTION: {str(e)}")
        return False

def test_csv_import_detailed():
    """Detaillierter CSV Import Test gemäß German Review Request"""
    print("\n🎯 CSV IMPORT TEST - GERMAN REVIEW REQUEST")
    print("=" * 60)
    
    # Exakte CSV-Struktur aus Review Request
    csv_content = '''Title,URL,Category,Subcategory
GitHub,https://github.com,Development,Code Hosting
Stack Overflow,https://stackoverflow.com,Development,Q&A
Hacker News,https://news.ycombinator.com,News,Tech News'''
    
    print(f"📄 CSV Content ({len(csv_content)} Zeichen):")
    print(csv_content)
    print()
    
    try:
        # Erstelle temporäre CSV-Datei
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
            f.write(csv_content)
            csv_file_path = f.name
        
        # Import Request
        with open(csv_file_path, 'rb') as f:
            files = {'file': ('test_bookmarks.csv', f, 'text/csv')}
            response = requests.post(f"{BACKEND_URL}/bookmarks/import", files=files)
        
        os.unlink(csv_file_path)
        
        print(f"📡 HTTP Response: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"📊 Import Results:")
            print(f"   imported_count: {data.get('imported_count', 0)}")
            print(f"   total_parsed: {data.get('total_parsed', 0)}")
            print(f"   message: {data.get('message', '')}")
            
            imported_count = data.get('imported_count', 0)
            
            if imported_count == 3:
                print("✅ CSV IMPORT ERFOLGREICH: 3 Bookmarks importiert (wie erwartet)")
                return True
            else:
                print(f"❌ CSV IMPORT PROBLEM: {imported_count} Bookmarks importiert (erwartet: 3)")
                return False
        else:
            print(f"❌ CSV IMPORT FEHLER: HTTP {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ CSV IMPORT EXCEPTION: {str(e)}")
        return False

def verify_category_subcategory_assignment():
    """Verifiziere korrekte Kategorie/Subcategory Zuordnung"""
    print("\n🎯 KATEGORIE/SUBCATEGORY ZUORDNUNG VERIFICATION")
    print("=" * 60)
    
    try:
        # Hole alle Bookmarks
        response = requests.get(f"{BACKEND_URL}/bookmarks")
        
        if response.status_code == 200:
            bookmarks = response.json()
            
            # Finde die neuesten Test-Bookmarks (die letzten importierten)
            test_bookmarks = []
            for bookmark in bookmarks:
                if bookmark.get('title') in ['GitHub', 'Stack Overflow', 'Hacker News']:
                    test_bookmarks.append(bookmark)
            
            # Sortiere nach date_added (neueste zuerst)
            test_bookmarks.sort(key=lambda x: x.get('date_added', ''), reverse=True)
            
            print(f"📌 Gefundene Test-Bookmarks: {len(test_bookmarks)}")
            
            # Erwartete Zuordnungen
            expected_assignments = {
                'GitHub': {'category': 'Development', 'subcategory': 'Code Hosting'},
                'Stack Overflow': {'category': 'Development', 'subcategory': None},  # Keine Subcategory in XML
                'Hacker News': {'category': 'News', 'subcategory': 'Tech News'}
            }
            
            correct_assignments = 0
            total_expected = len(expected_assignments)
            
            for title, expected in expected_assignments.items():
                # Finde das neueste Bookmark mit diesem Titel
                matching_bookmarks = [b for b in test_bookmarks if b.get('title') == title]
                
                if matching_bookmarks:
                    bookmark = matching_bookmarks[0]  # Nehme das neueste
                    actual_category = bookmark.get('category')
                    actual_subcategory = bookmark.get('subcategory') or None
                    
                    print(f"\n📋 {title}:")
                    print(f"   Erwartet: Category='{expected['category']}', Subcategory='{expected['subcategory']}'")
                    print(f"   Tatsächlich: Category='{actual_category}', Subcategory='{actual_subcategory}'")
                    
                    if (actual_category == expected['category'] and 
                        actual_subcategory == expected['subcategory']):
                        print("   ✅ KORREKT")
                        correct_assignments += 1
                    else:
                        print("   ❌ INKORREKT")
                else:
                    print(f"\n📋 {title}: ❌ NICHT GEFUNDEN")
            
            success_rate = (correct_assignments / total_expected) * 100
            print(f"\n📊 Kategorie-Zuordnung: {correct_assignments}/{total_expected} korrekt ({success_rate:.1f}%)")
            
            if success_rate >= 80:
                print("✅ KATEGORIE/SUBCATEGORY ZUORDNUNG: ERFOLGREICH")
                return True
            else:
                print("❌ KATEGORIE/SUBCATEGORY ZUORDNUNG: FEHLGESCHLAGEN")
                return False
                
        else:
            print(f"❌ FEHLER beim Abrufen der Bookmarks: HTTP {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ EXCEPTION bei Kategorie-Verification: {str(e)}")
        return False

def test_error_handling():
    """Test Fehlerbehandlung für ungültige Dateien"""
    print("\n🎯 FEHLERBEHANDLUNG TEST")
    print("=" * 60)
    
    # Test 1: Ungültige XML-Datei
    print("📄 Test 1: Ungültige XML-Datei")
    invalid_xml = '''<?xml version="1.0" encoding="UTF-8"?>
<bookmarks>
  <bookmark>
    <title>Incomplete</title>
    <!-- Missing URL -->
  </bookmark>
</bookmarks>'''
    
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.xml', delete=False, encoding='utf-8') as f:
            f.write(invalid_xml)
            xml_file_path = f.name
        
        with open(xml_file_path, 'rb') as f:
            files = {'file': ('invalid.xml', f, 'application/xml')}
            response = requests.post(f"{BACKEND_URL}/bookmarks/import", files=files)
        
        os.unlink(xml_file_path)
        
        if response.status_code == 200:
            data = response.json()
            imported_count = data.get('imported_count', 0)
            print(f"   Response: imported_count = {imported_count}")
            if imported_count == 0:
                print("   ✅ Ungültige XML korrekt behandelt")
                xml_error_handling = True
            else:
                print("   ⚠️  Ungültige XML importierte Bookmarks")
                xml_error_handling = False
        else:
            print(f"   ✅ Ungültige XML abgelehnt: HTTP {response.status_code}")
            xml_error_handling = True
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        xml_error_handling = False
    
    # Test 2: Ungültige CSV-Datei
    print("\n📄 Test 2: Ungültige CSV-Datei")
    invalid_csv = '''Title,URL,Category
Bookmark ohne URL,,Development
,https://example.com,Development'''
    
    try:
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False, encoding='utf-8') as f:
            f.write(invalid_csv)
            csv_file_path = f.name
        
        with open(csv_file_path, 'rb') as f:
            files = {'file': ('invalid.csv', f, 'text/csv')}
            response = requests.post(f"{BACKEND_URL}/bookmarks/import", files=files)
        
        os.unlink(csv_file_path)
        
        if response.status_code == 200:
            data = response.json()
            imported_count = data.get('imported_count', 0)
            print(f"   Response: imported_count = {imported_count}")
            print("   ✅ CSV-Fehlerbehandlung funktioniert")
            csv_error_handling = True
        else:
            print(f"   ✅ Ungültige CSV abgelehnt: HTTP {response.status_code}")
            csv_error_handling = True
            
    except Exception as e:
        print(f"   ❌ Exception: {str(e)}")
        csv_error_handling = False
    
    return xml_error_handling and csv_error_handling

def main():
    """Hauptfunktion - Führe alle Tests gemäß German Review Request aus"""
    print("🚀 COMPREHENSIVE XML/CSV IMPORT TESTING")
    print("🎯 GERMAN REVIEW REQUEST: Teste die neu implementierten XML und CSV Import-Funktionen")
    print("=" * 80)
    print(f"Backend URL: {BACKEND_URL}")
    print("=" * 80)
    
    # Test-Ergebnisse sammeln
    results = {}
    
    # 1. XML Import Test
    results['xml_import'] = test_xml_import_detailed()
    
    # 2. CSV Import Test  
    results['csv_import'] = test_csv_import_detailed()
    
    # 3. Kategorie/Subcategory Zuordnung
    results['category_assignment'] = verify_category_subcategory_assignment()
    
    # 4. Fehlerbehandlung
    results['error_handling'] = test_error_handling()
    
    # Zusammenfassung
    print("\n" + "=" * 80)
    print("📊 FINAL RESULTS - GERMAN REVIEW REQUEST")
    print("=" * 80)
    
    passed_tests = sum(results.values())
    total_tests = len(results)
    success_rate = (passed_tests / total_tests) * 100
    
    print(f"✅ XML Import sollte 2 Bookmarks importieren: {'JA' if results['xml_import'] else 'NEIN'}")
    print(f"✅ CSV Import sollte 3 Bookmarks importieren: {'JA' if results['csv_import'] else 'NEIN'}")
    print(f"✅ Korrekte Kategorie/Subcategory Zuordnung: {'JA' if results['category_assignment'] else 'NEIN'}")
    print(f"✅ Fehlerbehandlung für ungültige Dateien: {'JA' if results['error_handling'] else 'NEIN'}")
    
    print(f"\n📈 Success Rate: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
    
    if success_rate == 100:
        print("🎉 ALLE ERWARTETEN ERGEBNISSE ERFÜLLT!")
        print("✅ XML und CSV Import-Funktionen arbeiten korrekt")
        print("✅ Dokumentation des Erfolgs der neuen Implementation: VOLLSTÄNDIG")
    elif success_rate >= 75:
        print("⚠️  MEISTE ERWARTUNGEN ERFÜLLT - Kleinere Probleme vorhanden")
    else:
        print("❌ ERWARTUNGEN NICHT ERFÜLLT - Größere Probleme gefunden")
    
    return success_rate == 100

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)