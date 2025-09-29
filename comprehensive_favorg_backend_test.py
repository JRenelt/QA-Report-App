#!/usr/bin/env python3
"""
COMPREHENSIVE FAVORG BACKEND SYSTEM TESTING
German Review Request: Teste das FavOrg Backend System umfassend auf "Herz und Nieren"

TESTING SCOPE:
1. API Endpoints Testing (CRUD Operations für Bookmarks, Categories, Statistics, Import/Export)
2. Database Operations (MongoDB Verbindung, UUID Konsistenz, Datenintegrität)
3. ModularCategoryManager Testing (Lock/Unlock Funktionalität, Category CRUD)
4. Error Handling & Edge Cases (Invalid Data, Missing Fields, Duplicate Handling)
5. Test Data System (100 Bookmarks Generation mit exakten Status Counts)
6. Performance Testing (Response Times, Large Dataset Performance)
7. Security Testing (Input Validation, Sanitization)
"""

import asyncio
import aiohttp
import json
import os
import time
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional

class ComprehensiveFavOrgBackendTester:
    def __init__(self):
        # Use backend URL from environment
        self.base_url = os.getenv('REACT_APP_BACKEND_URL', 'https://test-suite-portal.preview.emergentagent.com')
        self.api_url = f"{self.base_url}/api"
        self.session = None
        
        # Test results tracking
        self.test_results = []
        self.performance_metrics = []
        self.security_issues = []
        self.bugs_found = []
        
        # Expected test data counts for comprehensive testing
        self.expected_test_data = {
            "total_bookmarks": 100,
            "main_categories": 11,
            "subcategories": 49,
            "status_distribution": {
                "active": 54,
                "dead": 9,
                "locked": 14,
                "localhost": 8,
                "duplicate": 6,
                "timeout": 5,
                "unchecked": 4
            }
        }
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None, severity: str = "INFO"):
        """Log test result with severity levels"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "severity": severity,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        # Color coding for severity
        severity_icons = {
            "CRITICAL": "🔴",
            "HIGH": "🟠", 
            "MEDIUM": "🟡",
            "LOW": "🟢",
            "INFO": "ℹ️"
        }
        
        status = "✅" if success else "❌"
        severity_icon = severity_icons.get(severity, "ℹ️")
        print(f"{status} {severity_icon} {test_name}: {message}")
        
        if details and severity in ["CRITICAL", "HIGH"]:
            print(f"   🔍 Details: {details}")
            
        # Track bugs and security issues
        if not success:
            if severity == "CRITICAL":
                self.bugs_found.append(result)
            elif "security" in test_name.lower() or "validation" in test_name.lower():
                self.security_issues.append(result)
    
    def log_performance(self, endpoint: str, response_time: float, status_code: int, data_size: int = 0):
        """Log performance metrics"""
        metric = {
            "endpoint": endpoint,
            "response_time": response_time,
            "status_code": status_code,
            "data_size": data_size,
            "timestamp": datetime.now().isoformat()
        }
        self.performance_metrics.append(metric)
        
        # Performance thresholds
        if response_time > 5.0:
            self.log_test(f"Performance - {endpoint}", False, f"Slow response: {response_time:.2f}s", 
                         {"threshold": "5.0s", "actual": f"{response_time:.2f}s"}, "HIGH")
        elif response_time > 2.0:
            self.log_test(f"Performance - {endpoint}", True, f"Acceptable response: {response_time:.2f}s", 
                         {"threshold": "2.0s", "actual": f"{response_time:.2f}s"}, "MEDIUM")

    async def make_request(self, method: str, endpoint: str, data: Dict = None, params: Dict = None) -> tuple:
        """Make HTTP request with performance tracking"""
        url = f"{self.api_url}{endpoint}"
        start_time = time.time()
        
        try:
            if method.upper() == "GET":
                async with self.session.get(url, params=params) as response:
                    response_time = time.time() - start_time
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    self.log_performance(endpoint, response_time, response.status, len(str(response_data)))
                    return response.status, response_data
                    
            elif method.upper() == "POST":
                async with self.session.post(url, json=data, params=params) as response:
                    response_time = time.time() - start_time
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    self.log_performance(endpoint, response_time, response.status, len(str(response_data)))
                    return response.status, response_data
                    
            elif method.upper() == "PUT":
                async with self.session.put(url, json=data, params=params) as response:
                    response_time = time.time() - start_time
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    self.log_performance(endpoint, response_time, response.status, len(str(response_data)))
                    return response.status, response_data
                    
            elif method.upper() == "DELETE":
                async with self.session.delete(url, params=params) as response:
                    response_time = time.time() - start_time
                    response_data = await response.json() if response.content_type == 'application/json' else await response.text()
                    self.log_performance(endpoint, response_time, response.status, len(str(response_data)))
                    return response.status, response_data
                    
        except Exception as e:
            response_time = time.time() - start_time
            self.log_performance(endpoint, response_time, 0, 0)
            return 0, str(e)

    # ==================== 1. API ENDPOINTS TESTING ====================
    
    async def test_bookmark_crud_operations(self):
        """Test alle CRUD Operationen für Bookmarks (/api/bookmarks/*)"""
        print("\n🔖 BOOKMARK CRUD OPERATIONS TESTING")
        print("=" * 50)
        
        # CREATE - POST /api/bookmarks
        test_bookmark = {
            "title": "Test Bookmark CRUD",
            "url": "https://test-crud.example.com",
            "category": "Testing",
            "subcategory": "CRUD Tests",
            "description": "Comprehensive CRUD testing bookmark",
            "status_type": "active"
        }
        
        status, data = await self.make_request("POST", "/bookmarks", test_bookmark)
        if status == 200:
            bookmark_id = data.get("id")
            self.log_test("Bookmark CREATE", True, f"Created bookmark with ID: {bookmark_id}")
        else:
            self.log_test("Bookmark CREATE", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # READ - GET /api/bookmarks
        status, data = await self.make_request("GET", "/bookmarks")
        if status == 200 and isinstance(data, list):
            bookmark_count = len(data)
            self.log_test("Bookmark READ ALL", True, f"Retrieved {bookmark_count} bookmarks")
        else:
            self.log_test("Bookmark READ ALL", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # READ SINGLE - GET /api/bookmarks/{id}
        status, data = await self.make_request("GET", f"/bookmarks/{bookmark_id}")
        if status == 200:
            self.log_test("Bookmark READ SINGLE", True, f"Retrieved bookmark: {data.get('title')}")
        else:
            self.log_test("Bookmark READ SINGLE", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # UPDATE - PUT /api/bookmarks/{id}
        update_data = {
            "title": "Updated Test Bookmark CRUD",
            "description": "Updated description for CRUD testing"
        }
        status, data = await self.make_request("PUT", f"/bookmarks/{bookmark_id}", update_data)
        if status == 200:
            self.log_test("Bookmark UPDATE", True, f"Updated bookmark successfully")
        else:
            self.log_test("Bookmark UPDATE", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # MOVE - POST /api/bookmarks/move
        move_data = {
            "bookmark_ids": [bookmark_id],
            "target_category": "Moved Category",
            "target_subcategory": "Moved Subcategory"
        }
        status, data = await self.make_request("POST", "/bookmarks/move", move_data)
        if status == 200:
            moved_count = data.get("moved_count", 0)
            self.log_test("Bookmark MOVE", True, f"Moved {moved_count} bookmark(s)")
        else:
            self.log_test("Bookmark MOVE", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # DELETE - DELETE /api/bookmarks/{id}
        status, data = await self.make_request("DELETE", f"/bookmarks/{bookmark_id}")
        if status == 200:
            self.log_test("Bookmark DELETE", True, f"Deleted bookmark successfully")
        else:
            self.log_test("Bookmark DELETE", False, f"HTTP {status}: {data}", severity="HIGH")
        
        return True

    async def test_category_management_apis(self):
        """Test Category Management APIs (/api/categories/*)"""
        print("\n📁 CATEGORY MANAGEMENT APIs TESTING")
        print("=" * 45)
        
        # GET Categories
        status, data = await self.make_request("GET", "/categories")
        if status == 200 and isinstance(data, list):
            category_count = len(data)
            self.log_test("Categories GET", True, f"Retrieved {category_count} categories")
        else:
            self.log_test("Categories GET", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # CREATE Category - POST /api/categories
        test_category = {
            "name": "Test Category CRUD",
            "parent_category": None
        }
        status, data = await self.make_request("POST", "/categories", test_category)
        if status == 200:
            category_id = data.get("id")
            self.log_test("Category CREATE", True, f"Created category with ID: {category_id}")
        else:
            self.log_test("Category CREATE", False, f"HTTP {status}: {data}", severity="HIGH")
            return False
        
        # UPDATE Category - PUT /api/categories/{id}
        update_data = {"name": "Updated Test Category CRUD"}
        status, data = await self.make_request("PUT", f"/categories/{category_id}", update_data)
        if status == 200:
            self.log_test("Category UPDATE", True, "Updated category successfully")
        else:
            self.log_test("Category UPDATE", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # DELETE Category - DELETE /api/categories/{id}
        status, data = await self.make_request("DELETE", f"/categories/{category_id}")
        if status == 200:
            self.log_test("Category DELETE", True, "Deleted category successfully")
        else:
            self.log_test("Category DELETE", False, f"HTTP {status}: {data}", severity="HIGH")
        
        return True

    async def test_statistics_and_data_apis(self):
        """Test Statistics und Data APIs (/api/stats/*, /api/data/*)"""
        print("\n📊 STATISTICS & DATA APIs TESTING")
        print("=" * 40)
        
        # GET Statistics
        status, data = await self.make_request("GET", "/statistics")
        if status == 200:
            required_fields = ["total_bookmarks", "total_categories", "active_links", "dead_links"]
            missing_fields = [field for field in required_fields if field not in data]
            
            if missing_fields:
                self.log_test("Statistics API Structure", False, f"Missing fields: {missing_fields}", severity="HIGH")
            else:
                self.log_test("Statistics API", True, f"Retrieved complete statistics: {data.get('total_bookmarks')} bookmarks")
        else:
            self.log_test("Statistics API", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # Search Bookmarks - GET /api/bookmarks/search/{query}
        test_queries = ["github", "development", "test"]
        for query in test_queries:
            status, data = await self.make_request("GET", f"/bookmarks/search/{query}")
            if status == 200 and isinstance(data, list):
                self.log_test(f"Search API - '{query}'", True, f"Found {len(data)} results")
            else:
                self.log_test(f"Search API - '{query}'", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    async def test_import_export_functionality(self):
        """Test Import/Export Funktionalität (/api/bookmarks/import, /api/bookmarks/export)"""
        print("\n📤📥 IMPORT/EXPORT FUNCTIONALITY TESTING")
        print("=" * 50)
        
        # Test Export - All formats
        export_formats = ["xml", "csv", "html", "json"]
        for format_type in export_formats:
            export_data = {"format": format_type}
            status, data = await self.make_request("POST", "/export", export_data)
            
            if status == 200:
                data_size = len(str(data)) if isinstance(data, str) else len(json.dumps(data))
                self.log_test(f"Export {format_type.upper()}", True, f"Generated {data_size} characters")
            else:
                self.log_test(f"Export {format_type.upper()}", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Test Export with Category Filter
        export_data = {"format": "xml", "category": "Development"}
        status, data = await self.make_request("POST", "/export", export_data)
        if status == 200:
            self.log_test("Export with Category Filter", True, "Category filtering works")
        else:
            self.log_test("Export with Category Filter", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    async def test_comprehensive_test_data_generation(self):
        """Test Test Data Generation (/api/bookmarks/create-comprehensive-test-data)"""
        print("\n🧪 COMPREHENSIVE TEST DATA GENERATION")
        print("=" * 45)
        
        # Clear existing data first
        status, data = await self.make_request("DELETE", "/bookmarks/all")
        if status == 200:
            self.log_test("Data Cleanup", True, f"Cleared {data.get('deleted_count', 0)} existing bookmarks")
        
        # Create comprehensive test data
        status, data = await self.make_request("POST", "/bookmarks/create-comprehensive-test-data")
        if status == 200:
            created_count = data.get("created_count", 0)
            
            if created_count == self.expected_test_data["total_bookmarks"]:
                self.log_test("Test Data Generation", True, f"Created exactly {created_count} bookmarks")
                
                # Validate status distribution
                details = data.get("details", {})
                status_distribution = data.get("status_distribution", {})
                
                all_counts_correct = True
                for status_type, expected_count in self.expected_test_data["status_distribution"].items():
                    actual_count = status_distribution.get(status_type, 0)
                    if actual_count != expected_count:
                        self.log_test(f"Status Distribution - {status_type}", False, 
                                    f"Expected {expected_count}, got {actual_count}", severity="HIGH")
                        all_counts_correct = False
                    else:
                        self.log_test(f"Status Distribution - {status_type}", True, f"Correct: {actual_count}")
                
                if all_counts_correct:
                    self.log_test("Status Distribution Validation", True, "All status counts are exact")
                
            else:
                self.log_test("Test Data Generation", False, 
                            f"Expected {self.expected_test_data['total_bookmarks']}, got {created_count}", severity="HIGH")
        else:
            self.log_test("Test Data Generation", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        return True

    # ==================== 2. DATABASE OPERATIONS TESTING ====================
    
    async def test_database_operations(self):
        """Test MongoDB Verbindung und CRUD Operationen"""
        print("\n🗄️ DATABASE OPERATIONS TESTING")
        print("=" * 35)
        
        # Test database connectivity through API
        status, data = await self.make_request("GET", "/bookmarks")
        if status == 200:
            self.log_test("MongoDB Connectivity", True, "Database connection working")
        else:
            self.log_test("MongoDB Connectivity", False, f"HTTP {status}: {data}", severity="CRITICAL")
            return False
        
        # Test UUID consistency
        if isinstance(data, list) and len(data) > 0:
            bookmark = data[0]
            bookmark_id = bookmark.get("id", "")
            
            # Check if ID is UUID format
            try:
                uuid.UUID(bookmark_id)
                self.log_test("UUID Consistency", True, f"Valid UUID format: {bookmark_id[:8]}...")
            except ValueError:
                self.log_test("UUID Consistency", False, f"Invalid UUID format: {bookmark_id}", severity="HIGH")
        
        # Test bulk operations performance
        bulk_test_data = [
            {
                "title": f"Bulk Test Bookmark {i}",
                "url": f"https://bulk-test-{i}.example.com",
                "category": "Bulk Testing",
                "status_type": "active"
            }
            for i in range(10)
        ]
        
        start_time = time.time()
        created_count = 0
        for bookmark_data in bulk_test_data:
            status, data = await self.make_request("POST", "/bookmarks", bookmark_data)
            if status == 200:
                created_count += 1
        
        bulk_time = time.time() - start_time
        
        if created_count == 10:
            self.log_test("Bulk Operations", True, f"Created {created_count} bookmarks in {bulk_time:.2f}s")
        else:
            self.log_test("Bulk Operations", False, f"Only created {created_count}/10 bookmarks", severity="MEDIUM")
        
        return True

    # ==================== 3. MODULAR CATEGORY MANAGER TESTING ====================
    
    async def test_modular_category_manager(self):
        """Test ModularCategoryManager Testing (Lock/Unlock Funktionalität)"""
        print("\n🔒 MODULAR CATEGORY MANAGER TESTING")
        print("=" * 45)
        
        # Create test category for lock testing
        test_category = {"name": "Lock Test Category"}
        status, data = await self.make_request("POST", "/categories", test_category)
        if status != 200:
            self.log_test("Category Creation for Lock Test", False, f"HTTP {status}: {data}", severity="HIGH")
            return False
        
        category_id = data.get("id")
        
        # Test LOCK functionality - PUT /api/categories/{id}/lock
        lock_data = {"lock_reason": "Testing lock functionality"}
        status, data = await self.make_request("PUT", f"/categories/{category_id}/lock", lock_data)
        if status == 200:
            self.log_test("Category LOCK", True, "Category locked successfully")
        else:
            self.log_test("Category LOCK", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Test protected operations on locked category
        update_data = {"name": "Should Not Update"}
        status, data = await self.make_request("PUT", f"/categories/{category_id}", update_data)
        if status == 403:
            self.log_test("Lock Protection - UPDATE", True, "Locked category protected from updates")
        else:
            self.log_test("Lock Protection - UPDATE", False, f"Lock protection failed: HTTP {status}", severity="HIGH")
        
        # Test DELETE protection
        status, data = await self.make_request("DELETE", f"/categories/{category_id}")
        if status == 403:
            self.log_test("Lock Protection - DELETE", True, "Locked category protected from deletion")
        else:
            self.log_test("Lock Protection - DELETE", False, f"Lock protection failed: HTTP {status}", severity="HIGH")
        
        # Test UNLOCK functionality - PUT /api/categories/{id}/unlock
        status, data = await self.make_request("PUT", f"/categories/{category_id}/unlock")
        if status == 200:
            self.log_test("Category UNLOCK", True, "Category unlocked successfully")
        else:
            self.log_test("Category UNLOCK", False, f"HTTP {status}: {data}", severity="HIGH")
        
        # Test operations after unlock
        update_data = {"name": "Successfully Updated After Unlock"}
        status, data = await self.make_request("PUT", f"/categories/{category_id}", update_data)
        if status == 200:
            self.log_test("Post-Unlock UPDATE", True, "Category can be updated after unlock")
        else:
            self.log_test("Post-Unlock UPDATE", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        # Cleanup
        await self.make_request("DELETE", f"/categories/{category_id}")
        
        return True

    # ==================== 4. ERROR HANDLING & EDGE CASES ====================
    
    async def test_error_handling_edge_cases(self):
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
            self.log_test("Invalid Data Validation", True, f"Properly rejected invalid data: HTTP {status}")
        else:
            self.log_test("Invalid Data Validation", False, "Invalid data was accepted", severity="HIGH")
        
        # Test missing required fields
        incomplete_bookmark = {"title": "Missing URL"}
        status, data = await self.make_request("POST", "/bookmarks", incomplete_bookmark)
        if status >= 400:
            self.log_test("Missing Fields Validation", True, f"Properly rejected incomplete data: HTTP {status}")
        else:
            self.log_test("Missing Fields Validation", False, "Incomplete data was accepted", severity="HIGH")
        
        # Test non-existent resource access
        fake_id = str(uuid.uuid4())
        status, data = await self.make_request("GET", f"/bookmarks/{fake_id}")
        if status == 404:
            self.log_test("Non-existent Resource Handling", True, "Properly returned 404 for non-existent resource")
        else:
            self.log_test("Non-existent Resource Handling", False, f"Unexpected response: HTTP {status}", severity="MEDIUM")
        
        # Test malformed JSON
        try:
            async with self.session.post(f"{self.api_url}/bookmarks", data="invalid json") as response:
                if response.status >= 400:
                    self.log_test("Malformed JSON Handling", True, f"Properly rejected malformed JSON: HTTP {response.status}")
                else:
                    self.log_test("Malformed JSON Handling", False, "Malformed JSON was accepted", severity="HIGH")
        except Exception as e:
            self.log_test("Malformed JSON Handling", True, f"Exception properly handled: {str(e)}")
        
        return True

    # ==================== 5. LINK VALIDATION TESTING ====================
    
    async def test_link_validation_system(self):
        """Test Link Validation System"""
        print("\n🔗 LINK VALIDATION SYSTEM TESTING")
        print("=" * 40)
        
        # Test link validation endpoint
        status, data = await self.make_request("POST", "/bookmarks/validate")
        if status == 200:
            total_checked = data.get("total_checked", 0)
            dead_links_found = data.get("dead_links_found", 0)
            self.log_test("Link Validation", True, f"Validated {total_checked} links, found {dead_links_found} dead links")
        else:
            self.log_test("Link Validation", False, f"HTTP {status}: {data}", severity="HIGH")
            return False
        
        # Test dead links removal
        status, data = await self.make_request("DELETE", "/bookmarks/dead-links")
        if status == 200:
            removed_count = data.get("removed_count", 0)
            self.log_test("Dead Links Removal", True, f"Removed {removed_count} dead links")
        else:
            self.log_test("Dead Links Removal", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    # ==================== 6. DUPLICATE DETECTION TESTING ====================
    
    async def test_duplicate_detection_system(self):
        """Test Duplicate Detection System"""
        print("\n🔄 DUPLICATE DETECTION SYSTEM TESTING")
        print("=" * 45)
        
        # Test find duplicates
        status, data = await self.make_request("POST", "/bookmarks/find-duplicates")
        if status == 200:
            duplicate_groups = data.get("duplicate_groups", 0)
            marked_count = data.get("marked_count", 0)
            self.log_test("Find Duplicates", True, f"Found {duplicate_groups} duplicate groups, marked {marked_count} bookmarks")
        else:
            self.log_test("Find Duplicates", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        # Test remove duplicates
        status, data = await self.make_request("DELETE", "/bookmarks/duplicates")
        if status == 200:
            removed_count = data.get("removed_count", 0)
            self.log_test("Remove Duplicates", True, f"Removed {removed_count} duplicate bookmarks")
        else:
            self.log_test("Remove Duplicates", False, f"HTTP {status}: {data}", severity="MEDIUM")
        
        return True

    # ==================== 7. PERFORMANCE & SECURITY TESTING ====================
    
    async def test_performance_benchmarks(self):
        """Test Performance Benchmarks"""
        print("\n⚡ PERFORMANCE BENCHMARKS TESTING")
        print("=" * 40)
        
        # Test large dataset performance
        start_time = time.time()
        status, data = await self.make_request("GET", "/bookmarks")
        response_time = time.time() - start_time
        
        if status == 200:
            bookmark_count = len(data) if isinstance(data, list) else 0
            throughput = bookmark_count / response_time if response_time > 0 else 0
            self.log_test("Large Dataset Performance", True, 
                         f"Retrieved {bookmark_count} bookmarks in {response_time:.2f}s ({throughput:.1f} bookmarks/sec)")
        
        # Test concurrent requests
        concurrent_tasks = []
        for i in range(5):
            task = self.make_request("GET", "/statistics")
            concurrent_tasks.append(task)
        
        start_time = time.time()
        results = await asyncio.gather(*concurrent_tasks)
        concurrent_time = time.time() - start_time
        
        successful_requests = sum(1 for status, _ in results if status == 200)
        self.log_test("Concurrent Request Handling", True, 
                     f"Handled {successful_requests}/5 concurrent requests in {concurrent_time:.2f}s")
        
        return True

    async def test_security_validation(self):
        """Test Security & Input Validation"""
        print("\n🛡️ SECURITY & INPUT VALIDATION TESTING")
        print("=" * 45)
        
        # Test SQL injection attempts (even though we use MongoDB)
        malicious_inputs = [
            "'; DROP TABLE bookmarks; --",
            "<script>alert('xss')</script>",
            "../../etc/passwd",
            "javascript:alert('xss')"
        ]
        
        for malicious_input in malicious_inputs:
            test_bookmark = {
                "title": malicious_input,
                "url": f"https://test.com/{malicious_input}",
                "category": malicious_input
            }
            
            status, data = await self.make_request("POST", "/bookmarks", test_bookmark)
            
            # Check if malicious input was sanitized or rejected
            if status >= 400:
                self.log_test(f"Security - Malicious Input Rejection", True, f"Rejected malicious input: {malicious_input[:20]}...")
            elif status == 200:
                # Check if input was sanitized
                created_title = data.get("title", "")
                if malicious_input not in created_title:
                    self.log_test(f"Security - Input Sanitization", True, f"Input was sanitized")
                else:
                    self.log_test(f"Security - Input Sanitization", False, f"Malicious input not sanitized", severity="HIGH")
        
        return True

    # ==================== COMPREHENSIVE TEST RUNNER ====================
    
    async def run_comprehensive_backend_tests(self):
        """Run all comprehensive backend tests"""
        print("🚀 COMPREHENSIVE FAVORG BACKEND SYSTEM TESTING")
        print("=" * 80)
        print("German Review Request: Teste das FavOrg Backend System umfassend auf 'Herz und Nieren'")
        print(f"Backend URL: {self.api_url}")
        print("=" * 80)
        
        test_suites = [
            ("API Endpoints Testing", [
                self.test_bookmark_crud_operations,
                self.test_category_management_apis,
                self.test_statistics_and_data_apis,
                self.test_import_export_functionality,
                self.test_comprehensive_test_data_generation
            ]),
            ("Database Operations", [
                self.test_database_operations
            ]),
            ("ModularCategoryManager", [
                self.test_modular_category_manager
            ]),
            ("Error Handling & Edge Cases", [
                self.test_error_handling_edge_cases
            ]),
            ("Link Validation", [
                self.test_link_validation_system
            ]),
            ("Duplicate Detection", [
                self.test_duplicate_detection_system
            ]),
            ("Performance & Security", [
                self.test_performance_benchmarks,
                self.test_security_validation
            ])
        ]
        
        total_tests = 0
        passed_tests = 0
        
        for suite_name, test_functions in test_suites:
            print(f"\n🧪 {suite_name.upper()} SUITE")
            print("=" * (len(suite_name) + 10))
            
            suite_passed = 0
            suite_total = len(test_functions)
            
            for test_func in test_functions:
                try:
                    result = await test_func()
                    total_tests += 1
                    if result:
                        passed_tests += 1
                        suite_passed += 1
                except Exception as e:
                    total_tests += 1
                    self.log_test(f"{test_func.__name__}", False, f"Exception: {str(e)}", severity="CRITICAL")
            
            suite_success_rate = (suite_passed / suite_total) * 100 if suite_total > 0 else 0
            print(f"📊 {suite_name} Suite: {suite_passed}/{suite_total} tests passed ({suite_success_rate:.1f}%)")
        
        # Generate comprehensive report
        await self.generate_comprehensive_report(total_tests, passed_tests)
        
        return passed_tests == total_tests

    async def generate_comprehensive_report(self, total_tests: int, passed_tests: int):
        """Generate comprehensive test report"""
        print("\n" + "=" * 80)
        print("🎯 COMPREHENSIVE BACKEND TESTING REPORT")
        print("=" * 80)
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"📊 Overall Results: {passed_tests}/{total_tests} tests passed ({success_rate:.1f}%)")
        
        # Performance Summary
        if self.performance_metrics:
            avg_response_time = sum(m["response_time"] for m in self.performance_metrics) / len(self.performance_metrics)
            slow_endpoints = [m for m in self.performance_metrics if m["response_time"] > 2.0]
            print(f"⚡ Performance: Average response time {avg_response_time:.2f}s, {len(slow_endpoints)} slow endpoints")
        
        # Security Issues
        if self.security_issues:
            print(f"🛡️ Security: {len(self.security_issues)} security issues found")
            for issue in self.security_issues[:3]:  # Show top 3
                print(f"   - {issue['test']}: {issue['message']}")
        else:
            print("🛡️ Security: No major security issues found")
        
        # Critical Bugs
        if self.bugs_found:
            print(f"🐛 Critical Issues: {len(self.bugs_found)} critical bugs found")
            for bug in self.bugs_found[:5]:  # Show top 5
                print(f"   - {bug['test']}: {bug['message']}")
        else:
            print("🐛 Critical Issues: No critical bugs found")
        
        # Recommendations
        print("\n📋 RECOMMENDATIONS:")
        if success_rate >= 95:
            print("✅ EXCELLENT: Backend system is highly stable and performant")
        elif success_rate >= 85:
            print("🟡 GOOD: Backend system is stable with minor issues to address")
        elif success_rate >= 70:
            print("🟠 FAIR: Backend system needs attention for several issues")
        else:
            print("🔴 POOR: Backend system has critical issues requiring immediate attention")
        
        # Optimization Suggestions
        slow_endpoints = [m for m in self.performance_metrics if m["response_time"] > 2.0]
        if slow_endpoints:
            print("⚡ Performance Optimization needed for:")
            for endpoint in slow_endpoints[:3]:
                print(f"   - {endpoint['endpoint']}: {endpoint['response_time']:.2f}s")
        
        print("=" * 80)

async def main():
    """Main test execution"""
    async with ComprehensiveFavOrgBackendTester() as tester:
        success = await tester.run_comprehensive_backend_tests()
        return success

if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)