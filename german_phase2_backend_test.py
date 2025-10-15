#!/usr/bin/env python3
"""
QA-Report-App German Phase 2 Bugfixes Backend Testing
Tests 5 specific bugfix scenarios as requested in German test request.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from environment
BACKEND_URL = "https://testsync-pro.preview.emergentagent.com"
API_BASE = f"{BACKEND_URL}/api"

# Test credentials
ADMIN_CREDENTIALS = {"username": "admin", "password": "admin123"}

class GermanPhase2Tester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        })
        self.test_results = []
        self.auth_token = None
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'response_data': response_data
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def authenticate_admin(self):
        """Authenticate as admin user"""
        try:
            response = self.session.post(
                f"{API_BASE}/auth/login",
                json=ADMIN_CREDENTIALS,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                self.auth_token = data.get("access_token")
                self.session.headers.update({
                    'Authorization': f'Bearer {self.auth_token}'
                })
                print("🔐 Admin authentication successful")
                return True
            else:
                print(f"❌ Admin authentication failed: HTTP {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ Admin authentication error: {str(e)}")
            return False
    
    def scenario_1_testdaten_generieren_frontend_sync(self):
        """
        SCENARIO 1: Testdaten Generieren + Frontend Sync
        1. Datenbank leeren: DELETE /api/admin/clear-database (Admin-Auth)
        2. Testdaten generieren: POST /api/admin/generate-test-data mit Body: {"companies": 2, "testsPerCompany": 10}
        3. ERWARTUNG: HTTP 200, Response enthält "companies": 2, "testCases": Anzahl
        4. Prüfen: GET /api/companies sollte 2 Firmen zurückgeben (plus ID2 = 3 gesamt)
        5. Prüfen: GET /api/projects sollte mindestens 2 Projekte zurückgeben
        """
        print("\n🇩🇪 SCENARIO 1: Testdaten Generieren + Frontend Sync")
        print("-" * 50)
        
        try:
            # Step 1: Clear database
            print("Step 1: Clearing database...")
            clear_response = self.session.delete(f"{API_BASE}/admin/clear-database", timeout=30)
            
            if clear_response.status_code != 200:
                self.log_test("Scenario 1 - Clear Database", False, 
                            f"Failed to clear database: HTTP {clear_response.status_code}")
                return False
            
            print("✅ Database cleared successfully")
            
            # Step 2: Generate test data
            print("Step 2: Generating test data...")
            test_data_payload = {
                "companies": 2,
                "testsPerCompany": 10
            }
            
            generate_response = self.session.post(
                f"{API_BASE}/admin/generate-test-data", 
                json=test_data_payload, 
                timeout=30
            )
            
            if generate_response.status_code != 200:
                self.log_test("Scenario 1 - Generate Test Data", False, 
                            f"Failed to generate test data: HTTP {generate_response.status_code}: {generate_response.text}")
                return False
            
            # Step 3: Check response structure
            data = generate_response.json()
            print(f"✅ Test data generation response: {data}")
            
            if "companies" not in data or data["companies"] != 2:
                self.log_test("Scenario 1 - Response Check", False, 
                            f"Expected companies: 2, got: {data.get('companies')}")
                return False
            
            if "testCases" not in data:
                self.log_test("Scenario 1 - Response Check", False, 
                            "Missing 'testCases' field in response")
                return False
            
            print(f"✅ Response contains companies: {data['companies']}, testCases: {data['testCases']}")
            
            # Step 4: Check companies endpoint
            print("Step 4: Checking companies endpoint...")
            companies_response = self.session.get(f"{API_BASE}/companies", timeout=10)
            
            if companies_response.status_code != 200:
                self.log_test("Scenario 1 - Companies Check", False, 
                            f"Failed to get companies: HTTP {companies_response.status_code}")
                return False
            
            companies = companies_response.json()
            print(f"✅ Found {len(companies)} companies")
            
            # Should have 2 generated companies plus ID2 company = 3 total
            if len(companies) < 2:
                self.log_test("Scenario 1 - Companies Count", False, 
                            f"Expected at least 2 companies, got: {len(companies)}")
                return False
            
            # Step 5: Check projects endpoint
            print("Step 5: Checking projects endpoint...")
            projects_response = self.session.get(f"{API_BASE}/projects", timeout=10)
            
            if projects_response.status_code != 200:
                self.log_test("Scenario 1 - Projects Check", False, 
                            f"Failed to get projects: HTTP {projects_response.status_code}")
                return False
            
            projects = projects_response.json()
            print(f"✅ Found {len(projects)} projects")
            
            if len(projects) < 2:
                self.log_test("Scenario 1 - Projects Count", False, 
                            f"Expected at least 2 projects, got: {len(projects)}")
                return False
            
            self.log_test("Scenario 1 - Testdaten Generieren + Frontend Sync", True, 
                        f"✅ ALL CHECKS PASSED: Generated {data['companies']} companies with {data['testCases']} test cases, verified {len(companies)} companies and {len(projects)} projects in database")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("Scenario 1 - Network Error", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Scenario 1 - Execution Error", False, f"Test execution error: {str(e)}")
            return False
    
    def scenario_2_pdf_export_endpoint(self):
        """
        SCENARIO 2: PDF Export Endpoint
        1. Falls keine Projekte: Testdaten generieren (siehe Scenario 1)
        2. Projekt-ID holen: GET /api/projects, erste project.id merken
        3. PDF generieren: GET /api/pdf-reports/generate/{project_id} (Admin-Auth)
        4. ERWARTUNG: HTTP 200, Content-Type: application/pdf
        """
        print("\n🇩🇪 SCENARIO 2: PDF Export Endpoint")
        print("-" * 50)
        
        try:
            # Step 1: Check if projects exist, generate if needed
            print("Step 1: Checking for existing projects...")
            projects_response = self.session.get(f"{API_BASE}/projects", timeout=10)
            
            if projects_response.status_code != 200:
                self.log_test("Scenario 2 - Projects Check", False, 
                            f"Failed to get projects: HTTP {projects_response.status_code}")
                return False
            
            projects = projects_response.json()
            
            if len(projects) == 0:
                print("No projects found, generating test data...")
                test_data_payload = {"companies": 1, "testsPerCompany": 5}
                generate_response = self.session.post(
                    f"{API_BASE}/admin/generate-test-data", 
                    json=test_data_payload, 
                    timeout=30
                )
                
                if generate_response.status_code != 200:
                    self.log_test("Scenario 2 - Generate Test Data", False, 
                                f"Failed to generate test data: HTTP {generate_response.status_code}")
                    return False
                
                # Re-fetch projects
                projects_response = self.session.get(f"{API_BASE}/projects", timeout=10)
                projects = projects_response.json()
            
            if len(projects) == 0:
                self.log_test("Scenario 2 - No Projects", False, 
                            "No projects available for PDF export test")
                return False
            
            # Step 2: Get first project ID
            project_id = projects[0]["id"]
            print(f"Step 2: Using project ID: {project_id}")
            
            # Step 3: Test PDF export
            print("Step 3: Testing PDF export...")
            pdf_response = self.session.get(
                f"{API_BASE}/pdf-reports/generate/{project_id}", 
                timeout=30
            )
            
            if pdf_response.status_code != 200:
                self.log_test("Scenario 2 - PDF Export", False, 
                            f"PDF export failed: HTTP {pdf_response.status_code}: {pdf_response.text}")
                return False
            
            # Step 4: Check Content-Type
            content_type = pdf_response.headers.get('content-type', '').lower()
            print(f"Step 4: Content-Type: {content_type}")
            
            if 'pdf' not in content_type:
                self.log_test("Scenario 2 - Content Type", False, 
                            f"Expected PDF content-type, got: {content_type}")
                return False
            
            self.log_test("Scenario 2 - PDF Export Endpoint", True, 
                        f"✅ PDF export successful: HTTP 200, Content-Type: {content_type}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("Scenario 2 - Network Error", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Scenario 2 - Execution Error", False, f"Test execution error: {str(e)}")
            return False
    
    def scenario_3_csv_excel_export_endpoint(self):
        """
        SCENARIO 3: CSV/Excel Export Endpoint
        1. Falls keine Projekte: Testdaten generieren
        2. Projekt-ID holen: GET /api/projects, erste project.id merken
        3. Excel exportieren: GET /api/import-export/export-excel/{project_id} (Admin-Auth)
        4. ERWARTUNG: HTTP 200, Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
        """
        print("\n🇩🇪 SCENARIO 3: CSV/Excel Export Endpoint")
        print("-" * 50)
        
        try:
            # Step 1: Check if projects exist, generate if needed
            print("Step 1: Checking for existing projects...")
            projects_response = self.session.get(f"{API_BASE}/projects", timeout=10)
            
            if projects_response.status_code != 200:
                self.log_test("Scenario 3 - Projects Check", False, 
                            f"Failed to get projects: HTTP {projects_response.status_code}")
                return False
            
            projects = projects_response.json()
            
            if len(projects) == 0:
                print("No projects found, generating test data...")
                test_data_payload = {"companies": 1, "testsPerCompany": 5}
                generate_response = self.session.post(
                    f"{API_BASE}/admin/generate-test-data", 
                    json=test_data_payload, 
                    timeout=30
                )
                
                if generate_response.status_code != 200:
                    self.log_test("Scenario 3 - Generate Test Data", False, 
                                f"Failed to generate test data: HTTP {generate_response.status_code}")
                    return False
                
                # Re-fetch projects
                projects_response = self.session.get(f"{API_BASE}/projects", timeout=10)
                projects = projects_response.json()
            
            if len(projects) == 0:
                self.log_test("Scenario 3 - No Projects", False, 
                            "No projects available for Excel export test")
                return False
            
            # Step 2: Get first project ID
            project_id = projects[0]["id"]
            print(f"Step 2: Using project ID: {project_id}")
            
            # Step 3: Test Excel export
            print("Step 3: Testing Excel export...")
            excel_response = self.session.get(
                f"{API_BASE}/import-export/export-excel/{project_id}", 
                timeout=30
            )
            
            if excel_response.status_code != 200:
                self.log_test("Scenario 3 - Excel Export", False, 
                            f"Excel export failed: HTTP {excel_response.status_code}: {excel_response.text}")
                return False
            
            # Step 4: Check Content-Type
            content_type = excel_response.headers.get('content-type', '').lower()
            print(f"Step 4: Content-Type: {content_type}")
            
            expected_content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            if expected_content_type not in content_type and 'excel' not in content_type and 'spreadsheet' not in content_type:
                self.log_test("Scenario 3 - Content Type", False, 
                            f"Expected Excel content-type, got: {content_type}")
                return False
            
            self.log_test("Scenario 3 - CSV/Excel Export Endpoint", True, 
                        f"✅ Excel export successful: HTTP 200, Content-Type: {content_type}")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("Scenario 3 - Network Error", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Scenario 3 - Execution Error", False, f"Test execution error: {str(e)}")
            return False
    
    def scenario_4_massendaten_mit_projekten_409_error(self):
        """
        SCENARIO 4: Massendaten mit Projekten (409 Error)
        1. Falls keine Projekte: Testdaten generieren
        2. POST /api/admin/generate-mass-data mit Body: {"hasLocalStorageProjects": false}
        3. ERWARTUNG: HTTP 409 Conflict
        4. Response Body prüfen: detail sollte object sein mit "error" key
        5. "error" sollte enthalten: "Masse-Daten-Import nicht möglich"
        """
        print("\n🇩🇪 SCENARIO 4: Massendaten mit Projekten (409 Error)")
        print("-" * 50)
        
        try:
            # Step 1: Ensure projects exist
            print("Step 1: Ensuring projects exist...")
            projects_response = self.session.get(f"{API_BASE}/projects", timeout=10)
            
            if projects_response.status_code != 200:
                self.log_test("Scenario 4 - Projects Check", False, 
                            f"Failed to get projects: HTTP {projects_response.status_code}")
                return False
            
            projects = projects_response.json()
            
            if len(projects) == 0:
                print("No projects found, generating test data...")
                test_data_payload = {"companies": 1, "testsPerCompany": 5}
                generate_response = self.session.post(
                    f"{API_BASE}/admin/generate-test-data", 
                    json=test_data_payload, 
                    timeout=30
                )
                
                if generate_response.status_code != 200:
                    self.log_test("Scenario 4 - Generate Test Data", False, 
                                f"Failed to generate test data: HTTP {generate_response.status_code}")
                    return False
                
                print("✅ Test data generated")
            else:
                print(f"✅ Found {len(projects)} existing projects")
            
            # Step 2: Attempt mass data generation (should fail with 409)
            print("Step 2: Attempting mass data generation...")
            mass_data_payload = {"hasLocalStorageProjects": False}
            
            mass_response = self.session.post(
                f"{API_BASE}/admin/generate-mass-data", 
                json=mass_data_payload, 
                timeout=30
            )
            
            # Step 3: Check for HTTP 409 Conflict
            if mass_response.status_code != 409:
                self.log_test("Scenario 4 - HTTP Status", False, 
                            f"Expected HTTP 409 Conflict, got: {mass_response.status_code}")
                return False
            
            print("✅ Received HTTP 409 Conflict as expected")
            
            # Step 4: Check response body structure
            try:
                response_data = mass_response.json()
            except json.JSONDecodeError:
                self.log_test("Scenario 4 - JSON Parse", False, 
                            "Response is not valid JSON")
                return False
            
            print(f"Response data: {response_data}")
            
            # Check detail object exists
            if "detail" not in response_data:
                self.log_test("Scenario 4 - Detail Field", False, 
                            "Missing 'detail' field in response")
                return False
            
            detail = response_data["detail"]
            if not isinstance(detail, dict):
                self.log_test("Scenario 4 - Detail Type", False, 
                            f"'detail' should be object, got: {type(detail)}")
                return False
            
            # Step 5: Check error message
            if "error" not in detail:
                self.log_test("Scenario 4 - Error Field", False, 
                            "Missing 'error' field in detail object")
                return False
            
            error_message = detail["error"]
            expected_text = "Masse-Daten-Import nicht möglich"
            
            if expected_text not in error_message:
                self.log_test("Scenario 4 - Error Message", False, 
                            f"Error message should contain '{expected_text}', got: {error_message}")
                return False
            
            print(f"✅ Error message contains expected text: {error_message}")
            
            self.log_test("Scenario 4 - Massendaten mit Projekten (409 Error)", True, 
                        f"✅ ALL CHECKS PASSED: HTTP 409 Conflict with correct error message structure")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("Scenario 4 - Network Error", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Scenario 4 - Execution Error", False, f"Test execution error: {str(e)}")
            return False
    
    def scenario_5_massendaten_ohne_projekte_success(self):
        """
        SCENARIO 5: Massendaten ohne Projekte (Success)
        1. Datenbank leeren: DELETE /api/admin/clear-database
        2. Prüfen: GET /api/projects sollte [] zurückgeben
        3. POST /api/admin/generate-mass-data mit Body: {"hasLocalStorageProjects": false}
        4. ERWARTUNG: HTTP 200, "stats" object mit "companies": 50, "projects": 50, "test_cases": 125000
        """
        print("\n🇩🇪 SCENARIO 5: Massendaten ohne Projekte (Success)")
        print("-" * 50)
        
        try:
            # Step 1: Clear database
            print("Step 1: Clearing database...")
            clear_response = self.session.delete(f"{API_BASE}/admin/clear-database", timeout=30)
            
            if clear_response.status_code != 200:
                self.log_test("Scenario 5 - Clear Database", False, 
                            f"Failed to clear database: HTTP {clear_response.status_code}")
                return False
            
            print("✅ Database cleared successfully")
            
            # Step 2: Verify projects collection is empty
            print("Step 2: Verifying empty projects...")
            projects_response = self.session.get(f"{API_BASE}/projects", timeout=10)
            
            if projects_response.status_code != 200:
                self.log_test("Scenario 5 - Projects Check", False, 
                            f"Failed to get projects: HTTP {projects_response.status_code}")
                return False
            
            projects = projects_response.json()
            
            if len(projects) != 0:
                self.log_test("Scenario 5 - Empty Projects", False, 
                            f"Expected empty projects array, got: {len(projects)} projects")
                return False
            
            print("✅ Projects array is empty as expected")
            
            # Step 3: Generate mass data
            print("Step 3: Generating mass data...")
            mass_data_payload = {"hasLocalStorageProjects": False}
            
            mass_response = self.session.post(
                f"{API_BASE}/admin/generate-mass-data", 
                json=mass_data_payload, 
                timeout=120  # Longer timeout for mass data generation
            )
            
            if mass_response.status_code != 200:
                self.log_test("Scenario 5 - Mass Data Generation", False, 
                            f"Mass data generation failed: HTTP {mass_response.status_code}: {mass_response.text}")
                return False
            
            print("✅ Mass data generation successful")
            
            # Step 4: Check response structure and values
            try:
                response_data = mass_response.json()
            except json.JSONDecodeError:
                self.log_test("Scenario 5 - JSON Parse", False, 
                            "Response is not valid JSON")
                return False
            
            print(f"Response data: {response_data}")
            
            # Check stats object exists
            if "stats" not in response_data:
                self.log_test("Scenario 5 - Stats Field", False, 
                            "Missing 'stats' field in response")
                return False
            
            stats = response_data["stats"]
            if not isinstance(stats, dict):
                self.log_test("Scenario 5 - Stats Type", False, 
                            f"'stats' should be object, got: {type(stats)}")
                return False
            
            # Check expected values
            expected_companies = 50
            expected_projects = 50
            expected_test_cases = 125000
            
            actual_companies = stats.get("companies", 0)
            actual_projects = stats.get("projects", 0)
            actual_test_cases = stats.get("test_cases", 0)
            
            print(f"Stats: companies={actual_companies}, projects={actual_projects}, test_cases={actual_test_cases}")
            
            if actual_companies != expected_companies:
                self.log_test("Scenario 5 - Companies Count", False, 
                            f"Expected {expected_companies} companies, got: {actual_companies}")
                return False
            
            if actual_projects != expected_projects:
                self.log_test("Scenario 5 - Projects Count", False, 
                            f"Expected {expected_projects} projects, got: {actual_projects}")
                return False
            
            if actual_test_cases != expected_test_cases:
                self.log_test("Scenario 5 - Test Cases Count", False, 
                            f"Expected {expected_test_cases} test cases, got: {actual_test_cases}")
                return False
            
            self.log_test("Scenario 5 - Massendaten ohne Projekte (Success)", True, 
                        f"✅ ALL CHECKS PASSED: Generated {actual_companies} companies, {actual_projects} projects, {actual_test_cases} test cases")
            return True
            
        except requests.exceptions.RequestException as e:
            self.log_test("Scenario 5 - Network Error", False, f"Request failed: {str(e)}")
            return False
        except Exception as e:
            self.log_test("Scenario 5 - Execution Error", False, f"Test execution error: {str(e)}")
            return False
    
    def run_all_scenarios(self):
        """Run all German Phase 2 bugfix test scenarios"""
        print("🇩🇪 GERMAN PHASE 2 BUGFIXES TESTING")
        print("=" * 60)
        print("Testing 5 specific bugfix scenarios:")
        print("1. Testdaten Generieren + Frontend Sync")
        print("2. PDF Export Endpoint")
        print("3. CSV/Excel Export Endpoint") 
        print("4. Massendaten mit Projekten (409 Error)")
        print("5. Massendaten ohne Projekte (Success)")
        print("=" * 60)
        
        # Authenticate first
        if not self.authenticate_admin():
            print("❌ Cannot proceed without admin authentication")
            return False
        
        # Run all scenarios
        scenarios = [
            ("Scenario 1: Testdaten Generieren + Frontend Sync", self.scenario_1_testdaten_generieren_frontend_sync),
            ("Scenario 2: PDF Export Endpoint", self.scenario_2_pdf_export_endpoint),
            ("Scenario 3: CSV/Excel Export Endpoint", self.scenario_3_csv_excel_export_endpoint),
            ("Scenario 4: Massendaten mit Projekten (409 Error)", self.scenario_4_massendaten_mit_projekten_409_error),
            ("Scenario 5: Massendaten ohne Projekte (Success)", self.scenario_5_massendaten_ohne_projekte_success),
        ]
        
        passed = 0
        total = len(scenarios)
        
        for scenario_name, scenario_func in scenarios:
            try:
                if scenario_func():
                    passed += 1
            except Exception as e:
                self.log_test(scenario_name, False, f"Scenario execution error: {str(e)}")
        
        print("\n" + "=" * 60)
        print(f"🏁 German Phase 2 Test Results: {passed}/{total} scenarios passed")
        
        if passed == total:
            print("✅ ALL GERMAN PHASE 2 BUGFIX SCENARIOS PASSED!")
        else:
            print(f"❌ {total - passed} scenarios FAILED!")
            print("\nFailed scenarios:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        return passed == total
    
    def get_summary(self):
        """Get test summary"""
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        
        summary = {
            'total_tests': total,
            'passed': passed,
            'failed': total - passed,
            'success_rate': (passed / total * 100) if total > 0 else 0,
            'results': self.test_results
        }
        
        return summary

def main():
    """Main test execution"""
    tester = GermanPhase2Tester()
    
    try:
        success = tester.run_all_scenarios()
        
        # Save detailed results
        summary = tester.get_summary()
        with open('/app/german_phase2_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Detailed results saved to: /app/german_phase2_test_results.json")
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Test execution failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())