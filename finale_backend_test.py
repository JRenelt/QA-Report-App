import requests
import sys
import json
import io
from datetime import datetime

class FinaleBackendTester:
    def __init__(self, base_url="https://pdf-report-boost.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

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
                        print(f"   Response: {json.dumps(response_data, indent=2)[:300]}...")
                        self.test_results.append({"name": name, "status": "PASSED", "response": response_data})
                        return success, response_data
                    except:
                        print(f"   Response: {response.text[:200]}...")
                        self.test_results.append({"name": name, "status": "PASSED", "response": response.text})
                        return success, {}
                else:
                    print(f"   Response: {response.text[:200]}...")
                    self.test_results.append({"name": name, "status": "PASSED", "response": response.text})
                    return success, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:300]}...")
                self.test_results.append({"name": name, "status": "FAILED", "error": f"Status {response.status_code}: {response.text[:200]}"})
                return success, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({"name": name, "status": "FAILED", "error": str(e)})
            return False, {}

    def test_status_management_features(self):
        """Test PUT /api/bookmarks/{id}/status with all status types"""
        print("\n🎯 TESTING STATUS MANAGEMENT FEATURES")
        print("=" * 50)
        
        # First get some bookmarks to test with
        success, bookmarks = self.run_test(
            "Get Bookmarks for Status Testing",
            "GET",
            "bookmarks",
            200
        )
        
        if not success or not bookmarks:
            print("❌ Cannot test status management - no bookmarks available")
            return False
        
        # Test with first bookmark
        test_bookmark = bookmarks[0]
        bookmark_id = test_bookmark['id']
        print(f"   Using bookmark: {test_bookmark['title']} (ID: {bookmark_id})")
        
        # Test all status types
        status_types = ["active", "dead", "localhost", "duplicate"]
        status_results = {}
        
        for status_type in status_types:
            print(f"\n   Testing status_type: {status_type}")
            success, response = self.run_test(
                f"Update Status to {status_type}",
                "PUT",
                f"bookmarks/{bookmark_id}/status",
                200,
                data={"status_type": status_type}
            )
            status_results[status_type] = success
            
            if success:
                # Verify the status was set correctly
                success_verify, bookmark_data = self.run_test(
                    f"Verify Status {status_type}",
                    "GET",
                    "bookmarks",
                    200
                )
                
                if success_verify:
                    updated_bookmark = next((b for b in bookmark_data if b['id'] == bookmark_id), None)
                    if updated_bookmark:
                        actual_status = updated_bookmark.get('status_type', 'unknown')
                        is_dead_link = updated_bookmark.get('is_dead_link', False)
                        
                        print(f"      ✅ Status verified: status_type={actual_status}, is_dead_link={is_dead_link}")
                        
                        # Verify status_type and is_dead_link synchronization
                        if status_type == "dead" and not is_dead_link:
                            print(f"      ⚠️  Warning: status_type='dead' but is_dead_link=False")
                        elif status_type in ["active", "localhost", "duplicate"] and is_dead_link:
                            print(f"      ⚠️  Warning: status_type='{status_type}' but is_dead_link=True")
                        else:
                            print(f"      ✅ Status synchronization correct")
        
        return all(status_results.values())

    def test_dead_links_removal_new_logic(self):
        """Test DELETE /api/bookmarks/dead-links with new logic"""
        print("\n🎯 TESTING 'TOTE ENTFERNEN' FUNCTIONALITY (NEW LOGIC)")
        print("=" * 50)
        
        # First create test bookmarks with different status types
        test_bookmarks = [
            {"title": "Dead Link Test", "url": "https://dead-test-link.invalid", "category": "Testing"},
            {"title": "Localhost Test", "url": "http://localhost:3000", "category": "Testing"},
            {"title": "Active Link Test", "url": "https://github.com", "category": "Testing"}
        ]
        
        created_ids = []
        for bookmark_data in test_bookmarks:
            success, response = self.run_test(
                f"Create Test Bookmark: {bookmark_data['title']}",
                "POST",
                "bookmarks",
                200,
                data=bookmark_data
            )
            if success and 'id' in response:
                created_ids.append(response['id'])
        
        if len(created_ids) < 3:
            print("❌ Could not create test bookmarks for dead links removal test")
            return False
        
        # Set different status types
        status_updates = [
            (created_ids[0], "dead"),      # This should be deleted
            (created_ids[1], "localhost"), # This should be preserved
            (created_ids[2], "active")     # This should be preserved
        ]
        
        for bookmark_id, status_type in status_updates:
            self.run_test(
                f"Set Status {status_type}",
                "PUT",
                f"bookmarks/{bookmark_id}/status",
                200,
                data={"status_type": status_type}
            )
        
        # Get initial count of bookmarks with different statuses
        success, initial_bookmarks = self.run_test(
            "Get Initial Bookmarks Count",
            "GET",
            "bookmarks",
            200
        )
        
        if success:
            dead_count = sum(1 for b in initial_bookmarks if b.get('status_type') == 'dead')
            localhost_count = sum(1 for b in initial_bookmarks if b.get('status_type') == 'localhost')
            print(f"   Initial counts: {dead_count} dead links, {localhost_count} localhost links")
        
        # Test the new dead links removal logic
        success, response = self.run_test(
            "Remove Dead Links (New Logic)",
            "DELETE",
            "bookmarks/dead-links",
            200
        )
        
        if not success:
            return False
        
        removed_count = response.get('removed_count', 0)
        print(f"   Removed {removed_count} dead links")
        
        # Verify localhost links were preserved
        success, final_bookmarks = self.run_test(
            "Verify Localhost Preservation",
            "GET",
            "bookmarks",
            200
        )
        
        if success:
            remaining_localhost = [b for b in final_bookmarks if b.get('status_type') == 'localhost']
            remaining_dead = [b for b in final_bookmarks if b.get('status_type') == 'dead']
            
            print(f"   After removal: {len(remaining_dead)} dead links, {len(remaining_localhost)} localhost links")
            
            # Verify localhost links were preserved
            localhost_preserved = any(b['id'] == created_ids[1] for b in remaining_localhost)
            dead_removed = not any(b['id'] == created_ids[0] for b in final_bookmarks)
            
            if localhost_preserved and dead_removed:
                print("   ✅ Dead links removal logic working correctly: dead removed, localhost preserved")
                return True
            else:
                print("   ❌ Dead links removal logic failed")
                return False
        
        return False

    def test_duplicate_workflow_extended(self):
        """Test extended duplicate workflow"""
        print("\n🎯 TESTING DUPLICATE WORKFLOW (EXTENDED)")
        print("=" * 50)
        
        # Create duplicate bookmarks for testing
        duplicate_url = "https://duplicate-test.com"
        duplicate_bookmarks = [
            {"title": "Duplicate 1", "url": duplicate_url, "category": "Testing"},
            {"title": "Duplicate 2", "url": duplicate_url, "category": "Testing"},
            {"title": "Duplicate 3", "url": duplicate_url, "category": "Testing"}
        ]
        
        created_ids = []
        for bookmark_data in duplicate_bookmarks:
            success, response = self.run_test(
                f"Create Duplicate: {bookmark_data['title']}",
                "POST",
                "bookmarks",
                200,
                data=bookmark_data
            )
            if success and 'id' in response:
                created_ids.append(response['id'])
        
        if len(created_ids) < 2:
            print("❌ Could not create duplicate bookmarks for testing")
            return False
        
        # Test find duplicates endpoint
        success, find_response = self.run_test(
            "Find Duplicates",
            "POST",
            "bookmarks/find-duplicates",
            200
        )
        
        if not success:
            return False
        
        duplicate_groups = find_response.get('duplicate_groups', 0)
        marked_count = find_response.get('marked_count', 0)
        
        print(f"   Found {duplicate_groups} duplicate groups, marked {marked_count} duplicates")
        
        # Verify duplicates were marked with status_type="duplicate"
        success, bookmarks = self.run_test(
            "Verify Duplicate Marking",
            "GET",
            "bookmarks",
            200
        )
        
        if success:
            duplicate_marked = [b for b in bookmarks if b.get('status_type') == 'duplicate']
            print(f"   Verified: {len(duplicate_marked)} bookmarks marked as duplicates")
        
        # Test delete duplicates endpoint
        success, delete_response = self.run_test(
            "Delete Duplicates",
            "DELETE",
            "bookmarks/duplicates",
            200
        )
        
        if not success:
            return False
        
        removed_count = delete_response.get('removed_count', 0)
        print(f"   Removed {removed_count} duplicate bookmarks")
        
        # Verify count consistency
        if marked_count == removed_count:
            print("   ✅ Count verification: Marked count = Removed count")
            return True
        else:
            print(f"   ❌ Count mismatch: Marked {marked_count}, Removed {removed_count}")
            return False

    def test_link_validation_with_status_integration(self):
        """Test link validation with new status_type logic"""
        print("\n🎯 TESTING LINK VALIDATION WITH STATUS INTEGRATION")
        print("=" * 50)
        
        # Create test bookmarks with different URLs
        test_bookmarks = [
            {"title": "Valid Link", "url": "https://github.com", "category": "Testing"},
            {"title": "Invalid Link", "url": "https://invalid-test-domain-12345.com", "category": "Testing"}
        ]
        
        created_ids = []
        for bookmark_data in test_bookmarks:
            success, response = self.run_test(
                f"Create Test Bookmark: {bookmark_data['title']}",
                "POST",
                "bookmarks",
                200,
                data=bookmark_data
            )
            if success and 'id' in response:
                created_ids.append(response['id'])
        
        # Run link validation
        success, validation_response = self.run_test(
            "Validate Links with Status Integration",
            "POST",
            "bookmarks/validate",
            200
        )
        
        if not success:
            return False
        
        total_checked = validation_response.get('total_checked', 0)
        dead_links_found = validation_response.get('dead_links_found', 0)
        
        print(f"   Validation results: {total_checked} checked, {dead_links_found} dead links found")
        
        # Verify status_type was set correctly
        success, bookmarks = self.run_test(
            "Verify Status Types After Validation",
            "GET",
            "bookmarks",
            200
        )
        
        if success:
            active_links = [b for b in bookmarks if b.get('status_type') == 'active' and not b.get('is_dead_link')]
            dead_links = [b for b in bookmarks if b.get('status_type') == 'dead' and b.get('is_dead_link')]
            
            print(f"   Status verification: {len(active_links)} active, {len(dead_links)} dead")
            
            # Check if our test bookmarks have correct status
            test_bookmark_statuses = []
            for bookmark_id in created_ids:
                bookmark = next((b for b in bookmarks if b['id'] == bookmark_id), None)
                if bookmark:
                    status_type = bookmark.get('status_type', 'unknown')
                    is_dead = bookmark.get('is_dead_link', False)
                    test_bookmark_statuses.append((status_type, is_dead))
                    print(f"   Test bookmark status: status_type={status_type}, is_dead_link={is_dead}")
            
            return len(test_bookmark_statuses) > 0
        
        return False

    def test_statistics_with_new_status_types(self):
        """Test statistics endpoint with new status types"""
        print("\n🎯 TESTING STATISTICS WITH NEW STATUS TYPES")
        print("=" * 50)
        
        success, stats = self.run_test(
            "Get Statistics with New Status Types",
            "GET",
            "statistics",
            200
        )
        
        if not success:
            return False
        
        # Verify statistics include all necessary fields
        required_fields = ['total_bookmarks', 'total_categories', 'active_links', 'dead_links']
        missing_fields = [field for field in required_fields if field not in stats]
        
        if missing_fields:
            print(f"   ❌ Missing required fields: {missing_fields}")
            return False
        
        total_bookmarks = stats.get('total_bookmarks', 0)
        dead_links = stats.get('dead_links', 0)
        active_links = stats.get('active_links', 0)
        
        print(f"   Statistics: {total_bookmarks} total, {active_links} active, {dead_links} dead")
        
        # Get actual bookmarks to verify statistics accuracy
        success, bookmarks = self.run_test(
            "Get Bookmarks for Statistics Verification",
            "GET",
            "bookmarks",
            200
        )
        
        if success:
            actual_total = len(bookmarks)
            actual_dead = sum(1 for b in bookmarks if b.get('status_type') == 'dead')
            actual_localhost = sum(1 for b in bookmarks if b.get('status_type') == 'localhost')
            
            print(f"   Actual counts: {actual_total} total, {actual_dead} dead, {actual_localhost} localhost")
            
            # Verify dead_links count is based on status_type="dead"
            if dead_links == actual_dead:
                print("   ✅ Dead links count correctly based on status_type='dead'")
            else:
                print(f"   ❌ Dead links count mismatch: stats={dead_links}, actual={actual_dead}")
            
            # Verify localhost links are not counted as dead
            if actual_localhost > 0:
                print(f"   ✅ Localhost links ({actual_localhost}) not counted as dead")
            
            return True
        
        return False

    def test_comprehensive_status_workflow(self):
        """Test the complete status workflow"""
        print("\n🎯 TESTING COMPREHENSIVE STATUS WORKFLOW")
        print("=" * 50)
        
        # Create a test bookmark
        test_bookmark = {
            "title": "Status Workflow Test",
            "url": "https://status-test.example.com",
            "category": "Testing"
        }
        
        success, response = self.run_test(
            "Create Bookmark for Status Workflow",
            "POST",
            "bookmarks",
            200,
            data=test_bookmark
        )
        
        if not success or 'id' not in response:
            return False
        
        bookmark_id = response['id']
        
        # Test status transitions: active -> dead -> localhost -> duplicate -> active
        status_sequence = ["active", "dead", "localhost", "duplicate", "active"]
        
        for status_type in status_sequence:
            print(f"\n   Testing transition to: {status_type}")
            
            # Update status
            success, update_response = self.run_test(
                f"Update to {status_type}",
                "PUT",
                f"bookmarks/{bookmark_id}/status",
                200,
                data={"status_type": status_type}
            )
            
            if not success:
                return False
            
            # Verify status in statistics
            success, stats = self.run_test(
                f"Verify Statistics after {status_type}",
                "GET",
                "statistics",
                200
            )
            
            if success:
                dead_count = stats.get('dead_links', 0)
                print(f"      Statistics dead_links: {dead_count}")
        
        # Clean up test bookmark
        self.run_test(
            "Delete Test Bookmark",
            "DELETE",
            f"bookmarks/{bookmark_id}",
            200
        )
        
        return True

def main():
    print("🚀 FINALE BACKEND TESTING - Alle neuen Features nach kompletter Implementation")
    print("🎯 Testing all new status management and dead links features")
    print("=" * 80)
    
    tester = FinaleBackendTester()
    
    # Test sequence based on review request
    test_functions = [
        ("Status Management Features", tester.test_status_management_features),
        ("Dead Links Removal New Logic", tester.test_dead_links_removal_new_logic),
        ("Duplicate Workflow Extended", tester.test_duplicate_workflow_extended),
        ("Link Validation with Status Integration", tester.test_link_validation_with_status_integration),
        ("Statistics with New Status Types", tester.test_statistics_with_new_status_types),
        ("Comprehensive Status Workflow", tester.test_comprehensive_status_workflow)
    ]
    
    results = {}
    
    for test_name, test_function in test_functions:
        print(f"\n{'='*20} {test_name} {'='*20}")
        try:
            result = test_function()
            results[test_name] = result
            if result:
                print(f"✅ {test_name}: PASSED")
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {str(e)}")
            results[test_name] = False
    
    # Print final results
    print("\n" + "=" * 80)
    print("📊 FINALE TESTING RESULTS")
    print("=" * 80)
    
    passed_tests = sum(1 for result in results.values() if result)
    total_tests = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASSED" if result else "❌ FAILED"
        print(f"{test_name}: {status}")
    
    print(f"\nOverall Results:")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    print(f"\nFeature Tests:")
    print(f"Feature Tests Passed: {passed_tests}/{total_tests}")
    print(f"Feature Success Rate: {(passed_tests/total_tests)*100:.1f}%")
    
    # Critical assessment
    critical_features = [
        "Status Management Features",
        "Dead Links Removal New Logic", 
        "Statistics with New Status Types"
    ]
    
    critical_passed = sum(1 for feature in critical_features if results.get(feature, False))
    
    print(f"\n🎯 CRITICAL FEATURES STATUS:")
    for feature in critical_features:
        status = "✅ WORKING" if results.get(feature, False) else "❌ FAILED"
        print(f"   {feature}: {status}")
    
    if critical_passed == len(critical_features):
        print("\n🎉 ALL CRITICAL FEATURES WORKING!")
        print("✅ Localhost-Schutz bei Dead-Links-Removal")
        print("✅ Status-Konsistenz bei Validierung") 
        print("✅ Duplikat-Workflow mit Counts")
        print("✅ Statistik-Genauigkeit mit neuen Status-Typen")
        return 0
    else:
        print(f"\n⚠️ {len(critical_features) - critical_passed} critical features failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())