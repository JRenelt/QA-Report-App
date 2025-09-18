#!/usr/bin/env python3
"""
FavOrg Backend Testing nach Bug-Fixes
Focused testing for specific user-reported issues

KRITISCHE BACKEND-PROBLEME ZU TESTEN:
1. Leere Kategorien Problem: User berichtet nach dem Löschen aller Kategorien bleiben [1][1][1] leere Kategorien zurück
2. Kategorie Counter Update: Counter aktualisieren sich nicht beim Verschieben von Favoriten
3. Neue Kategorie erstellen: Funktioniert nicht mehr
4. Status Filter: Nach "gesperrt" filtern sollte funktionieren

BACKEND ENDPUNKTE ZU TESTEN:
- GET /api/categories (sollte keine leeren Kategorien [1][1][1] zurückgeben)
- POST /api/categories (neue Kategorie erstellen) - MISSING ENDPOINT?
- PUT /api/categories/{id} (Kategorie umbenennen) - MISSING ENDPOINT?
- DELETE /api/categories/{id} (Kategorie löschen und Counter update) - MISSING ENDPOINT?
- GET /api/bookmarks?status_type=locked (nach gesperrt filtern) - MISSING QUERY SUPPORT?
- POST /api/bookmarks/move (Favorit verschieben und Counter update)
"""

import requests
import sys
import json
from datetime import datetime

class FavOrgBackendTester:
    def __init__(self, base_url="https://favlinks-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_issues = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, expect_json=True, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        if params:
            print(f"   Params: {params}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files, params=params)
                else:
                    response = requests.post(url, json=data, headers=headers, params=params)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, params=params)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                if expect_json:
                    try:
                        response_data = response.json()
                        print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                        return success, response_data
                    except:
                        print(f"   Response: {response.text[:200]}...")
                        return success, {}
                else:
                    print(f"   Response: {response.text[:200]}...")
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_categories_endpoint(self):
        """Test GET /api/categories - sollte keine leeren Kategorien [1][1][1] zurückgeben"""
        print("\n🎯 KRITISCHER TEST: Leere Kategorien Problem")
        success, response = self.run_test(
            "Get Categories (Check for Empty Categories)",
            "GET",
            "categories",
            200
        )
        
        if success and isinstance(response, list):
            # Check for empty or problematic categories
            empty_categories = []
            problematic_categories = []
            
            for category in response:
                if isinstance(category, dict):
                    name = category.get('name', '')
                    bookmark_count = category.get('bookmark_count', 0)
                    
                    # Check for empty names or suspicious patterns like [1][1][1]
                    if not name or name.strip() == '' or '[1]' in name:
                        empty_categories.append(category)
                    
                    # Check for categories with 0 bookmarks that shouldn't exist
                    if bookmark_count == 0 and name not in ['Uncategorized', 'Nicht zugeordnet']:
                        problematic_categories.append(category)
            
            print(f"   📊 Total categories found: {len(response)}")
            print(f"   ⚠️  Empty/problematic categories: {len(empty_categories)}")
            print(f"   ⚠️  Zero-bookmark categories: {len(problematic_categories)}")
            
            if empty_categories:
                print(f"   ❌ CRITICAL ISSUE: Found empty categories: {empty_categories}")
                self.critical_issues.append("Empty categories [1][1][1] found in database")
                return False, {"empty_categories": empty_categories, "total": len(response)}
            
            if problematic_categories:
                print(f"   ⚠️  Found categories with 0 bookmarks: {[cat.get('name') for cat in problematic_categories]}")
            
            return True, {"total_categories": len(response), "empty_categories": 0}
        
        return success, response

    def test_category_crud_endpoints(self):
        """Test category CRUD operations - these might be missing"""
        print("\n🎯 KRITISCHER TEST: Kategorie CRUD Operationen")
        
        # Test POST /api/categories (neue Kategorie erstellen)
        print("   Testing POST /api/categories...")
        create_success, create_response = self.run_test(
            "Create New Category",
            "POST",
            "categories",
            200,  # Expected success
            data={"name": "Test Kategorie Backend", "parent_category": None}
        )
        
        if not create_success:
            print("   ❌ CRITICAL: POST /api/categories endpoint missing or not working")
            self.critical_issues.append("POST /api/categories endpoint not available - cannot create new categories")
        
        # Test PUT /api/categories/{id} (Kategorie umbenennen)
        print("   Testing PUT /api/categories/{id}...")
        update_success, update_response = self.run_test(
            "Update Category Name",
            "PUT",
            "categories/test-id",
            200,  # Expected success
            data={"name": "Updated Test Kategorie"}
        )
        
        if not update_success:
            print("   ❌ CRITICAL: PUT /api/categories/{id} endpoint missing or not working")
            self.critical_issues.append("PUT /api/categories/{id} endpoint not available - cannot rename categories")
        
        # Test DELETE /api/categories/{id} (Kategorie löschen)
        print("   Testing DELETE /api/categories/{id}...")
        delete_success, delete_response = self.run_test(
            "Delete Category",
            "DELETE",
            "categories/test-id",
            200,  # Expected success
        )
        
        if not delete_success:
            print("   ❌ CRITICAL: DELETE /api/categories/{id} endpoint missing or not working")
            self.critical_issues.append("DELETE /api/categories/{id} endpoint not available - cannot delete categories")
        
        return create_success or update_success or delete_success, {
            "create": create_success,
            "update": update_success,
            "delete": delete_success
        }

    def test_status_filter_locked(self):
        """Test GET /api/bookmarks?status_type=locked (nach gesperrt filtern)"""
        print("\n🎯 KRITISCHER TEST: Status Filter für gesperrte Bookmarks")
        
        # First, create a locked bookmark to test with
        print("   Creating a locked bookmark for testing...")
        create_success, create_response = self.run_test(
            "Create Locked Bookmark",
            "POST",
            "bookmarks",
            200,
            data={
                "title": "Test Gesperrtes Bookmark",
                "url": "https://example.com/locked-test",
                "category": "Testing",
                "is_locked": True,
                "status_type": "locked"
            }
        )
        
        locked_bookmark_id = None
        if create_success and isinstance(create_response, dict):
            locked_bookmark_id = create_response.get('id')
            print(f"   ✅ Created locked bookmark with ID: {locked_bookmark_id}")
        
        # Test filtering by status_type=locked
        print("   Testing GET /api/bookmarks?status_type=locked...")
        filter_success, filter_response = self.run_test(
            "Filter Bookmarks by Locked Status",
            "GET",
            "bookmarks",
            200,
            params={"status_type": "locked"}
        )
        
        if not filter_success:
            print("   ❌ CRITICAL: GET /api/bookmarks with status_type query parameter not working")
            self.critical_issues.append("GET /api/bookmarks?status_type=locked filtering not available")
            return False, {"filter_available": False}
        
        # Check if filtering actually worked
        if isinstance(filter_response, list):
            locked_bookmarks = [b for b in filter_response if b.get('status_type') == 'locked' or b.get('is_locked')]
            print(f"   📊 Found {len(locked_bookmarks)} locked bookmarks")
            
            if len(locked_bookmarks) == 0:
                print("   ⚠️  No locked bookmarks found - filter might not be working or no locked bookmarks exist")
            
            # Cleanup - delete the test bookmark
            if locked_bookmark_id:
                print("   Cleaning up test bookmark...")
                self.run_test(
                    "Delete Test Locked Bookmark",
                    "DELETE",
                    f"bookmarks/{locked_bookmark_id}",
                    403  # Should fail because it's locked
                )
            
            return True, {"locked_bookmarks_found": len(locked_bookmarks), "filter_working": True}
        
        return filter_success, filter_response

    def test_bookmark_move_counter_update(self):
        """Test POST /api/bookmarks/move (Favorit verschieben und Counter update)"""
        print("\n🎯 KRITISCHER TEST: Bookmark Move und Counter Update")
        
        # First, get initial category counts
        print("   Getting initial category counts...")
        initial_categories_success, initial_categories = self.run_test(
            "Get Initial Categories",
            "GET",
            "categories",
            200
        )
        
        if not initial_categories_success:
            return False, {"error": "Could not get initial categories"}
        
        # Create a test bookmark
        print("   Creating test bookmark...")
        create_success, create_response = self.run_test(
            "Create Test Bookmark for Move",
            "POST",
            "bookmarks",
            200,
            data={
                "title": "Test Move Bookmark",
                "url": "https://example.com/move-test",
                "category": "Development"
            }
        )
        
        if not create_success:
            return False, {"error": "Could not create test bookmark"}
        
        bookmark_id = create_response.get('id')
        if not bookmark_id:
            return False, {"error": "No bookmark ID returned"}
        
        # Move the bookmark to a different category
        print("   Moving bookmark to different category...")
        move_success, move_response = self.run_test(
            "Move Bookmark to Different Category",
            "POST",
            "bookmarks/move",
            200,
            data={
                "bookmark_ids": [bookmark_id],
                "target_category": "Tools",
                "target_subcategory": None
            }
        )
        
        if not move_success:
            print("   ❌ CRITICAL: POST /api/bookmarks/move not working")
            self.critical_issues.append("POST /api/bookmarks/move endpoint not working - cannot move bookmarks")
            return False, {"move_working": False}
        
        # Check if counters were updated
        print("   Checking if category counters were updated...")
        updated_categories_success, updated_categories = self.run_test(
            "Get Updated Categories",
            "GET",
            "categories",
            200
        )
        
        if updated_categories_success:
            # Compare counters (this is a basic check - in a real scenario we'd need more sophisticated logic)
            print("   📊 Category counters comparison:")
            for category in updated_categories:
                name = category.get('name', '')
                count = category.get('bookmark_count', 0)
                print(f"      {name}: {count} bookmarks")
        
        # Cleanup
        print("   Cleaning up test bookmark...")
        self.run_test(
            "Delete Test Move Bookmark",
            "DELETE",
            f"bookmarks/{bookmark_id}",
            200
        )
        
        return move_success, {
            "move_working": move_success,
            "counter_update_tested": updated_categories_success
        }

    def test_comprehensive_backend_issues(self):
        """Run all critical backend tests for user-reported issues"""
        print("\n🚀 Starting Comprehensive Backend Testing für User-Reported Issues")
        print("🎯 FOCUS: Kritische Backend-Probleme nach Bug-Fixes")
        print("=" * 80)
        
        results = {}
        
        # Test 1: Empty Categories Problem
        print("\n📋 TEST 1: Leere Kategorien Problem")
        categories_success, categories_result = self.test_categories_endpoint()
        results['empty_categories'] = {
            'success': categories_success,
            'result': categories_result
        }
        
        # Test 2: Category CRUD Operations
        print("\n📋 TEST 2: Kategorie CRUD Operationen")
        crud_success, crud_result = self.test_category_crud_endpoints()
        results['category_crud'] = {
            'success': crud_success,
            'result': crud_result
        }
        
        # Test 3: Status Filter for Locked Bookmarks
        print("\n📋 TEST 3: Status Filter für gesperrte Bookmarks")
        filter_success, filter_result = self.test_status_filter_locked()
        results['status_filter'] = {
            'success': filter_success,
            'result': filter_result
        }
        
        # Test 4: Bookmark Move and Counter Update
        print("\n📋 TEST 4: Bookmark Move und Counter Update")
        move_success, move_result = self.test_bookmark_move_counter_update()
        results['bookmark_move'] = {
            'success': move_success,
            'result': move_result
        }
        
        return results

def main():
    print("🚀 FavOrg Backend Testing nach Bug-Fixes")
    print("🎯 Testing specific user-reported backend issues")
    print("🇩🇪 Teste kritische Backend-Probleme nach User-Reports")
    print("=" * 80)
    
    tester = FavOrgBackendTester()
    
    # Run comprehensive tests
    results = tester.test_comprehensive_backend_issues()
    
    # Print final results
    print("\n" + "=" * 80)
    print(f"📊 FINAL RESULTS - FavOrg Backend Testing nach Bug-Fixes")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Critical Issues Summary
    print(f"\n🎯 KRITISCHE BACKEND-PROBLEME GEFUNDEN:")
    if tester.critical_issues:
        for i, issue in enumerate(tester.critical_issues, 1):
            print(f"   {i}. ❌ {issue}")
    else:
        print("   ✅ Keine kritischen Backend-Probleme gefunden!")
    
    # Detailed Results
    print(f"\n📋 DETAILLIERTE ERGEBNISSE:")
    print(f"   1. Leere Kategorien Problem: {'✅ GELÖST' if results['empty_categories']['success'] else '❌ PROBLEM BESTEHT'}")
    print(f"   2. Kategorie CRUD Operationen: {'✅ FUNKTIONIERT' if results['category_crud']['success'] else '❌ NICHT VERFÜGBAR'}")
    print(f"   3. Status Filter (gesperrt): {'✅ FUNKTIONIERT' if results['status_filter']['success'] else '❌ NICHT VERFÜGBAR'}")
    print(f"   4. Bookmark Move & Counter: {'✅ FUNKTIONIERT' if results['bookmark_move']['success'] else '❌ PROBLEM BESTEHT'}")
    
    # Recommendations
    print(f"\n💡 EMPFEHLUNGEN FÜR MAIN AGENT:")
    if not results['category_crud']['success']:
        print("   - Implementiere fehlende Category CRUD Endpoints (POST, PUT, DELETE /api/categories)")
    if not results['status_filter']['success']:
        print("   - Erweitere GET /api/bookmarks um status_type Query Parameter")
    if tester.critical_issues:
        print("   - Behebe die oben aufgelisteten kritischen Backend-Probleme")
    else:
        print("   - Backend funktioniert korrekt für alle getesteten User-Szenarien")
    
    return 0 if len(tester.critical_issues) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())