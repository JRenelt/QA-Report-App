#!/usr/bin/env python3
"""
Browser Bookmarks Collector
Sammelt Favoriten von allen installierten Browsern auf Windows, Linux und macOS
Ausgabe: HTML-Datei für Import in FavLink Manager
"""

import os
import sys
import json
import sqlite3
import shutil
from pathlib import Path
from datetime import datetime
import platform
import subprocess
import tempfile


class BookmarkCollector:
    def __init__(self):
        self.system = platform.system().lower()
        self.bookmarks = []
        self.output_file = f"all_bookmarks_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        
    def get_chrome_bookmarks(self):
        """Chrome Bookmarks sammeln"""
        try:
            if self.system == "windows":
                chrome_path = Path(os.environ['LOCALAPPDATA']) / "Google" / "Chrome" / "User Data" / "Default" / "Bookmarks"
            elif self.system == "darwin":  # macOS
                chrome_path = Path.home() / "Library" / "Application Support" / "Google" / "Chrome" / "Default" / "Bookmarks"
            else:  # Linux
                chrome_path = Path.home() / ".config" / "google-chrome" / "Default" / "Bookmarks"
            
            if chrome_path.exists():
                print(f"📁 Chrome Bookmarks gefunden: {chrome_path}")
                with open(chrome_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._parse_chrome_bookmarks(data, "Chrome")
                return True
        except Exception as e:
            print(f"⚠️ Chrome Bookmarks Fehler: {e}")
        return False
    
    def get_firefox_bookmarks(self):
        """Firefox Bookmarks sammeln"""
        try:
            if self.system == "windows":
                firefox_dir = Path(os.environ['APPDATA']) / "Mozilla" / "Firefox" / "Profiles"
            elif self.system == "darwin":  # macOS
                firefox_dir = Path.home() / "Library" / "Application Support" / "Firefox" / "Profiles"
            else:  # Linux
                firefox_dir = Path.home() / ".mozilla" / "firefox"
            
            if firefox_dir.exists():
                for profile_dir in firefox_dir.iterdir():
                    if profile_dir.is_dir():
                        places_db = profile_dir / "places.sqlite"
                        if places_db.exists():
                            print(f"📁 Firefox Bookmarks gefunden: {places_db}")
                            self._parse_firefox_bookmarks(places_db)
                            return True
        except Exception as e:
            print(f"⚠️ Firefox Bookmarks Fehler: {e}")
        return False
    
    def get_edge_bookmarks(self):
        """Microsoft Edge Bookmarks sammeln"""
        try:
            if self.system == "windows":
                edge_path = Path(os.environ['LOCALAPPDATA']) / "Microsoft" / "Edge" / "User Data" / "Default" / "Bookmarks"
            elif self.system == "darwin":  # macOS
                edge_path = Path.home() / "Library" / "Application Support" / "Microsoft Edge" / "Default" / "Bookmarks"
            else:  # Linux
                edge_path = Path.home() / ".config" / "microsoft-edge" / "Default" / "Bookmarks"
            
            if edge_path.exists():
                print(f"📁 Edge Bookmarks gefunden: {edge_path}")
                with open(edge_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    self._parse_chrome_bookmarks(data, "Edge")
                return True
        except Exception as e:
            print(f"⚠️ Edge Bookmarks Fehler: {e}")
        return False
    
    def get_safari_bookmarks(self):
        """Safari Bookmarks sammeln (nur macOS)"""
        if self.system != "darwin":
            return False
            
        try:
            safari_path = Path.home() / "Library" / "Safari" / "Bookmarks.plist"
            if safari_path.exists():
                print(f"📁 Safari Bookmarks gefunden: {safari_path}")
                # Verwende plutil um plist zu JSON zu konvertieren
                result = subprocess.run(['plutil', '-convert', 'json', '-o', '-', str(safari_path)], 
                                      capture_output=True, text=True)
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    self._parse_safari_bookmarks(data)
                    return True
        except Exception as e:
            print(f"⚠️ Safari Bookmarks Fehler: {e}")
        return False
    
    def _parse_chrome_bookmarks(self, data, browser_name):
        """Chrome/Edge Bookmarks JSON parsen"""
        def extract_bookmarks(node, folder=""):
            if isinstance(node, dict):
                if node.get("type") == "folder":
                    folder_name = node.get("name", "Uncategorized")
                    if "children" in node:
                        for child in node["children"]:
                            extract_bookmarks(child, folder_name)
                elif node.get("type") == "url":
                    self.bookmarks.append({
                        "title": node.get("name", ""),
                        "url": node.get("url", ""),
                        "category": folder or "Uncategorized",
                        "browser": browser_name
                    })
            elif isinstance(node, list):
                for item in node:
                    extract_bookmarks(item, folder)
        
        if "roots" in data:
            for root_name, root_data in data["roots"].items():
                if "children" in root_data:
                    extract_bookmarks(root_data["children"])
    
    def _parse_firefox_bookmarks(self, places_db):
        """Firefox places.sqlite Datenbank parsen"""
        # Kopie erstellen da Firefox die DB sperren könnte
        temp_db = tempfile.NamedTemporaryFile(suffix='.sqlite', delete=False)
        shutil.copy2(places_db, temp_db.name)
        
        try:
            conn = sqlite3.connect(temp_db.name)
            cursor = conn.cursor()
            
            # Firefox Bookmarks Query
            query = """
            SELECT b.title, p.url, 
                   COALESCE(parent_b.title, 'Uncategorized') as folder
            FROM moz_bookmarks b
            JOIN moz_places p ON b.fk = p.id
            LEFT JOIN moz_bookmarks parent_b ON b.parent = parent_b.id
            WHERE b.type = 1 AND p.url IS NOT NULL
            AND p.url NOT LIKE 'place:%'
            """
            
            cursor.execute(query)
            results = cursor.fetchall()
            
            for title, url, folder in results:
                self.bookmarks.append({
                    "title": title or url,
                    "url": url,
                    "category": folder or "Uncategorized",
                    "browser": "Firefox"
                })
            
            conn.close()
        finally:
            os.unlink(temp_db.name)
    
    def _parse_safari_bookmarks(self, data):
        """Safari plist Daten parsen"""
        def extract_bookmarks(node, folder=""):
            if isinstance(node, dict):
                if node.get("WebBookmarkType") == "WebBookmarkTypeList":
                    title = node.get("Title", "")
                    children = node.get("Children", [])
                    for child in children:
                        extract_bookmarks(child, title)
                elif node.get("WebBookmarkType") == "WebBookmarkTypeLeaf":
                    url_dict = node.get("URLString", "")
                    title = node.get("URIDictionary", {}).get("title", url_dict)
                    if url_dict:
                        self.bookmarks.append({
                            "title": title,
                            "url": url_dict,
                            "category": folder or "Uncategorized",
                            "browser": "Safari"
                        })
            elif isinstance(node, list):
                for item in node:
                    extract_bookmarks(item, folder)
        
        if "Children" in data:
            extract_bookmarks(data)
    
    def add_test_duplicates(self):
        """Testdaten mit Duplikaten hinzufügen"""
        test_bookmarks = [
            # Normale Bookmarks
            {"title": "Google", "url": "https://www.google.com", "category": "Search", "browser": "Test"},
            {"title": "GitHub", "url": "https://github.com", "category": "Development", "browser": "Test"},
            {"title": "Stack Overflow", "url": "https://stackoverflow.com", "category": "Development", "browser": "Test"},
            
            # Duplikate (gleiche URLs in verschiedenen Varianten)
            {"title": "Google Search", "url": "https://google.com/", "category": "Search", "browser": "Test"},  # Duplikat
            {"title": "Google Homepage", "url": "https://www.google.com/", "category": "Tools", "browser": "Test"},  # Duplikat
            {"title": "GitHub Repository", "url": "https://www.github.com", "category": "Development", "browser": "Test"},  # Duplikat
            {"title": "GitHub Code", "url": "https://github.com/", "category": "Code", "browser": "Test"},  # Duplikat
            
            # Weitere Test-Bookmarks
            {"title": "YouTube", "url": "https://youtube.com", "category": "Entertainment", "browser": "Test"},
            {"title": "YouTube Videos", "url": "https://www.youtube.com/", "category": "Media", "browser": "Test"},  # Duplikat
            {"title": "Wikipedia", "url": "https://wikipedia.org", "category": "Reference", "browser": "Test"},
            {"title": "Wikipedia DE", "url": "https://de.wikipedia.org", "category": "Reference", "browser": "Test"},
            
            # Dead Links zum Testen
            {"title": "Dead Link 1", "url": "https://this-site-does-not-exist-12345.com", "category": "Testing", "browser": "Test"},
            {"title": "Dead Link 2", "url": "https://invalid-domain-xyz.fake", "category": "Testing", "browser": "Test"},
            {"title": "Dead Link 3", "url": "https://broken-url-test.nonexistent", "category": "Testing", "browser": "Test"},
        ]
        
        self.bookmarks.extend(test_bookmarks)
        print(f"✅ {len(test_bookmarks)} Testdaten mit Duplikaten hinzugefügt")
    
    def generate_html_export(self):
        """HTML-Export für FavLink Manager erstellen"""
        html_content = f"""<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Alle Browser Bookmarks - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</TITLE>
<H1>Gesammelte Browser-Favoriten</H1>

<DL><p>
"""
        
        # Nach Kategorien gruppieren
        categories = {}
        for bookmark in self.bookmarks:
            category = bookmark['category']
            if category not in categories:
                categories[category] = []
            categories[category].append(bookmark)
        
        # HTML für jede Kategorie generieren
        for category, bookmarks in sorted(categories.items()):
            html_content += f'    <DT><H3>{category}</H3>\n    <DL><p>\n'
            
            for bookmark in bookmarks:
                title = bookmark['title'].replace('"', '&quot;').replace('<', '&lt;').replace('>', '&gt;')
                url = bookmark['url']
                browser = bookmark.get('browser', 'Unknown')
                
                html_content += f'        <DT><A HREF="{url}" ADD_DATE="{int(datetime.now().timestamp())}">{title}</A>\n'
            
            html_content += '    </DL><p>\n\n'
        
        html_content += '</DL><p>\n'
        
        # Datei schreiben
        with open(self.output_file, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return self.output_file
    
    def collect_all(self):
        """Alle Browser-Bookmarks sammeln"""
        print("🚀 Browser Bookmarks Collector gestartet")
        print(f"💻 Betriebssystem: {platform.system()} {platform.release()}")
        print("-" * 60)
        
        found_browsers = 0
        
        # Chrome
        if self.get_chrome_bookmarks():
            found_browsers += 1
        
        # Firefox  
        if self.get_firefox_bookmarks():
            found_browsers += 1
            
        # Edge
        if self.get_edge_bookmarks():
            found_browsers += 1
            
        # Safari (nur macOS)
        if self.get_safari_bookmarks():
            found_browsers += 1
        
        # Testdaten hinzufügen
        self.add_test_duplicates()
        
        print("-" * 60)
        print(f"📊 Zusammenfassung:")
        print(f"   Browser gefunden: {found_browsers}")
        print(f"   Bookmarks gesammelt: {len(self.bookmarks)}")
        
        if self.bookmarks:
            output_file = self.generate_html_export()
            print(f"✅ HTML-Export erstellt: {output_file}")
            print(f"📤 Datei bereit für Import in FavLink Manager!")
            
            # Statistiken
            categories = set(b['category'] for b in self.bookmarks)
            browsers = set(b['browser'] for b in self.bookmarks)
            print(f"   Kategorien: {len(categories)}")
            print(f"   Browser: {', '.join(browsers)}")
            
            return output_file
        else:
            print("❌ Keine Bookmarks gefunden!")
            return None


def main():
    print("=" * 60)
    print("🔖 FavLink Manager - Browser Bookmarks Collector")
    print("   Sammelt Favoriten von allen installierten Browsern")
    print("=" * 60)
    print()
    
    collector = BookmarkCollector()
    output_file = collector.collect_all()
    
    if output_file:
        print()
        print("🎉 Erfolgreich abgeschlossen!")
        print(f"📁 Ausgabedatei: {os.path.abspath(output_file)}")
        print()
        print("📋 Nächste Schritte:")
        print("1. Öffnen Sie FavLink Manager in Ihrem Browser")
        print("2. Klicken Sie auf 'Favoriten importieren'")
        print(f"3. Wählen Sie die Datei '{output_file}' aus")
        print("4. Die Anwendung erkennt automatisch Duplikate und tote Links!")
        
        # Datei automatisch öffnen (optional)
        try:
            if platform.system() == "Windows":
                os.startfile(os.path.abspath(output_file))
            elif platform.system() == "Darwin":  # macOS
                subprocess.run(["open", os.path.abspath(output_file)])
            else:  # Linux
                subprocess.run(["xdg-open", os.path.abspath(output_file)])
            print(f"📖 Datei wird in Standard-Anwendung geöffnet...")
        except:
            pass
    else:
        print("❌ Keine Bookmarks zum Exportieren gefunden.")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())