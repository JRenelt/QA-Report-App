import requests
import sys
import json
import uuid
from datetime import datetime

class GermanReviewBackendTester:
    def __init__(self, base_url="https://bookmark-rescue.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_issues = []

    def run_test(self, name, method, endpoint, expected_status, data=None, expect_json=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

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
                if response.status_code >= 400:
                    self.critical_issues.append(f"{name}: HTTP {response.status_code}")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.critical_issues.append(f"{name}: {str(e)}")
            return False, {}

    def setup_test_data(self):
        """Setup test bookmarks and categories for testing"""
        print("\n🔧 Setting up test data...")
        
        # Create test bookmarks in different categories
        test_bookmarks = [
            {
                "title": "GitHub Test",
                "url": "https://github.com/test",
                "category": "TestCategory1",
                "description": "Test bookmark 1"
            },
            {
                "title": "Stack Overflow Test", 
                "url": "https://stackoverflow.com/test",
                "category": "TestCategory1",
                "description": "Test bookmark 2"
            },
            {
                "title": "Google Test",
                "url": "https://google.com/test",
                "category": "TestCategory2", 
                "description": "Test bookmark 3"
            }
        ]
        
        created_bookmarks = []
        for bookmark_data in test_bookmarks:
            success, response = self.run_test(
                f"Create Test Bookmark: {bookmark_data['title']}",
                "POST",
                "bookmarks",
                200,
                data=bookmark_data
            )
            if success and 'id' in response:
                created_bookmarks.append(response)
        
        return created_bookmarks

    def test_priority_1_category_delete_with_reassignment(self):
        """
        PRIORITÄT 1: KATEGORIE LÖSCHEN mit Bookmark-Reassignment
        - Teste DELETE /api/categories/{id} für Kategorien die Bookmarks enthalten
        - Verifikation: Bookmarks werden automatisch zu "Nicht zugeordnet" verschoben
        - Prüfe ob "Nicht zugeordnet" Kategorie automatisch erstellt wird
        - Verifikation der Antwort-Message mit Anzahl verschobener Bookmarks
        """
        print("\n🎯 PRIORITÄT 1: KATEGORIE LÖSCHEN mit Bookmark-Reassignment")
        
        # Step 1: Get all categories to find test categories
        success, categories = self.run_test(
            "Get Categories for Delete Test",
            "GET",
            "categories",
            200
        )
        
        if not success:
            return False, "Failed to get categories"
        
        # Find a category with bookmarks
        test_category = None
        for category in categories:
            if category.get('name') == 'TestCategory1' and category.get('bookmark_count', 0) > 0:
                test_category = category
                break
        
        if not test_category:
            print("   ⚠️  No test category with bookmarks found, creating one...")
            # Create a category with bookmarks
            category_data = {"name": "DeleteTestCategory"}
            success, category_response = self.run_test(
                "Create Category for Delete Test",
                "POST", 
                "categories",
                200,
                data=category_data
            )
            if not success:
                return False, "Failed to create test category"
            test_category = category_response
        
        category_id = test_category['id']
        category_name = test_category['name']
        bookmark_count = test_category.get('bookmark_count', 0)
        
        print(f"   Testing deletion of category: {category_name} (ID: {category_id}) with {bookmark_count} bookmarks")
        
        # Step 2: Delete the category
        success, delete_response = self.run_test(
            f"Delete Category with Bookmarks: {category_name}",
            "DELETE",
            f"categories/{category_id}",
            200
        )
        
        if not success:
            return False, "Failed to delete category"
        
        # Step 3: Verify response message contains bookmark reassignment info
        message = delete_response.get('message', '')
        moved_count = delete_response.get('moved_bookmarks', 0)
        
        print(f"   Delete response message: {message}")
        print(f"   Moved bookmarks count: {moved_count}")
        
        # Step 4: Verify bookmarks were moved to "Nicht zugeordnet"
        success, bookmarks = self.run_test(
            "Get Bookmarks in 'Nicht zugeordnet'",
            "GET",
            "bookmarks/category/Nicht zugeordnet",
            200
        )
        
        if success:
            uncategorized_count = len(bookmarks)
            print(f"   Bookmarks in 'Nicht zugeordnet': {uncategorized_count}")
        
        # Step 5: Verify "Nicht zugeordnet" category exists
        success, categories_after = self.run_test(
            "Verify 'Nicht zugeordnet' Category Exists",
            "GET",
            "categories",
            200
        )
        
        if success:
            nicht_zugeordnet_exists = any(cat.get('name') == 'Nicht zugeordnet' for cat in categories_after)
            print(f"   'Nicht zugeordnet' category exists: {nicht_zugeordnet_exists}")
            
            if nicht_zugeordnet_exists and moved_count > 0:
                return True, {
                    "deleted_category": category_name,
                    "moved_bookmarks": moved_count,
                    "message": message,
                    "nicht_zugeordnet_created": nicht_zugeordnet_exists
                }
        
        return False, "Category deletion with reassignment verification failed"

    def test_priority_2_subcategory_creation(self):
        """
        PRIORITÄT 2: UNTERKATEGORIE ERSTELLEN
        - Teste POST /api/categories mit parent_category Parameter
        - Verschiedene Szenarien: Haupt-zu-Sub, Sub-zu-Sub-Sub (mehrstufig)
        - Error-Handling für ungültige parent_category
        """
        print("\n🎯 PRIORITÄT 2: UNTERKATEGORIE ERSTELLEN")
        
        # Step 1: Create main category
        main_category_data = {"name": "MainTestCategory"}
        success, main_category = self.run_test(
            "Create Main Category",
            "POST",
            "categories", 
            200,
            data=main_category_data
        )
        
        if not success:
            return False, "Failed to create main category"
        
        main_category_name = main_category['name']
        
        # Step 2: Create subcategory under main category
        sub_category_data = {
            "name": "SubTestCategory",
            "parent_category": main_category_name
        }
        success, sub_category = self.run_test(
            "Create Subcategory (Main→Sub)",
            "POST",
            "categories",
            200,
            data=sub_category_data
        )
        
        if not success:
            return False, "Failed to create subcategory"
        
        sub_category_name = sub_category['name']
        
        # Step 3: Create sub-subcategory (mehrstufig)
        sub_sub_category_data = {
            "name": "SubSubTestCategory", 
            "parent_category": sub_category_name
        }
        success, sub_sub_category = self.run_test(
            "Create Sub-Subcategory (Sub→Sub-Sub)",
            "POST",
            "categories",
            200,
            data=sub_sub_category_data
        )
        
        if not success:
            return False, "Failed to create sub-subcategory"
        
        # Step 4: Test error handling for invalid parent_category
        invalid_category_data = {
            "name": "InvalidSubCategory",
            "parent_category": "NonExistentParent12345"
        }
        success, error_response = self.run_test(
            "Create Subcategory with Invalid Parent (Error Test)",
            "POST",
            "categories",
            400,  # Expecting error
            data=invalid_category_data
        )
        
        # For this test, success means we got the expected error
        error_handling_works = success
        
        # Step 5: Verify hierarchy in categories list
        success, all_categories = self.run_test(
            "Verify Category Hierarchy",
            "GET",
            "categories",
            200
        )
        
        if success:
            # Check if all created categories exist with correct parent relationships
            main_found = any(cat.get('name') == main_category_name and not cat.get('parent_category') for cat in all_categories)
            sub_found = any(cat.get('name') == sub_category_name and cat.get('parent_category') == main_category_name for cat in all_categories)
            sub_sub_found = any(cat.get('name') == 'SubSubTestCategory' and cat.get('parent_category') == sub_category_name for cat in all_categories)
            
            print(f"   Main category found: {main_found}")
            print(f"   Subcategory found with correct parent: {sub_found}")
            print(f"   Sub-subcategory found with correct parent: {sub_sub_found}")
            print(f"   Error handling for invalid parent works: {error_handling_works}")
            
            if main_found and sub_found and sub_sub_found and error_handling_works:
                return True, {
                    "main_category": main_category_name,
                    "subcategory": sub_category_name,
                    "sub_subcategory": "SubSubTestCategory",
                    "error_handling": error_handling_works
                }
        
        return False, "Subcategory creation verification failed"

    def test_priority_3_category_crud_complete(self):
        """
        PRIORITÄT 3: KATEGORIE CRUD VOLLSTÄNDIG
        - Teste alle CRUD Operationen: POST (create), PUT (rename), DELETE (with reassignment)
        - Teste POST /api/categories/cleanup für leere Kategorien
        - Hierarchie-Management: parent_category Updates
        """
        print("\n🎯 PRIORITÄT 3: KATEGORIE CRUD VOLLSTÄNDIG")
        
        # CREATE - Already tested in previous functions, test one more
        create_data = {"name": "CRUDTestCategory"}
        success, created_category = self.run_test(
            "CRUD Test - CREATE Category",
            "POST",
            "categories",
            200,
            data=create_data
        )
        
        if not success:
            return False, "CRUD CREATE failed"
        
        category_id = created_category['id']
        
        # UPDATE (RENAME) - Test PUT operation
        update_data = {"name": "RenamedCRUDTestCategory"}
        success, updated_category = self.run_test(
            "CRUD Test - UPDATE/RENAME Category",
            "PUT",
            f"categories/{category_id}",
            200,
            data=update_data
        )
        
        if not success:
            return False, "CRUD UPDATE failed"
        
        # READ - Verify the rename worked
        success, all_categories = self.run_test(
            "CRUD Test - READ Categories (verify rename)",
            "GET",
            "categories",
            200
        )
        
        renamed_found = False
        if success:
            renamed_found = any(cat.get('name') == 'RenamedCRUDTestCategory' for cat in all_categories)
            print(f"   Renamed category found: {renamed_found}")
        
        # Test CLEANUP for empty categories
        success, cleanup_response = self.run_test(
            "CRUD Test - CLEANUP Empty Categories",
            "POST",
            "categories/cleanup",
            200
        )
        
        cleanup_works = success
        if success:
            cleaned_count = cleanup_response.get('cleaned_count', 0)
            print(f"   Cleaned up {cleaned_count} empty categories")
        
        # DELETE with reassignment (already tested in priority 1, but test again)
        success, delete_response = self.run_test(
            "CRUD Test - DELETE Category",
            "DELETE",
            f"categories/{category_id}",
            200
        )
        
        delete_works = success
        
        # Verify all CRUD operations worked
        if renamed_found and cleanup_works and delete_works:
            return True, {
                "create": True,
                "read": True,
                "update": renamed_found,
                "delete": delete_works,
                "cleanup": cleanup_works
            }
        
        return False, "Complete CRUD operations verification failed"

    def test_standard_backend_features(self):
        """Test standard backend features as mentioned in review request"""
        print("\n📋 STANDARD BACKEND TESTS")
        
        results = {}
        
        # Bookmarks CRUD
        bookmark_data = {
            "title": "Standard Test Bookmark",
            "url": "https://example.com/standard",
            "category": "StandardTest"
        }
        success, bookmark = self.run_test(
            "Standard - Create Bookmark",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        results['bookmark_crud'] = success
        
        # Export functionality
        export_data = {"format": "xml"}
        success, export_response = self.run_test(
            "Standard - Export XML",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        results['export'] = success
        
        # Statistics
        success, stats = self.run_test(
            "Standard - Statistics",
            "GET",
            "statistics",
            200
        )
        results['statistics'] = success
        
        # Link validation
        success, validation = self.run_test(
            "Standard - Link Validation",
            "POST",
            "bookmarks/validate",
            200
        )
        results['link_validation'] = success
        
        return results

def main():
    print("🇩🇪 KRITISCHE USER-PROBLEME BACKEND TESTING")
    print("🎯 Teste umfassend spezifische Backend-Endpunkte basierend auf User-Reports")
    print("=" * 80)
    
    tester = GermanReviewBackendTester()
    
    # Setup test data
    test_bookmarks = tester.setup_test_data()
    print(f"   Created {len(test_bookmarks)} test bookmarks")
    
    print("\n" + "=" * 80)
    print("🎯 PRIORITÄT 1 TESTS (User-gemeldete Probleme)")
    print("=" * 80)
    
    # Priority 1: Category deletion with bookmark reassignment
    priority1_success, priority1_result = tester.test_priority_1_category_delete_with_reassignment()
    
    # Priority 2: Subcategory creation
    priority2_success, priority2_result = tester.test_priority_2_subcategory_creation()
    
    # Priority 3: Complete Category CRUD
    priority3_success, priority3_result = tester.test_priority_3_category_crud_complete()
    
    print("\n" + "=" * 80)
    print("📋 STANDARD BACKEND TESTS")
    print("=" * 80)
    
    # Standard backend features
    standard_results = tester.test_standard_backend_features()
    
    # Final Results
    print("\n" + "=" * 80)
    print("📊 FINAL RESULTS - German Review Backend Testing")
    print("=" * 80)
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\n🎯 PRIORITÄT 1 TESTS RESULTS:")
    print(f"✅ Kategorie Löschen mit Bookmark-Reassignment: {'PASS' if priority1_success else 'FAIL'}")
    print(f"✅ Unterkategorie Erstellen: {'PASS' if priority2_success else 'FAIL'}")
    print(f"✅ Kategorie CRUD Vollständig: {'PASS' if priority3_success else 'FAIL'}")
    
    print(f"\n📋 STANDARD BACKEND FEATURES:")
    for feature, success in standard_results.items():
        print(f"✅ {feature.replace('_', ' ').title()}: {'PASS' if success else 'FAIL'}")
    
    # Critical Issues Summary
    if tester.critical_issues:
        print(f"\n❌ KRITISCHE PROBLEME GEFUNDEN:")
        for issue in tester.critical_issues:
            print(f"   - {issue}")
        print("\n🚨 FOKUS: Die gemeldeten User-Probleme identifizieren und deren Backend-Funktionalität verifizieren.")
        print("   Falls Backend OK, dann ist es ein Frontend-Problem.")
    
    # Overall assessment
    priority_tests_passed = sum([priority1_success, priority2_success, priority3_success])
    if priority_tests_passed == 3:
        print(f"\n🎉 ALLE PRIORITÄT 1 TESTS BESTANDEN!")
        print("✅ Backend-Funktionalität für User-gemeldete Probleme ist vollständig funktional")
        print("🎯 Falls User weiterhin Probleme hat, liegt es am Frontend oder Client-seitiger Konnektivität")
        return 0
    else:
        print(f"\n⚠️  {3 - priority_tests_passed} von 3 Priorität-Tests fehlgeschlagen")
        print("❌ Backend-Probleme identifiziert die User-Issues verursachen könnten")
        return 1

if __name__ == "__main__":
    sys.exit(main())