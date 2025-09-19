#!/usr/bin/env python3
"""
PHASE 2 SYSTEM REBUILD - Schritt 1 Testing
Teste das neue modulare Testdaten-System mit exakten Status-Zahlen

German Review Request Testing:
- Testdaten-Generierung: POST /api/bookmarks/create-test-data
- Status-Konsistenz prüfen
- Statistiken validieren: GET /api/statistics
- Kategorie-Integration testen
"""

import asyncio
import aiohttp
import json
import os
from datetime import datetime
from typing import Dict, List, Any

class Phase2TestDataValidator:
    def __init__(self):
        # Use backend URL from environment
        self.base_url = os.getenv('REACT_APP_BACKEND_URL', 'https://favorg-rebuild.preview.emergentagent.com')
        self.api_url = f"{self.base_url}/api"
        self.session = None
        
        # Expected exact counts for Phase 2 modular system
        self.expected_counts = {
            "total_bookmarks": 70,
            "active": 10,
            "dead": 10, 
            "localhost": 10,
            "duplicate": 10,
            "locked": 10,
            "timeout": 10,
            "checked": 10  # This maps to 'unchecked' in statistics
        }
        
        self.test_results = []
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, message: str, details: Dict = None):
        """Log test result"""
        result = {
            "test": test_name,
            "success": success,
            "message": message,
            "details": details or {},
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅" if success else "❌"
        print(f"{status} {test_name}: {message}")
        if details:
            print(f"   Details: {details}")
    
    async def test_create_modular_test_data(self):
        """Test POST /api/bookmarks/create-test-data - Haupttest für Phase 2"""
        try:
            print("\n🎯 PHASE 2 SYSTEM REBUILD - TESTDATEN-GENERIERUNG")
            print("=" * 60)
            
            # Clear existing data first
            await self.clear_existing_data()
            
            # Create modular test data
            async with self.session.post(f"{self.api_url}/bookmarks/create-test-data") as response:
                if response.status != 200:
                    error_text = await response.text()
                    self.log_test(
                        "Modular Test Data Creation",
                        False,
                        f"HTTP {response.status}: {error_text}"
                    )
                    return False
                
                data = await response.json()
                
                # Validate response structure
                required_fields = ["message", "created_count", "status_distribution", "details"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    self.log_test(
                        "Response Structure Validation",
                        False,
                        f"Missing fields: {missing_fields}",
                        {"response": data}
                    )
                    return False
                
                # Check total count
                created_count = data.get("created_count", 0)
                if created_count != self.expected_counts["total_bookmarks"]:
                    self.log_test(
                        "Total Bookmark Count",
                        False,
                        f"Expected {self.expected_counts['total_bookmarks']}, got {created_count}",
                        {"expected": self.expected_counts["total_bookmarks"], "actual": created_count}
                    )
                    return False
                
                self.log_test(
                    "Total Bookmark Count",
                    True,
                    f"Exactly {created_count} bookmarks created as expected"
                )
                
                # Validate status distribution
                status_dist = data.get("status_distribution", {})
                all_status_correct = True
                
                for status_type, expected_count in self.expected_counts.items():
                    if status_type == "total_bookmarks":
                        continue
                        
                    actual_count = status_dist.get(status_type, 0)
                    if actual_count != expected_count:
                        self.log_test(
                            f"Status Count - {status_type}",
                            False,
                            f"Expected {expected_count}, got {actual_count}",
                            {"status": status_type, "expected": expected_count, "actual": actual_count}
                        )
                        all_status_correct = False
                    else:
                        self.log_test(
                            f"Status Count - {status_type}",
                            True,
                            f"Exactly {actual_count} {status_type} bookmarks"
                        )
                
                if all_status_correct:
                    self.log_test(
                        "Status Distribution Validation",
                        True,
                        "All status groups have exactly 10 bookmarks each",
                        {"distribution": status_dist}
                    )
                
                return all_status_correct
                
        except Exception as e:
            self.log_test(
                "Modular Test Data Creation",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def clear_existing_data(self):
        """Clear existing bookmarks and categories for clean test"""
        try:
            # Clear bookmarks
            async with self.session.delete(f"{self.api_url}/bookmarks/all") as response:
                if response.status == 200:
                    data = await response.json()
                    print(f"🧹 Cleared {data.get('deleted_count', 0)} existing bookmarks")
                
        except Exception as e:
            print(f"⚠️ Warning: Could not clear existing data: {e}")
    
    async def test_status_consistency(self):
        """Test status field consistency (status_type, is_dead_link, is_locked)"""
        try:
            print("\n🔍 STATUS-KONSISTENZ PRÜFUNG")
            print("=" * 40)
            
            # Get all bookmarks
            async with self.session.get(f"{self.api_url}/bookmarks") as response:
                if response.status != 200:
                    self.log_test(
                        "Status Consistency Check",
                        False,
                        f"Failed to fetch bookmarks: HTTP {response.status}"
                    )
                    return False
                
                bookmarks = await response.json()
                
                if len(bookmarks) != 70:
                    self.log_test(
                        "Bookmark Count for Consistency Check",
                        False,
                        f"Expected 70 bookmarks, found {len(bookmarks)}"
                    )
                    return False
                
                # Check consistency for each status type
                consistency_errors = []
                status_counts = {}
                
                for bookmark in bookmarks:
                    status_type = bookmark.get("status_type", "unknown")
                    is_dead_link = bookmark.get("is_dead_link", False)
                    is_locked = bookmark.get("is_locked", False)
                    
                    # Count status types
                    status_counts[status_type] = status_counts.get(status_type, 0) + 1
                    
                    # Validate consistency rules
                    if status_type == "active":
                        if is_dead_link or is_locked:
                            consistency_errors.append(f"Active bookmark {bookmark['id']} has is_dead_link={is_dead_link} or is_locked={is_locked}")
                    
                    elif status_type == "dead":
                        if not is_dead_link or is_locked:
                            consistency_errors.append(f"Dead bookmark {bookmark['id']} has is_dead_link={is_dead_link}, is_locked={is_locked}")
                    
                    elif status_type == "localhost":
                        if is_dead_link or is_locked:
                            consistency_errors.append(f"Localhost bookmark {bookmark['id']} has is_dead_link={is_dead_link} or is_locked={is_locked}")
                    
                    elif status_type == "duplicate":
                        if is_dead_link or is_locked:
                            consistency_errors.append(f"Duplicate bookmark {bookmark['id']} has is_dead_link={is_dead_link} or is_locked={is_locked}")
                    
                    elif status_type == "locked":
                        if is_dead_link or not is_locked:
                            consistency_errors.append(f"Locked bookmark {bookmark['id']} has is_dead_link={is_dead_link}, is_locked={is_locked}")
                    
                    elif status_type == "timeout":
                        if is_dead_link or is_locked:
                            consistency_errors.append(f"Timeout bookmark {bookmark['id']} has is_dead_link={is_dead_link} or is_locked={is_locked}")
                    
                    elif status_type == "checked":
                        if is_dead_link or is_locked:
                            consistency_errors.append(f"Checked bookmark {bookmark['id']} has is_dead_link={is_dead_link} or is_locked={is_locked}")
                
                if consistency_errors:
                    self.log_test(
                        "Status Field Consistency",
                        False,
                        f"Found {len(consistency_errors)} consistency errors",
                        {"errors": consistency_errors[:5], "total_errors": len(consistency_errors)}
                    )
                    return False
                
                self.log_test(
                    "Status Field Consistency",
                    True,
                    "All status fields are consistent with status_type",
                    {"status_counts": status_counts}
                )
                
                return True
                
        except Exception as e:
            self.log_test(
                "Status Consistency Check",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_statistics_validation(self):
        """Test GET /api/statistics for exact numbers"""
        try:
            print("\n📊 STATISTIKEN VALIDIERUNG")
            print("=" * 30)
            
            async with self.session.get(f"{self.api_url}/statistics") as response:
                if response.status != 200:
                    self.log_test(
                        "Statistics API",
                        False,
                        f"HTTP {response.status}"
                    )
                    return False
                
                stats = await response.json()
                
                # Validate total bookmarks
                total_bookmarks = stats.get("total_bookmarks", 0)
                if total_bookmarks != 70:
                    self.log_test(
                        "Statistics Total Bookmarks",
                        False,
                        f"Expected 70, got {total_bookmarks}",
                        {"expected": 70, "actual": total_bookmarks}
                    )
                    return False
                
                # Validate each status count
                status_mapping = {
                    "active_links": "active",
                    "dead_links": "dead", 
                    "localhost_links": "localhost",
                    "duplicate_links": "duplicate",
                    "locked_links": "locked",
                    "timeout_links": "timeout",
                    "unchecked_links": "checked"  # checked maps to unchecked in stats
                }
                
                all_stats_correct = True
                
                for stats_field, status_type in status_mapping.items():
                    expected = self.expected_counts[status_type]
                    actual = stats.get(stats_field, 0)
                    
                    if actual != expected:
                        self.log_test(
                            f"Statistics {stats_field}",
                            False,
                            f"Expected {expected}, got {actual}",
                            {"field": stats_field, "expected": expected, "actual": actual}
                        )
                        all_stats_correct = False
                    else:
                        self.log_test(
                            f"Statistics {stats_field}",
                            True,
                            f"Correct count: {actual}"
                        )
                
                if all_stats_correct:
                    self.log_test(
                        "Statistics Validation Complete",
                        True,
                        "All statistics show exact expected numbers",
                        {"total_bookmarks": total_bookmarks, "all_counts_correct": True}
                    )
                
                return all_stats_correct
                
        except Exception as e:
            self.log_test(
                "Statistics Validation",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_category_integration(self):
        """Test category system integration"""
        try:
            print("\n📁 KATEGORIE-INTEGRATION TEST")
            print("=" * 35)
            
            # Get categories
            async with self.session.get(f"{self.api_url}/categories") as response:
                if response.status != 200:
                    self.log_test(
                        "Categories API",
                        False,
                        f"HTTP {response.status}"
                    )
                    return False
                
                categories = await response.json()
                
                if not categories:
                    self.log_test(
                        "Category Creation",
                        False,
                        "No categories found after test data creation"
                    )
                    return False
                
                # Check if categories have bookmark counts
                categories_with_counts = [cat for cat in categories if cat.get("bookmark_count", 0) > 0]
                
                if not categories_with_counts:
                    self.log_test(
                        "Category Bookmark Counts",
                        False,
                        "No categories have bookmark counts updated"
                    )
                    return False
                
                total_bookmarks_in_categories = sum(cat.get("bookmark_count", 0) for cat in categories_with_counts)
                
                self.log_test(
                    "Category Integration",
                    True,
                    f"Found {len(categories)} categories with {total_bookmarks_in_categories} total bookmark assignments",
                    {
                        "total_categories": len(categories),
                        "categories_with_bookmarks": len(categories_with_counts),
                        "total_bookmark_assignments": total_bookmarks_in_categories
                    }
                )
                
                return True
                
        except Exception as e:
            self.log_test(
                "Category Integration Test",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def test_duplicate_validation(self):
        """Test that duplicates are correctly created with identical URLs"""
        try:
            print("\n🔄 DUPLIKAT-VALIDIERUNG")
            print("=" * 25)
            
            # Get all bookmarks
            async with self.session.get(f"{self.api_url}/bookmarks") as response:
                if response.status != 200:
                    return False
                
                bookmarks = await response.json()
                
                # Find duplicate status bookmarks
                duplicate_bookmarks = [b for b in bookmarks if b.get("status_type") == "duplicate"]
                
                if len(duplicate_bookmarks) != 10:
                    self.log_test(
                        "Duplicate Count",
                        False,
                        f"Expected 10 duplicate bookmarks, found {len(duplicate_bookmarks)}"
                    )
                    return False
                
                # Check for actual URL duplicates
                url_counts = {}
                for bookmark in duplicate_bookmarks:
                    url = bookmark.get("url", "")
                    url_counts[url] = url_counts.get(url, 0) + 1
                
                # Should have URLs that appear multiple times
                actual_duplicates = {url: count for url, count in url_counts.items() if count > 1}
                
                if not actual_duplicates:
                    self.log_test(
                        "Duplicate URL Validation",
                        False,
                        "No actual duplicate URLs found among duplicate status bookmarks"
                    )
                    return False
                
                self.log_test(
                    "Duplicate Validation",
                    True,
                    f"Found {len(actual_duplicates)} sets of duplicate URLs",
                    {"duplicate_urls": actual_duplicates}
                )
                
                return True
                
        except Exception as e:
            self.log_test(
                "Duplicate Validation",
                False,
                f"Exception: {str(e)}"
            )
            return False
    
    async def run_comprehensive_phase2_tests(self):
        """Run all Phase 2 System Rebuild tests"""
        print("🚀 PHASE 2 SYSTEM REBUILD - SCHRITT 1 TESTING")
        print("=" * 70)
        print("Teste das neue modulare Testdaten-System mit exakten Status-Zahlen")
        print(f"Backend URL: {self.api_url}")
        print("=" * 70)
        
        test_functions = [
            self.test_create_modular_test_data,
            self.test_status_consistency,
            self.test_statistics_validation,
            self.test_category_integration,
            self.test_duplicate_validation
        ]
        
        passed_tests = 0
        total_tests = len(test_functions)
        
        for test_func in test_functions:
            try:
                result = await test_func()
                if result:
                    passed_tests += 1
            except Exception as e:
                print(f"❌ Test {test_func.__name__} failed with exception: {e}")
        
        # Final summary
        print("\n" + "=" * 70)
        print("🎯 PHASE 2 SYSTEM REBUILD - TEST ERGEBNISSE")
        print("=" * 70)
        
        success_rate = (passed_tests / total_tests) * 100
        print(f"Tests bestanden: {passed_tests}/{total_tests} ({success_rate:.1f}%)")
        
        if passed_tests == total_tests:
            print("✅ ALLE PHASE 2 TESTS ERFOLGREICH!")
            print("✅ Modulares Testdaten-System funktioniert einwandfrei")
            print("✅ Exakte Status-Verteilung: 7 Gruppen à 10 Bookmarks")
            print("✅ Status-Konsistenz gewährleistet")
            print("✅ Statistiken zeigen korrekte Zahlen")
            print("✅ Kategorie-Integration funktional")
        else:
            print("❌ PHASE 2 TESTS TEILWEISE FEHLGESCHLAGEN")
            print("❌ Modulares System benötigt Nachbesserungen")
        
        print("=" * 70)
        
        return passed_tests == total_tests

async def main():
    """Main test execution"""
    async with Phase2TestDataValidator() as validator:
        success = await validator.run_comprehensive_phase2_tests()
        return success

if __name__ == "__main__":
    result = asyncio.run(main())
    exit(0 if result else 1)