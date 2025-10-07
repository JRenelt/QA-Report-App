import requests
import sys
import json
from datetime import datetime

class GesperrtFeaturesBackendTester:
    """
    Spezieller Tester für die neuen "Gesperrt" Features gemäß German Review-Request:
    1. POST /api/bookmarks mit is_locked Parameter
    2. DELETE Protection für gesperrte Bookmarks  
    3. Status Type Consistency
    4. Bestehende Endpunkte Kompatibilität
    """
    
    def __init__(self, base_url="https://qa-testing-hub.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_bookmark_ids = []  # Track created bookmarks for cleanup

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
                return success, response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_create_locked_bookmark_basic(self):
        """TEST 1: POST /api/bookmarks mit is_locked=true Parameter"""
        print("\n🔒 TEST 1: Gesperrtes Bookmark erstellen (is_locked=true)")
        
        bookmark_data = {
            "title": "Gesperrtes Test Bookmark",
            "url": "https://example.com/locked-test",
            "category": "Testing",
            "is_locked": True
        }
        
        success, response = self.run_test(
            "Create Locked Bookmark (is_locked=true)",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        
        if success and 'id' in response:
            bookmark_id = response['id']
            self.test_bookmark_ids.append(bookmark_id)
            
            # Verify the bookmark was created with correct fields
            if response.get('is_locked') == True:
                print("   ✅ is_locked field correctly set to true")
            else:
                print(f"   ❌ is_locked field incorrect: {response.get('is_locked')}")
                success = False
                
            if response.get('status_type') == 'locked':
                print("   ✅ status_type automatically set to 'locked'")
            else:
                print(f"   ❌ status_type not set correctly: {response.get('status_type')}")
                success = False
                
            return success, response
        
        return success, response

    def test_create_locked_bookmark_status_type(self):
        """TEST 2: POST /api/bookmarks mit status_type='locked' Parameter"""
        print("\n🔒 TEST 2: Bookmark mit status_type='locked' erstellen")
        
        bookmark_data = {
            "title": "Status Type Locked Bookmark",
            "url": "https://example.com/status-locked-test",
            "category": "Testing",
            "status_type": "locked"
        }
        
        success, response = self.run_test(
            "Create Bookmark with status_type='locked'",
            "POST",
            "bookmarks",
            200,
            data=bookmark_data
        )
        
        if success and 'id' in response:
            bookmark_id = response['id']
            self.test_bookmark_ids.append(bookmark_id)
            
            # Verify consistency: status_type='locked' should set is_locked=true
            if response.get('status_type') == 'locked':
                print("   ✅ status_type correctly set to 'locked'")
            else:
                print(f"   ❌ status_type incorrect: {response.get('status_type')}")
                success = False
                
            if response.get('is_locked') == True:
                print("   ✅ is_locked automatically set to true")
            else:
                print(f"   ❌ is_locked not set correctly: {response.get('is_locked')}")
                success = False
                
            return success, response
        
        return success, response

    def test_create_bookmark_combinations(self):
        """TEST 3: Verschiedene Kombinationen von is_locked und status_type testen"""
        print("\n🔒 TEST 3: Verschiedene Parameter-Kombinationen testen")
        
        test_cases = [
            {
                "name": "is_locked=false, status_type=active",
                "data": {
                    "title": "Normal Bookmark Test",
                    "url": "https://example.com/normal-test",
                    "category": "Testing",
                    "is_locked": False,
                    "status_type": "active"
                },
                "expected_locked": False,
                "expected_status": "active"
            },
            {
                "name": "is_locked=true, status_type=active (should override to locked)",
                "data": {
                    "title": "Override Test Bookmark",
                    "url": "https://example.com/override-test",
                    "category": "Testing",
                    "is_locked": True,
                    "status_type": "active"
                },
                "expected_locked": True,
                "expected_status": "locked"
            }
        ]
        
        all_success = True
        for test_case in test_cases:
            print(f"\n   Testing: {test_case['name']}")
            success, response = self.run_test(
                test_case['name'],
                "POST",
                "bookmarks",
                200,
                data=test_case['data']
            )
            
            if success and 'id' in response:
                bookmark_id = response['id']
                self.test_bookmark_ids.append(bookmark_id)
                
                # Verify expected values
                if response.get('is_locked') == test_case['expected_locked']:
                    print(f"     ✅ is_locked correctly set to {test_case['expected_locked']}")
                else:
                    print(f"     ❌ is_locked incorrect: expected {test_case['expected_locked']}, got {response.get('is_locked')}")
                    all_success = False
                    
                if response.get('status_type') == test_case['expected_status']:
                    print(f"     ✅ status_type correctly set to '{test_case['expected_status']}'")
                else:
                    print(f"     ❌ status_type incorrect: expected '{test_case['expected_status']}', got '{response.get('status_type')}'")
                    all_success = False
            else:
                all_success = False
        
        return all_success, "Parameter combinations tested"

    def test_delete_protection_locked_bookmark(self):
        """TEST 4: DELETE Protection für gesperrte Bookmarks"""
        print("\n🛡️ TEST 4: Löschschutz für gesperrte Bookmarks testen")
        
        # First create a locked bookmark
        locked_bookmark_data = {
            "title": "Zu löschendes gesperrtes Bookmark",
            "url": "https://example.com/delete-protection-test",
            "category": "Testing",
            "is_locked": True
        }
        
        create_success, create_response = self.run_test(
            "Create Locked Bookmark for Delete Test",
            "POST",
            "bookmarks",
            200,
            data=locked_bookmark_data
        )
        
        if not create_success or 'id' not in create_response:
            return False, "Failed to create locked bookmark for delete test"
        
        locked_bookmark_id = create_response['id']
        print(f"   Created locked bookmark with ID: {locked_bookmark_id}")
        
        # Now try to delete it - should get HTTP 403
        delete_success, delete_response = self.run_test(
            "Try to Delete Locked Bookmark (should fail with 403)",
            "DELETE",
            f"bookmarks/{locked_bookmark_id}",
            403  # Expecting 403 Forbidden
        )
        
        if delete_success:
            # Check if the error message is correct
            if isinstance(delete_response, dict) and 'detail' in delete_response:
                error_message = delete_response['detail']
                expected_message = "Gesperrte Bookmarks können nicht gelöscht werden"
                if error_message == expected_message:
                    print(f"   ✅ Correct German error message: '{error_message}'")
                else:
                    print(f"   ❌ Incorrect error message: expected '{expected_message}', got '{error_message}'")
                    delete_success = False
            else:
                print(f"   ❌ No proper error message in response: {delete_response}")
                delete_success = False
        
        # Keep the locked bookmark for cleanup later (we'll need to unlock it first)
        self.test_bookmark_ids.append(locked_bookmark_id)
        
        return delete_success, delete_response

    def test_delete_normal_bookmark(self):
        """TEST 5: Normale (nicht gesperrte) Bookmarks sollten löschbar sein"""
        print("\n🗑️ TEST 5: Normale Bookmarks sollten löschbar sein")
        
        # Create a normal (unlocked) bookmark
        normal_bookmark_data = {
            "title": "Normales löschbares Bookmark",
            "url": "https://example.com/normal-deletable-test",
            "category": "Testing",
            "is_locked": False
        }
        
        create_success, create_response = self.run_test(
            "Create Normal Bookmark for Delete Test",
            "POST",
            "bookmarks",
            200,
            data=normal_bookmark_data
        )
        
        if not create_success or 'id' not in create_response:
            return False, "Failed to create normal bookmark for delete test"
        
        normal_bookmark_id = create_response['id']
        print(f"   Created normal bookmark with ID: {normal_bookmark_id}")
        
        # Now try to delete it - should succeed with HTTP 200
        delete_success, delete_response = self.run_test(
            "Delete Normal Bookmark (should succeed)",
            "DELETE",
            f"bookmarks/{normal_bookmark_id}",
            200  # Expecting 200 OK
        )
        
        if delete_success:
            print("   ✅ Normal bookmark successfully deleted")
        
        return delete_success, delete_response

    def test_get_bookmarks_compatibility(self):
        """TEST 6: GET /api/bookmarks sollte is_locked und status_type Felder korrekt zurückgeben"""
        print("\n📋 TEST 6: GET /api/bookmarks Kompatibilität mit neuen Feldern")
        
        success, response = self.run_test(
            "Get All Bookmarks (check new fields)",
            "GET",
            "bookmarks",
            200
        )
        
        if success and isinstance(response, list) and len(response) > 0:
            # Check if bookmarks have the new fields
            sample_bookmark = response[0]
            
            has_is_locked = 'is_locked' in sample_bookmark
            has_status_type = 'status_type' in sample_bookmark
            
            if has_is_locked:
                print("   ✅ is_locked field present in bookmark response")
            else:
                print("   ❌ is_locked field missing in bookmark response")
                success = False
                
            if has_status_type:
                print("   ✅ status_type field present in bookmark response")
            else:
                print("   ❌ status_type field missing in bookmark response")
                success = False
                
            # Look for locked bookmarks specifically
            locked_bookmarks = [b for b in response if b.get('is_locked') == True]
            if locked_bookmarks:
                print(f"   ✅ Found {len(locked_bookmarks)} locked bookmarks in response")
                # Verify consistency
                for locked_bookmark in locked_bookmarks[:3]:  # Check first 3
                    if locked_bookmark.get('status_type') == 'locked':
                        print(f"     ✅ Locked bookmark {locked_bookmark.get('title', 'Unknown')} has correct status_type='locked'")
                    else:
                        print(f"     ❌ Locked bookmark {locked_bookmark.get('title', 'Unknown')} has incorrect status_type='{locked_bookmark.get('status_type')}'")
                        success = False
            else:
                print("   ℹ️  No locked bookmarks found in current dataset")
        
        return success, response

    def test_update_bookmark_is_locked(self):
        """TEST 7: PUT /api/bookmarks/{id} sollte is_locked updates unterstützen"""
        print("\n✏️ TEST 7: PUT /api/bookmarks/{id} is_locked Update Support")
        
        # First create a normal bookmark
        normal_bookmark_data = {
            "title": "Bookmark für Update Test",
            "url": "https://example.com/update-test",
            "category": "Testing",
            "is_locked": False
        }
        
        create_success, create_response = self.run_test(
            "Create Bookmark for Update Test",
            "POST",
            "bookmarks",
            200,
            data=normal_bookmark_data
        )
        
        if not create_success or 'id' not in create_response:
            return False, "Failed to create bookmark for update test"
        
        bookmark_id = create_response['id']
        self.test_bookmark_ids.append(bookmark_id)
        print(f"   Created bookmark with ID: {bookmark_id}")
        
        # Update to locked
        update_data = {
            "is_locked": True
        }
        
        update_success, update_response = self.run_test(
            "Update Bookmark to Locked (is_locked=true)",
            "PUT",
            f"bookmarks/{bookmark_id}",
            200,
            data=update_data
        )
        
        if update_success:
            # Verify the update worked
            if update_response.get('is_locked') == True:
                print("   ✅ is_locked successfully updated to true")
            else:
                print(f"   ❌ is_locked update failed: {update_response.get('is_locked')}")
                update_success = False
                
            if update_response.get('status_type') == 'locked':
                print("   ✅ status_type automatically updated to 'locked'")
            else:
                print(f"   ❌ status_type not updated correctly: {update_response.get('status_type')}")
                update_success = False
        
        return update_success, update_response

    def test_statistics_locked_bookmarks(self):
        """TEST 8: Statistiken sollten gesperrte Bookmarks korrekt zählen"""
        print("\n📊 TEST 8: Statistiken für gesperrte Bookmarks")
        
        success, response = self.run_test(
            "Get Statistics (check locked_links count)",
            "GET",
            "statistics",
            200
        )
        
        if success:
            locked_links = response.get('locked_links', 0)
            print(f"   📊 Locked links in statistics: {locked_links}")
            
            # Verify the field exists
            if 'locked_links' in response:
                print("   ✅ locked_links field present in statistics")
            else:
                print("   ❌ locked_links field missing in statistics")
                success = False
                
            # The count should be >= 0 (we created some locked bookmarks)
            if locked_links >= 0:
                print(f"   ✅ locked_links count is valid: {locked_links}")
            else:
                print(f"   ❌ locked_links count is invalid: {locked_links}")
                success = False
        
        return success, response

    def cleanup_test_bookmarks(self):
        """Clean up test bookmarks (unlock locked ones first, then delete)"""
        print("\n🧹 Cleaning up test bookmarks...")
        
        for bookmark_id in self.test_bookmark_ids:
            try:
                # First try to unlock the bookmark
                unlock_data = {"is_locked": False}
                unlock_url = f"{self.api_url}/bookmarks/{bookmark_id}"
                unlock_response = requests.put(unlock_url, json=unlock_data, headers={'Content-Type': 'application/json'})
                
                if unlock_response.status_code == 200:
                    print(f"   Unlocked bookmark {bookmark_id}")
                
                # Now try to delete it
                delete_url = f"{self.api_url}/bookmarks/{bookmark_id}"
                delete_response = requests.delete(delete_url, headers={'Content-Type': 'application/json'})
                
                if delete_response.status_code == 200:
                    print(f"   ✅ Deleted test bookmark {bookmark_id}")
                else:
                    print(f"   ⚠️  Could not delete bookmark {bookmark_id}: {delete_response.status_code}")
                    
            except Exception as e:
                print(f"   ⚠️  Error cleaning up bookmark {bookmark_id}: {e}")

def main():
    print("🔒 Starting FavOrg Bookmark Manager - Gesperrt Features Backend Testing")
    print("🎯 FOCUS: Neue 'Gesperrt' Features gemäß German Review-Request")
    print("=" * 80)
    print("TESTING SCOPE:")
    print("1. POST /api/bookmarks mit is_locked Parameter")
    print("2. DELETE Protection für gesperrte Bookmarks")
    print("3. Status Type Consistency (is_locked ↔ status_type)")
    print("4. Bestehende Endpunkte Kompatibilität")
    print("=" * 80)
    
    tester = GesperrtFeaturesBackendTester()
    
    # Test sequence for Gesperrt features
    test_results = {}
    
    print("\n📋 Phase 1: Bookmark Creation mit is_locked Parameter")
    test_results['create_locked_basic'] = tester.test_create_locked_bookmark_basic()
    test_results['create_locked_status'] = tester.test_create_locked_bookmark_status_type()
    test_results['create_combinations'] = tester.test_create_bookmark_combinations()
    
    print("\n📋 Phase 2: DELETE Protection für gesperrte Bookmarks")
    test_results['delete_protection'] = tester.test_delete_protection_locked_bookmark()
    test_results['delete_normal'] = tester.test_delete_normal_bookmark()
    
    print("\n📋 Phase 3: Bestehende Endpunkte Kompatibilität")
    test_results['get_compatibility'] = tester.test_get_bookmarks_compatibility()
    test_results['update_support'] = tester.test_update_bookmark_is_locked()
    
    print("\n📋 Phase 4: Statistiken Integration")
    test_results['statistics_locked'] = tester.test_statistics_locked_bookmarks()
    
    # Cleanup
    tester.cleanup_test_bookmarks()
    
    # Print final results
    print("\n" + "=" * 80)
    print(f"📊 FINAL RESULTS - Gesperrt Features Backend Testing")
    print(f"Tests Run: {tester.tests_run}")
    print(f"Tests Passed: {tester.tests_passed}")
    print(f"Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"Success Rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    # Detailed results for each test area
    print(f"\n🔒 GESPERRT FEATURES TEST RESULTS:")
    
    success_count = 0
    total_tests = len(test_results)
    
    for test_name, (success, _) in test_results.items():
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if success:
            success_count += 1
    
    print(f"\n📈 GESPERRT FEATURES SUMMARY:")
    print(f"Feature Tests Passed: {success_count}/{total_tests}")
    print(f"Feature Success Rate: {(success_count/total_tests)*100:.1f}%")
    
    # Critical assessment
    critical_tests = ['create_locked_basic', 'delete_protection', 'get_compatibility']
    critical_failures = [name for name in critical_tests if not test_results.get(name, (False, None))[0]]
    
    if critical_failures:
        print(f"\n❌ CRITICAL FAILURES: {', '.join(critical_failures)}")
        print("   These failures indicate core Gesperrt functionality is not working!")
    else:
        print(f"\n🎉 ALL CRITICAL GESPERRT FEATURES WORKING!")
    
    # Expected results summary
    print(f"\n🎯 ERWARTETE ERGEBNISSE CHECK:")
    create_locked_ok = test_results.get('create_locked_basic', (False, None))[0]
    delete_protection_ok = test_results.get('delete_protection', (False, None))[0]
    consistency_ok = test_results.get('create_locked_status', (False, None))[0]
    compatibility_ok = test_results.get('get_compatibility', (False, None))[0]
    
    print(f"✅ Gesperrte Bookmarks können erstellt werden: {'JA' if create_locked_ok else 'NEIN'}")
    print(f"✅ Löschschutz funktioniert mit deutscher Fehlermeldung: {'JA' if delete_protection_ok else 'NEIN'}")
    print(f"✅ Status-Konsistenz zwischen is_locked und status_type: {'JA' if consistency_ok else 'NEIN'}")
    print(f"✅ Keine Regression bei bestehenden Features: {'JA' if compatibility_ok else 'NEIN'}")
    
    if all([create_locked_ok, delete_protection_ok, consistency_ok, compatibility_ok]):
        print("\n🎉 ALLE ERWARTETEN ERGEBNISSE ERFÜLLT!")
        print("🔒 Gesperrt Features sind vollständig funktional!")
        return 0
    else:
        print(f"\n⚠️  Einige erwartete Ergebnisse nicht erfüllt. Details siehe oben.")
        return 1

if __name__ == "__main__":
    sys.exit(main())