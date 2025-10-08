"""
Import/Export Routes - MongoDB Version
Excel Import/Export for Test Cases
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from typing import List
import pandas as pd
import io
import json
import uuid
from datetime import datetime
from database import test_cases_collection, test_suites_collection, projects_collection
from models import User, TestCase
from auth import get_current_user

router = APIRouter()

@router.post("/import-excel/{project_id}")
async def import_excel(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import test cases from Excel file"""
    
    # Verify project access
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    try:
        # Read Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['Test ID', 'Test Name', 'Test Suite', 'Description', 'Expected Result', 'Priority']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        imported_count = 0
        errors = []
        
        for index, row in df.iterrows():
            try:
                # Get or create test suite
                suite_name = str(row['Test Suite'])
                suite = await test_suites_collection.find_one({
                    "project_id": project_id,
                    "name": suite_name
                })
                
                if not suite:
                    # Create new suite
                    new_suite = {
                        "id": str(uuid.uuid4()),
                        "project_id": project_id,
                        "name": suite_name,
                        "description": None,
                        "icon": "📋",
                        "sort_order": 0,
                        "created_at": datetime.utcnow()
                    }
                    await test_suites_collection.insert_one(new_suite)
                    suite = new_suite
                
                # Check if test case already exists
                existing_case = await test_cases_collection.find_one({
                    "test_suite_id": suite["id"],
                    "test_id": str(row['Test ID'])
                })
                
                if existing_case:
                    # Update existing
                    await test_cases_collection.update_one(
                        {"id": existing_case["id"]},
                        {"$set": {
                            "name": str(row['Test Name']),
                            "description": str(row['Description']) if pd.notna(row['Description']) else None,
                            "expected_result": str(row['Expected Result']) if pd.notna(row['Expected Result']) else None,
                            "priority": int(row['Priority']) if pd.notna(row['Priority']) else 3
                        }}
                    )
                else:
                    # Create new test case
                    new_case = {
                        "id": str(uuid.uuid4()),
                        "test_suite_id": suite["id"],
                        "test_id": str(row['Test ID']),
                        "name": str(row['Test Name']),
                        "description": str(row['Description']) if pd.notna(row['Description']) else None,
                        "priority": int(row['Priority']) if pd.notna(row['Priority']) else 3,
                        "expected_result": str(row['Expected Result']) if pd.notna(row['Expected Result']) else None,
                        "sort_order": 0,
                        "is_predefined": True,
                        "created_by": current_user.id,
                        "created_at": datetime.utcnow()
                    }
                    await test_cases_collection.insert_one(new_case)
                
                imported_count += 1
                
            except Exception as e:
                errors.append(f"Row {index + 2}: {str(e)}")
        
        return {
            "message": f"Successfully imported {imported_count} test cases",
            "imported": imported_count,
            "errors": errors
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing Excel file: {str(e)}"
        )

@router.get("/export-excel/{project_id}")
async def export_excel(
    project_id: str,
    include_results: bool = False,
    current_user: User = Depends(get_current_user)
):
    """Export test cases to Excel file"""
    
    # Verify project access
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all test suites for project
    suites = await test_suites_collection.find({"project_id": project_id}).to_list(1000)
    suite_ids = [s["id"] for s in suites]
    
    # Create suite lookup
    suite_lookup = {s["id"]: s["name"] for s in suites}
    
    # Get all test cases
    cases = await test_cases_collection.find({"test_suite_id": {"$in": suite_ids}}).to_list(10000)
    
    # Build data for Excel
    data = []
    for case in cases:
        row = {
            "Test ID": case["test_id"],
            "Test Name": case["name"],
            "Test Suite": suite_lookup.get(case["test_suite_id"], "Unknown"),
            "Description": case.get("description", ""),
            "Expected Result": case.get("expected_result", ""),
            "Priority": case.get("priority", 3)
        }
        
        if include_results:
            # Get latest result for this case
            from database import test_results_collection
            latest_result = await test_results_collection.find_one(
                {"test_case_id": case["id"]},
                sort=[("execution_date", -1)]
            )
            row["Last Status"] = latest_result["status"] if latest_result else "Not Tested"
            row["Last Execution"] = latest_result["execution_date"].strftime("%Y-%m-%d %H:%M") if latest_result else ""
            row["Notes"] = latest_result.get("notes", "") if latest_result else ""
        
        data.append(row)
    
    # Create DataFrame and Excel file
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Test Cases')
        
        # Auto-adjust column widths
        worksheet = writer.sheets['Test Cases']
        for column in worksheet.columns:
            max_length = 0
            column = [cell for cell in column]
            for cell in column:
                try:
                    if len(str(cell.value)) > max_length:
                        max_length = len(str(cell.value))
                except:
                    pass
            adjusted_width = min(max_length + 2, 50)
            worksheet.column_dimensions[column[0].column_letter].width = adjusted_width
    
    output.seek(0)
    
    # Return as downloadable file
    filename = f"{project['name']}_test_cases_{datetime.utcnow().strftime('%Y%m%d')}.xlsx"
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.post("/import-json/{project_id}")
async def import_json(
    project_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Import test cases from JSON file"""
    
    # Verify project access
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    try:
        contents = await file.read()
        data = json.loads(contents)
        
        imported_count = 0
        
        for suite_data in data.get("test_suites", []):
            # Get or create test suite
            suite = await test_suites_collection.find_one({
                "project_id": project_id,
                "name": suite_data["name"]
            })
            
            if not suite:
                new_suite = {
                    "id": str(uuid.uuid4()),
                    "project_id": project_id,
                    "name": suite_data["name"],
                    "description": suite_data.get("description"),
                    "icon": suite_data.get("icon", "📋"),
                    "sort_order": suite_data.get("sort_order", 0),
                    "created_at": datetime.utcnow()
                }
                await test_suites_collection.insert_one(new_suite)
                suite = new_suite
            
            # Import test cases
            for case_data in suite_data.get("test_cases", []):
                existing_case = await test_cases_collection.find_one({
                    "test_suite_id": suite["id"],
                    "test_id": case_data["test_id"]
                })
                
                if not existing_case:
                    new_case = {
                        "id": str(uuid.uuid4()),
                        "test_suite_id": suite["id"],
                        "test_id": case_data["test_id"],
                        "name": case_data["name"],
                        "description": case_data.get("description"),
                        "priority": case_data.get("priority", 3),
                        "expected_result": case_data.get("expected_result"),
                        "sort_order": case_data.get("sort_order", 0),
                        "is_predefined": True,
                        "created_by": current_user.id,
                        "created_at": datetime.utcnow()
                    }
                    await test_cases_collection.insert_one(new_case)
                    imported_count += 1
        
        return {
            "message": f"Successfully imported {imported_count} test cases",
            "imported": imported_count
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing JSON file: {str(e)}"
        )

@router.get("/export-json/{project_id}")
async def export_json(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """Export test cases to JSON file"""
    
    # Verify project access
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all test suites
    suites = await test_suites_collection.find({"project_id": project_id}).sort("sort_order", 1).to_list(1000)
    
    export_data = {
        "project_name": project["name"],
        "export_date": datetime.utcnow().isoformat(),
        "test_suites": []
    }
    
    for suite in suites:
        # Get test cases for this suite
        cases = await test_cases_collection.find({"test_suite_id": suite["id"]}).sort("sort_order", 1).to_list(1000)
        
        suite_data = {
            "name": suite["name"],
            "description": suite.get("description"),
            "icon": suite["icon"],
            "sort_order": suite["sort_order"],
            "test_cases": [
                {
                    "test_id": case["test_id"],
                    "name": case["name"],
                    "description": case.get("description"),
                    "priority": case.get("priority", 3),
                    "expected_result": case.get("expected_result"),
                    "sort_order": case.get("sort_order", 0)
                }
                for case in cases
            ]
        }
        export_data["test_suites"].append(suite_data)
    
    # Create JSON string
    json_str = json.dumps(export_data, indent=2, ensure_ascii=False)
    
    # Return as downloadable file
    filename = f"{project['name']}_test_cases_{datetime.utcnow().strftime('%Y%m%d')}.json"
    
    return StreamingResponse(
        io.BytesIO(json_str.encode('utf-8')),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
