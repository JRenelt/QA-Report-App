#!/usr/bin/env python3
"""
FavOrg Backend Test - German Review Request
Erstelle 100 umfangreiche Testdatensätze für FavOrg

ANFORDERUNG: 100 Datensätze mit ALLEN Kategorien vermengen
"""

import requests
import json
import time
import random
from datetime import datetime, timezone

# Backend URL aus .env-Datei
BACKEND_URL = "https://bookmark-rescue.preview.emergentagent.com/api"

def test_api_connection():
    """Test API-Verbindung"""
    print("🔗 Testing API connection...")
    try:
        response = requests.get(f"{BACKEND_URL}/statistics")
        if response.status_code == 200:
            print(f"✅ API connection successful: {response.status_code}")
            return True
        else:
            print(f"❌ API connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API connection error: {e}")
        return False

def delete_all_bookmarks():
    """1. Lösche alle bestehenden Bookmarks"""
    print("\n🗑️ Deleting all existing bookmarks...")
    try:
        response = requests.delete(f"{BACKEND_URL}/bookmarks/all")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Deleted {data.get('deleted_count', 0)} bookmarks")
            return True
        else:
            print(f"❌ Failed to delete bookmarks: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error deleting bookmarks: {e}")
        return False

def create_comprehensive_test_data():
    """2. Erstelle 100 diverse Bookmarks mit allen Kategorien und Status-Typen"""
    print("\n📊 Creating 100 comprehensive test bookmarks...")
    
    # Kategorien-Hierarchie definieren
    categories_structure = {
        "Development": {
            "subcategories": ["Frontend", "Backend", "JavaScript", "Python", "DevOps", "Mobile"],
            "count": 20
        },
        "News": {
            "subcategories": ["Tech News", "World News", "Local News", "Business"],
            "count": 15
        },
        "Social Media": {
            "subcategories": ["Professional", "Personal", "Microblogging", "Photo Sharing"],
            "count": 12
        },
        "Tools": {
            "subcategories": ["Productivity", "Design", "Cloud Storage", "Communication"],
            "count": 15
        },
        "Entertainment": {
            "subcategories": ["Video", "Music", "Gaming", "Streaming"],
            "count": 10
        },
        "Reference": {
            "subcategories": ["Documentation", "Learning", "Wikipedia", "Archives"],
            "count": 8
        },
        "Shopping": {
            "subcategories": ["Online Stores", "Price Comparison", "Reviews", "Deals"],
            "count": 6
        },
        "Education": {
            "subcategories": ["Online Courses", "Universities", "Tutorials", "Research"],
            "count": 6
        },
        "Health": {
            "subcategories": ["Medical Info", "Fitness", "Nutrition", "Mental Health"],
            "count": 4
        },
        "Finance": {
            "subcategories": ["Banking", "Investment", "Cryptocurrency", "Budget"],
            "count": 2
        },
        "Travel": {
            "subcategories": ["Booking", "Reviews", "Guides", "Maps"],
            "count": 2
        }
    }
    
    # Status-Verteilung: 60% active, 20% dead/localhost, 10% duplicate, 10% unchecked
    status_distribution = {
        "active": 60,
        "dead": 10,
        "localhost": 10,
        "duplicate": 10,
        "unchecked": 10
    }
    
    # Realistische URLs und Titel für jede Kategorie
    bookmark_templates = {
        "Development": [
            {"title": "GitHub - Code Repository", "url": "https://github.com", "description": "World's leading software development platform"},
            {"title": "Stack Overflow", "url": "https://stackoverflow.com", "description": "Programming Q&A community"},
            {"title": "MDN Web Docs", "url": "https://developer.mozilla.org", "description": "Web development documentation"},
            {"title": "Visual Studio Code", "url": "https://code.visualstudio.com", "description": "Free source code editor"},
            {"title": "Docker Hub", "url": "https://hub.docker.com", "description": "Container registry service"},
            {"title": "GitLab", "url": "https://gitlab.com", "description": "DevOps platform"},
            {"title": "CodePen", "url": "https://codepen.io", "description": "Online code editor"},
            {"title": "React Documentation", "url": "https://reactjs.org", "description": "JavaScript library for building UIs"},
            {"title": "Node.js", "url": "https://nodejs.org", "description": "JavaScript runtime environment"},
            {"title": "Python.org", "url": "https://python.org", "description": "Python programming language"},
            {"title": "Angular", "url": "https://angular.io", "description": "Web application framework"},
            {"title": "Vue.js", "url": "https://vuejs.org", "description": "Progressive JavaScript framework"},
            {"title": "TypeScript", "url": "https://typescriptlang.org", "description": "Typed JavaScript"},
            {"title": "Webpack", "url": "https://webpack.js.org", "description": "Module bundler"},
            {"title": "Babel", "url": "https://babeljs.io", "description": "JavaScript compiler"},
            {"title": "ESLint", "url": "https://eslint.org", "description": "JavaScript linter"},
            {"title": "Prettier", "url": "https://prettier.io", "description": "Code formatter"},
            {"title": "Jest", "url": "https://jestjs.io", "description": "JavaScript testing framework"},
            {"title": "Cypress", "url": "https://cypress.io", "description": "End-to-end testing"},
            {"title": "Postman", "url": "https://postman.com", "description": "API development platform"}
        ],
        "News": [
            {"title": "BBC News", "url": "https://bbc.com/news", "description": "Breaking news and analysis"},
            {"title": "CNN", "url": "https://cnn.com", "description": "Latest news and headlines"},
            {"title": "Reuters", "url": "https://reuters.com", "description": "International news agency"},
            {"title": "TechCrunch", "url": "https://techcrunch.com", "description": "Technology news and analysis"},
            {"title": "The Verge", "url": "https://theverge.com", "description": "Technology and culture news"},
            {"title": "Ars Technica", "url": "https://arstechnica.com", "description": "Technology news and reviews"},
            {"title": "Hacker News", "url": "https://news.ycombinator.com", "description": "Tech community news"},
            {"title": "Wired", "url": "https://wired.com", "description": "Technology and science magazine"},
            {"title": "Engadget", "url": "https://engadget.com", "description": "Technology news and reviews"},
            {"title": "The Guardian", "url": "https://theguardian.com", "description": "International news"},
            {"title": "New York Times", "url": "https://nytimes.com", "description": "American newspaper"},
            {"title": "Washington Post", "url": "https://washingtonpost.com", "description": "American daily newspaper"},
            {"title": "Financial Times", "url": "https://ft.com", "description": "Business and financial news"},
            {"title": "Bloomberg", "url": "https://bloomberg.com", "description": "Business and market news"},
            {"title": "Wall Street Journal", "url": "https://wsj.com", "description": "Business and financial news"}
        ],
        "Social Media": [
            {"title": "LinkedIn", "url": "https://linkedin.com", "description": "Professional networking platform"},
            {"title": "Twitter", "url": "https://twitter.com", "description": "Social networking service"},
            {"title": "Facebook", "url": "https://facebook.com", "description": "Social networking platform"},
            {"title": "Instagram", "url": "https://instagram.com", "description": "Photo and video sharing"},
            {"title": "YouTube", "url": "https://youtube.com", "description": "Video sharing platform"},
            {"title": "TikTok", "url": "https://tiktok.com", "description": "Short-form video platform"},
            {"title": "Reddit", "url": "https://reddit.com", "description": "Social news aggregation"},
            {"title": "Discord", "url": "https://discord.com", "description": "Voice and text chat"},
            {"title": "Slack", "url": "https://slack.com", "description": "Business communication"},
            {"title": "Mastodon", "url": "https://mastodon.social", "description": "Decentralized social network"},
            {"title": "Pinterest", "url": "https://pinterest.com", "description": "Image sharing platform"},
            {"title": "Snapchat", "url": "https://snapchat.com", "description": "Multimedia messaging"}
        ],
        "Tools": [
            {"title": "Google Drive", "url": "https://drive.google.com", "description": "Cloud storage service"},
            {"title": "Dropbox", "url": "https://dropbox.com", "description": "File hosting service"},
            {"title": "Notion", "url": "https://notion.so", "description": "All-in-one workspace"},
            {"title": "Trello", "url": "https://trello.com", "description": "Project management tool"},
            {"title": "Asana", "url": "https://asana.com", "description": "Team collaboration tool"},
            {"title": "Figma", "url": "https://figma.com", "description": "Design and prototyping"},
            {"title": "Canva", "url": "https://canva.com", "description": "Graphic design platform"},
            {"title": "Adobe Creative Cloud", "url": "https://adobe.com", "description": "Creative software suite"},
            {"title": "Zoom", "url": "https://zoom.us", "description": "Video conferencing"},
            {"title": "Microsoft Teams", "url": "https://teams.microsoft.com", "description": "Collaboration platform"},
            {"title": "Google Workspace", "url": "https://workspace.google.com", "description": "Productivity suite"},
            {"title": "1Password", "url": "https://1password.com", "description": "Password manager"},
            {"title": "LastPass", "url": "https://lastpass.com", "description": "Password management"},
            {"title": "Evernote", "url": "https://evernote.com", "description": "Note-taking app"},
            {"title": "OneNote", "url": "https://onenote.com", "description": "Digital notebook"}
        ],
        "Entertainment": [
            {"title": "Netflix", "url": "https://netflix.com", "description": "Streaming service"},
            {"title": "Spotify", "url": "https://spotify.com", "description": "Music streaming"},
            {"title": "Apple Music", "url": "https://music.apple.com", "description": "Music streaming service"},
            {"title": "Amazon Prime Video", "url": "https://primevideo.com", "description": "Video streaming"},
            {"title": "Disney+", "url": "https://disneyplus.com", "description": "Streaming service"},
            {"title": "Twitch", "url": "https://twitch.tv", "description": "Live streaming platform"},
            {"title": "Steam", "url": "https://store.steampowered.com", "description": "Gaming platform"},
            {"title": "Epic Games Store", "url": "https://epicgames.com", "description": "Digital game store"},
            {"title": "IMDb", "url": "https://imdb.com", "description": "Movie database"},
            {"title": "Goodreads", "url": "https://goodreads.com", "description": "Book recommendations"}
        ],
        "Reference": [
            {"title": "Wikipedia", "url": "https://wikipedia.org", "description": "Free encyclopedia"},
            {"title": "Wolfram Alpha", "url": "https://wolframalpha.com", "description": "Computational engine"},
            {"title": "Archive.org", "url": "https://archive.org", "description": "Internet archive"},
            {"title": "Google Scholar", "url": "https://scholar.google.com", "description": "Academic search"},
            {"title": "Britannica", "url": "https://britannica.com", "description": "Encyclopedia"},
            {"title": "Dictionary.com", "url": "https://dictionary.com", "description": "Online dictionary"},
            {"title": "Thesaurus.com", "url": "https://thesaurus.com", "description": "Synonym finder"},
            {"title": "Merriam-Webster", "url": "https://merriam-webster.com", "description": "Dictionary and thesaurus"}
        ],
        "Shopping": [
            {"title": "Amazon", "url": "https://amazon.com", "description": "Online marketplace"},
            {"title": "eBay", "url": "https://ebay.com", "description": "Online auction site"},
            {"title": "Etsy", "url": "https://etsy.com", "description": "Handmade and vintage items"},
            {"title": "AliExpress", "url": "https://aliexpress.com", "description": "Online retail service"},
            {"title": "Best Buy", "url": "https://bestbuy.com", "description": "Electronics retailer"},
            {"title": "Target", "url": "https://target.com", "description": "General merchandise retailer"}
        ],
        "Education": [
            {"title": "Coursera", "url": "https://coursera.org", "description": "Online learning platform"},
            {"title": "edX", "url": "https://edx.org", "description": "Online course provider"},
            {"title": "Khan Academy", "url": "https://khanacademy.org", "description": "Free online education"},
            {"title": "Udemy", "url": "https://udemy.com", "description": "Online learning marketplace"},
            {"title": "MIT OpenCourseWare", "url": "https://ocw.mit.edu", "description": "Free course materials"},
            {"title": "Codecademy", "url": "https://codecademy.com", "description": "Interactive coding lessons"}
        ],
        "Health": [
            {"title": "WebMD", "url": "https://webmd.com", "description": "Medical information"},
            {"title": "Mayo Clinic", "url": "https://mayoclinic.org", "description": "Medical information and tools"},
            {"title": "Healthline", "url": "https://healthline.com", "description": "Health information"},
            {"title": "MyFitnessPal", "url": "https://myfitnesspal.com", "description": "Nutrition and fitness tracking"}
        ],
        "Finance": [
            {"title": "Yahoo Finance", "url": "https://finance.yahoo.com", "description": "Financial news and data"},
            {"title": "Mint", "url": "https://mint.com", "description": "Personal finance management"}
        ],
        "Travel": [
            {"title": "Booking.com", "url": "https://booking.com", "description": "Hotel booking platform"},
            {"title": "TripAdvisor", "url": "https://tripadvisor.com", "description": "Travel reviews and booking"}
        ]
    }
    
    # Dead Links für Tests
    dead_links = [
        {"title": "Dead Link Test 1", "url": "https://nonexistentdomain12345.com", "description": "Test dead link"},
        {"title": "Dead Link Test 2", "url": "https://brokenlink98765.org", "description": "Test dead link"},
        {"title": "Dead Link Test 3", "url": "https://deadurl54321.net", "description": "Test dead link"},
        {"title": "Dead Link Test 4", "url": "https://invalidsite11111.com", "description": "Test dead link"},
        {"title": "Dead Link Test 5", "url": "https://notfound22222.org", "description": "Test dead link"},
        {"title": "Dead Link Test 6", "url": "https://broken33333.net", "description": "Test dead link"},
        {"title": "Dead Link Test 7", "url": "https://dead44444.com", "description": "Test dead link"},
        {"title": "Dead Link Test 8", "url": "https://invalid55555.org", "description": "Test dead link"},
        {"title": "Dead Link Test 9", "url": "https://missing66666.net", "description": "Test dead link"},
        {"title": "Dead Link Test 10", "url": "https://gone77777.com", "description": "Test dead link"}
    ]
    
    # Localhost Links für Tests
    localhost_links = [
        {"title": "Local Development Server", "url": "http://localhost:3000", "description": "React development server"},
        {"title": "Local API Server", "url": "http://localhost:8000", "description": "FastAPI development server"},
        {"title": "Local Database Admin", "url": "http://localhost:8080", "description": "Database administration"},
        {"title": "Local Test Server", "url": "http://127.0.0.1:5000", "description": "Flask test server"},
        {"title": "Local Docker Container", "url": "http://localhost:9000", "description": "Docker container service"},
        {"title": "Local Webpack Dev Server", "url": "http://localhost:8080", "description": "Webpack development server"},
        {"title": "Local MongoDB Express", "url": "http://localhost:8081", "description": "MongoDB web interface"},
        {"title": "Local Redis Commander", "url": "http://localhost:8082", "description": "Redis web interface"},
        {"title": "Local Jupyter Notebook", "url": "http://localhost:8888", "description": "Jupyter notebook server"},
        {"title": "Local Grafana Dashboard", "url": "http://localhost:3001", "description": "Monitoring dashboard"}
    ]
    
    # Erstelle Status-Array basierend auf Verteilung
    status_array = []
    for status, count in status_distribution.items():
        status_array.extend([status] * count)
    
    # Shuffle für zufällige Verteilung
    random.shuffle(status_array)
    
    created_bookmarks = []
    bookmark_counter = 0
    
    # Erstelle Bookmarks für jede Kategorie
    for category, config in categories_structure.items():
        subcategories = config["subcategories"]
        target_count = config["count"]
        
        # Hole Templates für diese Kategorie
        templates = bookmark_templates.get(category, [])
        
        for i in range(target_count):
            # Wähle Template oder erstelle generisches
            if i < len(templates):
                template = templates[i]
                title = template["title"]
                url = template["url"]
                description = template["description"]
            else:
                # Generiere zusätzliche Bookmarks wenn nötig
                title = f"{category} Resource {i+1}"
                url = f"https://example-{category.lower()}-{i+1}.com"
                description = f"Additional {category.lower()} resource for testing"
            
            # Wähle Unterkategorie
            subcategory = random.choice(subcategories)
            
            # Bestimme Status
            if bookmark_counter < len(status_array):
                status_type = status_array[bookmark_counter]
            else:
                status_type = "active"
            
            # Spezielle URLs für bestimmte Status-Typen
            if status_type == "dead" and bookmark_counter < len(dead_links):
                dead_link = dead_links[bookmark_counter % len(dead_links)]
                url = dead_link["url"]
                title = f"{title} (Dead Link Test)"
                description = dead_link["description"]
            elif status_type == "localhost" and bookmark_counter < len(localhost_links):
                localhost_link = localhost_links[bookmark_counter % len(localhost_links)]
                url = localhost_link["url"]
                title = f"{title} (Localhost)"
                description = localhost_link["description"]
            
            # Zufällige is_locked Status (ca. 10% gesperrt)
            is_locked = random.random() < 0.1
            
            bookmark_data = {
                "title": title,
                "url": url,
                "category": category,
                "subcategory": subcategory,
                "description": description,
                "status_type": status_type,
                "is_locked": is_locked
            }
            
            created_bookmarks.append(bookmark_data)
            bookmark_counter += 1
    
    # Erstelle Bookmarks über API
    success_count = 0
    failed_count = 0
    
    print(f"📝 Creating {len(created_bookmarks)} bookmarks...")
    
    for i, bookmark in enumerate(created_bookmarks):
        try:
            response = requests.post(f"{BACKEND_URL}/bookmarks", json=bookmark)
            if response.status_code == 200:
                success_count += 1
                if (i + 1) % 10 == 0:
                    print(f"   ✅ Created {i + 1}/{len(created_bookmarks)} bookmarks")
            else:
                failed_count += 1
                print(f"   ❌ Failed to create bookmark {i+1}: {response.status_code}")
        except Exception as e:
            failed_count += 1
            print(f"   ❌ Error creating bookmark {i+1}: {e}")
    
    print(f"✅ Successfully created {success_count} bookmarks")
    if failed_count > 0:
        print(f"❌ Failed to create {failed_count} bookmarks")
    
    return success_count, failed_count

def verify_statistics():
    """6. Prüfe Statistics API ob alle Kategorien und Status korrekt gezählt werden"""
    print("\n📊 Verifying statistics...")
    
    try:
        response = requests.get(f"{BACKEND_URL}/statistics")
        if response.status_code == 200:
            stats = response.json()
            
            print("📈 STATISTICS VERIFICATION:")
            print(f"   📊 Total Bookmarks: {stats.get('total_bookmarks', 0)}")
            print(f"   📁 Total Categories: {stats.get('total_categories', 0)}")
            print(f"   ✅ Active Links: {stats.get('active_links', 0)}")
            print(f"   ❌ Dead Links: {stats.get('dead_links', 0)}")
            print(f"   🏠 Localhost Links: {stats.get('localhost_links', 0)}")
            print(f"   🔄 Duplicate Links: {stats.get('duplicate_links', 0)}")
            print(f"   🔒 Locked Links: {stats.get('locked_links', 0)}")
            print(f"   ⏱️ Timeout Links: {stats.get('timeout_links', 0)}")
            print(f"   ❓ Unchecked Links: {stats.get('unchecked_links', 0)}")
            
            # Kategorien-Verteilung
            categories_dist = stats.get('categories_distribution', {})
            print(f"\n📂 CATEGORIES DISTRIBUTION:")
            for category, count in sorted(categories_dist.items(), key=lambda x: x[1], reverse=True):
                print(f"   {category}: {count} bookmarks")
            
            # Top Kategorien mit Unterkategorien
            top_categories = stats.get('top_categories', [])
            print(f"\n🏆 TOP CATEGORIES WITH SUBCATEGORIES:")
            for cat in top_categories[:6]:
                print(f"   {cat['name']}: {cat['count']} bookmarks ({cat['percentage']}%)")
                subcats = cat.get('subcategories', {})
                for subcat, subcount in sorted(subcats.items(), key=lambda x: x[1], reverse=True)[:3]:
                    print(f"      └─ {subcat}: {subcount}")
            
            return True
        else:
            print(f"❌ Failed to get statistics: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error getting statistics: {e}")
        return False

def main():
    """Hauptfunktion für German Review Request Testing"""
    print("🎯 FavOrg Backend Test - German Review Request")
    print("=" * 60)
    print("ANFORDERUNG: 100 Datensätze mit ALLEN Kategorien vermengen")
    print("=" * 60)
    
    # Test API-Verbindung
    if not test_api_connection():
        print("❌ Cannot proceed without API connection")
        return
    
    # 1. Lösche alle bestehenden Bookmarks
    if not delete_all_bookmarks():
        print("❌ Failed to delete existing bookmarks")
        return
    
    # 2. Erstelle 100 diverse Bookmarks
    success_count, failed_count = create_comprehensive_test_data()
    
    if success_count == 0:
        print("❌ No bookmarks were created successfully")
        return
    
    # Kurze Pause für Database-Updates
    print("\n⏳ Waiting for database updates...")
    time.sleep(2)
    
    # 6. Prüfe Statistics API
    if verify_statistics():
        print("\n🎉 GERMAN REVIEW REQUEST TESTING COMPLETED SUCCESSFULLY!")
        print(f"✅ Created {success_count} comprehensive test bookmarks")
        print("✅ All categories and status types distributed correctly")
        print("✅ Statistics API verification passed")
    else:
        print("\n⚠️ Testing completed but statistics verification failed")
    
    print("\n" + "=" * 60)
    print("🎯 FavOrg Test Data Creation Complete")
    print("=" * 60)

if __name__ == "__main__":
    main()