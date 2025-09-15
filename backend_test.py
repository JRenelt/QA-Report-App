#!/usr/bin/env python3
"""
FavOrg Backend API Test Suite
Tests all endpoints for the favorites manager system
"""

import requests
import json
import sys
from datetime import datetime
import time

class FavOrgAPITester:
    def __init__(self, base_url="https://bookmark-central.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.created_items = {
            'categories': [],
            'favorites': []
        }

    def log_test(self, name, success, details=""):
        """Log test results"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        if details and success:
            print(f"   {details}")

    def make_request(self, method, endpoint, data=None, expected_status=200):
        """Make HTTP request and return response"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            
            success = response.status_code == expected_status
            return success, response
            
        except Exception as e:
            return False, str(e)

    def test_api_root(self):
        """Test API root endpoint"""
        success, response = self.make_request('GET', '')
        if success:
            try:
                data = response.json()
                self.log_test("API Root", True, f"Message: {data.get('message', 'No message')}")
            except:
                self.log_test("API Root", False, "Invalid JSON response")
        else:
            self.log_test("API Root", False, f"Status: {response.status_code if hasattr(response, 'status_code') else response}")

    def test_categories_crud(self):
        """Test complete CRUD operations for categories"""
        print("\n🔍 Testing Categories CRUD...")
        
        # 1. GET categories (initially empty or with existing data)
        success, response = self.make_request('GET', 'categories')
        if success:
            initial_categories = response.json()
            self.log_test("GET Categories", True, f"Found {len(initial_categories)} existing categories")
        else:
            self.log_test("GET Categories", False, f"Status: {response.status_code}")
            return

        # 2. CREATE main category
        main_cat_data = {"name": "Test Hauptkategorie", "parent_id": None}
        success, response = self.make_request('POST', 'categories', main_cat_data, 200)
        if success:
            main_category = response.json()
            self.created_items['categories'].append(main_category['id'])
            self.log_test("CREATE Main Category", True, f"ID: {main_category['id']}, Level: {main_category['level']}")
        else:
            self.log_test("CREATE Main Category", False, f"Status: {response.status_code}")
            return

        # 3. CREATE subcategory
        sub_cat_data = {"name": "Test Unterkategorie", "parent_id": main_category['id']}
        success, response = self.make_request('POST', 'categories', sub_cat_data, 200)
        if success:
            sub_category = response.json()
            self.created_items['categories'].append(sub_category['id'])
            self.log_test("CREATE Sub Category", True, f"ID: {sub_category['id']}, Level: {sub_category['level']}")
        else:
            self.log_test("CREATE Sub Category", False, f"Status: {response.status_code}")

        # 4. UPDATE category
        update_data = {"name": "Test Hauptkategorie (Bearbeitet)"}
        success, response = self.make_request('PUT', f'categories/{main_category["id"]}', update_data, 200)
        if success:
            updated_category = response.json()
            self.log_test("UPDATE Category", True, f"New name: {updated_category['name']}")
        else:
            self.log_test("UPDATE Category", False, f"Status: {response.status_code}")

        # 5. GET categories again to verify changes
        success, response = self.make_request('GET', 'categories')
        if success:
            updated_categories = response.json()
            self.log_test("GET Updated Categories", True, f"Total: {len(updated_categories)} categories")
        else:
            self.log_test("GET Updated Categories", False, f"Status: {response.status_code}")

    def test_favorites_crud(self):
        """Test complete CRUD operations for favorites"""
        print("\n🔍 Testing Favorites CRUD...")
        
        # Get a category ID for testing (use first created category)
        category_id = self.created_items['categories'][0] if self.created_items['categories'] else None
        
        # 1. GET favorites (initially empty or with existing data)
        success, response = self.make_request('GET', 'favorites')
        if success:
            initial_favorites = response.json()
            self.log_test("GET Favorites", True, f"Found {len(initial_favorites)} existing favorites")
        else:
            self.log_test("GET Favorites", False, f"Status: {response.status_code}")
            return

        # 2. CREATE normal favorite
        normal_fav_data = {
            "title": "Test Google",
            "url": "https://www.google.com",
            "description": "Test favorite for Google",
            "category_id": category_id,
            "tags": ["search", "test"]
        }
        success, response = self.make_request('POST', 'favorites', normal_fav_data, 200)
        if success:
            normal_favorite = response.json()
            self.created_items['favorites'].append(normal_favorite['id'])
            self.log_test("CREATE Normal Favorite", True, 
                         f"ID: {normal_favorite['id']}, Broken: {normal_favorite['is_broken']}, Localhost: {normal_favorite['is_localhost']}")
        else:
            self.log_test("CREATE Normal Favorite", False, f"Status: {response.status_code}")
            return

        # 3. CREATE localhost favorite
        localhost_fav_data = {
            "title": "Test Localhost",
            "url": "http://localhost:3000",
            "description": "Test localhost favorite",
            "category_id": category_id,
            "tags": ["localhost", "test"]
        }
        success, response = self.make_request('POST', 'favorites', localhost_fav_data, 200)
        if success:
            localhost_favorite = response.json()
            self.created_items['favorites'].append(localhost_favorite['id'])
            self.log_test("CREATE Localhost Favorite", True, 
                         f"ID: {localhost_favorite['id']}, Localhost: {localhost_favorite['is_localhost']}")
        else:
            self.log_test("CREATE Localhost Favorite", False, f"Status: {response.status_code}")

        # 4. CREATE duplicate favorite (same URL as first)
        duplicate_fav_data = {
            "title": "Test Google Duplicate",
            "url": "https://www.google.com",
            "description": "Duplicate of Google",
            "category_id": category_id,
            "tags": ["duplicate", "test"]
        }
        success, response = self.make_request('POST', 'favorites', duplicate_fav_data, 200)
        if success:
            duplicate_favorite = response.json()
            self.created_items['favorites'].append(duplicate_favorite['id'])
            self.log_test("CREATE Duplicate Favorite", True, f"ID: {duplicate_favorite['id']}")
            
            # Wait a moment for duplicate detection to process
            time.sleep(2)
        else:
            self.log_test("CREATE Duplicate Favorite", False, f"Status: {response.status_code}")

        # 5. UPDATE favorite with protection
        update_data = {
            "title": "Test Google (Protected)",
            "is_protected": True
        }
        success, response = self.make_request('PUT', f'favorites/{normal_favorite["id"]}', update_data, 200)
        if success:
            updated_favorite = response.json()
            self.log_test("UPDATE Favorite (Add Protection)", True, 
                         f"Protected: {updated_favorite['is_protected']}")
        else:
            self.log_test("UPDATE Favorite (Add Protection)", False, f"Status: {response.status_code}")

        # 6. Try to update protected favorite (should fail)
        success, response = self.make_request('PUT', f'favorites/{normal_favorite["id"]}', 
                                            {"title": "Should Fail"}, 403)
        self.log_test("UPDATE Protected Favorite (Should Fail)", success, 
                     "Correctly blocked protected favorite update")

    def test_favorites_filtering(self):
        """Test favorites filtering functionality"""
        print("\n🔍 Testing Favorites Filtering...")
        
        # Test filter by status - duplicates
        success, response = self.make_request('GET', 'favorites?status=duplicates')
        if success:
            duplicates = response.json()
            duplicate_count = len([f for f in duplicates if f.get('is_duplicate', False)])
            self.log_test("Filter Duplicates", True, f"Found {duplicate_count} duplicate favorites")
        else:
            self.log_test("Filter Duplicates", False, f"Status: {response.status_code}")

        # Test filter by status - localhost
        success, response = self.make_request('GET', 'favorites?status=localhost')
        if success:
            localhost_favs = response.json()
            localhost_count = len([f for f in localhost_favs if f.get('is_localhost', False)])
            self.log_test("Filter Localhost", True, f"Found {localhost_count} localhost favorites")
        else:
            self.log_test("Filter Localhost", False, f"Status: {response.status_code}")

        # Test filter by status - broken
        success, response = self.make_request('GET', 'favorites?status=broken')
        if success:
            broken_favs = response.json()
            broken_count = len([f for f in broken_favs if f.get('is_broken', False)])
            self.log_test("Filter Broken", True, f"Found {broken_count} broken favorites")
        else:
            self.log_test("Filter Broken", False, f"Status: {response.status_code}")

        # Test filter by category
        if self.created_items['categories']:
            category_id = self.created_items['categories'][0]
            success, response = self.make_request('GET', f'favorites?category_id={category_id}')
            if success:
                category_favs = response.json()
                self.log_test("Filter by Category", True, f"Found {len(category_favs)} favorites in category")
            else:
                self.log_test("Filter by Category", False, f"Status: {response.status_code}")

    def test_import_export(self):
        """Test import and export functionality"""
        print("\n🔍 Testing Import/Export...")
        
        # Test import with sample bookmark data
        sample_bookmarks = {
            "name": "Bookmarks",
            "type": "folder",
            "children": [
                {
                    "name": "Test Folder",
                    "type": "folder",
                    "children": [
                        {
                            "name": "GitHub",
                            "url": "https://github.com",
                            "type": "url"
                        },
                        {
                            "name": "Stack Overflow",
                            "url": "https://stackoverflow.com",
                            "type": "url"
                        }
                    ]
                },
                {
                    "name": "Direct Link",
                    "url": "https://www.example.com",
                    "type": "url"
                }
            ]
        }
        
        import_data = {
            "browser_name": "Chrome",
            "bookmarks_data": json.dumps(sample_bookmarks)
        }
        
        success, response = self.make_request('POST', 'import/browser', import_data, 200)
        if success:
            result = response.json()
            self.log_test("Import Browser Bookmarks", True, result.get('message', 'Import successful'))
        else:
            self.log_test("Import Browser Bookmarks", False, f"Status: {response.status_code}")

        # Test export
        success, response = self.make_request('POST', 'export/Chrome', None, 200)
        if success:
            export_data = response.json()
            self.log_test("Export Bookmarks", True, f"Export structure created with {len(export_data.get('children', []))} top-level items")
        else:
            self.log_test("Export Bookmarks", False, f"Status: {response.status_code}")

    def test_link_analysis(self):
        """Test link analysis functionality"""
        print("\n🔍 Testing Link Analysis...")
        
        success, response = self.make_request('POST', 'analyze/links', None, 200)
        if success:
            result = response.json()
            self.log_test("Analyze Links", True, result.get('message', 'Analysis completed'))
        else:
            self.log_test("Analyze Links", False, f"Status: {response.status_code}")

    def test_special_categories(self):
        """Test that special categories are created and used correctly"""
        print("\n🔍 Testing Special Categories...")
        
        # Get all categories and check for special ones
        success, response = self.make_request('GET', 'categories')
        if success:
            categories = response.json()
            special_cats = ["Doppelte Favoriten", "Defekte Links", "Localhost"]
            found_special = []
            
            for cat in categories:
                if cat['name'] in special_cats:
                    found_special.append(cat['name'])
            
            self.log_test("Special Categories Created", len(found_special) > 0, 
                         f"Found: {', '.join(found_special)}")
        else:
            self.log_test("Special Categories Check", False, f"Status: {response.status_code}")

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test favorites (in reverse order)
        for fav_id in reversed(self.created_items['favorites']):
            success, response = self.make_request('DELETE', f'favorites/{fav_id}', expected_status=200)
            if success:
                print(f"   ✅ Deleted favorite {fav_id}")
            else:
                # Try to remove protection first
                self.make_request('PUT', f'favorites/{fav_id}', {"is_protected": False})
                success, response = self.make_request('DELETE', f'favorites/{fav_id}', expected_status=200)
                if success:
                    print(f"   ✅ Deleted protected favorite {fav_id}")
                else:
                    print(f"   ❌ Failed to delete favorite {fav_id}")

        # Delete test categories (in reverse order to handle hierarchy)
        for cat_id in reversed(self.created_items['categories']):
            success, response = self.make_request('DELETE', f'categories/{cat_id}', expected_status=200)
            if success:
                print(f"   ✅ Deleted category {cat_id}")
            else:
                print(f"   ❌ Failed to delete category {cat_id}")

    def run_all_tests(self):
        """Run complete test suite"""
        print("🚀 Starting FavOrg Backend API Tests")
        print(f"📍 Testing against: {self.base_url}")
        print("=" * 60)
        
        try:
            # Core API tests
            self.test_api_root()
            self.test_categories_crud()
            self.test_favorites_crud()
            self.test_favorites_filtering()
            self.test_import_export()
            self.test_link_analysis()
            self.test_special_categories()
            
        except KeyboardInterrupt:
            print("\n⚠️  Tests interrupted by user")
        except Exception as e:
            print(f"\n💥 Unexpected error: {str(e)}")
        finally:
            # Always try to clean up
            self.cleanup_test_data()
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} tests failed")
            return 1

def main():
    """Main test runner"""
    tester = FavOrgAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())