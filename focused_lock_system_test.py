#!/usr/bin/env python3
"""
Focused Lock System Test for FavOrg V2.3.0
Tests specifically the new lock system features
"""

import requests
import sys
import json
from datetime import datetime

class LockSystemTester:
    def __init__(self, base_url="https://bookmark-central.preview.emergentagent.com"):
        self.base_url = base_url
        self.test_bookmark_id = None

    def log(self, message, level="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def test_create_bookmark_for_lock_test(self):
        """Create a bookmark specifically for lock testing"""
        self.log("📝 Creating bookmark for lock system testing...")
        
        bookmark_data = {
            "title": "Lock Test Bookmark V2.3.0",
            "url": "https://example.com/lock-test-v2-3-0",
            "category": "Testing"
        }
        
        try:
            response = requests.post(
                f"{self.base_url}/api/bookmarks",
                json=bookmark_data,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                self.test_bookmark_id = data.get('id')
                self.log(f"✅ Test bookmark created successfully")
                self.log(f"   ID: {self.test_bookmark_id}")
                self.log(f"   Title: {data.get('title')}")
                self.log(f"   Initial is_locked: {data.get('is_locked', 'Not present')}")
                return True
            else:
                self.log(f"❌ Failed to create bookmark: {response.status_code}")
                self.log(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error creating bookmark: {str(e)}")
            return False

    def test_lock_system_api(self):
        """Test the lock system API endpoints"""
        if not self.test_bookmark_id:
            self.log("❌ No test bookmark available")
            return False
            
        self.log("🔒 Testing Lock System API...")
        
        # Test 1: Lock the bookmark using is_locked parameter
        self.log("🔐 Step 1: Locking bookmark with is_locked=true...")
        try:
            response = requests.put(
                f"{self.base_url}/api/bookmarks/{self.test_bookmark_id}",
                json={"is_locked": True},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                is_locked = data.get('is_locked')
                status_type = data.get('status_type')
                
                self.log(f"✅ Lock API call successful")
                self.log(f"   is_locked: {is_locked}")
                self.log(f"   status_type: {status_type}")
                
                if is_locked == True:
                    self.log("✅ Bookmark successfully locked via is_locked parameter")
                else:
                    self.log("❌ is_locked parameter not set correctly")
                    return False
            else:
                self.log(f"❌ Lock API failed: {response.status_code}")
                self.log(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in lock API: {str(e)}")
            return False
        
        # Test 2: Unlock the bookmark
        self.log("🔓 Step 2: Unlocking bookmark with is_locked=false...")
        try:
            response = requests.put(
                f"{self.base_url}/api/bookmarks/{self.test_bookmark_id}",
                json={"is_locked": False},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                is_locked = data.get('is_locked')
                
                self.log(f"✅ Unlock API call successful")
                self.log(f"   is_locked: {is_locked}")
                
                if is_locked == False:
                    self.log("✅ Bookmark successfully unlocked")
                else:
                    self.log("❌ Bookmark not unlocked correctly")
                    return False
            else:
                self.log(f"❌ Unlock API failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in unlock API: {str(e)}")
            return False
        
        # Test 3: Set status_type to 'locked'
        self.log("🔒 Step 3: Setting status_type to 'locked'...")
        try:
            response = requests.put(
                f"{self.base_url}/api/bookmarks/{self.test_bookmark_id}",
                json={"status_type": "locked"},
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                status_type = data.get('status_type')
                
                self.log(f"✅ Status type API call successful")
                self.log(f"   status_type: {status_type}")
                
                if status_type == "locked":
                    self.log("✅ Status type successfully set to 'locked'")
                    return True
                else:
                    self.log("❌ Status type not set to 'locked' correctly")
                    return False
            else:
                self.log(f"❌ Status type API failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in status type API: {str(e)}")
            return False

    def test_statistics_locked_links(self):
        """Test that statistics include locked_links count"""
        self.log("📊 Testing statistics for locked_links field...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/statistics",
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                locked_links = data.get('locked_links')
                
                self.log(f"✅ Statistics API successful")
                self.log(f"   locked_links: {locked_links}")
                
                if 'locked_links' in data:
                    self.log("✅ locked_links field present in statistics")
                    if locked_links >= 1:  # We created at least one locked bookmark
                        self.log(f"✅ locked_links count is correct: {locked_links}")
                    else:
                        self.log(f"⚠️  locked_links count is {locked_links}, expected >= 1")
                    return True
                else:
                    self.log("❌ locked_links field missing from statistics")
                    return False
            else:
                self.log(f"❌ Statistics API failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error in statistics API: {str(e)}")
            return False

    def test_get_all_bookmarks_with_lock_status(self):
        """Test retrieving bookmarks and checking lock status"""
        self.log("📋 Testing bookmark retrieval with lock status...")
        
        try:
            response = requests.get(
                f"{self.base_url}/api/bookmarks",
                timeout=10
            )
            
            if response.status_code == 200:
                bookmarks = response.json()
                
                self.log(f"✅ Retrieved {len(bookmarks)} bookmarks")
                
                # Find our test bookmark
                test_bookmark = None
                locked_bookmarks = []
                
                for bookmark in bookmarks:
                    if bookmark.get('id') == self.test_bookmark_id:
                        test_bookmark = bookmark
                    
                    if bookmark.get('is_locked') == True or bookmark.get('status_type') == 'locked':
                        locked_bookmarks.append(bookmark)
                
                self.log(f"📊 Found {len(locked_bookmarks)} locked bookmarks total")
                
                if test_bookmark:
                    self.log(f"✅ Found our test bookmark:")
                    self.log(f"   Title: {test_bookmark.get('title')}")
                    self.log(f"   is_locked: {test_bookmark.get('is_locked')}")
                    self.log(f"   status_type: {test_bookmark.get('status_type')}")
                    return True
                else:
                    self.log("❌ Could not find our test bookmark in results")
                    return False
            else:
                self.log(f"❌ Get bookmarks API failed: {response.status_code}")
                return False
                
        except Exception as e:
            self.log(f"❌ Error retrieving bookmarks: {str(e)}")
            return False

    def cleanup(self):
        """Clean up test bookmark"""
        if self.test_bookmark_id:
            self.log("🧹 Cleaning up test bookmark...")
            try:
                response = requests.delete(
                    f"{self.base_url}/api/bookmarks/{self.test_bookmark_id}",
                    timeout=10
                )
                if response.status_code == 200:
                    self.log("✅ Test bookmark deleted successfully")
                else:
                    self.log(f"⚠️  Could not delete test bookmark: {response.status_code}")
            except Exception as e:
                self.log(f"⚠️  Error deleting test bookmark: {str(e)}")

    def run_lock_system_tests(self):
        """Run all lock system tests"""
        self.log("🚀 Starting FavOrg V2.3.0 Lock System Tests...")
        self.log(f"🎯 Testing against: {self.base_url}")
        
        test_results = []
        
        # Create test bookmark
        test_results.append(("Create Test Bookmark", self.test_create_bookmark_for_lock_test()))
        
        # Test lock system APIs
        test_results.append(("Lock System API", self.test_lock_system_api()))
        
        # Test statistics
        test_results.append(("Statistics with locked_links", self.test_statistics_locked_links()))
        
        # Test bookmark retrieval
        test_results.append(("Get Bookmarks with Lock Status", self.test_get_all_bookmarks_with_lock_status()))
        
        # Cleanup
        self.cleanup()
        
        # Print summary
        self.log("=" * 60)
        self.log("🏁 LOCK SYSTEM TEST SUMMARY")
        self.log("=" * 60)
        
        passed_tests = 0
        for test_name, result in test_results:
            status = "✅ PASSED" if result else "❌ FAILED"
            self.log(f"{status} - {test_name}")
            if result:
                passed_tests += 1
        
        self.log("=" * 60)
        self.log(f"📊 LOCK SYSTEM RESULTS: {passed_tests}/{len(test_results)} tests passed")
        self.log(f"📈 Success Rate: {(passed_tests/len(test_results)*100):.1f}%")
        
        if passed_tests == len(test_results):
            self.log("🎉 ALL LOCK SYSTEM TESTS PASSED!")
            return True
        else:
            self.log("⚠️  Some lock system tests failed.")
            return False

def main():
    tester = LockSystemTester()
    success = tester.run_lock_system_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())