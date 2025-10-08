"""
PDF Report Generation Routes - MongoDB Version
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime
import io
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from database import (
    projects_collection, 
    test_suites_collection, 
    test_cases_collection, 
    test_results_collection,
    companies_collection
)
from models import User
from auth import get_current_user

router = APIRouter()

@router.get("/generate/{project_id}")
async def generate_pdf_report(
    project_id: str,
    session_id: Optional[str] = None,
    language: str = "DE",
    current_user: User = Depends(get_current_user)
):
    """Generate comprehensive PDF test report"""
    
    # Get project
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get company
    company = await companies_collection.find_one({"id": project["company_id"]})
    
    # Translations
    trans = {
        "DE": {
            "title": "QA Test-Bericht",
            "project": "Projekt",
            "company": "Firma",
            "date": "Datum",
            "tester": "Getestet von",
            "summary": "Zusammenfassung",
            "total_tests": "Gesamtzahl Tests",
            "success": "Erfolgreich",
            "error": "Fehler",
            "warning": "Warnung",
            "skipped": "Übersprungen",
            "untested": "Nicht getestet",
            "pass_rate": "Erfolgsrate",
            "test_details": "Test-Details",
            "test_id": "Test-ID",
            "test_name": "Test-Name",
            "status": "Status",
            "notes": "Notizen",
            "executed_by": "Ausgeführt von",
            "execution_date": "Ausführungsdatum",
            "suite": "Suite"
        },
        "ENG": {
            "title": "QA Test Report",
            "project": "Project",
            "company": "Company",
            "date": "Date",
            "tester": "Tested by",
            "summary": "Summary",
            "total_tests": "Total Tests",
            "success": "Success",
            "error": "Error",
            "warning": "Warning",
            "skipped": "Skipped",
            "untested": "Untested",
            "pass_rate": "Pass Rate",
            "test_details": "Test Details",
            "test_id": "Test ID",
            "test_name": "Test Name",
            "status": "Status",
            "notes": "Notes",
            "executed_by": "Executed by",
            "execution_date": "Execution Date",
            "suite": "Suite"
        }
    }
    
    t = trans.get(language, trans["DE"])
    
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#1a1a1a'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2c3e50'),
        spaceAfter=12
    )
    
    # Title
    story.append(Paragraph(t["title"], title_style))
    story.append(Spacer(1, 0.3 * inch))
    
    # Project Information
    project_info = [
        [t["project"], project["name"]],
        [t["company"], company["name"] if company else "N/A"],
        [t["date"], datetime.utcnow().strftime("%Y-%m-%d %H:%M")],
        [t["tester"], f"{current_user.first_name} {current_user.last_name}" if current_user.first_name else current_user.username]
    ]
    
    info_table = Table(project_info, colWidths=[2*inch, 4*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ecf0f1')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.4 * inch))
    
    # Get test statistics
    suites = await test_suites_collection.find({"project_id": project_id}).to_list(1000)
    suite_ids = [s["id"] for s in suites]
    cases = await test_cases_collection.find({"test_suite_id": {"$in": suite_ids}}).to_list(10000)
    case_ids = [c["id"] for c in cases]
    
    # Build result query
    result_query = {"test_case_id": {"$in": case_ids}}
    if session_id:
        result_query["session_id"] = session_id
    
    results = await test_results_collection.find(result_query).to_list(10000)
    
    # Calculate statistics
    total_tests = len(cases)
    latest_results = {}
    for result in sorted(results, key=lambda x: x["execution_date"], reverse=True):
        case_id = result["test_case_id"]
        if case_id not in latest_results:
            latest_results[case_id] = result
    
    status_counts = {
        "success": 0,
        "error": 0,
        "warning": 0,
        "skipped": 0,
        "untested": 0
    }
    
    for case_id in case_ids:
        if case_id in latest_results:
            status = latest_results[case_id]["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        else:
            status_counts["untested"] += 1
    
    tested_count = total_tests - status_counts["untested"]
    pass_rate = (status_counts["success"] / tested_count * 100) if tested_count > 0 else 0
    
    # Summary Section
    story.append(Paragraph(t["summary"], heading_style))
    
    summary_data = [
        [t["total_tests"], str(total_tests)],
        [t["success"], str(status_counts["success"])],
        [t["error"], str(status_counts["error"])],
        [t["warning"], str(status_counts["warning"])],
        [t["skipped"], str(status_counts["skipped"])],
        [t["untested"], str(status_counts["untested"])],
        [t["pass_rate"], f"{pass_rate:.1f}%"]
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 1.5*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#3498db')),
        ('BACKGROUND', (1, 0), (1, -1), colors.HexColor('#ecf0f1')),
        ('TEXTCOLOR', (0, 0), (0, -1), colors.white),
        ('TEXTCOLOR', (1, 0), (1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey)
    ]))
    story.append(summary_table)
    story.append(PageBreak())
    
    # Test Details
    story.append(Paragraph(t["test_details"], heading_style))
    story.append(Spacer(1, 0.2 * inch))
    
    # Create suite lookup
    suite_lookup = {s["id"]: s["name"] for s in suites}
    
    # Group cases by suite
    for suite in suites:
        suite_cases = [c for c in cases if c["test_suite_id"] == suite["id"]]
        if not suite_cases:
            continue
        
        # Suite header
        story.append(Paragraph(f"<b>{suite['icon']} {suite['name']}</b>", styles['Heading3']))
        story.append(Spacer(1, 0.1 * inch))
        
        # Test cases table
        detail_data = [[t["test_id"], t["test_name"], t["status"], t["notes"][:50] + "..." if len(t.get("notes", "")) > 50 else t.get("notes", "")]]
        
        for case in suite_cases:
            result = latest_results.get(case["id"])
            status_text = result["status"] if result else t["untested"]
            notes_text = result.get("notes", "")[:50] + "..." if result and len(result.get("notes", "")) > 50 else result.get("notes", "") if result else ""
            
            # Color code status
            status_display = status_text
            
            detail_data.append([
                case["test_id"],
                case["name"][:40] + "..." if len(case["name"]) > 40 else case["name"],
                status_display,
                notes_text
            ])
        
        detail_table = Table(detail_data, colWidths=[1*inch, 2.5*inch, 1*inch, 1.5*inch])
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8f9fa')])
        ]))
        story.append(detail_table)
        story.append(Spacer(1, 0.3 * inch))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    # Return as downloadable file
    filename = f"QA_Report_{project['name']}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/summary/{project_id}")
async def get_report_summary(
    project_id: str,
    session_id: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Get report summary data (for preview)"""
    
    # Get test statistics (same logic as PDF generation)
    suites = await test_suites_collection.find({"project_id": project_id}).to_list(1000)
    suite_ids = [s["id"] for s in suites]
    cases = await test_cases_collection.find({"test_suite_id": {"$in": suite_ids}}).to_list(10000)
    case_ids = [c["id"] for c in cases]
    
    result_query = {"test_case_id": {"$in": case_ids}}
    if session_id:
        result_query["session_id"] = session_id
    
    results = await test_results_collection.find(result_query).to_list(10000)
    
    # Calculate statistics
    total_tests = len(cases)
    latest_results = {}
    for result in sorted(results, key=lambda x: x["execution_date"], reverse=True):
        case_id = result["test_case_id"]
        if case_id not in latest_results:
            latest_results[case_id] = result
    
    status_counts = {
        "success": 0,
        "error": 0,
        "warning": 0,
        "skipped": 0,
        "untested": 0
    }
    
    for case_id in case_ids:
        if case_id in latest_results:
            status = latest_results[case_id]["status"]
            status_counts[status] = status_counts.get(status, 0) + 1
        else:
            status_counts["untested"] += 1
    
    tested_count = total_tests - status_counts["untested"]
    pass_rate = (status_counts["success"] / tested_count * 100) if tested_count > 0 else 0
    
    return {
        "total_tests": total_tests,
        "tested": tested_count,
        "untested": status_counts["untested"],
        "success": status_counts["success"],
        "error": status_counts["error"],
        "warning": status_counts["warning"],
        "skipped": status_counts["skipped"],
        "pass_rate": round(pass_rate, 2),
        "total_executions": len(results),
        "last_execution": max([r["execution_date"] for r in results]) if results else None
    }
