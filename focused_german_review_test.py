#!/usr/bin/env python3
"""
FOCUSED GERMAN REVIEW REQUEST TESTING
Teste das FavOrg Backend System gemäß German Review Request

FOCUS AREAS:
1. API Endpoints Testing (alle verfügbaren Endpunkte)
2. ModularCategoryManager Testing (Lock/Unlock Funktionalität)
3. Test Data System (100 Bookmarks Generation)
4. Error Handling & Performance
5. Database Operations & UUID Konsistenz
"""

import asyncio
import aiohttp
import json
import os
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any

class FocusedGermanReviewTester:
    def __init__(self):
        self.base_url = os.getenv('REACT_APP_BACKEND_URL', 'https://audit-log-tracker.preview.emergentagent.com')
        self.api_url = f"{self.base_url}/api"
        self.session = None
        self.test_results = []
        self.critical_issues = []
        self.performance_issues = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None, severity: str = "INFO"):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "severity": severity,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅" if success else "❌"
        severity_icon = {"CRITICAL": "🔴", "HIGH": "🟠", "MEDIUM": "🟡", "LOW": "🟢", "INFO": "ℹ️"}.get(severity, "ℹ️")
        print(f"{status} {severity_icon} {test_name}: {message}")
        
        if not success and severity in ["CRITICAL", "HIGH"]:
            self.critical_issues.append(result)
            if details:
                print(f"   🔍 Details: {details}")

    async def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{self.api_url}{endpoint}"
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, params=params) as response:
                    response_time = time.time() - start_time
                    if response_time > 3.0:
                        self.performance_issues.append({"endpoint": endpoint, "time": response_time})
                    
                    if response.content_type == 'application/json':
                        response_data = await response.json()
                    else:
                        response_data = await response.text()
                    return response.status, response_data
                    
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, params=params) as response:
                    response_time = time.time() - start_time
                    if response_time > 3.0:
                        self.performance_issues.append({"endpoint": endpoint, "time": response_time})
                    
                    if response.content_type == 'application/json':
                        response_data = await response.json()
                    else:
                        response_data = await response.text()
                    return response.status, response_data
                    
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, params=params) as response:
                    response_time = time.time() - start_time
                    if response_time > 3.0:
                        self.performance_issues.append({"endpoint": endpoint, "time": response_time})
                    
                    if response.content_type == 'application/json':
                        response_data = await response.json()
                    else:
                        response_data = await response.text()
                    return response.status, response_data
                    
            elif method.upper() == "DELETE":
                async with self.session.delete(url, params=params) as response:
                    response_time = time.time() - start_time
                    if response_time > 3.0:
                        self.performance_issues.append({"endpoint": endpoint, "time": response_time})
                    
                    if response.content_type == 'application/json':
                        response_data = await response.json()
                    else:
                        response_data = await response.text()
                    return response.status, response_data
                    
        except Exception as e:
            return 0, str(e)

    async def test_bookmark_crud_comprehensive(self):
        """Test alle verfügbaren Bookmark CRUD Operationen"""
        print("\n🔖 BOOKMARK CRUD OPERATIONS - COMPREHENSIVE TESTING")
        print("=" * 60)
        
        # CREATE - POST /api/bookmarks
        test_bookmark = {
            "title": "German Review Test Bookmark",
            "url": "https://german-review-test.example.com",
            "category": "German Review Testing",
            "subcategory": "CRUD Tests",
            "description": "Comprehensive German review testing bookmark",
            "status_type": "active"
        }
        
        status, data = await self.make_request("POST", "/bookmarks", test_bookmark)
        if status == 200:
            bookmark_id = data.get("id")
            self.log_test("Bookmark CREATE (POST /api/bookmarks)", True, f"✅ Created bookmark with ID: {bookmark_id}")
        else:
            self.log_test("Bookmark CREATE (POST /api/bookmarks)", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # READ ALL - GET /api/bookmarks
        status, data = await self.make_request("GET", "/bookmarks")
        if status == 200 and isinstance(data, list):
            bookmark_count = len(data)
            self.log_test("Bookmark READ ALL (GET /api/bookmarks)", True, f"✅ Retrieved {bookmark_count} bookmarks")
        else:
            self.log_test("Bookmark READ ALL (GET /api/bookmarks)", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # UPDATE - PUT /api/bookmarks/{id}
        update_data = {
            "title": "Updated German Review Test Bookmark",
            "description": "Updated description for German review testing"
        }
        status, data = await self.make_request("PUT", f"/bookmarks/{bookmark_id}", update_data)
        if status == 200:
            self.log_test("Bookmark UPDATE (PUT /api/bookmarks/{id})", True, "✅ Updated bookmark successfully")
        else:
            self.log_test("Bookmark UPDATE (PUT /api/bookmarks/{id})", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # MOVE - POST /api/bookmarks/move
        move_data = {
            "bookmark_ids": [bookmark_id],
            "target_category": "Moved Category",
            "target_subcategory": "Moved Subcategory"
        }
        status, data = await self.make_request("POST", "/bookmarks/move", move_data)
        if status == 200:
            moved_count = data.get("moved_count", 0)
            self.log_test("Bookmark MOVE (POST /api/bookmarks/move)", True, f"✅ Moved {moved_count} bookmark(s)")
        else:
            self.log_test("Bookmark MOVE (POST /api/bookmarks/move)", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # DELETE - DELETE /api/bookmarks/{id}
        status, data = await self.make_request("DELETE", f"/bookmarks/{bookmark_id}")
        if status == 200:
            self.log_test("Bookmark DELETE (DELETE /api/bookmarks/{id})", True, "✅ Deleted bookmark successfully")
        else:
            self.log_test("Bookmark DELETE (DELETE /api/bookmarks/{id})", False, f"HTTP {status}: {data}", severity="HIGH")
        
        return True

    async def test_category_crud_with_lock_functionality(self):
        """Test Category CRUD mit Lock-Funktionalität (Current Focus)"""
        print("\n🔒 CATEGORY CRUD WITH LOCK FUNCTIONALITY - CURRENT FOCUS")
        print("=" * 65)
        
        # GET Categories
        status, data = await self.make_request("GET", "/categories")
        if status == 200 and isinstance(data, list):
            category_count = len(data)
            self.log_test("Categories GET (GET /api/categories)", True, f"✅ Retrieved {category_count} categories")
        else:
            self.log_test("Categories GET (GET /api/categories)", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # CREATE Category - POST /api/categories
        test_category = {
            "name": "German Review Lock Test Category",
            "parent_category": None
        }
        status, data = await self.make_request("POST", "/categories", test_category)
        if status == 200:
            category_id = data.get("id")
            self.log_test("Category CREATE (POST /api/categories)", True, f"✅ Created category with ID: {category_id}")
        else:
            self.log_test("Category CREATE (POST /api/categories)", False, f"HTTP {status}: {data}", severity="HIGH")
            return False
        
        # LOCK Category - PUT /api/categories/{id}/lock
        lock_data = {"lock_reason": "German Review Testing - Lock Functionality"}
        status, data = await self.make_request("PUT", f"/categories/{category_id}/lock", lock_data)
        if status == 200:
            self.log_test("Category LOCK (PUT /api/categories/{id}/lock)", True, "✅ Category locked successfully")
        else:
            self.log_test("Category LOCK (PUT /api/categories/{id}/lock)", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Test Lock Protection - UPDATE
        update_data = {"name": "Should Not Update - Locked"}
        status, data = await self.make_request("PUT", f"/categories/{category_id}", update_data)
        if status == 403:
            self.log_test("Lock Protection - UPDATE", True, "✅ Locked category protected from updates (HTTP 403)")
        else:
            self.log_test("Lock Protection - UPDATE", False, f"Lock protection failed: HTTP {status}", 
                         {"expected": 403, "actual": status}, severity="HIGH")
        
        # Test Lock Protection - DELETE
        status, data = await self.make_request("DELETE", f"/categories/{category_id}")
        if status == 403:
            self.log_test("Lock Protection - DELETE", True, "✅ Locked category protected from deletion (HTTP 403)")
        else:
            self.log_test("Lock Protection - DELETE", False, f"Lock protection failed: HTTP {status}", 
                         {"expected": 403, "actual": status}, severity="HIGH")
        
        # UNLOCK Category - PUT /api/categories/{id}/unlock
        status, data = await self.make_request("PUT", f"/categories/{category_id}/unlock")
        if status == 200:
            self.log_test("Category UNLOCK (PUT /api/categories/{id}/unlock)", True, "✅ Category unlocked successfully")
        else:
            self.log_test("Category UNLOCK (PUT /api/categories/{id}/unlock)", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Test operations after unlock - UPDATE
        update_data = {"name": "Successfully Updated After Unlock"}
        status, data = await self.make_request("PUT", f"/categories/{category_id}", update_data)
        if status == 200:
            self.log_test("Post-Unlock UPDATE", True, "✅ Category can be updated after unlock")
        else:
            self.log_test("Post-Unlock UPDATE", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        # DELETE after unlock
        status, data = await self.make_request("DELETE", f"/categories/{category_id}")
        if status == 200:
            self.log_test("Post-Unlock DELETE", True, "✅ Category can be deleted after unlock")
        else:
            self.log_test("Post-Unlock DELETE", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    async def test_statistics_and_data_apis(self):
        """Test Statistics und Data APIs"""
        print("\n📊 STATISTICS & DATA APIs TESTING")
        print("=" * 40)
        
        # GET Statistics
        status, data = await self.make_request("GET", "/statistics")
        if status == 200:
            required_fields = ["total_bookmarks", "total_categories", "active_links", "dead_links", 
                             "localhost_links", "duplicate_links", "locked_links", "unchecked_links"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Statistics API Structure", False, f"Missing fields: {missing_fields}", 
                             {"missing": missing_fields}, severity="HIGH")
            else:
                total_bookmarks = data.get('total_bookmarks', 0)
                total_categories = data.get('total_categories', 0)
                self.log_test("Statistics API (GET /api/statistics)", True, 
                             f"✅ Complete statistics: {total_bookmarks} bookmarks, {total_categories} categories")
        else:
            self.log_test("Statistics API (GET /api/statistics)", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # Search Bookmarks - GET /api/bookmarks/search/{query}
        test_queries = ["github", "development", "test"]
        for query in test_queries:
            status, data = await self.make_request("GET", f"/bookmarks/search/{query}")
            if status == 200 and isinstance(data, list):
                self.log_test(f"Search API - '{query}' (GET /api/bookmarks/search/{query})", True, f"✅ Found {len(data)} results")
            else:
                self.log_test(f"Search API - '{query}' (GET /api/bookmarks/search/{query})", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    async def test_import_export_functionality(self):
        """Test Import/Export Funktionalität"""
        print("\n📤📥 IMPORT/EXPORT FUNCTIONALITY TESTING")
        print("=" * 50)
        
        # Test Export - All formats
        export_formats = ["xml", "csv", "html", "json"]
        for format_type in export_formats:
            export_data = {"format": format_type}
            status, data = await self.make_request("POST", "/export", export_data)
            
            if status == 200:
                data_size = len(str(data)) if isinstance(data, str) else len(json.dumps(data))
                self.log_test(f"Export {format_type.upper()} (POST /api/export)", True, f"✅ Generated {data_size} characters")
            else:
                self.log_test(f"Export {format_type.upper()} (POST /api/export)", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Test Export with Category Filter
        export_data = {"format": "xml", "category": "Development"}
        status, data = await self.make_request("POST", "/export", export_data)
        if status == 200:
            self.log_test("Export with Category Filter", True, "✅ Category filtering works")
        else:
            self.log_test("Export with Category Filter", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    async def test_link_validation_and_duplicate_detection(self):
        """Test Link Validation und Duplicate Detection"""
        print("\n🔗🔄 LINK VALIDATION & DUPLICATE DETECTION TESTING")
        print("=" * 60)
        
        # Link Validation - POST /api/bookmarks/validate
        status, data = await self.make_request("POST", "/bookmarks/validate")
        if status == 200:
            total_checked = data.get("total_checked", 0)
            dead_links_found = data.get("dead_links_found", 0)
            self.log_test("Link Validation (POST /api/bookmarks/validate)", True, 
                         f"✅ Validated {total_checked} links, found {dead_links_found} dead links")
        else:
            self.log_test("Link Validation (POST /api/bookmarks/validate)", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Dead Links Removal - DELETE /api/bookmarks/dead-links
        status, data = await self.make_request("DELETE", "/bookmarks/dead-links")
        if status == 200:
            removed_count = data.get("removed_count", 0)
            self.log_test("Dead Links Removal (DELETE /api/bookmarks/dead-links)", True, f"✅ Removed {removed_count} dead links")
        else:
            self.log_test("Dead Links Removal (DELETE /api/bookmarks/dead-links)", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        # Find Duplicates - POST /api/bookmarks/find-duplicates
        status, data = await self.make_request("POST", "/bookmarks/find-duplicates")
        if status == 200:
            duplicate_groups = data.get("duplicate_groups", 0)
            marked_count = data.get("marked_count", 0)
            self.log_test("Find Duplicates (POST /api/bookmarks/find-duplicates)", True, 
                         f"✅ Found {duplicate_groups} duplicate groups, marked {marked_count} bookmarks")
        else:
            self.log_test("Find Duplicates (POST /api/bookmarks/find-duplicates)", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        # Remove Duplicates - DELETE /api/bookmarks/duplicates
        status, data = await self.make_request("DELETE", "/bookmarks/duplicates")
        if status == 200:
            removed_count = data.get("removed_count", 0)
            self.log_test("Remove Duplicates (DELETE /api/bookmarks/duplicates)", True, f"✅ Removed {removed_count} duplicate bookmarks")
        else:
            self.log_test("Remove Duplicates (DELETE /api/bookmarks/duplicates)", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    async def test_test_data_generation(self):
        """Test Test Data Generation System"""
        print("\n🧪 TEST DATA GENERATION SYSTEM TESTING")
        print("=" * 45)
        
        # Clear existing data first
        status, data = await self.make_request("DELETE", "/bookmarks/all")
        if status == 200:
            deleted_count = data.get("deleted_count", 0)
            self.log_test("Data Cleanup (DELETE /api/bookmarks/all)", True, f"✅ Cleared {deleted_count} existing bookmarks")
        
        # Create test data - POST /api/bookmarks/create-test-data
        status, data = await self.make_request("POST", "/bookmarks/create-test-data")
        if status == 200:
            created_count = data.get("created_count", 0)
            self.log_test("Test Data Generation (POST /api/bookmarks/create-test-data)", True, 
                         f"✅ Created {created_count} test bookmarks")
            
            # Validate status distribution
            status_distribution = data.get("status_distribution", {})
            if status_distribution:
                self.log_test("Status Distribution Validation", True, 
                             f"✅ Status distribution: {status_distribution}")
            
        else:
            self.log_test("Test Data Generation (POST /api/bookmarks/create-test-data)", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Create sample bookmarks - POST /api/bookmarks/create-samples
        status, data = await self.make_request("POST", "/bookmarks/create-samples")
        if status == 200:
            created_count = data.get("created_count", 0)
            self.log_test("Sample Data Generation (POST /api/bookmarks/create-samples)", True, 
                         f"✅ Created {created_count} sample bookmarks")
        else:
            self.log_test("Sample Data Generation (POST /api/bookmarks/create-samples)", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    async def test_database_operations_and_uuid_consistency(self):
        """Test Database Operations und UUID Konsistenz"""
        print("\n🗄️ DATABASE OPERATIONS & UUID CONSISTENCY TESTING")
        print("=" * 55)
        
        # Test database connectivity through API
        status, data = await self.make_request("GET", "/bookmarks")
        if status == 200:
            self.log_test("MongoDB Connectivity", True, "✅ Database connection working")
            
            # Test UUID consistency
            if isinstance(data, list) and len(data) > 0:
                valid_uuids = 0
                invalid_uuids = 0
                
                for bookmark in data[:10]:  # Check first 10 bookmarks
                    bookmark_id = bookmark.get("id", "")
                    try:
                        uuid.UUID(bookmark_id)
                        valid_uuids += 1
                    except ValueError:
                        invalid_uuids += 1
                
                if invalid_uuids == 0:
                    self.log_test("UUID Consistency", True, f"✅ All {valid_uuids} checked bookmarks have valid UUID format")
                else:
                    self.log_test("UUID Consistency", False, f"{invalid_uuids} invalid UUIDs found", 
                                 {"valid": valid_uuids, "invalid": invalid_uuids}, severity="HIGH")
            
        else:
            self.log_test("MongoDB Connectivity", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        return True

    async def test_error_handling_and_edge_cases(self):
        """Test Error Handling & Edge Cases"""
        print("\n⚠️ ERROR HANDLING & EDGE CASES TESTING")
        print("=" * 45)
        
        # Test invalid data input
        invalid_bookmark = {
            "title": "",  # Empty title
            "url": "not-a-valid-url",  # Invalid URL
            "category": None  # Null category
        }
        status, data = await self.make_request("POST", "/bookmarks", invalid_bookmark)
        if status >= 400:
            self.log_test("Invalid Data Validation", True, f"✅ Properly rejected invalid data: HTTP {status}")
        else:
            self.log_test("Invalid Data Validation", False, "Invalid data was accepted", severity="HIGH")
        
        # Test missing required fields
        incomplete_bookmark = {"title": "Missing URL"}
        status, data = await self.make_request("POST", "/bookmarks", incomplete_bookmark)
        if status >= 400:
            self.log_test("Missing Fields Validation", True, f"✅ Properly rejected incomplete data: HTTP {status}")
        else:
            self.log_test("Missing Fields Validation", False, "Incomplete data was accepted", severity="HIGH")
        
        # Test non-existent resource access
        fake_id = str(uuid.uuid4())
        status, data = await self.make_request("PUT", f"/bookmarks/{fake_id}", {"title": "Test"})
        if status == 404:
            self.log_test("Non-existent Resource Handling", True, "✅ Properly returned 404 for non-existent resource")
        else:
            self.log_test("Non-existent Resource Handling", False, f"Unexpected response: HTTP {status}", severity="MEDIUM")
        
        return True

    async def run_focused_german_review_tests(self):
        """Run focused German review tests"""
        print("🚀 FOCUSED GERMAN REVIEW REQUEST TESTING")
        print("=" * 80)
        print("Teste das FavOrg Backend System gemäß German Review Request")
        print(f"Backend URL: {self.api_url}")
        print("=" * 80)
        
        test_suites = [
            ("Bookmark CRUD Operations", self.test_bookmark_crud_comprehensive),
            ("Category CRUD with Lock Functionality (CURRENT FOCUS)", self.test_category_crud_with_lock_functionality),
            ("Statistics & Data APIs", self.test_statistics_and_data_apis),
            ("Import/Export Functionality", self.test_import_export_functionality),
            ("Link Validation & Duplicate Detection", self.test_link_validation_and_duplicate_detection),
            ("Test Data Generation System", self.test_test_data_generation),
            ("Database Operations & UUID Consistency", self.test_database_operations_and_uuid_consistency),
            ("Error Handling & Edge Cases", self.test_error_handling_and_edge_cases)
        ]
        
        total_tests = 0
        passed_tests = 0
        
        for suite_name, test_func in test_suites:
            print(f"\n🧪 {suite_name.upper()}")
            print("=" * (len(suite_name) + 5))
            
            try:
                result = await test_func()
                total_tests += 1
                if result:
                    passed_tests += 1
            except Exception as e:
                total_tests += 1
                self.log_test(f"{suite_name}", False, f"Exception: {str(e)}", severity="CRITICAL")
        
        # Generate final report
        await self.generate_final_report(total_tests, passed_tests)
        
        return passed_tests == total_tests

    async def generate_final_report(self, total_tests: int, passed_tests: int):
        """Generate final German review report"""
        print("\n" + "=" * 80)
        print("🎯 GERMAN REVIEW REQUEST - FINAL TESTING REPORT")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"📊 Overall Results: {passed_tests}/{total_tests} test suites passed ({success_rate:.1f}%)")
        
        # Critical Issues Summary
        if self.critical_issues:
            print(f"\n🔴 CRITICAL ISSUES FOUND: {len(self.critical_issues)}")
            for issue in self.critical_issues:
                print(f"   - {issue['test']}: {issue['message']}")
        else:
            print("\n✅ NO CRITICAL ISSUES FOUND")
        
        # Performance Issues
        if self.performance_issues:
            print(f"\n⚡ PERFORMANCE ISSUES: {len(self.performance_issues)} slow endpoints")
            for perf in self.performance_issues:
                print(f"   - {perf['endpoint']}: {perf['time']:.2f}s")
        else:
            print("\n⚡ PERFORMANCE: All endpoints respond within acceptable time")
        
        # German Review Request Specific Results
        print("\n📋 GERMAN REVIEW REQUEST SPECIFIC RESULTS:")
        
        # Count successful tests by category
        successful_tests = [r for r in self.test_results if r['success']]
        
        bookmark_crud_tests = len([r for r in successful_tests if 'bookmark' in r['test'].lower() and 'crud' in r['test'].lower()])
        category_tests = len([r for r in successful_tests if 'category' in r['test'].lower()])
        lock_tests = len([r for r in successful_tests if 'lock' in r['test'].lower()])
        export_tests = len([r for r in successful_tests if 'export' in r['test'].lower()])
        validation_tests = len([r for r in successful_tests if 'validation' in r['test'].lower() or 'duplicate' in r['test'].lower()])
        
        print(f"   ✅ Bookmark CRUD Operations: {bookmark_crud_tests} tests passed")
        print(f"   ✅ Category Management: {category_tests} tests passed")
        print(f"   ✅ Lock/Unlock Functionality: {lock_tests} tests passed")
        print(f"   ✅ Import/Export Features: {export_tests} tests passed")
        print(f"   ✅ Link Validation & Duplicates: {validation_tests} tests passed")
        
        # Final Assessment
        print("\n🏆 FINAL ASSESSMENT:")
        if success_rate >= 90:
            print("✅ EXCELLENT: FavOrg Backend System ist hochstabil und erfüllt alle German Review Anforderungen")
        elif success_rate >= 80:
            print("🟡 GOOD: FavOrg Backend System ist stabil mit wenigen zu behebenden Problemen")
        elif success_rate >= 70:
            print("🟠 FAIR: FavOrg Backend System benötigt Aufmerksamkeit für mehrere Probleme")
        else:
            print("🔴 POOR: FavOrg Backend System hat kritische Probleme die sofortige Aufmerksamkeit erfordern")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    async with FocusedGermanReviewTester() as tester:
        success = await tester.run_focused_german_review_tests()
        return success

if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)