import requests
import sys
import json
import io
from datetime import datetime

class FavLinkBackendTester:
    def __init__(self, base_url="https://favorg-manager-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0

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
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def create_sample_html_file(self):
        """Create a sample HTML bookmarks file for testing"""
        html_content = """<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks Menu</H1>

<DL><p>
    <DT><H3>Development</H3>
    <DL><p>
        <DT><A HREF="https://github.com/">GitHub</A>
        <DT><A HREF="https://stackoverflow.com/">Stack Overflow</A>
    </DL><p>
    
    <DT><H3>News</H3>
    <DL><p>
        <DT><A HREF="https://news.ycombinator.com/">Hacker News</A>
        <DT><A HREF="https://www.reddit.com/">Reddit</A>
    </DL><p>
    
    <DT><H3>Tools</H3>
    <DL><p>
        <DT><A HREF="https://www.google.com/">Google</A>
        <DT><A HREF="https://www.wikipedia.org/">Wikipedia</A>
    </DL><p>
</DL><p>"""
        return html_content

    def create_sample_json_file(self):
        """Create a sample JSON bookmarks file for testing"""
        json_content = {
            "children": [
                {
                    "name": "Social Media",
                    "children": [
                        {"name": "Twitter", "url": "https://twitter.com/"},
                        {"name": "LinkedIn", "url": "https://linkedin.com/"}
                    ]
                },
                {
                    "name": "Entertainment", 
                    "children": [
                        {"name": "YouTube", "url": "https://youtube.com/"},
                        {"name": "Netflix", "url": "https://netflix.com/"}
                    ]
                }
            ]
        }
        return json.dumps(json_content)

    def test_import_html_bookmarks(self):
        """Test HTML bookmarks import"""
        html_content = self.create_sample_html_file()
        files = {'file': ('bookmarks.html', html_content, 'text/html')}
        
        success, response = self.run_test(
            "Import HTML Bookmarks",
            "POST",
            "bookmarks/import",
            200,
            files=files
        )
        return success, response

    def test_import_json_bookmarks(self):
        """Test JSON bookmarks import"""
        json_content = self.create_sample_json_file()
        files = {'file': ('bookmarks.json', json_content, 'application/json')}
        
        success, response = self.run_test(
            "Import JSON Bookmarks", 
            "POST",
            "bookmarks/import",
            200,
            files=files
        )
        return success, response

    def test_get_all_bookmarks(self):
        """Test getting all bookmarks"""
        success, response = self.run_test(
            "Get All Bookmarks",
            "GET", 
            "bookmarks",
            200
        )
        return success, response

    def test_get_categories(self):
        """Test getting all categories"""
        success, response = self.run_test(
            "Get All Categories",
            "GET",
            "categories", 
            200
        )
        return success, response

    def test_get_bookmarks_by_category(self, category="Development"):
        """Test getting bookmarks by category"""
        success, response = self.run_test(
            f"Get Bookmarks by Category ({category})",
            "GET",
            f"bookmarks/category/{category}",
            200
        )
        return success, response

    def test_search_bookmarks(self, query="GitHub"):
        """Test bookmark search functionality"""
        success, response = self.run_test(
            f"Search Bookmarks ({query})",
            "GET",
            f"bookmarks/search/{query}",
            200
        )
        return success, response

    def test_validate_links(self):
        """Test link validation (dead link check)"""
        success, response = self.run_test(
            "Validate Links (Dead Link Check)",
            "POST",
            "bookmarks/validate",
            200
        )
        return success, response

    def test_remove_duplicates(self):
        """Test duplicate removal"""
        success, response = self.run_test(
            "Remove Duplicates",
            "POST", 
            "bookmarks/remove-duplicates",
            200
        )
        return success, response

    def test_create_single_bookmark(self):
        """Test creating a single bookmark"""
        bookmark_data = {
            "title": "Test Bookmark",
            "url": "https://example.com/test",
            "category": "Testing"
        }
        
        success, response = self.run_test(
            "Create Single Bookmark",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        return success, response

    def test_delete_single_bookmark(self, bookmark_id):
        """Test deleting a single bookmark"""
        success, response = self.run_test(
            f"Delete Single Bookmark ({bookmark_id})",
            "DELETE",
            f"bookmarks/{bookmark_id}",
            200
        )
        return success, response

    def test_delete_all_bookmarks(self):
        """Test deleting all bookmarks"""
        success, response = self.run_test(
            "Delete All Bookmarks",
            "DELETE",
            "bookmarks/all",
            200
        )
        return success, response

    def test_update_bookmark(self, bookmark_id, update_data):
        """Test updating a bookmark"""
        success, response = self.run_test(
            f"Update Bookmark ({bookmark_id})",
            "PUT",
            f"bookmarks/{bookmark_id}",
            200,
            data=update_data
        )
        return success, response

    def test_move_bookmarks(self, bookmark_ids, target_category, target_subcategory=None):
        """Test moving bookmarks to different category"""
        move_data = {
            "bookmark_ids": bookmark_ids,
            "target_category": target_category,
            "target_subcategory": target_subcategory
        }
        
        success, response = self.run_test(
            f"Move Bookmarks to {target_category}",
            "POST",
            "bookmarks/move",
            200,
            data=move_data
        )
        return success, response

    def test_export_xml(self, category=None):
        """Test XML export functionality"""
        export_data = {"format": "xml"}
        if category:
            export_data["category"] = category
            
        success, response = self.run_test(
            f"Export XML{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        return success, response

    def test_export_csv(self, category=None):
        """Test CSV export functionality"""
        export_data = {"format": "csv"}
        if category:
            export_data["category"] = category
            
        success, response = self.run_test(
            f"Export CSV{' (Category: ' + category + ')' if category else ''}",
            "POST",
            "export",
            200,
            data=export_data,
            expect_json=False
        )
        return success, response

    def test_get_statistics(self):
        """Test statistics endpoint"""
        success, response = self.run_test(
            "Get Statistics",
            "GET",
            "statistics",
            200
        )
        return success, response

    def test_download_collector_zip(self):
        """Test downloading collector scripts as ZIP"""
        success, response = self.run_test(
            "Download Collector ZIP",
            "GET",
            "download/collector",
            200,
            expect_json=False
        )
        return success, response

    def test_create_sample_bookmarks(self):
        """Test creating sample bookmarks"""
        success, response = self.run_test(
            "Create Sample Bookmarks",
            "POST",
            "bookmarks/create-samples",
            200
        )
        return success, response

    def test_remove_dead_links(self):
        """Test removing all dead links (NEW FEATURE)"""
        success, response = self.run_test(
            "Remove Dead Links (NEW)",
            "DELETE",
            "bookmarks/dead-links",
            200
        )
        return success, response

    def test_status_management(self):
        """Test new status management features"""
        print("\n🔄 Testing Status Management Features...")
        
        # First get a bookmark to test with
        success, bookmarks = self.test_get_all_bookmarks()
        if not success or not bookmarks:
            print("❌ No bookmarks available for status testing")
            return False, "No bookmarks available"
        
        bookmark_id = bookmarks[0]['id']
        print(f"   Using bookmark ID: {bookmark_id}")
        
        # Test all status types
        status_types = ['active', 'dead', 'localhost', 'duplicate', 'unchecked']
        
        for status_type in status_types:
            status_data = {"status_type": status_type}
            success, response = self.run_test(
                f"Update Status to {status_type}",
                "PUT",
                f"bookmarks/{bookmark_id}/status",
                200,
                data=status_data
            )
            if not success:
                return False, f"Failed to set status to {status_type}"
        
        return True, "All status types tested successfully"

    def test_duplicate_workflow(self):
        """Test complete duplicate workflow: Find → Mark → Delete"""
        print("\n🔄 Testing Duplicate Workflow...")
        
        # Step 1: Find and mark duplicates
        success, find_response = self.run_test(
            "Find and Mark Duplicates",
            "POST",
            "bookmarks/find-duplicates",
            200
        )
        if not success:
            return False, "Failed to find duplicates"
        
        duplicate_groups = find_response.get('duplicate_groups', 0)
        marked_count = find_response.get('marked_count', 0)
        print(f"   Found {duplicate_groups} duplicate groups, marked {marked_count} duplicates")
        
        # Step 2: Delete marked duplicates
        success, delete_response = self.run_test(
            "Delete Marked Duplicates",
            "DELETE",
            "bookmarks/duplicates",
            200
        )
        if not success:
            return False, "Failed to delete duplicates"
        
        removed_count = delete_response.get('removed_count', 0)
        print(f"   Removed {removed_count} duplicate bookmarks")
        
        return True, {
            "duplicate_groups": duplicate_groups,
            "marked_count": marked_count,
            "removed_count": removed_count
        }

    def test_statistics_comprehensive(self):
        """Test statistics endpoint with comprehensive field validation for new vertical layout"""
        success, response = self.run_test(
            "Get Comprehensive Statistics",
            "GET",
            "statistics",
            200
        )
        
        if success:
            # Validate all required fields for the new vertical layout
            required_fields = [
                'total_bookmarks', 'total_categories', 'active_links', 
                'dead_links', 'localhost_links', 'duplicate_links', 
                'timeout_links', 'unchecked_links'
            ]
            
            missing_fields = []
            for field in required_fields:
                if field not in response:
                    missing_fields.append(field)
            
            if missing_fields:
                print(f"   ⚠️  Missing fields for vertical layout: {missing_fields}")
                return False, f"Missing required fields: {missing_fields}"
            else:
                print("   ✅ All required statistics fields present for vertical layout")
                print(f"   📊 Statistics: {response['total_bookmarks']} total, {response['active_links']} active, {response['dead_links']} dead")
                return True, response
        
        return success, response

    def test_integration_workflow(self):
        """Test the complete integration workflow: Validate → Check Dead Links → Remove → Update Statistics"""
        print("\n🔄 Starting Integration Workflow Test...")
        
        # Step 1: Get initial statistics
        print("   Step 1: Getting initial statistics...")
        stats_success, initial_stats = self.test_get_statistics()
        if not stats_success:
            return False, "Failed to get initial statistics"
        
        initial_dead_links = initial_stats.get('dead_links', 0)
        initial_total = initial_stats.get('total_bookmarks', 0)
        print(f"   Initial state: {initial_total} total bookmarks, {initial_dead_links} dead links")
        
        # Step 2: Validate all links
        print("   Step 2: Validating all links...")
        validate_success, validate_response = self.test_validate_links()
        if not validate_success:
            return False, "Link validation failed"
        
        dead_links_found = validate_response.get('dead_links_found', 0)
        print(f"   Validation result: {dead_links_found} dead links found")
        
        # Step 3: Get updated statistics after validation
        print("   Step 3: Getting statistics after validation...")
        stats_success, post_validate_stats = self.test_get_statistics()
        if not stats_success:
            return False, "Failed to get post-validation statistics"
        
        post_validate_dead_links = post_validate_stats.get('dead_links', 0)
        print(f"   Post-validation: {post_validate_dead_links} dead links in statistics")
        
        # Step 4: Remove dead links if any exist
        if post_validate_dead_links > 0:
            print("   Step 4: Removing dead links...")
            remove_success, remove_response = self.test_remove_dead_links()
            if not remove_success:
                return False, "Dead links removal failed"
            
            removed_count = remove_response.get('removed_count', 0)
            print(f"   Removal result: {removed_count} dead links removed")
            
            # Step 5: Get final statistics
            print("   Step 5: Getting final statistics...")
            stats_success, final_stats = self.test_get_statistics()
            if not stats_success:
                return False, "Failed to get final statistics"
            
            final_dead_links = final_stats.get('dead_links', 0)
            final_total = final_stats.get('total_bookmarks', 0)
            print(f"   Final state: {final_total} total bookmarks, {final_dead_links} dead links")
            
            # Verify the workflow worked correctly
            expected_total = initial_total - removed_count
            if final_total == expected_total and final_dead_links == 0:
                print("   ✅ Integration workflow completed successfully!")
                return True, {
                    "initial_total": initial_total,
                    "initial_dead_links": initial_dead_links,
                    "dead_links_found": dead_links_found,
                    "removed_count": removed_count,
                    "final_total": final_total,
                    "final_dead_links": final_dead_links
                }
            else:
                return False, f"Workflow verification failed: expected {expected_total} total, got {final_total}; expected 0 dead links, got {final_dead_links}"
        else:
            print("   No dead links found, workflow completed without removal")
            return True, {
                "initial_total": initial_total,
                "initial_dead_links": initial_dead_links,
                "dead_links_found": dead_links_found,
                "removed_count": 0,
                "final_total": initial_total,
                "final_dead_links": 0
            }

    def test_dead_links_error_handling(self):
        """Test error handling when removing dead links with none present"""
        # First ensure no dead links exist by running the removal
        self.test_remove_dead_links()
        
        # Now test removing dead links when none exist
        success, response = self.run_test(
            "Remove Dead Links (No Dead Links Present)",
            "DELETE",
            "bookmarks/dead-links",
            200
        )
        
        if success:
            removed_count = response.get('removed_count', 0)
            if removed_count == 0:
                print("   ✅ Correctly handled case with no dead links to remove")
                return True, response
            else:
                print(f"   ⚠️  Unexpected: {removed_count} links removed when none should exist")
                return False, response
        
        return success, response

def main():
    print("🚀 Starting FavLink Manager Backend API Tests")
    print("🎯 FOCUS: Comprehensive Backend Testing nach Frontend Updates")
    print("🇩🇪 Teste das FavOrg Backend nach den aktuellen Frontend-Updates")
    print("=" * 70)
    
    tester = FavLinkBackendTester()
    
    # Test sequence - prioritizing Statistics and Status Management as requested
    print("\n📋 Phase 1: 🎯 PRIORITY - Statistics Endpoint (für vertikales Layout)")
    print("   Testing statistics endpoint for new vertical layout requirements")
    stats_success, stats_response = tester.test_statistics_comprehensive()
    
    print("\n📋 Phase 2: Categories Endpoint (für verbesserte Tooltip-Funktionalität)")
    categories_success, categories_response = tester.test_get_categories()
    
    print("\n📋 Phase 3: CRUD Operations (Basis-Operationen)")
    # Create
    create_success, create_response = tester.test_create_single_bookmark()
    bookmark_id = None
    if create_success and 'id' in create_response:
        bookmark_id = create_response['id']
        
        # Read
        tester.test_get_all_bookmarks()
        tester.test_get_bookmarks_by_category("Development")
        
        # Update
        update_data = {
            "title": "Updated Test Bookmark für Backend Test",
            "category": "Testing"
        }
        tester.test_update_bookmark(bookmark_id, update_data)
        
        # Move
        tester.test_move_bookmarks([bookmark_id], "Development")
        
        # Delete (will be done at end)
    
    print("\n📋 Phase 4: 🎯 Status Management (alle status_type Operationen)")
    status_success, status_response = tester.test_status_management()
    
    print("\n📋 Phase 5: Export-Funktionalität (XML/CSV)")
    xml_success, xml_response = tester.test_export_xml()
    csv_success, csv_response = tester.test_export_csv()
    # Test with category filter
    tester.test_export_xml("Development")
    tester.test_export_csv("Development")
    
    print("\n📋 Phase 6: Link-Validierung (POST /api/bookmarks/validate)")
    validation_success, validation_response = tester.test_validate_links()
    
    print("\n📋 Phase 7: 🎯 Duplikat-Management (Find und Delete Operationen)")
    duplicate_success, duplicate_response = tester.test_duplicate_workflow()
    
    print("\n📋 Phase 8: Dead Links Removal & Integration Workflow")
    workflow_success, workflow_result = tester.test_integration_workflow()
    tester.test_dead_links_error_handling()
    
    print("\n📋 Phase 9: Scripts Download (ZIP)")
    scripts_success, scripts_response = tester.test_download_collector_zip()
    
    print("\n📋 Phase 10: Final Verification")
    # Get final statistics to verify everything is consistent
    final_stats_success, final_stats = tester.test_get_statistics()
    
    # Cleanup - Delete the test bookmark if it was created
    if bookmark_id:
        tester.test_delete_single_bookmark(bookmark_id)
    
    # Print final results
    print("\n" + "=" * 70)
    print(f"📊 FINAL RESULTS - Backend Testing nach Frontend Updates")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Detailed results for key areas
    print(f"\n🎯 KEY AREAS STATUS:")
    print(f"✅ Statistics Endpoint (vertikales Layout): {'PASS' if stats_success else 'FAIL'}")
    print(f"✅ Categories Endpoint (Tooltip): {'PASS' if categories_success else 'FAIL'}")
    print(f"✅ CRUD Operations: {'PASS' if create_success else 'FAIL'}")
    print(f"✅ Status Management: {'PASS' if status_success else 'FAIL'}")
    print(f"✅ Export Functionality: {'PASS' if xml_success and csv_success else 'FAIL'}")
    print(f"✅ Link Validation: {'PASS' if validation_success else 'FAIL'}")
    print(f"✅ Duplicate Management: {'PASS' if duplicate_success else 'FAIL'}")
    print(f"✅ Scripts Download: {'PASS' if scripts_success else 'FAIL'}")
    
    # Critical issues check
    critical_failures = []
    if not stats_success:
        critical_failures.append("Statistics Endpoint")
    if not categories_success:
        critical_failures.append("Categories Endpoint")
    if not create_success:
        critical_failures.append("CRUD Operations")
    
    if critical_failures:
        print(f"\n❌ CRITICAL FAILURES: {', '.join(critical_failures)}")
        print("   These failures could impact frontend functionality!")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All tests passed! Backend API is fully functional nach Frontend Updates.")
        print("🎯 Alle kritischen Endpunkte funktionieren einwandfrei!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} tests failed. Check the output above for details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())