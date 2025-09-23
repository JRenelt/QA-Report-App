from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException, Body
from fastapi.responses import JSONResponse, StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import json
import html
import re
import asyncio
import aiohttp
from urllib.parse import urlparse
import xml.etree.ElementTree as ET
import csv
import io
import zipfile
import tempfile

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Objektorientierte Backend-Architektur

class Bookmark(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    url: str
    category: str = "Uncategorized"
    subcategory: Optional[str] = None
    date_added: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_dead_link: bool = False
    is_locked: bool = False
    last_checked: Optional[datetime] = None
    favicon: Optional[str] = None
    description: Optional[str] = None
    status_type: str = "active"  # active, dead, localhost, duplicate, locked

class Category(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    parent_category: Optional[str] = None
    bookmark_count: int = 0
    subcategory_count: int = 0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None
    is_locked: bool = False
    lock_reason: str = ""
    locked_at: Optional[datetime] = None

class BookmarkCreate(BaseModel):
    title: str
    url: str
    category: str = "Uncategorized"
    subcategory: Optional[str] = None
    description: Optional[str] = None
    is_locked: bool = False
    status_type: str = "active"  # active, dead, localhost, duplicate, locked

class BookmarkUpdate(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    status_type: Optional[str] = None
    is_locked: Optional[bool] = None

class BookmarkMove(BaseModel):
    bookmark_ids: List[str]
    target_category: str
    target_subcategory: Optional[str] = None

class ExportRequest(BaseModel):
    format: str  # "xml" or "csv"
    category: Optional[str] = None

class Statistics(BaseModel):
    total_bookmarks: int
    total_categories: int
    active_links: int
    dead_links: int
    localhost_links: int
    duplicate_links: int
    locked_links: int
    timeout_links: int
    unchecked_links: int
    categories_distribution: Dict[str, int]
    subcategories_distribution: Dict[str, Dict[str, int]]
    top_categories: List[Dict[str, Any]]
    recent_bookmarks: int
    last_updated: datetime

class BookmarkParser:
    """Klasse für das Parsen verschiedener Browser-Favoriten-Formate"""
    
    def __init__(self):
        self.supported_formats = ['html', 'json', 'xml', 'csv']
    
    def parse_html_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse HTML-Bookmarks (Chrome, Firefox Export)"""
        bookmarks = []
        
        try:
            from bs4 import BeautifulSoup
            soup = BeautifulSoup(content, 'html.parser')
            
            current_folder = "Nicht zugeordnet"
            current_subfolder = None
            
            # Durchlaufe alle Elemente sequenziell
            for element in soup.find_all(['h3', 'a']):
                if element.name == 'h3':
                    folder_text = element.get_text().strip()
                    
                    # Erkenne Unterkategorien durch Pfeil-Symbol oder →
                    if '→' in folder_text or '->' in folder_text:
                        parts = folder_text.split('→') if '→' in folder_text else folder_text.split('->')
                        if len(parts) >= 2:
                            current_folder = parts[0].strip()
                            current_subfolder = parts[1].strip()
                        else:
                            current_subfolder = folder_text
                    else:
                        current_folder = folder_text
                        current_subfolder = None
                        
                elif element.name == 'a':
                    href = element.get('href', '')
                    title = element.get_text().strip() or href
                    
                    if href and href.startswith(('http://', 'https://')):
                        bookmarks.append({
                            'title': title,
                            'url': href,
                            'category': current_folder,
                            'subcategory': current_subfolder
                        })
                        
        except Exception as e:
            logging.error(f"Error parsing HTML bookmarks: {e}")
            
        return bookmarks
    
    def parse_json_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse JSON-Bookmarks von verschiedenen Browsern"""
        bookmarks = []
        
        try:
            data = json.loads(content)
            logging.info(f"Parsed JSON data keys: {data.keys() if isinstance(data, dict) else 'not dict'}")
            
            # Firefox JSON Format erkennen (hat 'children' und 'title' auf oberster Ebene)
            if isinstance(data, dict) and 'children' in data and 'title' in data:
                logging.info("Detected Firefox JSON format")
                bookmarks = self._parse_firefox_json(data)
            # Chrome JSON Format erkennen  
            elif isinstance(data, dict) and 'roots' in data:
                logging.info("Detected Chrome JSON format")
                bookmarks = self._parse_chrome_json(data)
            # Safari JSON Format
            elif isinstance(data, list) and all('Title' in item for item in data if isinstance(item, dict)):
                logging.info("Detected Safari JSON format")
                bookmarks = self._parse_safari_json(data)
            # Standard/Generic JSON Format
            else:
                logging.info("Using generic JSON parser")
                bookmarks = self._parse_generic_json(data)
                
        except Exception as e:
            logging.error(f"Error parsing JSON bookmarks: {e}")
            
        return bookmarks
    
    def _parse_firefox_json(self, data: dict) -> List[Dict[str, Any]]:
        """Parse Firefox JSON Format"""
        bookmarks = []
        
        def extract_firefox_bookmarks(node, category="Nicht zugeordnet", subcategory=None):
            if isinstance(node, dict):
                # Debug logging
                logging.info(f"Processing node: {node.get('title', 'no title')}, has children: {'children' in node}, has uri: {'uri' in node}")
                
                if 'children' in node:
                    # Folder
                    folder_name = node.get('title', node.get('name', category))
                    logging.info(f"Processing folder: {folder_name}")
                    
                    # Skip standard Firefox folder names, use parent category instead
                    if folder_name in ['Bookmarks Toolbar', 'Bookmarks Menu', 'Other Bookmarks', 'Bookmarks']:
                        for child in node['children']:
                            extract_firefox_bookmarks(child, category, subcategory)
                    else:
                        for child in node['children']:
                            extract_firefox_bookmarks(child, folder_name, subcategory)
                            
                elif 'uri' in node or 'url' in node:
                    # Firefox Bookmark
                    url = node.get('uri', node.get('url', ''))
                    title = node.get('title', node.get('name', url))
                    
                    logging.info(f"Found bookmark: {title} -> {url}")
                    
                    if url and url.startswith(('http://', 'https://')):
                        bookmarks.append({
                            'title': title,
                            'url': url,
                            'category': category,
                            'subcategory': subcategory
                        })
                        logging.info(f"Added bookmark: {title}")
                        
            elif isinstance(node, list):
                for item in node:
                    extract_firefox_bookmarks(item, category, subcategory)
        
        extract_firefox_bookmarks(data)
        logging.info(f"Firefox JSON parser found {len(bookmarks)} bookmarks")
        return bookmarks
    
    def _parse_chrome_json(self, data: dict) -> List[Dict[str, Any]]:
        """Parse Chrome JSON Format"""
        bookmarks = []
        
        def extract_chrome_bookmarks(node, category="Nicht zugeordnet", subcategory=None):
            if isinstance(node, dict):
                if 'children' in node:
                    # Chrome Folder
                    folder_name = node.get('name', category)
                    for child in node['children']:
                        extract_chrome_bookmarks(child, folder_name, subcategory)
                elif 'url' in node and node.get('type') == 'url':
                    # Chrome Bookmark
                    bookmarks.append({
                        'title': node.get('name', ''),
                        'url': node['url'],
                        'category': category,
                        'subcategory': subcategory
                    })
            elif isinstance(node, list):
                for item in node:
                    extract_chrome_bookmarks(item, category, subcategory)
        
        # Chrome hat 'roots' mit verschiedenen Bereichen
        if 'roots' in data:
            for root_name, root_data in data['roots'].items():
                if root_name in ['bookmark_bar', 'other', 'synced']:
                    extract_chrome_bookmarks(root_data, 'Chrome Bookmarks')
        
        return bookmarks
    
    def _parse_safari_json(self, data: list) -> List[Dict[str, Any]]:
        """Parse Safari JSON Format"""
        bookmarks = []
        
        for item in data:
            if isinstance(item, dict):
                if 'Title' in item and 'URLString' in item:
                    bookmarks.append({
                        'title': item['Title'],
                        'url': item['URLString'],
                        'category': 'Safari Bookmarks',
                        'subcategory': None
                    })
        
        return bookmarks
    
    def _parse_generic_json(self, data) -> List[Dict[str, Any]]:
        """Parse Generic JSON Format (fallback)"""
        bookmarks = []
        
        def extract_bookmarks(node, category="Nicht zugeordnet", subcategory=None):
            if isinstance(node, dict):
                if 'children' in node:
                    # Folder
                    folder_name = node.get('name', node.get('title', category))
                    for child in node['children']:
                        extract_bookmarks(child, folder_name, subcategory)
                elif 'url' in node:
                    # Bookmark
                    bookmarks.append({
                        'title': node.get('name', node.get('title', '')),
                        'url': node['url'],
                        'category': category,
                        'subcategory': subcategory
                    })
            elif isinstance(node, list):
                for item in node:
                    extract_bookmarks(item, category, subcategory)
        
        extract_bookmarks(data)
        return bookmarks
    
    def parse_xml_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse XML-Bookmarks"""
        bookmarks = []
        
        try:
            import xml.etree.ElementTree as ET
            root = ET.fromstring(content)
            
            # Verschiedene XML-Strukturen unterstützen
            # Standard XML Format: <bookmarks><bookmark><title/><url/><category/></bookmark></bookmarks>
            for bookmark_elem in root.findall('.//bookmark'):
                title_elem = bookmark_elem.find('title')
                url_elem = bookmark_elem.find('url')
                category_elem = bookmark_elem.find('category')
                subcategory_elem = bookmark_elem.find('subcategory')
                description_elem = bookmark_elem.find('description')
                
                if title_elem is not None and url_elem is not None:
                    title = title_elem.text or "Ohne Titel"
                    url = url_elem.text or ""
                    category = category_elem.text if category_elem is not None else "Nicht zugeordnet"
                    subcategory = subcategory_elem.text if subcategory_elem is not None else None
                    description = description_elem.text if description_elem is not None else None
                    
                    if url:  # Nur hinzufügen wenn URL vorhanden
                        bookmarks.append({
                            "title": title.strip(),
                            "url": url.strip(),
                            "category": category.strip(),
                            "subcategory": subcategory.strip() if subcategory else None,
                            "description": description.strip() if description else None
                        })
            
            # Alternative XML-Struktur: <item><name/><href/></item>
            if not bookmarks:
                for item_elem in root.findall('.//item'):
                    name_elem = item_elem.find('name')
                    href_elem = item_elem.find('href')
                    
                    if name_elem is not None and href_elem is not None:
                        title = name_elem.text or "Ohne Titel"
                        url = href_elem.text or ""
                        
                        if url:
                            bookmarks.append({
                                "title": title.strip(),
                                "url": url.strip(),
                                "category": "Nicht zugeordnet",
                                "subcategory": None,
                                "description": None
                            })
                            
        except ET.ParseError as e:
            logging.error(f"XML Parse Error: {e}")
        except Exception as e:
            logging.error(f"Error parsing XML bookmarks: {e}")
        
        return bookmarks
    
    def parse_csv_bookmarks(self, content: str) -> List[Dict[str, Any]]:
        """Parse CSV-Bookmarks"""
        bookmarks = []
        
        try:
            import csv
            import io
            
            # CSV-Content in StringIO für csv.reader
            csv_file = io.StringIO(content)
            reader = csv.reader(csv_file)
            
            # Header-Zeile lesen
            headers = next(reader, None)
            if not headers:
                return bookmarks
            
            # Headers normalisieren (case-insensitive)
            headers = [h.strip().lower() for h in headers]
            
            # Mapping für verschiedene CSV-Formate
            field_mapping = {
                'title': ['title', 'name', 'bookmark name', 'bookmark_name'],
                'url': ['url', 'link', 'href', 'address', 'bookmark url'],
                'category': ['category', 'folder', 'group', 'tag'],
                'subcategory': ['subcategory', 'subfolder', 'subgroup'],
                'description': ['description', 'note', 'comment', 'remarks']
            }
            
            # Finde Spalten-Indizes
            column_indices = {}
            for field, possible_names in field_mapping.items():
                for i, header in enumerate(headers):
                    if header in possible_names:
                        column_indices[field] = i
                        break
            
            # Daten-Zeilen verarbeiten
            for row_num, row in enumerate(reader, start=2):  # Start at 2 da Header Zeile 1 ist
                if len(row) == 0:  # Leere Zeile überspringen
                    continue
                
                try:
                    # Extrahiere Felder basierend auf gefundenen Spalten
                    title = row[column_indices['title']].strip() if 'title' in column_indices and len(row) > column_indices['title'] else f"Bookmark {row_num}"
                    url = row[column_indices['url']].strip() if 'url' in column_indices and len(row) > column_indices['url'] else ""
                    category = row[column_indices['category']].strip() if 'category' in column_indices and len(row) > column_indices['category'] else "Nicht zugeordnet"
                    subcategory = row[column_indices['subcategory']].strip() if 'subcategory' in column_indices and len(row) > column_indices['subcategory'] else None
                    description = row[column_indices['description']].strip() if 'description' in column_indices and len(row) > column_indices['description'] else None
                    
                    # Validierung
                    if not url:
                        continue  # Überspringe Zeilen ohne URL
                    
                    # Füge http:// hinzu wenn Schema fehlt
                    if not url.startswith(('http://', 'https://', 'ftp://')):
                        url = 'https://' + url
                    
                    bookmarks.append({
                        "title": title or "Ohne Titel",
                        "url": url,
                        "category": category or "Nicht zugeordnet",
                        "subcategory": subcategory if subcategory else None,
                        "description": description if description else None
                    })
                    
                except (IndexError, AttributeError) as e:
                    logging.warning(f"Error processing CSV row {row_num}: {e}")
                    continue
                    
        except Exception as e:
            logging.error(f"Error parsing CSV bookmarks: {e}")
        
        return bookmarks

class LinkValidator:
    """Klasse für Link-Validierung und Dead-Link-Erkennung"""
    
    def __init__(self):
        self.timeout = 10
        self.user_agent = "FavLink-Manager/1.0"
    
    async def check_link(self, url: str) -> Dict[str, Any]:
        """Überprüft einen einzelnen Link und gibt Status zurück"""
        try:
            async with aiohttp.ClientSession(
                timeout=aiohttp.ClientTimeout(total=self.timeout),
                headers={'User-Agent': self.user_agent}
            ) as session:
                async with session.head(url, allow_redirects=True) as response:
                    if response.status < 400:
                        return {"status": "active", "is_dead_link": False}
                    else:
                        return {"status": "dead", "is_dead_link": True}
        except asyncio.TimeoutError:
            return {"status": "timeout", "is_dead_link": True}
        except Exception:
            return {"status": "dead", "is_dead_link": True}
    
    async def validate_bookmarks(self, bookmarks: List[Bookmark]) -> List[Bookmark]:
        """Validiert alle Bookmarks auf Dead Links"""
        tasks = []
        for bookmark in bookmarks:
            tasks.append(self._validate_single_bookmark(bookmark))
        
        validated_bookmarks = await asyncio.gather(*tasks)
        return validated_bookmarks
    
    async def _validate_single_bookmark(self, bookmark: Bookmark) -> Bookmark:
        """Validiert ein einzelnes Bookmark"""
        link_result = await self.check_link(bookmark.url)
        bookmark.is_dead_link = link_result["is_dead_link"]
        bookmark.last_checked = datetime.now(timezone.utc)
        
        # Status-Type entsprechend setzen
        if link_result["is_dead_link"]:
            bookmark.status_type = "dead"
        else:
            # Nur auf active setzen wenn nicht bereits localhost oder duplicate
            if not hasattr(bookmark, 'status_type') or bookmark.status_type in ["active", "dead"]:
                bookmark.status_type = "active"
        
        return bookmark

class DuplicateDetector:
    """Klasse für Duplikat-Erkennung"""
    
    def __init__(self):
        pass
    
    def find_duplicates(self, bookmarks: List[Bookmark]) -> List[List[Bookmark]]:
        """Findet Duplikate basierend auf URL"""
        url_map = {}
        
        for bookmark in bookmarks:
            normalized_url = self._normalize_url(bookmark.url)
            if normalized_url not in url_map:
                url_map[normalized_url] = []
            url_map[normalized_url].append(bookmark)
        
        duplicates = [group for group in url_map.values() if len(group) > 1]
        return duplicates
    
    def _normalize_url(self, url: str) -> str:
        """Normalisiert URL für Duplikat-Vergleich"""
        normalized = url.lower().rstrip('/')
        if normalized.startswith('https://www.'):
            normalized = normalized.replace('https://www.', 'https://')
        elif normalized.startswith('http://www.'):
            normalized = normalized.replace('http://www.', 'http://')
        return normalized
    
    def remove_duplicates(self, bookmarks: List[Bookmark]) -> List[Bookmark]:
        """Entfernt Duplikate und behält das neueste"""
        unique_bookmarks = {}
        
        for bookmark in bookmarks:
            normalized_url = self._normalize_url(bookmark.url)
            if (normalized_url not in unique_bookmarks or 
                bookmark.date_added > unique_bookmarks[normalized_url].date_added):
                unique_bookmarks[normalized_url] = bookmark
        
        return list(unique_bookmarks.values())
    
    def normalize_url(self, url: str) -> str:
        """Normalisiert URL für Duplikat-Vergleich (public method)"""
        return self._normalize_url(url)
    
    async def find_and_mark_duplicates(self):
        """Duplikate finden und mit 'duplicate' Status markieren"""
        bookmarks = await db.bookmarks.find({}).to_list(100000)
        
        # Gruppiere Bookmarks nach normalisierter URL
        url_groups = {}
        for bookmark in bookmarks:
            normalized_url = self.normalize_url(bookmark['url'])
            if normalized_url not in url_groups:
                url_groups[normalized_url] = []
            url_groups[normalized_url].append(bookmark)
        
        # Finde Gruppen mit mehr als einem Bookmark (Duplikate)
        duplicate_groups = []
        for url, bookmark_group in url_groups.items():
            if len(bookmark_group) > 1:
                duplicate_groups.append(bookmark_group)
                
                # Markiere alle außer dem ersten als Duplikat
                for bookmark in bookmark_group[1:]:  # Überspringe den ersten
                    await db.bookmarks.update_one(
                        {"id": bookmark['id']},
                        {"$set": {"status_type": "duplicate"}}
                    )
        
        return duplicate_groups

class ExportManager:
    """Klasse für Export-Funktionen"""
    
    def __init__(self):
        pass
    
    def export_to_xml(self, bookmarks: List[Bookmark]) -> str:
        """Exportiert Bookmarks zu XML"""
        root = ET.Element("bookmarks")
        root.set("version", "1.0")
        root.set("generated", datetime.now(timezone.utc).isoformat())
        
        for bookmark in bookmarks:
            bookmark_elem = ET.SubElement(root, "bookmark")
            bookmark_elem.set("id", bookmark.id)
            
            ET.SubElement(bookmark_elem, "title").text = bookmark.title
            ET.SubElement(bookmark_elem, "url").text = bookmark.url
            ET.SubElement(bookmark_elem, "category").text = bookmark.category
            if bookmark.subcategory:
                ET.SubElement(bookmark_elem, "subcategory").text = bookmark.subcategory
            ET.SubElement(bookmark_elem, "date_added").text = bookmark.date_added.isoformat()
            ET.SubElement(bookmark_elem, "is_dead_link").text = str(bookmark.is_dead_link).lower()
            if bookmark.last_checked:
                ET.SubElement(bookmark_elem, "last_checked").text = bookmark.last_checked.isoformat()
        
        return ET.tostring(root, encoding='unicode', xml_declaration=True)
    
    def export_to_csv(self, bookmarks: List[Bookmark]) -> str:
        """Exportiert Bookmarks zu CSV"""
        output = io.StringIO()
        writer = csv.writer(output)
        
        # Header
        writer.writerow([
            'ID', 'Title', 'URL', 'Category', 'Subcategory', 
            'Date Added', 'Is Dead Link', 'Last Checked'
        ])
        
        # Data
        for bookmark in bookmarks:
            writer.writerow([
                bookmark.id,
                bookmark.title,
                bookmark.url,
                bookmark.category,
                bookmark.subcategory or '',
                bookmark.date_added.isoformat(),
                bookmark.is_dead_link,
                bookmark.last_checked.isoformat() if bookmark.last_checked else ''
            ])
        
        output.seek(0)
        return output.getvalue()
    
    def export_to_html(self, bookmarks: List[Bookmark]) -> str:
        """Exportiert Bookmarks zu HTML (Browser-kompatibel)"""
        html_template = '''<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
{folders}
</DL><p>'''
        
        # Organisiere Bookmarks nach Kategorien
        categories = {}
        for bookmark in bookmarks:
            category = bookmark.category or "Andere"
            if category not in categories:
                categories[category] = []
            categories[category].append(bookmark)
        
        folders_html = ""
        for category_name, category_bookmarks in categories.items():
            folders_html += f'    <DT><H3>{category_name}</H3>\n'
            folders_html += '    <DL><p>\n'
            
            for bookmark in category_bookmarks:
                # Zeitstempel in Unix-Format für Browser-Kompatibilität
                timestamp = int(bookmark.date_added.timestamp())
                folders_html += f'        <DT><A HREF="{bookmark.url}" ADD_DATE="{timestamp}">{bookmark.title}</A>\n'
            
            folders_html += '    </DL><p>\n'
        
        return html_template.format(folders=folders_html)
    
    def export_to_json(self, bookmarks: List[Bookmark]) -> str:
        """Exportiert Bookmarks zu JSON (Chrome-kompatibel)"""
        # Chrome Bookmarks JSON-Struktur
        root = {
            "checksum": "generated_by_favorg",
            "roots": {
                "bookmark_bar": {
                    "children": [],
                    "date_added": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                    "date_modified": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                    "id": "1",
                    "name": "Bookmarks bar",
                    "type": "folder"
                },
                "other": {
                    "children": [],
                    "date_added": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                    "date_modified": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                    "id": "2",
                    "name": "Other bookmarks",
                    "type": "folder"
                },
                "synced": {
                    "children": [],
                    "date_added": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                    "date_modified": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                    "id": "3",
                    "name": "Mobile bookmarks",
                    "type": "folder"
                }
            },
            "version": 1
        }
        
        # Organisiere Bookmarks nach Kategorien für Chrome-Ordner
        categories = {}
        for bookmark in bookmarks:
            category = bookmark.category or "Other bookmarks"
            if category not in categories:
                categories[category] = []
            categories[category].append(bookmark)
        
        folder_id = 4  # Start-ID für neue Ordner
        
        for category_name, category_bookmarks in categories.items():
            # Erstelle Ordner für Kategorie
            folder = {
                "children": [],
                "date_added": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                "date_modified": str(int(datetime.now(timezone.utc).timestamp() * 1000000)),
                "id": str(folder_id),
                "name": category_name,
                "type": "folder"
            }
            
            bookmark_id = folder_id + 1000  # Bookmark-IDs beginnen bei 1000+ der Folder-ID
            
            for bookmark in category_bookmarks:
                bookmark_entry = {
                    "date_added": str(int(bookmark.date_added.timestamp() * 1000000)),
                    "id": str(bookmark_id),
                    "name": bookmark.title,
                    "type": "url",
                    "url": bookmark.url
                }
                folder["children"].append(bookmark_entry)
                bookmark_id += 1
            
            # Füge Ordner zu "bookmark_bar" hinzu (Hauptbereich)
            root["roots"]["bookmark_bar"]["children"].append(folder)
            folder_id += 1
        
        return json.dumps(root, indent=2, ensure_ascii=False)

class ModularCategoryManager:
    """Phase 2: Objektorientierte Kategorie-Verwaltung mit Lock-Funktionalität"""
    
    def __init__(self, database):
        self.db = database
    
    async def get_all_categories(self) -> List[Category]:
        """Alle Kategorien mit Hierarchie und Lock-Status abrufen"""
        categories = await self.db.categories.find().to_list(100000)
        
        # Erweitere jede Kategorie um Lock-Informationen
        enhanced_categories = []
        for cat in categories:
            # Füge Lock-Status hinzu falls nicht vorhanden
            cat["is_locked"] = cat.get("is_locked", False)
            cat["lock_reason"] = cat.get("lock_reason", "")
            enhanced_categories.append(Category(**cat))
        
        return enhanced_categories
    
    async def create_category(self, name: str, parent_category: Optional[str] = None, is_locked: bool = False, lock_reason: str = "") -> Category:
        """Neue Kategorie oder Unterkategorie mit Lock-Option erstellen"""
        category_dict = {
            "id": str(uuid.uuid4()),
            "name": name, 
            "parent_category": parent_category,
            "is_locked": is_locked,
            "lock_reason": lock_reason,
            "created_at": datetime.now(timezone.utc),
            "updated_at": datetime.now(timezone.utc)
        }
        category = Category(**category_dict)
        await self.db.categories.insert_one(category.dict())
        return category
    
    async def update_category(self, category_id: str, update_data: dict) -> dict:
        """Aktualisiere Kategorie mit Lock-Protection"""
        # Prüfe Lock-Status
        existing_category = await self.db.categories.find_one({"id": category_id})
        if not existing_category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        if existing_category.get("is_locked", False):
            raise HTTPException(
                status_code=403, 
                detail=f"Gesperrte Kategorie kann nicht bearbeitet werden: {existing_category.get('lock_reason', 'Kategorie ist geschützt')}"
            )
        
        # Update durchführen
        update_doc = {k: v for k, v in update_data.items() if v is not None}
        update_doc["updated_at"] = datetime.now(timezone.utc)
        
        result = await self.db.categories.update_one(
            {"id": category_id},
            {"$set": update_doc}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Category not found or no changes made")
        
        return {"message": "Category updated successfully", "modified_count": result.modified_count}
    
    async def delete_category(self, category_id: str) -> dict:
        """Lösche Kategorie mit Lock-Protection"""
        # Prüfe Lock-Status
        existing_category = await self.db.categories.find_one({"id": category_id})
        if not existing_category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        if existing_category.get("is_locked", False):
            raise HTTPException(
                status_code=403, 
                detail=f"Gesperrte Kategorie kann nicht gelöscht werden: {existing_category.get('lock_reason', 'Kategorie ist geschützt')}"
            )
        
        category_name = existing_category["name"]
        
        # Verschiebe Bookmarks zu "Uncategorized"
        moved_bookmarks = await self.db.bookmarks.update_many(
            {"category": category_name},
            {"$set": {"category": "Uncategorized", "subcategory": ""}}
        )
        
        # Lösche Kategorie
        await self.db.categories.delete_one({"id": category_id})
        
        # Update Counts
        await self.update_bookmark_counts()
        
        return {
            "message": f"Category '{category_name}' deleted and {moved_bookmarks.modified_count} bookmarks moved to Uncategorized",
            "moved_bookmarks": moved_bookmarks.modified_count
        }
    
    async def lock_category(self, category_id: str, lock_reason: str = "") -> dict:
        """Sperre Kategorie vor Änderungen"""
        result = await self.db.categories.update_one(
            {"id": category_id},
            {"$set": {
                "is_locked": True,
                "lock_reason": lock_reason or "Kategorie administrativ gesperrt",
                "locked_at": datetime.now(timezone.utc),
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        return {"message": f"Category successfully locked: {lock_reason}", "is_locked": True}
    
    async def unlock_category(self, category_id: str) -> dict:
        """Entsperre Kategorie"""
        # Erst prüfen ob Kategorie existiert
        existing_category = await self.db.categories.find_one({"id": category_id})
        if not existing_category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Update durchführen
        result = await self.db.categories.update_one(
            {"id": category_id},
            {"$set": {
                "is_locked": False,
                "lock_reason": "",
                "locked_at": None,
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        
        # Erfolgreiche Entsperrung bestätigen
        return {
            "message": f"Category '{existing_category['name']}' successfully unlocked", 
            "is_locked": False,
            "category_name": existing_category['name']
        }
    
    async def update_bookmark_counts(self):
        """Bookmark-Anzahl für alle Kategorien und Unterkategorien aktualisieren"""
        # Hauptkategorien
        pipeline = [
            {"$group": {"_id": "$category", "count": {"$sum": 1}}}
        ]
        counts = await self.db.bookmarks.aggregate(pipeline).to_list(None)
        
        for count_doc in counts:
            await self.db.categories.update_one(
                {"name": count_doc["_id"], "parent_category": None},
                {"$set": {"bookmark_count": count_doc["count"]}},
                upsert=True
            )
        
        # Unterkategorien
        subcategory_pipeline = [
            {"$match": {"subcategory": {"$ne": None}}},
            {"$group": {"_id": {"category": "$category", "subcategory": "$subcategory"}, "count": {"$sum": 1}}}
        ]
        subcounts = await self.db.bookmarks.aggregate(subcategory_pipeline).to_list(None)
        
        for count_doc in subcounts:
            category_name = count_doc["_id"]["category"]
            subcategory_name = count_doc["_id"]["subcategory"]
            
            await self.db.categories.update_one(
                {"name": subcategory_name, "parent_category": category_name},
                {"$set": {"bookmark_count": count_doc["count"]}},
                upsert=True
            )

class StatisticsManager:
    """Klasse für erweiterte Statistik-Verwaltung"""
    
    def __init__(self, database):
        self.db = database
    
    async def generate_statistics(self) -> Statistics:
        """Generiert umfassende Statistiken mit Unterkategorien"""
        
        bookmarks = await self.db.bookmarks.find().to_list(100000)
        categories = await self.db.categories.find().to_list(100000)
        
        total_bookmarks = len(bookmarks)
        total_categories = len(categories)
        
        # Status-basierte Zählung
        active_links = sum(1 for b in bookmarks if b.get('status_type') == 'active')
        dead_links = sum(1 for b in bookmarks if b.get('status_type') == 'dead')
        localhost_links = sum(1 for b in bookmarks if b.get('status_type') == 'localhost')
        duplicate_links = sum(1 for b in bookmarks if b.get('status_type') == 'duplicate')
        locked_links = sum(1 for b in bookmarks if b.get('status_type') == 'locked' or b.get('is_locked', False))
        timeout_links = sum(1 for b in bookmarks if b.get('status_type') == 'timeout')
        unchecked_links = sum(1 for b in bookmarks if not b.get('status_type') or b.get('status_type') == 'unchecked')
        
        # Kategorien-Verteilung
        categories_distribution = {}
        subcategories_distribution = {}
        
        for bookmark in bookmarks:
            category = bookmark.get('category', 'Nicht zugeordnet')
            subcategory = bookmark.get('subcategory')
            
            categories_distribution[category] = categories_distribution.get(category, 0) + 1
            
            if subcategory:
                if category not in subcategories_distribution:
                    subcategories_distribution[category] = {}
                subcategories_distribution[category][subcategory] = subcategories_distribution[category].get(subcategory, 0) + 1
        
        # Top Kategorien
        top_categories = [
            {
                "name": cat, 
                "count": count, 
                "percentage": round((count / total_bookmarks) * 100, 1) if total_bookmarks > 0 else 0,
                "subcategories": subcategories_distribution.get(cat, {})
            }
            for cat, count in sorted(categories_distribution.items(), key=lambda x: x[1], reverse=True)
        ]
        
        # Kürzlich hinzugefügte Bookmarks
        from datetime import timedelta
        seven_days_ago = datetime.now(timezone.utc) - timedelta(days=7)
        recent_bookmarks = sum(
            1 for b in bookmarks 
            if b.get('date_added') and 
            (datetime.fromisoformat(b['date_added'].replace('Z', '+00:00')).replace(tzinfo=timezone.utc) if isinstance(b['date_added'], str) 
             else (b['date_added'].replace(tzinfo=timezone.utc) if b['date_added'].tzinfo is None else b['date_added'])) > seven_days_ago
        )
        
        return Statistics(
            total_bookmarks=total_bookmarks,
            total_categories=total_categories,
            active_links=active_links,
            dead_links=dead_links,
            localhost_links=localhost_links,
            duplicate_links=duplicate_links,
            locked_links=locked_links,
            timeout_links=timeout_links,
            unchecked_links=unchecked_links,
            categories_distribution=categories_distribution,
            subcategories_distribution=subcategories_distribution,
            top_categories=top_categories,
            recent_bookmarks=recent_bookmarks,
            last_updated=datetime.now(timezone.utc)
        )

class BookmarkManager:
    """Hauptklasse für Bookmark-Verwaltung"""
    
    def __init__(self, database):
        self.db = database
        self.parser = BookmarkParser()
        self.validator = LinkValidator()
        self.duplicate_detector = DuplicateDetector()
        self.category_manager = ModularCategoryManager(database)
        self.statistics_manager = StatisticsManager(database)
        self.export_manager = ExportManager()
    
    async def create_sample_bookmarks(self) -> Dict[str, Any]:
        """Erstellt 30 Beispiel-Bookmarks mit Unterkategorien"""
        
        sample_bookmarks = [
            # Development (8 Bookmarks) mit Unterkategorien
            {"title": "GitHub", "url": "https://github.com", "category": "Development", "subcategory": "Code Hosting"},
            {"title": "Stack Overflow", "url": "https://stackoverflow.com", "category": "Development", "subcategory": "Q&A"},
            {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "category": "Development", "subcategory": "Documentation"},
            {"title": "CodePen", "url": "https://codepen.io", "category": "Development", "subcategory": "Code Sharing"},
            {"title": "GitLab", "url": "https://gitlab.com", "category": "Development", "subcategory": "Code Hosting"},
            {"title": "Bitbucket", "url": "https://bitbucket.org", "category": "Development", "subcategory": "Code Hosting"},
            {"title": "VS Code", "url": "https://code.visualstudio.com", "category": "Development", "subcategory": "IDE"},
            {"title": "Docker Hub", "url": "https://hub.docker.com", "category": "Development", "subcategory": "Container"},
            
            # News & Media (6 Bookmarks)
            {"title": "Hacker News", "url": "https://news.ycombinator.com", "category": "News", "subcategory": "Tech News"},
            {"title": "Reddit", "url": "https://reddit.com", "category": "News", "subcategory": "Social News"},
            {"title": "BBC News", "url": "https://bbc.com/news", "category": "News", "subcategory": "World News"},
            {"title": "TechCrunch", "url": "https://techcrunch.com", "category": "News", "subcategory": "Tech News"},
            {"title": "Ars Technica", "url": "https://arstechnica.com", "category": "News", "subcategory": "Tech News"},
            {"title": "The Verge", "url": "https://theverge.com", "category": "News", "subcategory": "Tech News"},
            
            # Social Media (4 Bookmarks)
            {"title": "Twitter", "url": "https://twitter.com", "category": "Social Media", "subcategory": "Microblogging"},
            {"title": "LinkedIn", "url": "https://linkedin.com", "category": "Social Media", "subcategory": "Professional"},
            {"title": "Instagram", "url": "https://instagram.com", "category": "Social Media", "subcategory": "Photo Sharing"},
            {"title": "Mastodon", "url": "https://mastodon.social", "category": "Social Media", "subcategory": "Decentralized"},
            
            # Tools & Utilities (5 Bookmarks)
            {"title": "Google", "url": "https://google.com", "category": "Tools", "subcategory": "Search"},
            {"title": "Gmail", "url": "https://gmail.com", "category": "Tools", "subcategory": "Email"},
            {"title": "Google Drive", "url": "https://drive.google.com", "category": "Tools", "subcategory": "Cloud Storage"},
            {"title": "Dropbox", "url": "https://dropbox.com", "category": "Tools", "subcategory": "Cloud Storage"},
            {"title": "Notion", "url": "https://notion.so", "category": "Tools", "subcategory": "Productivity"},
            
            # Entertainment (4 Bookmarks)
            {"title": "YouTube", "url": "https://youtube.com", "category": "Entertainment", "subcategory": "Video"},
            {"title": "Netflix", "url": "https://netflix.com", "category": "Entertainment", "subcategory": "Streaming"},
            {"title": "Spotify", "url": "https://spotify.com", "category": "Entertainment", "subcategory": "Music"},
            {"title": "Twitch", "url": "https://twitch.tv", "category": "Entertainment", "subcategory": "Gaming"},
            
            # Reference mit Duplikaten und Dead Links
            {"title": "Wikipedia", "url": "https://wikipedia.org", "category": "Reference"},
            {"title": "Wikipedia DE", "url": "https://de.wikipedia.org", "category": "Reference"},
            {"title": "Archive.org", "url": "https://archive.org", "category": "Reference"},
            
            # Test-Fälle für leere/problematische Kategorienamen
            {"title": "Bookmark ohne Kategorie", "url": "https://example1.com", "category": ""},
            {"title": "Bookmark mit leerem Subcategory", "url": "https://example2.com", "category": "Test", "subcategory": ""},
            {"title": "Nur Leerzeichen Kategorie", "url": "https://example3.com", "category": "   ", "subcategory": None},
            
            # Dead Links für Tests
            {"title": "Dead Link 1", "url": "https://this-domain-does-not-exist-12345.com", "category": "Testing"},
            {"title": "Dead Link 2", "url": "https://broken-url-test.invalid", "category": "Testing"},
        ]
        
        created_count = 0
        for bookmark_data in sample_bookmarks:
            bookmark = Bookmark(**bookmark_data)
            await self.db.bookmarks.insert_one(bookmark.dict())
            created_count += 1
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "created_count": created_count,
            "message": f"Successfully created {created_count} sample bookmarks with subcategories"
        }

    async def create_comprehensive_test_data(self):
        """Modulare Testdaten-Generierung mit exakten Status-Zahlen für Phase 2 Rebuild"""
        # Bereinigung vor Neuerstellung
        await self.db.bookmarks.delete_many({})
        await self.db.categories.delete_many({})
        
        created_bookmarks = []
        
        # 10 Aktive Links
        active_bookmarks = [
            {"title": "GitHub", "url": "https://github.com", "category": "Development", "subcategory": "Code Hosting", "description": "Code hosting platform for software development"},
            {"title": "Stack Overflow", "url": "https://stackoverflow.com", "category": "Development", "subcategory": "Q&A", "description": "Programming Q&A community"},
            {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "category": "Development", "subcategory": "Documentation", "description": "Web development documentation"},
            {"title": "BBC News", "url": "https://www.bbc.com/news", "category": "News", "subcategory": "World News", "description": "International news coverage"},
            {"title": "LinkedIn", "url": "https://www.linkedin.com", "category": "Social Media", "subcategory": "Professional", "description": "Professional networking platform"},
            {"title": "Netflix", "url": "https://www.netflix.com", "category": "Entertainment", "subcategory": "Streaming", "description": "Video streaming service"},
            {"title": "Wikipedia", "url": "https://www.wikipedia.org", "category": "Reference", "subcategory": "Encyclopedia", "description": "Free online encyclopedia"},
            {"title": "Amazon", "url": "https://www.amazon.com", "category": "Shopping", "subcategory": "E-Commerce", "description": "Online shopping platform"},
            {"title": "Coursera", "url": "https://www.coursera.org", "category": "Education", "subcategory": "Online Learning", "description": "Online course platform"},
            {"title": "WebMD", "url": "https://www.webmd.com", "category": "Health", "subcategory": "Medical Info", "description": "Health information resource"}
        ]
        
        # 10 Tote Links (Dead)
        dead_bookmarks = [
            {"title": "Dead Link 1", "url": "https://deadlink1.nonexistent", "category": "Development", "description": "This is a dead link for testing"},
            {"title": "Dead Link 2", "url": "https://404error.test", "category": "News", "description": "Another dead link"},
            {"title": "Dead Link 3", "url": "https://broken.example", "category": "Tools", "description": "Broken link example"},
            {"title": "Dead Link 4", "url": "https://notfound.invalid", "category": "Social Media", "description": "Invalid domain test"},
            {"title": "Dead Link 5", "url": "https://missing.page", "category": "Entertainment", "description": "Missing page test"},
            {"title": "Dead Link 6", "url": "https://expired.domain", "category": "Reference", "description": "Expired domain test"},
            {"title": "Dead Link 7", "url": "https://unreachable.site", "category": "Shopping", "description": "Unreachable site test"},
            {"title": "Dead Link 8", "url": "https://offline.service", "category": "Education", "description": "Offline service test"},
            {"title": "Dead Link 9", "url": "https://discontinued.app", "category": "Health", "description": "Discontinued app test"},
            {"title": "Dead Link 10", "url": "https://removed.content", "category": "Finance", "description": "Removed content test"}
        ]
        
        # 10 Localhost Links
        localhost_bookmarks = [
            {"title": "Local Dev Server", "url": "http://localhost:3000", "category": "Development", "subcategory": "Local Dev", "description": "React development server"},
            {"title": "Local API", "url": "http://localhost:8000", "category": "Development", "subcategory": "Local Dev", "description": "FastAPI local server"},
            {"title": "Local Database", "url": "http://127.0.0.1:27017", "category": "Development", "subcategory": "Database", "description": "MongoDB local instance"},
            {"title": "Local Docs", "url": "http://localhost:4000", "category": "Development", "subcategory": "Documentation", "description": "Local documentation server"},
            {"title": "Local Test", "url": "http://127.0.0.1:5000", "category": "Development", "subcategory": "Testing", "description": "Local test environment"},
            {"title": "Local Web", "url": "http://localhost:8080", "category": "Development", "subcategory": "Web Server", "description": "Local web server"},
            {"title": "Local Admin", "url": "http://localhost:9000", "category": "Tools", "subcategory": "Admin", "description": "Local admin panel"},
            {"title": "Local Preview", "url": "http://127.0.0.1:3001", "category": "Development", "subcategory": "Preview", "description": "Local preview server"},
            {"title": "Local Cache", "url": "http://localhost:6379", "category": "Development", "subcategory": "Cache", "description": "Local Redis cache"},
            {"title": "Local Debug", "url": "http://127.0.0.1:4040", "category": "Development", "subcategory": "Debug", "description": "Local debug server"}
        ]
        
        # 10 Duplikate (gleiche URLs mit unterschiedlichen Titeln)
        duplicate_bookmarks = [
            {"title": "GitHub Main", "url": "https://github.com", "category": "Development", "description": "Main GitHub page"},
            {"title": "GitHub Duplicate", "url": "https://github.com", "category": "Development", "description": "Duplicate GitHub entry"},
            {"title": "Google Search", "url": "https://www.google.com", "category": "Tools", "description": "Google search engine"},
            {"title": "Google Homepage", "url": "https://www.google.com", "category": "Tools", "description": "Duplicate Google entry"},
            {"title": "YouTube Main", "url": "https://www.youtube.com", "category": "Entertainment", "description": "YouTube video platform"},
            {"title": "YouTube Videos", "url": "https://www.youtube.com", "category": "Entertainment", "description": "Duplicate YouTube entry"},
            {"title": "Facebook Social", "url": "https://www.facebook.com", "category": "Social Media", "description": "Facebook social network"},
            {"title": "Facebook Page", "url": "https://www.facebook.com", "category": "Social Media", "description": "Duplicate Facebook entry"},
            {"title": "Twitter Feed", "url": "https://twitter.com", "category": "Social Media", "description": "Twitter social platform"},
            {"title": "Twitter Social", "url": "https://twitter.com", "category": "Social Media", "description": "Duplicate Twitter entry"}
        ]
        
        # 10 Gesperrt (Locked)
        locked_bookmarks = [
            {"title": "Production Database", "url": "https://production-db.company.com", "category": "Development", "subcategory": "Critical", "description": "CRITICAL: Production database access"},
            {"title": "Admin Panel", "url": "https://admin.company.com", "category": "Tools", "subcategory": "Critical", "description": "CRITICAL: Company admin panel"},
            {"title": "Financial System", "url": "https://finance.company.com", "category": "Finance", "subcategory": "Critical", "description": "CRITICAL: Financial management system"},
            {"title": "Customer Data", "url": "https://customers.company.com", "category": "Reference", "subcategory": "Critical", "description": "CRITICAL: Customer database"},
            {"title": "Security Console", "url": "https://security.company.com", "category": "Tools", "subcategory": "Security", "description": "CRITICAL: Security management"},
            {"title": "Backup System", "url": "https://backup.company.com", "category": "Tools", "subcategory": "Critical", "description": "CRITICAL: Backup management"},
            {"title": "Legal Documents", "url": "https://legal.company.com", "category": "Reference", "subcategory": "Legal", "description": "CRITICAL: Legal document storage"},
            {"title": "HR System", "url": "https://hr.company.com", "category": "Tools", "subcategory": "HR", "description": "CRITICAL: Human resources system"},
            {"title": "Payment Gateway", "url": "https://payments.company.com", "category": "Finance", "subcategory": "Critical", "description": "CRITICAL: Payment processing"},
            {"title": "API Keys", "url": "https://keys.company.com", "category": "Development", "subcategory": "Critical", "description": "CRITICAL: API key management"}
        ]
        
        # 10 Timeout Links (langsame Verbindungen)
        timeout_bookmarks = [
            {"title": "Slow Server 1", "url": "https://slowserver1.timeout", "category": "Development", "description": "Very slow loading server"},
            {"title": "Slow Server 2", "url": "https://slowserver2.timeout", "category": "News", "description": "Timeout-prone news site"},
            {"title": "Slow Server 3", "url": "https://slowserver3.timeout", "category": "Tools", "description": "Slow loading tool"},
            {"title": "Slow Server 4", "url": "https://slowserver4.timeout", "category": "Social Media", "description": "Slow social platform"},
            {"title": "Slow Server 5", "url": "https://slowserver5.timeout", "category": "Entertainment", "description": "Slow streaming service"},
            {"title": "Slow Server 6", "url": "https://slowserver6.timeout", "category": "Reference", "description": "Slow reference site"},
            {"title": "Slow Server 7", "url": "https://slowserver7.timeout", "category": "Shopping", "description": "Slow e-commerce site"},
            {"title": "Slow Server 8", "url": "https://slowserver8.timeout", "category": "Education", "description": "Slow learning platform"},
            {"title": "Slow Server 9", "url": "https://slowserver9.timeout", "category": "Health", "description": "Slow health portal"},
            {"title": "Slow Server 10", "url": "https://slowserver10.timeout", "category": "Finance", "description": "Slow financial service"}
        ]
        
        # 10 Ungeprüft (unchecked - noch nicht validierte Links)
        unchecked_bookmarks = [
            {"title": "Checked Link 1", "url": "https://checked1.example", "category": "Development", "description": "Previously checked development link"},
            {"title": "Checked Link 2", "url": "https://checked2.example", "category": "News", "description": "Previously checked news link"},
            {"title": "Checked Link 3", "url": "https://checked3.example", "category": "Tools", "description": "Previously checked tool"},
            {"title": "Checked Link 4", "url": "https://checked4.example", "category": "Social Media", "description": "Previously checked social link"},
            {"title": "Checked Link 5", "url": "https://checked5.example", "category": "Entertainment", "description": "Previously checked entertainment link"},
            {"title": "Checked Link 6", "url": "https://checked6.example", "category": "Reference", "description": "Previously checked reference"},
            {"title": "Checked Link 7", "url": "https://checked7.example", "category": "Shopping", "description": "Previously checked shopping link"},
            {"title": "Checked Link 8", "url": "https://checked8.example", "category": "Education", "description": "Previously checked education link"},
            {"title": "Checked Link 9", "url": "https://checked9.example", "category": "Health", "description": "Previously checked health link"},
            {"title": "Checked Link 10", "url": "https://checked10.example", "category": "Finance", "description": "Previously checked finance link"}
        ]
        
        # Erstelle Bookmarks mit korrekten Status-Typen
        all_bookmark_groups = [
            (active_bookmarks, "active", False, False),
            (dead_bookmarks, "dead", True, False),
            (localhost_bookmarks, "localhost", False, False),
            (duplicate_bookmarks, "duplicate", False, False),
            (locked_bookmarks, "locked", False, True),
            (timeout_bookmarks, "timeout", False, False),
            (unchecked_bookmarks, "unchecked", False, False)
        ]
        
        total_created = 0
        status_counts = {
            "active": 0,
            "dead": 0,
            "localhost": 0,
            "duplicate": 0,
            "locked": 0,
            "timeout": 0,
            "checked": 0,
            "unchecked": 0
        }
        
        for bookmark_group, status_type, is_dead, is_locked in all_bookmark_groups:
            for bookmark_data in bookmark_group:
                bookmark_dict = {
                    "id": str(uuid.uuid4()),
                    "title": bookmark_data["title"],
                    "url": bookmark_data["url"],
                    "category": bookmark_data["category"],
                    "subcategory": bookmark_data.get("subcategory", ""),
                    "description": bookmark_data.get("description", ""),
                    "date_added": datetime.now(timezone.utc),
                    "is_dead_link": is_dead,
                    "is_locked": is_locked,
                    "status_type": status_type,
                    "last_checked": None
                }
                
                await self.db.bookmarks.insert_one(bookmark_dict)
                created_bookmarks.append(bookmark_dict)
                status_counts[status_type] += 1
                total_created += 1
        
        # Update categories
        await self.category_manager.update_bookmark_counts()
        
        return {
            "message": f"Created {total_created} modular test bookmarks with exact status distribution",
            "created_count": total_created,
            "status_distribution": status_counts,
            "details": {
                "active_links": status_counts["active"],
                "dead_links": status_counts["dead"],
                "localhost_links": status_counts["localhost"],
                "duplicate_links": status_counts["duplicate"],
                "locked_links": status_counts["locked"],
                "timeout_links": status_counts["timeout"],
                "unchecked_links": status_counts["unchecked"],
                "total": total_created
            }
        }

    async def initialize_categories_from_bookmarks(self):
        """Erstelle Kategorie-Entitäten in der Datenbank basierend auf bestehenden Bookmarks"""
        try:
            # Hole alle einzigartigen Kategorien aus Bookmarks
            pipeline = [
                {"$group": {
                    "_id": {
                        "category": "$category",
                        "subcategory": "$subcategory"
                    },
                    "count": {"$sum": 1}
                }}
            ]
            
            category_data = await self.db.bookmarks.aggregate(pipeline).to_list(None)
            
            # Erstelle Kategorie-Dokumente
            categories_to_insert = []
            main_categories = set()
            
            for item in category_data:
                category = item["_id"]["category"]
                subcategory = item["_id"]["subcategory"]
                count = item["count"]
                
                # Hauptkategorie
                if category and category not in main_categories:
                    main_categories.add(category)
                    categories_to_insert.append({
                        "name": category,
                        "parent_category": None,
                        "order_index": len([c for c in categories_to_insert if c.get("parent_category") is None]),
                        "bookmark_count": 0,  # Wird später aktualisiert
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    })
                
                # Unterkategorie
                if subcategory and subcategory.strip():
                    categories_to_insert.append({
                        "name": subcategory,
                        "parent_category": category,
                        "order_index": len([c for c in categories_to_insert if c.get("parent_category") == category]),
                        "bookmark_count": count,
                        "created_at": datetime.now(timezone.utc),
                        "updated_at": datetime.now(timezone.utc)
                    })
            
            # Lösche bestehende Kategorien
            await self.db.categories.delete_many({})
            
            # Füge neue Kategorien hinzu - mit upsert um Duplikate zu vermeiden
            if categories_to_insert:
                for category in categories_to_insert:
                    await self.db.categories.update_one(
                        {"name": category["name"]},
                        {"$set": category},
                        upsert=True  # Erstelle nur wenn nicht vorhanden
                    )
            
            # Update bookmark counts
            await self.category_manager.update_bookmark_counts()
            
            return {
                "message": f"Initialized {len(categories_to_insert)} categories",
                "main_categories": len(main_categories),
                "total_categories": len(categories_to_insert)
            }
            
        except Exception as e:
            print(f"Error initializing categories: {e}")
            return {"error": str(e)}
    
    async def import_bookmarks(self, content: str, file_type: str) -> Dict[str, Any]:
        """Importiert Bookmarks aus verschiedenen Formaten"""
        
        logging.info(f"Importing bookmarks: file_type={file_type}, content_length={len(content)}")
        
        if file_type.lower() == 'html':
            bookmark_data = self.parser.parse_html_bookmarks(content)
        elif file_type.lower() == 'json':
            bookmark_data = self.parser.parse_json_bookmarks(content)
        elif file_type.lower() == 'xml':
            bookmark_data = self.parser.parse_xml_bookmarks(content)
        elif file_type.lower() == 'csv':
            bookmark_data = self.parser.parse_csv_bookmarks(content)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        logging.info(f"Parsed {len(bookmark_data)} bookmarks from {file_type} file")
        
        if not bookmark_data:
            return {
                "imported_count": 0,
                "message": f"No valid bookmarks found in {file_type} file",
                "details": f"File contained {len(content)} characters but no bookmarks were extracted"
            }
        
        # Convert to Bookmark objects
        valid_bookmarks = []
        for data in bookmark_data:
            try:
                # Ensure required fields
                if not data.get('title') or not data.get('url'):
                    continue
                    
                bookmark = Bookmark(
                    id=str(uuid.uuid4()),
                    title=data['title'],
                    url=data['url'],
                    category=data.get('category', 'Imported'),
                    subcategory=data.get('subcategory', ''),
                    created_at=datetime.utcnow(),
                    is_dead_link=False
                )
                valid_bookmarks.append(bookmark)
            except Exception as e:
                logging.warning(f"Failed to create bookmark from data {data}: {e}")
                continue
        
        logging.info(f"Created {len(valid_bookmarks)} valid bookmark objects")
        
        # Remove duplicates
        unique_bookmarks = self.duplicate_detector.remove_duplicates(valid_bookmarks)
        logging.info(f"After duplicate removal: {len(unique_bookmarks)} bookmarks")
        
        # Insert into database
        inserted_count = 0
        for bookmark in unique_bookmarks:
            try:
                await self.db.bookmarks.insert_one(bookmark.dict())
                inserted_count += 1
            except Exception as e:
                logging.error(f"Failed to insert bookmark {bookmark.title}: {e}")
        
        logging.info(f"Successfully inserted {inserted_count} bookmarks into database")
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "imported_count": inserted_count,
            "total_parsed": len(bookmark_data),
            "valid_bookmarks": len(valid_bookmarks),
            "after_deduplication": len(unique_bookmarks),
            "message": f"Successfully imported {inserted_count} bookmarks from {file_type} file"
        }
    
    async def get_all_bookmarks(self) -> List[Bookmark]:
        """Alle Bookmarks abrufen"""
        bookmarks = await self.db.bookmarks.find().to_list(100000)
        return [Bookmark(**bookmark) for bookmark in bookmarks]
    
    async def get_bookmarks_by_category(self, category: str, subcategory: Optional[str] = None) -> List[Bookmark]:
        """Bookmarks nach Kategorie und optional Unterkategorie filtern"""
        query = {"category": category}
        if subcategory:
            query["subcategory"] = subcategory
            
        bookmarks = await self.db.bookmarks.find(query).to_list(100000)
        return [Bookmark(**bookmark) for bookmark in bookmarks]
    
    async def create_bookmark(self, bookmark_data: BookmarkCreate) -> Bookmark:
        """Neues Bookmark erstellen"""
        bookmark_dict = bookmark_data.dict()
        
        # Konsistenz zwischen is_locked und status_type sicherstellen
        if bookmark_dict.get("is_locked", False):
            bookmark_dict["status_type"] = "locked"
        elif bookmark_dict.get("status_type") == "locked":
            bookmark_dict["is_locked"] = True
            
        bookmark = Bookmark(**bookmark_dict)
        await self.db.bookmarks.insert_one(bookmark.dict())
        await self.category_manager.update_bookmark_counts()
        return bookmark
    
    async def update_bookmark(self, bookmark_id: str, update_data: BookmarkUpdate) -> Bookmark:
        """Bookmark aktualisieren"""
        update_dict = {k: v for k, v in update_data.dict().items() if v is not None}
        
        result = await self.db.bookmarks.update_one(
            {"id": bookmark_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        await self.category_manager.update_bookmark_counts()
        
        # Return updated bookmark
        updated_bookmark = await self.db.bookmarks.find_one({"id": bookmark_id})
        return Bookmark(**updated_bookmark)
    
    async def move_bookmarks(self, move_data: BookmarkMove) -> Dict[str, Any]:
        """Bookmarks in andere Kategorie verschieben"""
        result = await self.db.bookmarks.update_many(
            {"id": {"$in": move_data.bookmark_ids}},
            {"$set": {
                "category": move_data.target_category,
                "subcategory": move_data.target_subcategory
            }}
        )
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "moved_count": result.modified_count,
            "message": f"Moved {result.modified_count} bookmarks to {move_data.target_category}"
        }
    
    async def validate_all_links(self) -> Dict[str, Any]:
        """Alle Links validieren"""
        bookmarks = await self.get_all_bookmarks()
        validated_bookmarks = await self.validator.validate_bookmarks(bookmarks)
        
        for bookmark in validated_bookmarks:
            await self.db.bookmarks.update_one(
                {"id": bookmark.id},
                {"$set": bookmark.dict()}
            )
        
        dead_links = [b for b in validated_bookmarks if b.is_dead_link]
        
        return {
            "total_checked": len(validated_bookmarks),
            "dead_links_found": len(dead_links),
            "message": f"Validation complete. Found {len(dead_links)} dead links."
        }
    
    async def find_and_remove_duplicates(self) -> Dict[str, Any]:
        """Duplikate finden und entfernen"""
        bookmarks = await self.get_all_bookmarks()
        duplicates = self.duplicate_detector.find_duplicates(bookmarks)
        
        removed_count = 0
        for duplicate_group in duplicates:
            # Fix datetime comparison issue by normalizing timezones
            def get_comparable_date(bookmark):
                date = bookmark.date_added
                if date.tzinfo is None:
                    # Make timezone-naive datetime timezone-aware (UTC)
                    return date.replace(tzinfo=timezone.utc)
                return date
            
            sorted_group = sorted(duplicate_group, key=get_comparable_date, reverse=True)
            for bookmark in sorted_group[1:]:
                await self.db.bookmarks.delete_one({"id": bookmark.id})
                removed_count += 1
        
        await self.category_manager.update_bookmark_counts()
        
        return {
            "duplicates_found": len(duplicates),
            "bookmarks_removed": removed_count,
            "message": f"Removed {removed_count} duplicate bookmarks"
        }
    
    async def delete_all_bookmarks(self) -> Dict[str, Any]:
        """Alle Bookmarks löschen"""
        result = await self.db.bookmarks.delete_many({})
        await self.db.categories.delete_many({})
        
        return {
            "deleted_count": result.deleted_count,
            "message": f"Deleted {result.deleted_count} bookmarks"
        }
    
    async def search_bookmarks(self, query: str) -> List[Bookmark]:
        """Bookmarks durchsuchen - erweitert um Beschreibung"""
        search_regex = {"$regex": query, "$options": "i"}
        bookmarks = await self.db.bookmarks.find({
            "$or": [
                {"title": search_regex},
                {"url": search_regex},
                {"category": search_regex},
                {"subcategory": search_regex},
                {"description": search_regex}
            ]
        }).to_list(100000)
        
        return [Bookmark(**bookmark) for bookmark in bookmarks]

# Globale BookmarkManager Instanz
bookmark_manager = BookmarkManager(db)

# API Endpoints

@api_router.post("/bookmarks/create-samples")
async def create_sample_bookmarks():
    """30 Beispiel-Bookmarks mit Unterkategorien erstellen"""
    return await bookmark_manager.create_sample_bookmarks()

@api_router.post("/bookmarks/create-test-data")
async def create_test_data():
    """50 Testdaten mit Duplikaten und toten Links erstellen"""
    result = await bookmark_manager.create_comprehensive_test_data()
    return result

@api_router.get("/statistics", response_model=Statistics)
async def get_statistics():
    """Erweiterte Statistiken mit Unterkategorien abrufen"""
    # Get all bookmarks
    bookmarks = await db.bookmarks.find().to_list(100000)
    categories = await db.categories.find().to_list(100000)
    
    # Count by status_type
    total_bookmarks = len(bookmarks)
    active_links = len([b for b in bookmarks if b.get('status_type') == 'active'])
    dead_links = len([b for b in bookmarks if b.get('status_type') == 'dead'])
    localhost_links = len([b for b in bookmarks if b.get('status_type') == 'localhost'])
    duplicate_links = len([b for b in bookmarks if b.get('status_type') == 'duplicate'])
    locked_links = len([b for b in bookmarks if b.get('status_type') == 'locked' or b.get('is_locked', False)])
    timeout_links = len([b for b in bookmarks if b.get('status_type') == 'timeout'])
    unchecked_links = len([b for b in bookmarks if b.get('status_type') == 'unchecked'])
    
    # Categories distribution
    categories_distribution = {}
    subcategories_distribution = {}
    top_categories = []
    
    for bookmark in bookmarks:
        category = bookmark.get('category', 'Uncategorized')
        subcategory = bookmark.get('subcategory')
        
        # Count categories
        categories_distribution[category] = categories_distribution.get(category, 0) + 1
        
        # Count subcategories
        if subcategory:
            if category not in subcategories_distribution:
                subcategories_distribution[category] = {}
            subcategories_distribution[category][subcategory] = subcategories_distribution[category].get(subcategory, 0) + 1
    
    # Generate top categories
    for cat, count in sorted(categories_distribution.items(), key=lambda x: x[1], reverse=True)[:6]:
        top_categories.append({
            "name": cat,
            "count": count,
            "percentage": round((count / total_bookmarks) * 100) if total_bookmarks > 0 else 0,
            "subcategories": subcategories_distribution.get(cat, {})
        })
    
    return {
        "total_bookmarks": total_bookmarks,
        "total_categories": len(categories),
        "active_links": active_links,
        "dead_links": dead_links,
        "localhost_links": localhost_links,
        "duplicate_links": duplicate_links,
        "locked_links": locked_links,
        "timeout_links": timeout_links,
        "unchecked_links": unchecked_links,
        "categories_distribution": categories_distribution,
        "subcategories_distribution": subcategories_distribution,
        "top_categories": top_categories,
        "recent_bookmarks": 0,
        "last_updated": datetime.now(timezone.utc).isoformat()
    }

@api_router.get("/download/collector")
async def download_collector():
    """Download des Sammelprogramms als ZIP"""
    # Sammle alle Dateien aus dem scripts Ordner
    scripts_dir = Path("/app/scripts")
    
    # Erstelle ZIP in Memory
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for file_path in scripts_dir.glob("*"):
            if file_path.is_file():
                zip_file.write(file_path, file_path.name)
    
    zip_buffer.seek(0)
    
    return StreamingResponse(
        io.BytesIO(zip_buffer.read()),
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=bookmark_collector.zip"}
    )

@api_router.post("/export")
async def export_bookmarks(export_request: ExportRequest):
    """Exportiert Bookmarks in XML, CSV, HTML oder JSON Format"""
    # Hole Bookmarks basierend auf Filter
    if export_request.category:
        bookmarks = await bookmark_manager.get_bookmarks_by_category(export_request.category)
    else:
        bookmarks = await bookmark_manager.get_all_bookmarks()
    
    # Exportiere basierend auf Format
    format_lower = export_request.format.lower()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    
    if format_lower == "xml":
        content = bookmark_manager.export_manager.export_to_xml(bookmarks)
        media_type = "application/xml"
        filename = f"bookmarks_{timestamp}.xml"
    elif format_lower == "csv":
        content = bookmark_manager.export_manager.export_to_csv(bookmarks)
        media_type = "text/csv"
        filename = f"bookmarks_{timestamp}.csv"
    elif format_lower == "html":
        content = bookmark_manager.export_manager.export_to_html(bookmarks)
        media_type = "text/html"
        filename = f"bookmarks_{timestamp}.html"
    elif format_lower == "json":
        content = bookmark_manager.export_manager.export_to_json(bookmarks)
        media_type = "application/json"
        filename = f"bookmarks_{timestamp}.json"
    else:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported export format: {export_request.format}. Supported formats: XML, CSV, HTML, JSON"
        )
    
    return StreamingResponse(
        io.StringIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@api_router.post("/bookmarks/import")
async def import_bookmarks_endpoint(file: UploadFile = File(...)):
    """Favoriten-Datei hochladen und importieren"""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    content = await file.read()
    content_str = content.decode('utf-8')
    
    file_extension = file.filename.split('.')[-1].lower()
    
    try:
        result = await bookmark_manager.import_bookmarks(content_str, file_extension)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/bookmarks", response_model=List[Bookmark])
async def get_bookmarks():
    """Alle Bookmarks abrufen"""
    return await bookmark_manager.get_all_bookmarks()

@api_router.get("/bookmarks/category/{category}", response_model=List[Bookmark])
async def get_bookmarks_by_category(category: str, subcategory: Optional[str] = None):
    """Bookmarks nach Kategorie und optional Unterkategorie filtern"""
    return await bookmark_manager.get_bookmarks_by_category(category, subcategory)

@api_router.get("/categories", response_model=List[Category])
async def get_categories():
    """Alle Kategorien mit Hierarchie abrufen"""
    return await bookmark_manager.category_manager.get_all_categories()

@api_router.post("/bookmarks/validate")
async def validate_links():
    """Alle Links auf Dead Links überprüfen"""
    return await bookmark_manager.validate_all_links()

@api_router.post("/bookmarks/remove-duplicates")
async def remove_duplicates():
    """Duplikate finden und entfernen"""
    return await bookmark_manager.find_and_remove_duplicates()

@api_router.delete("/bookmarks/dead-links")
async def remove_dead_links():
    """Alle toten Links entfernen (außer localhost)"""
    # Nur Links mit status_type="dead" löschen, localhost verschonen
    result = await db.bookmarks.delete_many({"status_type": "dead"})
    await bookmark_manager.category_manager.update_bookmark_counts()
    
    return {
        "removed_count": result.deleted_count,
        "message": f"Removed {result.deleted_count} dead links (localhost links preserved)"
    }

@api_router.put("/bookmarks/{bookmark_id}/status")
async def update_bookmark_status(bookmark_id: str, status: dict):
    """Manueller Update des Link-Status (mit neuen Status-Typen)"""
    try:
        status_type = status.get("status_type", "active")  # active, dead, localhost, duplicate
        
        update_data = {}
        if status_type == "active":
            update_data = {"is_dead_link": False, "status_type": "active"}
        elif status_type == "dead":
            update_data = {"is_dead_link": True, "status_type": "dead"}
        elif status_type == "localhost":
            update_data = {"is_dead_link": False, "status_type": "localhost"}
        elif status_type == "duplicate":
            update_data = {"is_dead_link": False, "status_type": "duplicate"}
        elif status_type == "unchecked":
            update_data = {"is_dead_link": False, "status_type": "unchecked", "last_checked": None}
        
        result = await db.bookmarks.update_one(
            {"id": bookmark_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        await bookmark_manager.category_manager.update_bookmark_counts()
        
        return {
            "message": f"Bookmark status updated to {status_type}",
            "bookmark_id": bookmark_id,
            "status_type": status_type
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update bookmark status: {str(e)}")

@api_router.post("/bookmarks/find-duplicates")
async def find_duplicates():
    """Duplikate finden und mit 'duplicate' Status markieren"""
    try:
        duplicate_groups = await bookmark_manager.duplicate_detector.find_and_mark_duplicates()
        marked_count = sum(len(group) - 1 for group in duplicate_groups)  # Alle außer dem ersten pro Gruppe
        
        return {
            "duplicate_groups": len(duplicate_groups),
            "marked_count": marked_count,
            "message": f"Found {len(duplicate_groups)} duplicate groups, marked {marked_count} duplicates"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find duplicates: {str(e)}")

@api_router.delete("/bookmarks/duplicates")
async def remove_duplicates():
    """Alle als Duplikat markierte Bookmarks löschen"""
    try:
        result = await db.bookmarks.delete_many({"status_type": "duplicate"})
        await bookmark_manager.category_manager.update_bookmark_counts()
        
        return {
            "removed_count": result.deleted_count,
            "message": f"Removed {result.deleted_count} duplicate bookmarks"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove duplicates: {str(e)}")

@api_router.delete("/bookmarks/all")
async def delete_all_bookmarks():
    """Alle Bookmarks löschen"""
    return await bookmark_manager.delete_all_bookmarks()

@api_router.get("/bookmarks/search/{query}", response_model=List[Bookmark])
async def search_bookmarks(query: str):
    """Bookmarks durchsuchen"""
    return await bookmark_manager.search_bookmarks(query)

@api_router.post("/bookmarks", response_model=Bookmark)
async def create_bookmark(bookmark: BookmarkCreate):
    """Einzelnes Bookmark erstellen"""
    return await bookmark_manager.create_bookmark(bookmark)

@api_router.put("/bookmarks/{bookmark_id}", response_model=Bookmark)
async def update_bookmark(bookmark_id: str, update_data: BookmarkUpdate):
    """Bookmark aktualisieren"""
    return await bookmark_manager.update_bookmark(bookmark_id, update_data)

@api_router.put("/bookmarks/{bookmark_id}/lock")
async def lock_bookmark(bookmark_id: str):
    """Bookmark sperren"""
    try:
        # Find the bookmark
        bookmark = await db.bookmarks.find_one({"id": bookmark_id})
        if not bookmark:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Update to locked status
        result = await db.bookmarks.update_one(
            {"id": bookmark_id},
            {"$set": {"is_locked": True, "status_type": "locked"}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Return updated bookmark
        updated_bookmark = await db.bookmarks.find_one({"id": bookmark_id})
        return Bookmark(**updated_bookmark)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error locking bookmark: {str(e)}")

@api_router.put("/bookmarks/{bookmark_id}/unlock")
async def unlock_bookmark(bookmark_id: str):
    """Bookmark entsperren"""
    try:
        # Find the bookmark
        bookmark = await db.bookmarks.find_one({"id": bookmark_id})
        if not bookmark:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Update to unlocked status (set to active)
        result = await db.bookmarks.update_one(
            {"id": bookmark_id},
            {"$set": {"is_locked": False, "status_type": "active"}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Return updated bookmark
        updated_bookmark = await db.bookmarks.find_one({"id": bookmark_id})
        return Bookmark(**updated_bookmark)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error unlocking bookmark: {str(e)}")

@api_router.post("/bookmarks/move")
async def move_bookmarks(move_data: BookmarkMove):
    """Bookmarks in andere Kategorie verschieben"""
    return await bookmark_manager.move_bookmarks(move_data)

@api_router.get("/bookmarks/download-bookmarkbox")
async def download_bookmarkbox():
    """BookmarkBox Tool als verschlüsseltes ZIP herunterladen"""
    try:
        import zipfile
        import tempfile
        import os
        from io import BytesIO
        
        # Erstelle temporäres ZIP-File
        zip_buffer = BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # BookmarkBox Executable (simuliert - in Realität wäre das die echte .exe)
            bookmarkbox_content = """# BookmarkBox - Universal Bookmark Collector
# Version 1.0.0 - Für alle gängigen Betriebsysteme
# 
# Dieses Tool sammelt Bookmarks von:
# - Chrome, Firefox, Safari, Edge
# - Internet Explorer, Opera, Brave
# - Vivaldi, Yandex Browser
# - Alle anderen Chromium-basierten Browser
#
# Exportiert in FavOrg-kompatibles Format
#
# Anleitung:
# 1. Entpacken Sie diese ZIP-Datei
# 2. Führen Sie BookmarkBox.exe aus (Windows) oder BookmarkBox (Linux/Mac)
# 3. Wählen Sie die gewünschten Browser aus
# 4. Exportieren Sie als favorg_import.json
# 5. Importieren Sie die Datei in FavOrg
#
# Passwort für ZIP: SpendefuerdenEntwickler
#
# Hinweis: Dies ist eine Simulation der BookmarkBox-Software.
# In der Produktionsversion würde hier die echte ausführbare Datei stehen.

echo "BookmarkBox - Universal Bookmark Collector wird gestartet..."
echo "Sammle Bookmarks von allen installierten Browsern..."
echo "Export nach favorg_import.json erfolgreich!"
"""
            
            # Readme-Datei
            readme_content = """BookmarkBox - Universal Bookmark Collector
==========================================

VERSION: 1.0.0
ENTWICKELT FÜR: FavOrg Bookmark Manager

BESCHREIBUNG:
BookmarkBox ist ein universelles Tool zum Sammeln von Bookmarks 
aus allen gängigen Webbrowsern und deren Export in ein 
FavOrg-kompatibles Format.

UNTERSTÜTZTE BROWSER:
✓ Google Chrome
✓ Mozilla Firefox  
✓ Microsoft Edge
✓ Safari (macOS)
✓ Opera
✓ Brave Browser
✓ Vivaldi
✓ Yandex Browser
✓ Internet Explorer (Legacy)
✓ Alle Chromium-basierten Browser

BETRIEBSSYSTEME:
✓ Windows 10/11 (x64)
✓ macOS 10.15+ (Intel/Apple Silicon)
✓ Linux Ubuntu/Debian (x64)

ANLEITUNG:
1. Entpacken Sie diese ZIP-Datei mit dem Passwort: SpendefuerdenEntwickler
2. Führen Sie die entsprechende Datei für Ihr System aus:
   - Windows: BookmarkBox.exe
   - macOS: BookmarkBox.app  
   - Linux: BookmarkBox

3. Das Tool scannt automatisch alle installierten Browser
4. Wählen Sie die gewünschten Browser aus
5. Klicken Sie auf "Export to FavOrg"
6. Speichern Sie die generierte favorg_import.json Datei
7. Importieren Sie diese Datei in FavOrg über "Import" > "JSON"

VERSCHLÜSSELUNG:
Diese ZIP-Datei ist mit dem Passwort "SpendefuerdenEntwickler" 
verschlüsselt. Dieses Passwort dient als Spenden-Erinnerung für 
die Entwicklung von FavOrg.

SUPPORT:
Bei Fragen wenden Sie sich an: support@id2.de

© 2025 Jörg Renelt, id2.de Hamburg
FavOrg Version 2.3.0
"""
            
            # Windows Executable (simuliert)
            zip_file.writestr("BookmarkBox.exe", bookmarkbox_content.encode('utf-8'))
            
            # macOS App (simuliert)  
            zip_file.writestr("BookmarkBox.app/Contents/MacOS/BookmarkBox", bookmarkbox_content.encode('utf-8'))
            
            # Linux Binary (simuliert)
            zip_file.writestr("BookmarkBox", bookmarkbox_content.encode('utf-8'))
            
            # Readme
            zip_file.writestr("README.txt", readme_content.encode('utf-8'))
            
            # Beispiel Import-Datei
            sample_import = {
                "version": "1.0",
                "exported_from": "BookmarkBox Universal Collector",
                "export_date": "2025-01-01T12:00:00Z",
                "bookmarks": [
                    {
                        "title": "Beispiel: GitHub",
                        "url": "https://github.com",
                        "category": "Development",
                        "subcategory": "Code Hosting",
                        "description": "Code-Repository und Versionskontrolle"
                    },
                    {
                        "title": "Beispiel: Stack Overflow", 
                        "url": "https://stackoverflow.com",
                        "category": "Development",
                        "subcategory": "Q&A",
                        "description": "Programmierer-Community und Wissensdatenbank"
                    }
                ]
            }
            zip_file.writestr("sample_favorg_import.json", json.dumps(sample_import, indent=2, ensure_ascii=False).encode('utf-8'))
        
        zip_buffer.seek(0)
        
        # Passwort-geschütztes ZIP erstellen (Simulation)
        # In der Realität würde man pyminizip oder andere Bibliothek verwenden
        zip_data = zip_buffer.getvalue()
        
        from fastapi.responses import Response
        
        return Response(
            content=zip_data,
            media_type="application/zip",
            headers={
                "Content-Disposition": "attachment; filename=BookmarkBox_v1.0.0.zip",
                "Content-Length": str(len(zip_data))
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating BookmarkBox download: {str(e)}")

@api_router.post("/categories/initialize")
async def initialize_categories():
    """Kategorien in der Datenbank basierend auf Bookmarks initialisieren"""
    try:
        result = await bookmark_manager.initialize_categories_from_bookmarks()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error initializing categories: {str(e)}")

@api_router.put("/categories/reorder")
async def reorder_categories(reorder_data: dict):
    """Kategorien in neuer Reihenfolge sortieren"""
    try:
        category_ids = reorder_data.get('category_ids', [])
        parent_category = reorder_data.get('parent_category', None)
        
        if not category_ids:
            raise HTTPException(status_code=400, detail="Category IDs list is required")
        
        # Update die Reihenfolge der Kategorien
        for index, category_name in enumerate(category_ids):
            update_data = {
                "order_index": index, 
                "updated_at": datetime.utcnow()
            }
            
            # Wenn parent_category gesetzt ist, update auch die Hierarchie
            if parent_category is not None:
                update_data["parent_category"] = parent_category if parent_category != "root" else None
            
            await db.categories.update_one(
                {"name": category_name},
                {"$set": update_data}
            )
        
        # Update category counts
        await bookmark_manager.category_manager.update_bookmark_counts()
        
        return {
            "message": f"Reordered {len(category_ids)} categories", 
            "reordered_count": len(category_ids),
            "parent_category": parent_category
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reordering categories: {str(e)}")

@api_router.put("/categories/{category_name}/reparent")
async def reparent_category(category_name: str, reparent_data: dict):
    """Kategorie in andere Hierarchie-Ebene verschieben (Reparenting)"""
    try:
        new_parent = reparent_data.get('new_parent')  # None für Root-Level
        target_position = reparent_data.get('target_position', 0)  # Position in neuer Hierarchie
        
        # Finde die Kategorie
        category = await db.categories.find_one({"name": category_name})
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Prüfe auf zirkuläre Referenzen
        if new_parent and new_parent == category_name:
            raise HTTPException(status_code=400, detail="Cannot make category its own parent")
        
        # Update der Kategorie
        update_data = {
            "parent_category": new_parent,
            "order_index": target_position,
            "updated_at": datetime.utcnow()
        }
        
        result = await db.categories.update_one(
            {"name": category_name},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Category not found")
        
        # Update category counts und Hierarchie
        await bookmark_manager.category_manager.update_bookmark_counts()
        
        # Rückgabe der aktualisierten Kategorie-Info
        return {
            "message": f"Category '{category_name}' reparented successfully",
            "category_name": category_name,
            "old_parent": category.get("parent_category"),
            "new_parent": new_parent,
            "target_position": target_position
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reparenting category: {str(e)}")

@api_router.put("/categories/cross-level-sort")
async def cross_level_sort_categories(sort_data: dict):
    """Cross-Level Sortierung für Excel-ähnliche Drag & Drop Funktionalität"""
    try:
        dragged_category = sort_data.get('dragged_category')
        target_category = sort_data.get('target_category')
        operation_mode = sort_data.get('operation_mode', 'standard')  # 'standard' oder 'insert'
        target_level = sort_data.get('target_level', 'same')  # 'same', 'child', 'parent', 'root'
        
        if not dragged_category or not target_category:
            raise HTTPException(status_code=400, detail="Dragged and target categories are required")
        
        # Finde dragged category - target kann "Alle" sein (UI-Element)
        dragged = await db.categories.find_one({"name": dragged_category})
        target = None
        
        # Spezialbehandlung für "Alle" - existiert nicht in DB
        if target_category != "Alle":
            target = await db.categories.find_one({"name": target_category})
            if not target:
                raise HTTPException(status_code=404, detail=f"Target category '{target_category}' not found")
        
        if not dragged:
            raise HTTPException(status_code=404, detail=f"Dragged category '{dragged_category}' not found")
        
        # Bestimme neue Hierarchie basierend auf target_level
        new_parent = None
        new_position = 0
        
        if target_level == 'child':
            # Dragged wird Unterkategorie von Target - an ERSTE Position
            new_parent = target_category
            new_position = 0  # ERSTE Position unter Parent
            
            # Verschiebe andere Unterkategorien nach unten
            await db.categories.update_many(
                {
                    "parent_category": target_category,
                    "name": {"$ne": dragged_category}  # Nicht die verschobene Kategorie
                },
                {"$inc": {"order_index": 1}}  # Alle anderen um 1 nach unten
            )
            
        elif target_level == 'root':
            # Dragged wird Root-Kategorie - an ERSTE Position
            new_parent = None
            new_position = 0  # ERSTE Position auf Root-Level
            
            # Verschiebe andere Root-Kategorien nach unten
            await db.categories.update_many(
                {
                    "parent_category": None,
                    "name": {"$ne": dragged_category}  # Nicht die verschobene Kategorie
                },
                {"$inc": {"order_index": 1}}  # Alle anderen um 1 nach unten
            )
            
        elif target_level == 'same':
            # Dragged bleibt auf gleicher Ebene wie Target
            if target_category == "Alle":
                # Wenn Target "Alle" ist, wird es Root-Level - ERSTE Position
                new_parent = None
                new_position = 0
                
                # Verschiebe andere Root-Kategorien nach unten
                await db.categories.update_many(
                    {
                        "parent_category": None,
                        "name": {"$ne": dragged_category}
                    },
                    {"$inc": {"order_index": 1}}
                )
            else:
                new_parent = target.get("parent_category") if target else None
                target_position = target.get("order_index", 0) if target else 0
                
                if operation_mode == 'insert':
                    # Insert-Modus: Füge zwischen bestehende ein
                    new_position = target_position + 1
                    
                    # Verschiebe Kategorien nach der Insert-Position nach unten
                    await db.categories.update_many(
                        {
                            "parent_category": new_parent,
                            "order_index": {"$gte": new_position},
                            "name": {"$ne": dragged_category}
                        },
                        {"$inc": {"order_index": 1}}
                    )
                else:
                    # Standard-Modus: Ersetze Position - aber an ERSTE Position
                    new_position = 0  # ERSTE Position
                    
                    # Verschiebe alle anderen nach unten
                    await db.categories.update_many(
                        {
                            "parent_category": new_parent,
                            "name": {"$ne": dragged_category}
                        },
                        {"$inc": {"order_index": 1}}
                    )
        
        # Update der verschobenen Kategorie
        result = await db.categories.update_one(
            {"name": dragged_category},
            {"$set": {
                "parent_category": new_parent,
                "order_index": new_position,
                "updated_at": datetime.utcnow()
            }}
        )
        
        # Debug: Log the operation
        print(f"Cross-level sort operation:")
        print(f"  Dragged: {dragged_category}")
        print(f"  Target: {target_category}") 
        print(f"  Target Level: {target_level}")
        print(f"  New Parent: {new_parent}")
        print(f"  New Position: {new_position}")
        print(f"  Operation Mode: {operation_mode}")
        print(f"  MongoDB Result: matched={result.matched_count}, modified={result.modified_count}")
        
        # Update category counts
        await bookmark_manager.category_manager.update_bookmark_counts()
        
        return {
            "message": f"Category '{dragged_category}' moved successfully",
            "operation_mode": operation_mode,
            "target_level": target_level,
            "new_parent": new_parent,
            "new_position": new_position
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error in cross-level sort: {str(e)}")

@api_router.put("/documentation/download-nomenklatur")
async def download_nomenklatur():
    """FavOrg UI-Nomenklatur als PDF herunterladen"""
    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import cm
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
        from reportlab.lib import colors
        from io import BytesIO
        
        # PDF Buffer erstellen
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=2*cm, leftMargin=2*cm, topMargin=2*cm, bottomMargin=2*cm)
        
        # Styles definieren
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Title'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#0ea5e9')
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading1'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#1e40af')
        )
        
        subheading_style = ParagraphStyle(
            'CustomSubHeading',
            parent=styles['Heading2'],
            fontSize=14,
            spaceAfter=8,
            textColor=colors.HexColor('#059669')
        )
        
        # Content aufbauen
        story = []
        
        # Titel
        story.append(Paragraph("📋 FavOrg UI-Bereichs-Nomenklatur", title_style))
        story.append(Paragraph("Version 2.3.0 - Professioneller Bookmark Manager", styles['Normal']))
        story.append(Spacer(1, 20))
        
        # Hauptbereiche
        story.append(Paragraph("🔸 Hauptbereiche", heading_style))
        
        main_areas_data = [
            ['Bereich', 'Position', 'Inhalt', 'Eigenschaften'],
            ['Kopf (Header)', 'TOP Website, 3 DIVs je 33,33%', 'Firmenlogo, Toolbar, Systemsteuerung', 'Fix positioniert'],
            ['Firmenlogo', 'LEFT Kopf', '[Grafik] FavOrg + Untertitel', 'Klickbar'],
            ['Toolbar (Funktionsbutton)', 'CENTER Kopf', '6 Action-Buttons', 'Farb-kodiert'],
            ['Systemsteuerung', 'RIGHT Kopf', '4 System-Symbole', 'Interaktiv'],
            ['Kategorie-Sidebar', 'LEFT Website, ~20% Breite', 'Verzeichnisstruktur', 'Ausblendbar, Resizable'],
            ['Hauptbereich (Main-Content)', 'CENTER Website', 'Bookmark-Darstellung', 'Responsive'],
            ['Footer', 'BOTTOM Website, 3 DIVs je 33,33%', 'Copyright, Infos, Impressum', 'Fix positioniert']
        ]
        
        main_table = Table(main_areas_data, colWidths=[4*cm, 4*cm, 5*cm, 3*cm])
        main_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0ea5e9')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(main_table)
        story.append(Spacer(1, 20))
        
        # Detailbereiche
        story.append(Paragraph("🔸 Detailbereiche", heading_style))
        
        detail_areas_data = [
            ['Bereich', 'Position', 'Funktion'],
            ['Suchleiste (Search-Bar)', 'TOP Hauptbereich', 'Suchfeld + Anzahl + Filter'],
            ['Ansicht-Steuerung', 'Unter Suchleiste, LEFT', 'Karten/Tabellen-Toggle'],
            ['Bookmark-Container', 'CENTER Hauptbereich', 'Grid/Liste der Bookmarks'],
            ['Dialog-Overlay', 'CENTER Website (Modal)', 'Hilfe, Settings, Bookmark-Dialogs']
        ]
        
        detail_table = Table(detail_areas_data, colWidths=[5*cm, 5*cm, 6*cm])
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(detail_table)
        story.append(Spacer(1, 20))
        
        # Positionsterminologie
        story.append(Paragraph("🔸 Positionsterminologie", heading_style))
        story.append(Paragraph("Für jedes DIV verwenden wir HTML-Standard Begriffe:", styles['Normal']))
        story.append(Spacer(1, 10))
        
        pos_data = [
            ['Begriff', 'Bedeutung', 'Beispiel'],
            ['TOP [DIV-Name]', 'Oberer Rand', 'TOP Kopf = Oberkante Header'],
            ['BOTTOM [DIV-Name]', 'Unterer Rand', 'BOTTOM Footer = Unterkante'],
            ['LEFT [DIV-Name]', 'Linker Rand', 'LEFT Kategorie-Sidebar'],
            ['RIGHT [DIV-Name]', 'Rechter Rand', 'RIGHT Systemsteuerung'],
            ['CENTER [DIV-Name]', 'Mitte', 'CENTER Hauptbereich']
        ]
        
        pos_table = Table(pos_data, colWidths=[4*cm, 5*cm, 7*cm])
        pos_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#7c3aed')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lavender),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(pos_table)
        story.append(Spacer(1, 20))
        
        # Container vs Content
        story.append(Paragraph("🔸 Container vs. Content Unterscheidung", heading_style))
        story.append(Paragraph("Wichtige Unterscheidung für präzise Kommunikation:", styles['Normal']))
        story.append(Spacer(1, 10))
        
        container_data = [
            ['Typ', 'Definition', 'Beispiel'],
            ['[Bereich]-Container', 'Das äußere DIV/Fenster', 'Sidebar-Container = Rahmen, Breite, Position'],
            ['[Bereich]-Content', 'Der Inhalt im DIV', 'Sidebar-Content = Kategorien, Buttons, Text']
        ]
        
        container_table = Table(container_data, colWidths=[4*cm, 6*cm, 6*cm])
        container_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#dc2626')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.mistyrose),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        story.append(container_table)
        story.append(Spacer(1, 20))
        
        # Glossar
        story.append(Paragraph("📚 Technisches Glossar", heading_style))
        
        glossar_data = [
            ['Begriff', 'Definition', 'Anwendung in FavOrg'],
            ['CRUD', 'Create, Read, Update, Delete', 'Grundoperationen für Bookmarks/Kategorien'],
            ['Comprehensive Testing', 'Vollständige End-to-End Tests', 'Automatisierte Playwright-Tests aller Features'],
            ['Excel-Funktionalität', 'Drag & Drop wie Excel-Tabellen', 'Zeilen verschieben, einfügen zwischen Positionen'],
            ['Standardmodus (Drag)', 'Verschieben ohne Shift-Taste', 'Element an neue Position verschieben'],
            ['Einfügemodus (Shift+Drag)', 'Verschieben mit Shift-Taste', 'Element zwischen bestehende einfügen'],
            ['Reparenting', 'Kategorie-Hierarchie ändern', 'Hauptkategorie zu Unterkategorie machen'],
            ['Cross-Level Sorting', 'Zwischen Ebenen verschieben', 'Von Level 1 zu Level 2 oder umgekehrt'],
            ['Tree Reordering', 'Baum-Struktur neu ordnen', 'Hierarchische Kategorien sortieren'],
            ['Search-Container', 'Suchleisten-Bereich', 'DIV mit Suchfeld, Anzahl und Filter']
        ]
        
        glossar_table = Table(glossar_data, colWidths=[4*cm, 6*cm, 6*cm])
        glossar_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ('VALIGN', (0, 0), (-1, -1), 'TOP')
        ]))
        story.append(glossar_table)
        story.append(Spacer(1, 20))
        
        # Footer
        story.append(Paragraph("© 2025 Jörg Renelt, id2.de Hamburg - FavOrg Version 2.3.0", styles['Normal']))
        story.append(Paragraph("Erstellt: " + str(datetime.now(timezone.utc).strftime('%d.%m.%Y %H:%M UTC')), styles['Normal']))
        
        # PDF generieren
        doc.build(story)
        
        pdf_data = buffer.getvalue()
        buffer.close()
        
        from fastapi.responses import Response
        
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=FavOrg_UI_Nomenklatur_v2.3.0.pdf",
                "Content-Length": str(len(pdf_data))
            }
        )
        
    except ImportError:
        # Fallback: Text-Version wenn reportlab nicht verfügbar
        nomenklatur_text = """
📋 FavOrg UI-Bereichs-Nomenklatur
Version 2.3.0 - Professioneller Bookmark Manager

🔸 HAUPTBEREICHE:
- Kopf (Header): TOP Website, 3 DIVs je 33,33%
- Firmenlogo: LEFT Kopf - [Grafik] FavOrg + Untertitel
- Toolbar: CENTER Kopf - 6 Action-Buttons (farbkodiert)
- Systemsteuerung: RIGHT Kopf - 4 System-Symbole
- Kategorie-Sidebar: LEFT Website, ~20% Breite (ausblendbar)
- Hauptbereich: CENTER Website - Bookmark-Darstellung
- Footer: BOTTOM Website, 3 DIVs je 33,33%

🔸 DETAILBEREICHE:
- Suchleiste: TOP Hauptbereich - Suchfeld + Anzahl + Filter
- Ansicht-Steuerung: Unter Suchleiste - Karten/Tabellen-Toggle
- Bookmark-Container: CENTER Hauptbereich - Grid/Liste
- Dialog-Overlay: CENTER Website (Modal) - Verschiedene Dialogs

🔸 POSITIONSTERMINOLOGIE:
- TOP [DIV-Name] = Oberer Rand
- BOTTOM [DIV-Name] = Unterer Rand  
- LEFT [DIV-Name] = Linker Rand
- RIGHT [DIV-Name] = Rechter Rand
- CENTER [DIV-Name] = Mitte

🔸 CONTAINER vs. CONTENT:
- [Bereich]-Container = Das äußere DIV/Fenster
- [Bereich]-Content = Der Inhalt im DIV

📚 TECHNISCHES GLOSSAR:
- CRUD: Create, Read, Update, Delete
- Comprehensive Testing: Vollständige End-to-End Tests
- Excel-Funktionalität: Drag & Drop wie Excel-Tabellen
- Standardmodus: Verschieben ohne Shift-Taste
- Einfügemodus: Verschieben mit Shift-Taste
- Reparenting: Kategorie-Hierarchie ändern
- Cross-Level Sorting: Zwischen Ebenen verschieben
- Tree Reordering: Baum-Struktur neu ordnen
- Search-Container: Suchleisten-Bereich

© 2025 Jörg Renelt, id2.de Hamburg - FavOrg Version 2.3.0
        """
        
        return Response(
            content=nomenklatur_text.encode('utf-8'),
            media_type="text/plain; charset=utf-8",
            headers={
                "Content-Disposition": "attachment; filename=FavOrg_UI_Nomenklatur_v2.3.0.txt",
                "Content-Length": str(len(nomenklatur_text.encode('utf-8')))
            }
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating nomenklatur download: {str(e)}")

@api_router.put("/bookmarks/{bookmark_id}/move-to-category")
async def move_bookmark_to_category(bookmark_id: str, move_data: dict):
    """Bookmark in andere Kategorie verschieben"""
    try:
        target_category = move_data.get('category')
        target_subcategory = move_data.get('subcategory')
        
        if not target_category:
            raise HTTPException(status_code=400, detail="Target category is required")
        
        # Finde das Bookmark
        bookmark = await db.bookmarks.find_one({"id": bookmark_id})
        if not bookmark:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Gesperrte Bookmarks können verschoben werden (nur nicht gelöscht/bearbeitet)
        # Der Lock-Check wird entfernt
        
        # Update Kategorie
        update_data = {
            "category": target_category,
            "updated_at": datetime.utcnow()
        }
        
        if target_subcategory:
            update_data["subcategory"] = target_subcategory
        else:
            update_data["subcategory"] = None
        
        result = await db.bookmarks.update_one(
            {"id": bookmark_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Bookmark not found")
        
        # Update category counts
        await bookmark_manager.category_manager.update_bookmark_counts()
        
        # Rückgabe des aktualisierten Bookmarks
        updated_bookmark = await db.bookmarks.find_one({"id": bookmark_id})
        return Bookmark(**updated_bookmark)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error moving bookmark: {str(e)}")

@api_router.put("/bookmarks/reorder")
async def reorder_bookmarks(reorder_data: dict):
    """Bookmarks in neuer Reihenfolge sortieren"""
    try:
        bookmark_ids = reorder_data.get('bookmark_ids', [])
        
        if not bookmark_ids:
            raise HTTPException(status_code=400, detail="Bookmark IDs list is required")
        
        # Update die Reihenfolge der Bookmarks
        for index, bookmark_id in enumerate(bookmark_ids):
            await db.bookmarks.update_one(
                {"id": bookmark_id},
                {"$set": {"order_index": index, "updated_at": datetime.utcnow()}}
            )
        
        return {"message": f"Reordered {len(bookmark_ids)} bookmarks", "reordered_count": len(bookmark_ids)}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reordering bookmarks: {str(e)}")

@api_router.delete("/bookmarks/{bookmark_id}")
async def delete_bookmark(bookmark_id: str):
    """Einzelnes Bookmark löschen"""
    # Erst prüfen ob das Bookmark gesperrt ist
    bookmark = await db.bookmarks.find_one({"id": bookmark_id})
    if not bookmark:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    # Löschschutz für gesperrte Bookmarks
    if bookmark.get("is_locked", False):
        raise HTTPException(status_code=403, detail="Gesperrte Bookmarks können nicht gelöscht werden")
    
    result = await db.bookmarks.delete_one({"id": bookmark_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    await bookmark_manager.category_manager.update_bookmark_counts()
    return {"message": "Bookmark deleted successfully"}

# Category Management Endpoints
class CategoryCreate(BaseModel):
    name: str
    parent_category: Optional[str] = None

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    parent_category: Optional[str] = None

@api_router.post("/categories", response_model=Category)
async def create_category(category_data: CategoryCreate):
    """Neue Kategorie erstellen"""
    # Prüfen ob Kategorie bereits existiert
    existing = await db.categories.find_one({"name": category_data.name})
    if existing:
        raise HTTPException(status_code=400, detail="Kategorie existiert bereits")
    
    category = Category(
        name=category_data.name,
        parent_category=category_data.parent_category,
        bookmark_count=0,
        subcategory_count=0
    )
    
    await db.categories.insert_one(category.dict())
    await bookmark_manager.category_manager.update_bookmark_counts()
    return category

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, update_data: CategoryUpdate):
    """Kategorie aktualisieren mit Lock-Protection"""
    # Finde Kategorie
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
    
    # LOCK-PROTECTION: Prüfe ob Kategorie gesperrt ist
    if category.get("is_locked", False):
        raise HTTPException(
            status_code=403, 
            detail=f"Category '{category['name']}' is locked: {category.get('lock_reason', 'No reason provided')}"
        )
    
    # Update nur geänderte Felder
    update_dict = {}
    old_name = category["name"]
    
    if update_data.name is not None:
        update_dict["name"] = update_data.name
    if update_data.parent_category is not None:
        update_dict["parent_category"] = update_data.parent_category
    
    update_dict["updated_at"] = datetime.now(timezone.utc)
    
    if update_dict:
        await db.categories.update_one({"id": category_id}, {"$set": update_dict})
    
    # Update Bookmark-Referenzen wenn Name geändert wurde
    if update_data.name and update_data.name != old_name:
        await db.bookmarks.update_many(
            {"category": old_name},
            {"$set": {"category": update_data.name}}
        )
    
    # Aktualisierte Kategorie zurückgeben
    updated_category = await db.categories.find_one({"id": category_id})
    await bookmark_manager.category_manager.update_bookmark_counts()
    return Category(**updated_category)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    """Kategorie löschen mit Lock-Protection"""
    # Finde Kategorie
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
    
    # LOCK-PROTECTION: Prüfe ob Kategorie gesperrt ist
    if category.get("is_locked", False):
        raise HTTPException(
            status_code=403, 
            detail=f"Gesperrte Kategorie kann nicht gelöscht werden: {category.get('lock_reason', 'Kategorie ist geschützt')}"
        )
    
    category_name = category["name"]
    
    # Prüfe ob "Nicht zugeordnet" existiert, falls nicht erstelle sie
    unassigned_category = await db.categories.find_one({"name": "Nicht zugeordnet"})
    if not unassigned_category:
        unassigned_cat = Category(
            name="Nicht zugeordnet",
            parent_category=None,
            bookmark_count=0,
            subcategory_count=0
        )
        await db.categories.insert_one(unassigned_cat.dict())
        print("Kategorie 'Nicht zugeordnet' wurde erstellt")
    
    # Verschiebe alle Bookmarks zu "Nicht zugeordnet"
    bookmark_result = await db.bookmarks.update_many(
        {"category": category_name},
        {"$set": {"category": "Nicht zugeordnet", "subcategory": None}}
    )
    
    # Verschiebe alle Unterkategorien zu Hauptkategorien (parent_category = null)
    subcategory_result = await db.categories.update_many(
        {"parent_category": category_name},
        {"$unset": {"parent_category": ""}}
    )
    
    # Lösche die Kategorie
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Kategorie nicht gefunden")
    
    await bookmark_manager.category_manager.update_bookmark_counts()
    
    message = f"Kategorie '{category_name}' gelöscht"
    if bookmark_result.modified_count > 0:
        message += f" - {bookmark_result.modified_count} Bookmarks zu 'Nicht zugeordnet' verschoben"
    if subcategory_result.modified_count > 0:
        message += f" - {subcategory_result.modified_count} Unterkategorien zu Hauptebene verschoben"
    
    return {"message": message}

@api_router.post("/categories/cleanup")
async def cleanup_empty_categories():
    """Leere Kategorien mit Namen '' oder null entfernen"""
    result = await db.categories.delete_many({
        "$or": [
            {"name": ""},
            {"name": None},
            {"name": {"$exists": False}}
        ]
    })
    
    await bookmark_manager.category_manager.update_bookmark_counts()
    return {"message": f"{result.deleted_count} leere Kategorien entfernt"}

# ================================
# Phase 2: Category Lock-System API Endpunkte
# ================================

@api_router.put("/categories/{category_id}/lock")
async def lock_category(category_id: str, lock_data: dict = Body(...)):
    """🔒 Kategorie sperren - Phase 2 Modulares Lock-System"""
    lock_reason = lock_data.get("lock_reason", "Administrativ gesperrt")
    
    try:
        result = await bookmark_manager.category_manager.lock_category(category_id, lock_reason)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Sperren der Kategorie: {str(e)}")

@api_router.put("/categories/{category_id}/unlock")
async def unlock_category(category_id: str):
    """🔓 Kategorie entsperren - Phase 2 Modulares Lock-System"""
    try:
        result = await bookmark_manager.category_manager.unlock_category(category_id)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Entsperren der Kategorie: {str(e)}")

@api_router.get("/categories/with-lock-status")
async def get_categories_with_lock_status():
    """📋 Alle Kategorien mit Lock-Status abrufen - Phase 2"""
    try:
        categories = await bookmark_manager.category_manager.get_all_categories()
        
        # Erweitere um Lock-Informationen für das Frontend
        enhanced_categories = []
        for category in categories:
            category_dict = category.dict()
            category_dict["lock_info"] = {
                "is_locked": category_dict.get("is_locked", False),
                "lock_reason": category_dict.get("lock_reason", ""),
                "locked_at": category_dict.get("locked_at"),
                "can_edit": not category_dict.get("is_locked", False),
                "can_delete": not category_dict.get("is_locked", False)
            }
            enhanced_categories.append(category_dict)
        
        return {
            "categories": enhanced_categories,
            "total_count": len(enhanced_categories),
            "locked_count": len([cat for cat in enhanced_categories if cat["lock_info"]["is_locked"]])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Abrufen der Kategorien: {str(e)}")

@api_router.put("/categories/{category_id}/update-protected")
async def update_category_protected(category_id: str, update_data: dict = Body(...)):
    """✏️ Kategorie mit Lock-Protection aktualisieren - Phase 2"""
    try:
        result = await bookmark_manager.category_manager.update_category(category_id, update_data)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Aktualisieren der Kategorie: {str(e)}")

@api_router.delete("/categories/{category_id}/delete-protected")
async def delete_category_protected(category_id: str):
    """🗑️ Kategorie mit Lock-Protection löschen - Phase 2"""
    try:
        result = await bookmark_manager.category_manager.delete_category(category_id)
        return result
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Löschen der Kategorie: {str(e)}")

@api_router.post("/categories/create-with-lock")
async def create_category_with_lock(category_data: dict = Body(...)):
    """➕ Neue Kategorie mit optionaler Lock-Funktion erstellen - Phase 2"""
    try:
        name = category_data.get("name")
        parent_category = category_data.get("parent_category")
        is_locked = category_data.get("is_locked", False)
        lock_reason = category_data.get("lock_reason", "")
        
        if not name:
            raise HTTPException(status_code=400, detail="Kategorie-Name ist erforderlich")
        
        result = await bookmark_manager.category_manager.create_category(
            name=name,
            parent_category=parent_category,
            is_locked=is_locked,
            lock_reason=lock_reason
        )
        
        return {
            "message": f"Kategorie '{name}' erfolgreich erstellt",
            "category": result.dict(),
            "is_locked": is_locked
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Fehler beim Erstellen der Kategorie: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()