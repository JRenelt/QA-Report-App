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
    # pass_rate berechnen (wird nicht mehr verwendet in neuem Design)
    
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
    # Logo - Note: ReportLab Image doesn't support SVG, only PNG/JPG
    logo_added = False
    try:
        if company_logo_url:
            # Check if it's a PNG/JPG URL
            if company_logo_url.startswith('http') and (company_logo_url.endswith('.png') or company_logo_url.endswith('.jpg') or company_logo_url.endswith('.jpeg')):
                logo = Image(company_logo_url, width=2*inch, height=0.8*inch)
                logo.hAlign = 'CENTER'
                story.append(logo)
                story.append(Spacer(1, 0.3*inch))
                logo_added = True
            # Check if it's a base64 PNG/JPG
            elif company_logo_url.startswith('data:image/png') or company_logo_url.startswith('data:image/jpeg') or company_logo_url.startswith('data:image/jpg'):
                if ',' in company_logo_url:
                    header, encoded = company_logo_url.split(',', 1)
                    image_data = base64.b64decode(encoded)
                    logo_buffer = io.BytesIO(image_data)
                    logo = Image(logo_buffer, width=2*inch, height=0.8*inch)
                    logo.hAlign = 'CENTER'
                    story.append(logo)
                    story.append(Spacer(1, 0.3*inch))
                    logo_added = True
            # Skip SVG logos (not supported by ReportLab)
            elif 'svg' in company_logo_url.lower():
                print("SVG Logo übersprungen (nicht unterstützt von ReportLab)")
                # Add company name as text header instead
                company_header = Paragraph(
                    f"<b>{company_name}</b>",
                    ParagraphStyle('CompanyHeader', parent=styles['Heading2'], fontSize=18, alignment=TA_CENTER, textColor=colors.HexColor('#2C3E50'))
                )
                story.append(company_header)
                story.append(Spacer(1, 0.3*inch))
                logo_added = True
    except Exception as e:
        print(f"Logo-Fehler: {e}")
    
    # If no logo was added, add spacer
    if not logo_added:
        story.append(Spacer(1, 0.2*inch))
    
    # Title
    story.append(Paragraph(t["title"], title_style))
    story.append(Paragraph(t["subtitle"], subtitle_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Project Information Box
    info_data = [
        [t["project"] + ":", project["name"]],
        ["Projekt-ID:", project["id"]],
        [t["company"] + ":", company_name],
        ["Testumgebung:", project.get("test_environment", "Nicht angegeben")],
        ["Test-Methodik:", project.get("test_methodology", "Nicht angegeben")],
        ["Testobjekt:", project.get("test_object", "Nicht angegeben")],
        ["Ziel des Tests:", project.get("test_goal", "Nicht angegeben")],
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
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 12),
        ('RIGHTPADDING', (0, 0), (-1, -1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDC3C7'))
    ]))
    story.append(info_table)
    story.append(Spacer(1, 0.2*inch))
    
    # === EXECUTIVE SUMMARY - KOMPAKT ===
    story.append(Paragraph(t["executive_summary"], heading_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Zusammenfassender Text
    untested = status_counts["pending"] + status_counts["skipped"]
    summary_text = f"{status_counts['success']} von {total_tests} Testfällen bestanden. "
    if status_counts['error'] > 0:
        summary_text += f"Es wurden {status_counts['error']} kritische Fehler festgestellt. "
    if untested > 0:
        summary_text += f"{untested} Testfälle wurden nicht geprüft."
    else:
        summary_text += "Alle Testfälle wurden geprüft."
    
    summary_para = Paragraph(
        summary_text,
        ParagraphStyle('SummaryText', parent=styles['Normal'], fontSize=11, textColor=colors.HexColor('#2C3E50'), spaceAfter=10)
    )
    story.append(summary_para)
    story.append(Spacer(1, 0.15*inch))
    
    # Große Zahlen-Karten in einer Zeile (5 Spalten)
    card_data = [[
        Paragraph(f"<para align=center><font size=32 color='#2C3E50'><b>{total_tests}</b></font><br/><font size=9 color='#7F8C8D'>Gesamt</font></para>", body_style),
        Paragraph(f"<para align=center><font size=32 color='#4CAF50'><b>{status_counts['success']}</b></font><br/><font size=9 color='#7F8C8D'>✓ Bestanden</font></para>", body_style),
        Paragraph(f"<para align=center><font size=32 color='#F44336'><b>{status_counts['error']}</b></font><br/><font size=9 color='#7F8C8D'>✗ Fehler</font></para>", body_style),
        Paragraph(f"<para align=center><font size=32 color='#FF9800'><b>{status_counts['warning']}</b></font><br/><font size=9 color='#7F8C8D'>⚠ Warnung</font></para>", body_style),
        Paragraph(f"<para align=center><font size=32 color='#9E9E9E'><b>{untested}</b></font><br/><font size=9 color='#7F8C8D'>⏸ Ungeprüft</font></para>", body_style)
    ]]
    
    card_table = Table(card_data, colWidths=[3.2*cm, 3.2*cm, 3.2*cm, 3.2*cm, 3.2*cm])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.white),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#BDC3C7')),
        ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor('#E0E0E0')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 15),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 15)
    ]))
    story.append(card_table)
    story.append(Spacer(1, 0.25*inch))
    
    # === TEST DETAILS ===
    story.append(Paragraph(t["test_details"], heading_style))
    story.append(Spacer(1, 0.1*inch))
    
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
            ('FONTSIZE', (0, 0), (-1, -1), 7),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8F9FA')])
        ]))
        story.append(detail_table)
        story.append(Spacer(1, 0.2*inch))
    
    # === CONCLUSION ===
    story.append(PageBreak())
    story.append(Paragraph(t["conclusion"], heading_style))
    story.append(Spacer(1, 0.1*inch))
    
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
    # Format: QA-Report_PROJEKTNAME_IDXXXX_TT-MM-YY.pdf
    report_type_suffix = "_getestet" if tested_only else "_alle"
    project_name_clean = project['name'].replace(" ", "_").replace("/", "-")
    project_id_short = project['id'][:8]  # Erste 8 Zeichen der UUID
    date_german = datetime.utcnow().strftime('%d-%m-%y')  # TT-MM-YY Format
    
    filename = f"QA-Report_{project_name_clean}_{project_id_short}_{date_german}.pdf"
    
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
    # pass_rate berechnen (wird nicht mehr verwendet in neuem Design)
    
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
