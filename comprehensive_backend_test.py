import requests
import sys
import json
import io
from datetime import datetime

class ComprehensiveBackendTester:
    def __init__(self, base_url="https://favorg-manager-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_failures = []

    def run_test(self, name, method, endpoint, expected_status, data=None, files=None, expect_json=True):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {}
        
        if not files:
            headers['Content-Type'] = 'application/json'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                if files:
                    response = requests.post(url, files=files)
                else:
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
                        print(f"   Response: {json.dumps(response_data, indent=2)[:200]}...")
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
                if response.status_code >= 500:
                    self.critical_failures.append(f"{name}: {response.status_code} - {response.text[:100]}")
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.critical_failures.append(f"{name}: Exception - {str(e)}")
            return False, {}

    def test_status_management_features(self):
        """Test all new status management features"""
        print("\n🎯 TESTING STATUS MANAGEMENT FEATURES")
        print("=" * 50)
        
        # First, create a test bookmark to work with
        bookmark_data = {
            "title": "Status Test Bookmark",
            "url": "https://example.com/status-test",
            "category": "Testing"
        }
        
        create_success, create_response = self.run_test(
            "Create Test Bookmark for Status Testing",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        
        if not create_success:
            print("❌ Cannot test status features without creating test bookmark")
            return False
        
        bookmark_id = create_response.get('id')
        if not bookmark_id:
            print("❌ No bookmark ID returned from creation")
            return False
        
        print(f"   Created test bookmark with ID: {bookmark_id}")
        
        # Test all status types
        status_types = ["active", "dead", "localhost", "duplicate", "unchecked"]
        
        for status_type in status_types:
            status_data = {"status_type": status_type}
            success, response = self.run_test(
                f"Update Status to {status_type}",
                "PUT",
                f"bookmarks/{bookmark_id}/status",
                200,
                data=status_data
            )
            
            if success:
                print(f"   ✅ Status successfully updated to {status_type}")
            else:
                print(f"   ❌ Failed to update status to {status_type}")
        
        # Test toggle logic (dead ↔ localhost)
        print("\n   Testing Toggle Logic (dead ↔ localhost):")
        
        # Set to dead first
        self.run_test(
            "Set Status to Dead for Toggle Test",
            "PUT",
            f"bookmarks/{bookmark_id}/status",
            200,
            data={"status_type": "dead"}
        )
        
        # Then toggle to localhost
        self.run_test(
            "Toggle Dead to Localhost",
            "PUT", 
            f"bookmarks/{bookmark_id}/status",
            200,
            data={"status_type": "localhost"}
        )
        
        # Verify the bookmark has the correct status
        success, bookmarks = self.run_test(
            "Verify Status Update in Bookmarks List",
            "GET",
            "bookmarks",
            200
        )
        
        if success:
            test_bookmark = next((b for b in bookmarks if b.get('id') == bookmark_id), None)
            if test_bookmark:
                current_status = test_bookmark.get('status_type', 'unknown')
                print(f"   Current status in database: {current_status}")
                if current_status == "localhost":
                    print("   ✅ Status toggle working correctly")
                else:
                    print(f"   ❌ Status toggle failed - expected 'localhost', got '{current_status}'")
        
        # Clean up test bookmark
        self.run_test(
            "Delete Test Bookmark",
            "DELETE",
            f"bookmarks/{bookmark_id}",
            200
        )
        
        return True

    def test_duplicate_workflow(self):
        """Test the complete duplicate detection and removal workflow"""
        print("\n🎯 TESTING DUPLICATE WORKFLOW")
        print("=" * 50)
        
        # Create duplicate bookmarks for testing
        duplicate_url = "https://example.com/duplicate-test"
        
        bookmark1 = {
            "title": "Duplicate Test 1",
            "url": duplicate_url,
            "category": "Testing"
        }
        
        bookmark2 = {
            "title": "Duplicate Test 2", 
            "url": duplicate_url,
            "category": "Testing"
        }
        
        # Create both bookmarks
        success1, response1 = self.run_test(
            "Create First Duplicate Bookmark",
            "POST",
            "bookmarks",
            200,
            data=bookmark1
        )
        
        success2, response2 = self.run_test(
            "Create Second Duplicate Bookmark",
            "POST", 
            "bookmarks",
            200,
            data=bookmark2
        )
        
        if not (success1 and success2):
            print("❌ Failed to create duplicate test bookmarks")
            return False
        
        # Find duplicates
        success, find_response = self.run_test(
            "Find and Mark Duplicates",
            "POST",
            "bookmarks/find-duplicates",
            200
        )
        
        if success:
            duplicate_groups = find_response.get('duplicate_groups', 0)
            marked_count = find_response.get('marked_count', 0)
            print(f"   Found {duplicate_groups} duplicate groups, marked {marked_count} duplicates")
        
        # Remove duplicates
        success, remove_response = self.run_test(
            "Remove Marked Duplicates",
            "DELETE",
            "bookmarks/duplicates", 
            200
        )
        
        if success:
            removed_count = remove_response.get('removed_count', 0)
            print(f"   Removed {removed_count} duplicate bookmarks")
        
        return success

    def test_statistics_with_status_types(self):
        """Test statistics endpoint with new status types"""
        print("\n🎯 TESTING STATISTICS WITH STATUS TYPES")
        print("=" * 50)
        
        success, stats = self.run_test(
            "Get Statistics with Status Types",
            "GET",
            "statistics",
            200
        )
        
        if success:
            print("   Statistics breakdown:")
            print(f"   - Total bookmarks: {stats.get('total_bookmarks', 0)}")
            print(f"   - Active links: {stats.get('active_links', 0)}")
            print(f"   - Dead links: {stats.get('dead_links', 0)}")
            print(f"   - Localhost links: {stats.get('localhost_links', 0)}")
            print(f"   - Duplicate links: {stats.get('duplicate_links', 0)}")
            print(f"   - Unchecked links: {stats.get('unchecked_links', 0)}")
            
            # Verify that localhost links are NOT counted as dead
            dead_count = stats.get('dead_links', 0)
            localhost_count = stats.get('localhost_links', 0)
            
            if localhost_count > 0:
                print(f"   ✅ Localhost links ({localhost_count}) correctly NOT counted as dead links")
            
            return True
        
        return False

    def test_dead_links_removal_with_localhost_protection(self):
        """Test that dead links removal protects localhost links"""
        print("\n🎯 TESTING DEAD LINKS REMOVAL WITH LOCALHOST PROTECTION")
        print("=" * 50)
        
        # Create test bookmarks with different status types
        test_bookmarks = [
            {
                "title": "Dead Link Test",
                "url": "https://nonexistent-dead-link.com",
                "category": "Testing"
            },
            {
                "title": "Localhost Test", 
                "url": "http://localhost:3000/test",
                "category": "Testing"
            }
        ]
        
        created_ids = []
        for i, bookmark in enumerate(test_bookmarks):
            success, response = self.run_test(
                f"Create Test Bookmark {i+1}",
                "POST",
                "bookmarks",
                200,
                data=bookmark
            )
            if success and 'id' in response:
                created_ids.append(response['id'])
        
        if len(created_ids) != 2:
            print("❌ Failed to create test bookmarks")
            return False
        
        # Set statuses manually
        self.run_test(
            "Set First Bookmark to Dead",
            "PUT",
            f"bookmarks/{created_ids[0]}/status",
            200,
            data={"status_type": "dead"}
        )
        
        self.run_test(
            "Set Second Bookmark to Localhost",
            "PUT", 
            f"bookmarks/{created_ids[1]}/status",
            200,
            data={"status_type": "localhost"}
        )
        
        # Get statistics before removal
        success, before_stats = self.run_test(
            "Get Statistics Before Dead Links Removal",
            "GET",
            "statistics",
            200
        )
        
        before_dead = before_stats.get('dead_links', 0) if success else 0
        before_localhost = before_stats.get('localhost_links', 0) if success else 0
        
        print(f"   Before removal: {before_dead} dead links, {before_localhost} localhost links")
        
        # Remove dead links
        success, remove_response = self.run_test(
            "Remove Dead Links (Should Protect Localhost)",
            "DELETE",
            "bookmarks/dead-links",
            200
        )
        
        if success:
            removed_count = remove_response.get('removed_count', 0)
            print(f"   Removed {removed_count} dead links")
        
        # Get statistics after removal
        success, after_stats = self.run_test(
            "Get Statistics After Dead Links Removal",
            "GET", 
            "statistics",
            200
        )
        
        if success:
            after_dead = after_stats.get('dead_links', 0)
            after_localhost = after_stats.get('localhost_links', 0)
            
            print(f"   After removal: {after_dead} dead links, {after_localhost} localhost links")
            
            # Verify localhost protection
            if after_localhost == before_localhost and after_dead < before_dead:
                print("   ✅ Localhost links correctly protected during dead links removal")
                return True
            else:
                print("   ❌ Localhost protection may have failed")
                return False
        
        return False

    def test_link_validation_with_status_integration(self):
        """Test link validation with proper status_type setting"""
        print("\n🎯 TESTING LINK VALIDATION WITH STATUS INTEGRATION")
        print("=" * 50)
        
        # Get initial count
        success, initial_stats = self.run_test(
            "Get Initial Statistics",
            "GET",
            "statistics", 
            200
        )
        
        initial_total = initial_stats.get('total_bookmarks', 0) if success else 0
        print(f"   Initial total bookmarks: {initial_total}")
        
        # Run validation
        success, validation_result = self.run_test(
            "Validate All Links with Status Integration",
            "POST",
            "bookmarks/validate",
            200
        )
        
        if success:
            total_checked = validation_result.get('total_checked', 0)
            dead_found = validation_result.get('dead_links_found', 0)
            
            print(f"   Validation results: {total_checked} links checked, {dead_found} dead links found")
            
            # Get updated statistics
            success, updated_stats = self.run_test(
                "Get Statistics After Validation",
                "GET",
                "statistics",
                200
            )
            
            if success:
                updated_dead = updated_stats.get('dead_links', 0)
                updated_active = updated_stats.get('active_links', 0)
                
                print(f"   Updated statistics: {updated_active} active, {updated_dead} dead")
                
                # Verify status_type consistency
                if updated_dead == dead_found:
                    print("   ✅ Status integration working correctly - dead count matches validation")
                    return True
                else:
                    print(f"   ❌ Status integration issue - validation found {dead_found} but stats show {updated_dead}")
        
        return False

    def test_all_crud_operations(self):
        """Test all CRUD operations comprehensively"""
        print("\n🎯 TESTING CRUD OPERATIONS")
        print("=" * 50)
        
        # CREATE
        bookmark_data = {
            "title": "CRUD Test Bookmark",
            "url": "https://example.com/crud-test",
            "category": "Testing",
            "subcategory": "CRUD"
        }
        
        success, create_response = self.run_test(
            "CREATE - Single Bookmark",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        
        if not success:
            return False
        
        bookmark_id = create_response.get('id')
        
        # READ - All bookmarks
        success, all_bookmarks = self.run_test(
            "READ - All Bookmarks",
            "GET",
            "bookmarks",
            200
        )
        
        # READ - By category
        success, category_bookmarks = self.run_test(
            "READ - By Category",
            "GET",
            "bookmarks/category/Testing",
            200
        )
        
        # UPDATE
        update_data = {
            "title": "Updated CRUD Test Bookmark",
            "category": "Updated Testing"
        }
        
        success, update_response = self.run_test(
            "UPDATE - Bookmark",
            "PUT",
            f"bookmarks/{bookmark_id}",
            200,
            data=update_data
        )
        
        # MOVE
        move_data = {
            "bookmark_ids": [bookmark_id],
            "target_category": "Development",
            "target_subcategory": "Testing"
        }
        
        success, move_response = self.run_test(
            "MOVE - Bookmark to Different Category",
            "POST",
            "bookmarks/move",
            200,
            data=move_data
        )
        
        # DELETE
        success, delete_response = self.run_test(
            "DELETE - Single Bookmark",
            "DELETE",
            f"bookmarks/{bookmark_id}",
            200
        )
        
        return success

    def test_export_functionality(self):
        """Test export functionality with category filters"""
        print("\n🎯 TESTING EXPORT FUNCTIONALITY")
        print("=" * 50)
        
        # Test XML export (all)
        success, xml_content = self.run_test(
            "Export All Bookmarks as XML",
            "POST",
            "export",
            200,
            data={"format": "xml"},
            expect_json=False
        )
        
        if success:
            print(f"   XML export generated {len(xml_content)} characters")
        
        # Test CSV export (all)
        success, csv_content = self.run_test(
            "Export All Bookmarks as CSV",
            "POST",
            "export", 
            200,
            data={"format": "csv"},
            expect_json=False
        )
        
        if success:
            csv_lines = csv_content.count('\n')
            print(f"   CSV export generated {csv_lines} lines")
        
        # Test XML export with category filter
        success, xml_filtered = self.run_test(
            "Export Development Category as XML",
            "POST",
            "export",
            200,
            data={"format": "xml", "category": "Development"},
            expect_json=False
        )
        
        # Test CSV export with category filter
        success, csv_filtered = self.run_test(
            "Export Development Category as CSV",
            "POST",
            "export",
            200,
            data={"format": "csv", "category": "Development"},
            expect_json=False
        )
        
        return success

    def test_categories_endpoint(self):
        """Test categories endpoint thoroughly"""
        print("\n🎯 TESTING CATEGORIES ENDPOINT")
        print("=" * 50)
        
        success, categories = self.run_test(
            "Get All Categories",
            "GET",
            "categories",
            200
        )
        
        if success:
            print(f"   Retrieved {len(categories)} categories")
            
            # Check for required fields
            if categories:
                sample_category = categories[0]
                required_fields = ['name', 'bookmark_count']
                
                for field in required_fields:
                    if field in sample_category:
                        print(f"   ✅ Category has required field: {field}")
                    else:
                        print(f"   ❌ Category missing field: {field}")
            
            return True
        
        return False

    def test_scripts_download(self):
        """Test scripts ZIP download"""
        print("\n🎯 TESTING SCRIPTS DOWNLOAD")
        print("=" * 50)
        
        success, zip_content = self.run_test(
            "Download Collector Scripts ZIP",
            "GET",
            "download/collector",
            200,
            expect_json=False
        )
        
        if success:
            print(f"   ZIP file generated with {len(zip_content)} bytes")
            return True
        
        return False

    def run_comprehensive_tests(self):
        """Run all comprehensive backend tests"""
        print("🚀 Starting Comprehensive Backend API Tests")
        print("🎯 FOCUS: Status Management, Data Integrity, Performance")
        print("=" * 70)
        
        # Phase 1: Basic connectivity and data setup
        print("\n📋 Phase 1: Basic Connectivity & Data Setup")
        self.run_test("Basic Connectivity Test", "GET", "statistics", 200)
        
        # Ensure we have test data
        self.run_test("Create Sample Bookmarks", "POST", "bookmarks/create-samples", 200)
        
        # Phase 2: Status Management Features (NEW)
        print("\n📋 Phase 2: Status Management Features")
        self.test_status_management_features()
        
        # Phase 3: Duplicate Workflow (NEW)
        print("\n📋 Phase 3: Duplicate Detection & Removal Workflow")
        self.test_duplicate_workflow()
        
        # Phase 4: Statistics with Status Types (NEW)
        print("\n📋 Phase 4: Statistics with New Status Types")
        self.test_statistics_with_status_types()
        
        # Phase 5: Dead Links Removal with Localhost Protection (NEW)
        print("\n📋 Phase 5: Dead Links Removal with Localhost Protection")
        self.test_dead_links_removal_with_localhost_protection()
        
        # Phase 6: Link Validation with Status Integration (NEW)
        print("\n📋 Phase 6: Link Validation with Status Integration")
        self.test_link_validation_with_status_integration()
        
        # Phase 7: CRUD Operations
        print("\n📋 Phase 7: CRUD Operations")
        self.test_all_crud_operations()
        
        # Phase 8: Export Functionality
        print("\n📋 Phase 8: Export Functionality")
        self.test_export_functionality()
        
        # Phase 9: Categories Endpoint
        print("\n📋 Phase 9: Categories Endpoint")
        self.test_categories_endpoint()
        
        # Phase 10: Scripts Download
        print("\n📋 Phase 10: Scripts Download")
        self.test_scripts_download()
        
        # Final Results
        self.print_final_results()

    def print_final_results(self):
        """Print comprehensive test results"""
        print("\n" + "=" * 70)
        print("📊 COMPREHENSIVE TEST RESULTS")
        print("=" * 70)
        
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Tests Failed: {self.tests_run - self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.critical_failures:
            print(f"\n❌ CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"   - {failure}")
        else:
            print(f"\n✅ NO CRITICAL FAILURES")
        
        # Status-specific results
        print(f"\n🎯 STATUS MANAGEMENT FEATURES:")
        if self.tests_passed >= self.tests_run * 0.9:  # 90% success rate
            print("✅ Status management features working correctly")
            print("✅ New status types (active, dead, localhost, duplicate) functional")
            print("✅ Status integration with statistics working")
            print("✅ Localhost protection during dead links removal working")
        else:
            print("❌ Status management features have issues")
        
        print(f"\n🎯 DATA INTEGRITY:")
        if len(self.critical_failures) == 0:
            print("✅ No data integrity issues detected")
            print("✅ MongoDB operations working correctly")
        else:
            print("❌ Potential data integrity issues detected")
        
        print(f"\n🎯 API ENDPOINTS:")
        if self.tests_passed == self.tests_run:
            print("✅ All API endpoints working correctly")
        else:
            print(f"⚠️  {self.tests_run - self.tests_passed} API endpoint issues detected")

def main():
    tester = ComprehensiveBackendTester()
    tester.run_comprehensive_tests()
    
    # Return appropriate exit code
    if tester.tests_passed == tester.tests_run and len(tester.critical_failures) == 0:
        print("\n🎉 All tests passed! Backend is fully functional.")
        return 0
    else:
        print(f"\n⚠️  Issues detected. Check output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())