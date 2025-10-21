"""
PDF Report Generation Routes - Modern Professional Design
Supports Company Logo, Executive Summary, Dynamic Conclusions
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from typing import Optional
from datetime import datetime
import io
import base64
import urllib.request
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, 
    Spacer, PageBreak, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

from database import (
    projects_collection, 
    test_suites_collection, 
    test_cases_collection,
    companies_collection
)
from models import User
from auth import get_current_user

router = APIRouter()

# Default ID2 Logo for white background
DEFAULT_LOGO_URL = "https://customer-assets.emergentagent.com/job_test-result-dash/artifacts/fc0bo5xn_image.png"

def calculate_conclusion(status_counts: dict, total_tests: int, tested_count: int) -> tuple:
    """
    Berechnet intelligentes Fazit basierend auf Testergebnissen
    Returns: (fazit_titel, fazit_text, empfehlung, farbe)
    """
    if tested_count == 0:
        return (
            "⚠️ KEINE TESTS DURCHGEFÜHRT",
            "Es wurden keine Tests durchgeführt. Das System wurde nicht getestet.",
            "Das Testing muss vollständig durchgeführt werden, bevor eine Freigabe erfolgen kann.",
            colors.HexColor('#FF9800')  # Orange
        )
    
    success_rate = (status_counts["success"] / tested_count * 100) if tested_count > 0 else 0
    failed_tests = status_counts["error"]
    warning_tests = status_counts["warning"]
    
    if success_rate == 100 and failed_tests == 0:
        return (
            "✅ SYSTEM BEREIT FÜR FREIGABE",
            f"Alle {tested_count} durchgeführten Tests waren erfolgreich. Das System funktioniert einwandfrei.",
            "Das System kann für die Produktionsumgebung freigegeben werden.",
            colors.HexColor('#4CAF50')  # Grün
        )
    elif success_rate >= 95 and failed_tests == 0:
        return (
            "✓ ÜBERWIEGEND POSITIV",
            f"{status_counts['success']} von {tested_count} Tests erfolgreich ({success_rate:.1f}%). {warning_tests} Warnung(en) vorhanden.",
            "Kleinere Optimierungen empfohlen. Warnungen sollten vor Freigabe geprüft werden.",
            colors.HexColor('#8BC34A')  # Hellgrün
        )
    elif success_rate >= 80:
        return (
            "⚠️ NACHBESSERUNGEN ERFORDERLICH",
            f"{status_counts['success']} von {tested_count} Tests erfolgreich ({success_rate:.1f}%). {failed_tests} Fehler, {warning_tests} Warnung(en).",
            "Fehler müssen behoben und erneut getestet werden. Freigabe noch nicht empfohlen.",
            colors.HexColor('#FF9800')  # Orange
        )
    else:
        return (
            "❌ KRITISCHE FEHLER",
            f"Nur {status_counts['success']} von {tested_count} Tests erfolgreich ({success_rate:.1f}%). {failed_tests} kritische Fehler gefunden.",
            "Umfangreiches Re-Testing erforderlich. System NICHT freigabefähig.",
            colors.HexColor('#F44336')  # Rot
        )


@router.get("/generate/{project_id}")
async def generate_pdf_report(
    project_id: str,
    tested_only: bool = False,  # PDF2: nur getestete Testfälle
    session_id: Optional[str] = None,
    language: str = "DE",
    current_user: User = Depends(get_current_user)
):
    """
    Generate modern, professional PDF test report
    tested_only=False: PDF1 (alle Testfälle)
    tested_only=True: PDF2 (nur getestete Testfälle)
    """
    
    # Get project
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get company
    company = await companies_collection.find_one({"id": project["company_id"]})
    company_name = company["name"] if company else "N/A"
    company_logo_url = company.get("logo_url") if company else DEFAULT_LOGO_URL
    
    # Use default logo if company has none
    if not company_logo_url:
        company_logo_url = DEFAULT_LOGO_URL
    
    # Translations
    trans = {
        "DE": {
            "title": "QA-TESTBERICHT",
            "subtitle": "Qualitätssicherung & Testing",
            "project": "Projekt",
            "company": "Firma",
            "date": "Berichtsdatum",
            "tester": "Getestet von",
            "report_type": "Berichtstyp",
            "all_tests": "Alle Testfälle",
            "tested_only": "Nur getestete Testfälle",
            "executive_summary": "EXECUTIVE SUMMARY",
            "total_tests": "Gesamtanzahl Tests",
            "tested": "Getestet",
            "success": "Erfolgreich",
            "error": "Fehler",
            "warning": "Warnung",
            "skipped": "Übersprungen",
            "pending": "Ausstehend",
            "pass_rate": "Erfolgsrate",
            "test_details": "TESTFALL-DETAILS",
            "test_id": "Test-ID",
            "test_name": "Testfall",
            "status": "Status",
            "priority": "Prio",
            "note": "Notiz",
            "suite": "Suite",
            "conclusion": "FAZIT UND EMPFEHLUNGEN",
            "conclusion_title": "Fazit",
            "recommendation": "Empfehlung",
            "page": "Seite"
        },
        "ENG": {
            "title": "QA TEST REPORT",
            "subtitle": "Quality Assurance & Testing",
            "project": "Project",
            "company": "Company",
            "date": "Report Date",
            "tester": "Tested by",
            "report_type": "Report Type",
            "all_tests": "All Test Cases",
            "tested_only": "Tested Cases Only",
            "executive_summary": "EXECUTIVE SUMMARY",
            "total_tests": "Total Tests",
            "tested": "Tested",
            "success": "Success",
            "error": "Error",
            "warning": "Warning",
            "skipped": "Skipped",
            "pending": "Pending",
            "pass_rate": "Pass Rate",
            "test_details": "TEST CASE DETAILS",
            "test_id": "Test ID",
            "test_name": "Test Case",
            "status": "Status",
            "priority": "Priority",
            "note": "Note",
            "suite": "Suite",
            "conclusion": "CONCLUSION & RECOMMENDATIONS",
            "conclusion_title": "Conclusion",
            "recommendation": "Recommendation",
            "page": "Page"
        }
    }
    
    t = trans.get(language, trans["DE"])
    
    # Get test statistics
    suites = await test_suites_collection.find({"project_id": project_id}).to_list(1000)
    suite_ids = [s["id"] for s in suites]
    all_cases = await test_cases_collection.find({"test_suite_id": {"$in": suite_ids}}).to_list(10000)
    
    # Calculate statistics based on test case status field
    status_counts = {
        "success": 0,
        "error": 0,
        "warning": 0,
        "skipped": 0,
        "pending": 0
    }
    
    for case in all_cases:
        case_status = case.get("status", "pending")
        if case_status in status_counts:
            status_counts[case_status] += 1
        else:
            status_counts["pending"] += 1
    
    # Filter cases for PDF2 (tested_only)
    if tested_only:
        cases = [c for c in all_cases if c.get("status") not in ["pending", "skipped", None]]
    else:
        cases = all_cases
    
    total_tests = len(all_cases)
    tested_count = status_counts["success"] + status_counts["error"] + status_counts["warning"]
    pass_rate = (status_counts["success"] / tested_count * 100) if tested_count > 0 else 0
    
    # Get dynamic conclusion
    fazit_title, fazit_text, recommendation, fazit_color = calculate_conclusion(
        status_counts, total_tests, tested_count
    )
    
    # Create PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2*cm,
        bottomMargin=2*cm
    )
    story = []
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Custom Styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=28,
        textColor=colors.HexColor('#2C3E50'),
        spaceAfter=8,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        textColor=colors.HexColor('#7F8C8D'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#34495E'),
        spaceBefore=20,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#2C3E50'),
        spaceAfter=6,
        alignment=TA_JUSTIFY
    )
    
    # === HEADER SECTION ===
    # Logo
    try:
        if company_logo_url.startswith('data:image'):
            # Base64 image
            image_data = base64.b64decode(company_logo_url.split(',')[1])
            logo_buffer = io.BytesIO(image_data)
            logo = Image(logo_buffer, width=2*inch, height=0.8*inch)
        else:
            # URL image
            logo = Image(company_logo_url, width=2*inch, height=0.8*inch)
        logo.hAlign = 'CENTER'
        story.append(logo)
        story.append(Spacer(1, 0.3*inch))
    except Exception as e:
        print(f"Logo konnte nicht geladen werden: {e}")
        story.append(Spacer(1, 0.2*inch))
    
    # Title
    story.append(Paragraph(t["title"], title_style))
    story.append(Paragraph(t["subtitle"], subtitle_style))
    
    # Project Information Box
    info_data = [
        [t["project"] + ":", project["name"]],
        [t["company"] + ":", company_name],
        [t["date"] + ":", datetime.utcnow().strftime("%d.%m.%Y %H:%M")],
        [t["tester"] + ":", f"{current_user.first_name} {current_user.last_name}" if current_user.first_name else current_user.username],
        [t["report_type"] + ":", t["tested_only"] if tested_only else t["all_tests"]]
    ]
    
    info_table = Table(info_data, colWidths=[4*cm, 12*cm])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (0, -1), 'RIGHT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDC3C7'))
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.5*inch))
    
    # === EXECUTIVE SUMMARY ===
    story.append(Paragraph(t["executive_summary"], heading_style))
    
    # Statistics in 2-column layout
    summary_data = [
        [
            Paragraph(f"<b>{t['total_tests']}</b><br/><font size=20>{total_tests}</font>", body_style),
            Paragraph(f"<b>{t['tested']}</b><br/><font size=20>{tested_count}</font>", body_style),
            Paragraph(f"<b>{t['success']}</b><br/><font size=20 color='#4CAF50'>{status_counts['success']}</font>", body_style)
        ],
        [
            Paragraph(f"<b>{t['error']}</b><br/><font size=20 color='#F44336'>{status_counts['error']}</font>", body_style),
            Paragraph(f"<b>{t['warning']}</b><br/><font size=20 color='#FF9800'>{status_counts['warning']}</font>", body_style),
            Paragraph(f"<b>{t['pass_rate']}</b><br/><font size=20>{pass_rate:.1f}%</font>", body_style)
        ]
    ]
    
    summary_table = Table(summary_data, colWidths=[5.3*cm, 5.3*cm, 5.3*cm])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8F9FA')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDC3C7'))
    ]))
    story.append(summary_table)
    story.append(PageBreak())
    
    # === TEST DETAILS ===
    story.append(Paragraph(t["test_details"], heading_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Group cases by suite
    for suite in suites:
        suite_cases = [c for c in cases if c["test_suite_id"] == suite["id"]]
        if not suite_cases:
            continue
        
        # Suite header
        suite_header = Paragraph(
            f"<b>{suite.get('icon', '📁')} {suite['name']}</b> ({len(suite_cases)} Tests)", 
            ParagraphStyle('SuiteHeader', parent=styles['Heading3'], fontSize=12, textColor=colors.HexColor('#34495E'))
        )
        story.append(suite_header)
        story.append(Spacer(1, 0.1*inch))
        
        # Test cases table - Spalten-Ansicht
        detail_data = [[
            Paragraph(f"<b>{t['test_id']}</b>", body_style),
            Paragraph(f"<b>{t['test_name']}</b>", body_style),
            Paragraph(f"<b>{t['status']}</b>", body_style),
            Paragraph(f"<b>{t['note']}</b>", body_style)
        ]]
        
        for case in suite_cases:
            case_status = case.get("status", "pending")
            case_note = case.get("note", "")
            case_name = case.get("name") or case.get("title", "N/A")  # Support both fields
            
            # Status mit Farbe
            status_color = {
                "success": "#4CAF50",
                "error": "#F44336",
                "warning": "#FF9800",
                "pending": "#9E9E9E",
                "skipped": "#607D8B"
            }.get(case_status, "#9E9E9E")
            
            # Kurze Notiz (max 60 Zeichen)
            short_note = case_note[:60] + "..." if len(case_note) > 60 else case_note
            
            detail_data.append([
                Paragraph(case.get("test_id", "N/A"), body_style),
                Paragraph(case_name[:50] + "..." if len(case_name) > 50 else case_name, body_style),
                Paragraph(f"<font color='{status_color}'><b>{case_status.upper()}</b></font>", body_style),
                Paragraph(short_note, body_style)
            ])
        
        detail_table = Table(detail_data, colWidths=[2.5*cm, 7*cm, 2.5*cm, 4*cm])
        detail_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#34495E')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 8),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')])
        ]))
        story.append(detail_table)
        story.append(Spacer(1, 0.3*inch))
    
    # === CONCLUSION ===
    story.append(PageBreak())
    story.append(Paragraph(t["conclusion"], heading_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Fazit Box
    conclusion_data = [
        [Paragraph(f"<b>{fazit_title}</b>", body_style)],
        [Paragraph(fazit_text, body_style)],
        [Paragraph(f"<b>{t['recommendation']}:</b> {recommendation}", body_style)]
    ]
    
    conclusion_table = Table(conclusion_data, colWidths=[16*cm])
    conclusion_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), fazit_color),
        ('BACKGROUND', (0, 1), (0, -1), colors.white),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
        ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 12),
        ('FONTSIZE', (0, 1), (0, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 12),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
        ('LEFTPADDING', (0, 0), (-1, -1), 15),
        ('RIGHTPADDING', (0, 0), (-1, -1), 15),
        ('GRID', (0, 0), (-1, -1), 1, fazit_color)
    ]))
    story.append(conclusion_table)
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    
    # Return as downloadable file
    report_type_suffix = "_getestet" if tested_only else "_alle"
    filename = f"QA_Bericht_{project['name']}{report_type_suffix}_{datetime.utcnow().strftime('%Y%m%d')}.pdf"
    filename = filename.replace(" ", "_")  # Leerzeichen entfernen
    
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
    
    # Get test statistics
    suites = await test_suites_collection.find({"project_id": project_id}).to_list(1000)
    suite_ids = [s["id"] for s in suites]
    all_cases = await test_cases_collection.find({"test_suite_id": {"$in": suite_ids}}).to_list(10000)
    
    # Calculate statistics
    status_counts = {
        "success": 0,
        "error": 0,
        "warning": 0,
        "skipped": 0,
        "pending": 0
    }
    
    for case in all_cases:
        case_status = case.get("status", "pending")
        if case_status in status_counts:
            status_counts[case_status] += 1
        else:
            status_counts["pending"] += 1
    
    total_tests = len(all_cases)
    tested_count = status_counts["success"] + status_counts["error"] + status_counts["warning"]
    pass_rate = (status_counts["success"] / tested_count * 100) if tested_count > 0 else 0
    
    return {
        "total_tests": total_tests,
        "tested": tested_count,
        "untested": status_counts["pending"] + status_counts["skipped"],
        "success": status_counts["success"],
        "error": status_counts["error"],
        "warning": status_counts["warning"],
        "skipped": status_counts["skipped"],
        "pending": status_counts["pending"],
        "pass_rate": round(pass_rate, 2)
    }
