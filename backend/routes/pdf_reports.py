"""
PDF Report Generation Routes
"""

import io
from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from database import database
from models import User
from auth import get_current_user

router = APIRouter()

@router.get("/generate-report")
async def generate_qa_report(
    project_id: int = Query(..., description="Projekt ID für den Bericht"),
    include_results: bool = Query(True, description="Test-Ergebnisse einschließen"),
    report_type: str = Query("complete", description="Berichtstyp: complete, tested_only, summary"),
    language: str = Query("de", description="Sprache: de, en"),
    current_user: User = Depends(get_current_user)
):
    """Generate comprehensive QA PDF report"""
    
    # Get project data with permissions check
    project = await _get_project_with_permissions(project_id, current_user)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Projekt nicht gefunden oder keine Berechtigung"
        )
    
    # Get test data
    test_data = await _get_test_data_for_report(
        project_id, 
        include_results, 
        report_type
    )
    
    # Generate PDF
    buffer = io.BytesIO()
    pdf_content = await _generate_pdf_document(
        buffer, 
        project, 
        test_data, 
        current_user, 
        language
    )
    
    # Prepare filename
    timestamp = datetime.now().strftime('%Y%m%d-%H%M')
    filename = f"QA-Bericht-{project['name']}-{timestamp}.pdf"
    
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/test-execution-report")
async def generate_test_execution_report(
    session_id: str = Query(..., description="Test Session ID"),
    current_user: User = Depends(get_current_user)
):
    """Generate test execution report for specific session"""
    
    # Get session data
    session_data = await _get_session_data(session_id, current_user)
    if not session_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test-Session nicht gefunden"
        )
    
    # Generate PDF
    buffer = io.BytesIO()
    pdf_content = await _generate_execution_report_pdf(
        buffer, 
        session_data, 
        current_user
    )
    
    filename = f"Test-Ausführung-{session_id}-{datetime.now().strftime('%Y%m%d-%H%M')}.pdf"
    
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Helper Functions

async def _get_project_with_permissions(project_id: int, current_user: User) -> Optional[Dict]:
    """Get project data with permission check"""
    query = """
        SELECT p.*, c.name as company_name
        FROM projects p
        JOIN companies c ON p.company_id = c.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE p.id = :project_id 
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
    """
    
    result = await database.fetch_one(query, {
        "project_id": project_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    return dict(result) if result else None

async def _get_test_data_for_report(
    project_id: int, 
    include_results: bool, 
    report_type: str
) -> Dict[str, Any]:
    """Get comprehensive test data for PDF report"""
    
    # Get test suites
    suites_query = """
        SELECT id, name, description, icon, sort_order
        FROM test_suites
        WHERE project_id = :project_id
        ORDER BY sort_order, name
    """
    suites = await database.fetch_all(suites_query, {"project_id": project_id})
    
    # Get test cases
    cases_query = """
        SELECT tc.*, ts.name as suite_name, ts.icon as suite_icon
        FROM test_cases tc
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        WHERE ts.project_id = :project_id
        ORDER BY ts.sort_order, tc.sort_order
    """
    cases = await database.fetch_all(cases_query, {"project_id": project_id})
    
    test_data = {
        "suites": [dict(suite) for suite in suites],
        "cases": [dict(case) for case in cases],
        "results": []
    }
    
    if include_results:
        # Get test results
        results_query = """
            SELECT tr.*, tc.test_id, tc.name as test_name, 
                   ts.name as suite_name, ts.icon as suite_icon
            FROM test_results tr
            JOIN test_cases tc ON tr.test_case_id = tc.id
            JOIN test_suites ts ON tc.test_suite_id = ts.id
            WHERE ts.project_id = :project_id
        """
        
        if report_type == "tested_only":
            results_query += " AND tr.status != 'not_tested'"
        
        results_query += " ORDER BY ts.sort_order, tc.sort_order, tr.execution_date DESC"
        
        results = await database.fetch_all(results_query, {"project_id": project_id})
        test_data["results"] = [dict(result) for result in results]
    
    return test_data

async def _generate_pdf_document(
    buffer: io.BytesIO, 
    project: Dict, 
    test_data: Dict, 
    current_user: User, 
    language: str
) -> bytes:
    """Generate PDF document with reportlab"""
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=3*cm,
        bottomMargin=2*cm
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=30,
        alignment=TA_CENTER,
        textColor=colors.HexColor('#1f2937')
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        spaceAfter=12,
        spaceBefore=20,
        textColor=colors.HexColor('#374151')
    )
    
    content = []
    
    # Title Page
    content.append(Paragraph("📋 QA-Bericht", title_style))
    content.append(Spacer(1, 20))
    
    # Project Information
    project_info = [
        ['Projekt:', project['name']],
        ['Unternehmen:', project['company_name']],
        ['Berichtstyp:', project['template_type']],
        ['Status:', project['status']],
        ['Erstellt von:', f"{current_user.first_name} {current_user.last_name}"],
        ['Erstellungsdatum:', datetime.now().strftime('%d.%m.%Y %H:%M')]
    ]
    
    project_table = Table(project_info, colWidths=[4*cm, 10*cm])
    project_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    content.append(project_table)
    content.append(Spacer(1, 30))
    
    # Test Overview
    content.append(Paragraph("📊 Gesamtübersicht", heading_style))
    
    # Summary statistics
    total_suites = len(test_data['suites'])
    total_cases = len(test_data['cases'])
    
    if test_data['results']:
        status_counts = {}
        for result in test_data['results']:
            status = result['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        
        summary_data = [
            ['Test-Bereiche:', str(total_suites)],
            ['Testfälle gesamt:', str(total_cases)],
            ['Erfolgreich:', str(status_counts.get('passed', 0))],
            ['Fehlgeschlagen:', str(status_counts.get('failed', 0))],
            ['Übersprungen:', str(status_counts.get('skipped', 0))],
            ['Noch nicht getestet:', str(status_counts.get('not_tested', 0))]
        ]
    else:
        summary_data = [
            ['Test-Bereiche:', str(total_suites)],
            ['Testfälle gesamt:', str(total_cases)],
            ['Status:', 'Noch keine Test-Ergebnisse vorhanden']
        ]
    
    summary_table = Table(summary_data, colWidths=[6*cm, 4*cm])
    summary_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 11),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6'))
    ]))
    
    content.append(summary_table)
    content.append(PageBreak())
    
    # Test Suites and Cases
    for suite in test_data['suites']:
        content.append(Paragraph(f"{suite.get('icon', '📁')} {suite['name']}", heading_style))
        
        if suite['description']:
            content.append(Paragraph(suite['description'], styles['Normal']))
        
        content.append(Spacer(1, 10))
        
        # Get cases for this suite
        suite_cases = [case for case in test_data['cases'] if case['suite_name'] == suite['name']]
        
        if suite_cases:
            case_table_data = [['ID', 'Testfall', 'Priorität', 'Status']]
            
            for case in suite_cases:
                # Find latest result for this case
                case_results = [r for r in test_data['results'] if r['test_case_id'] == case['id']]
                latest_result = case_results[0] if case_results else None
                
                status_text = "Nicht getestet"
                if latest_result:
                    status_map = {
                        'passed': '✅ Bestanden',
                        'failed': '❌ Fehlgeschlagen', 
                        'skipped': '⏭️ Übersprungen',
                        'not_tested': 'Nicht getestet'
                    }
                    status_text = status_map.get(latest_result['status'], latest_result['status'])
                
                case_table_data.append([
                    case['test_id'],
                    case['name'][:50] + '...' if len(case['name']) > 50 else case['name'],
                    str(case['priority']),
                    status_text
                ])
            
            case_table = Table(case_table_data, colWidths=[2*cm, 8*cm, 2*cm, 3*cm])
            case_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5e7eb')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP')
            ]))
            
            content.append(case_table)
        
        content.append(Spacer(1, 20))
    
    # Build PDF
    doc.build(content)
    return buffer.getvalue()

async def _get_session_data(session_id: str, current_user: User) -> Optional[Dict]:
    """Get test session data for execution report"""
    query = """
        SELECT tr.*, tc.test_id, tc.name as test_name, 
               ts.name as suite_name, p.name as project_name
        FROM test_results tr
        JOIN test_cases tc ON tr.test_case_id = tc.id
        JOIN test_suites ts ON tc.test_suite_id = ts.id
        JOIN projects p ON ts.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE tr.session_id = :session_id
          AND (p.created_by = :user_id OR pu.user_id = :user_id OR :user_role = 'admin')
        ORDER BY tr.execution_date
    """
    
    results = await database.fetch_all(query, {
        "session_id": session_id,
        "user_id": current_user.id,
        "user_role": current_user.role
    })
    
    if not results:
        return None
    
    return {
        "session_id": session_id,
        "project_name": results[0]["project_name"],
        "results": [dict(result) for result in results]
    }

async def _generate_execution_report_pdf(
    buffer: io.BytesIO, 
    session_data: Dict, 
    current_user: User
) -> bytes:
    """Generate test execution report PDF"""
    
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    styles = getSampleStyleSheet()
    content = []
    
    # Title
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=16,
        alignment=TA_CENTER
    )
    
    content.append(Paragraph("🔍 Test-Ausführungsbericht", title_style))
    content.append(Spacer(1, 20))
    
    # Session Info
    session_info = [
        ['Session ID:', session_data['session_id']],
        ['Projekt:', session_data['project_name']],
        ['Ausgeführt von:', f"{current_user.first_name} {current_user.last_name}"],
        ['Bericht erstellt:', datetime.now().strftime('%d.%m.%Y %H:%M')]
    ]
    
    info_table = Table(session_info, colWidths=[4*cm, 8*cm])
    info_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 12),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
    ]))
    
    content.append(info_table)
    content.append(Spacer(1, 20))
    
    # Results table
    results_data = [['Test-ID', 'Test', 'Status', 'Datum/Zeit', 'Notizen']]
    
    for result in session_data['results']:
        status_map = {
            'passed': '✅ Bestanden',
            'failed': '❌ Fehlgeschlagen',
            'skipped': '⏭️ Übersprungen'
        }
        
        results_data.append([
            result['test_id'],
            result['test_name'][:30] + '...' if len(result['test_name']) > 30 else result['test_name'],
            status_map.get(result['status'], result['status']),
            result['execution_date'].strftime('%d.%m.%Y %H:%M'),
            result['notes'][:20] + '...' if result['notes'] and len(result['notes']) > 20 else (result['notes'] or '')
        ])
    
    results_table = Table(results_data, colWidths=[2*cm, 5*cm, 2.5*cm, 2.5*cm, 3*cm])
    results_table.setStyle(TableStyle([
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#e5e7eb')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    
    content.append(results_table)
    
    doc.build(content)
    return buffer.getvalue()