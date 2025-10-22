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
    
    # === HEADER SECTION - NEU GESTALTET ===
    # Logo - Falls SVG (nicht unterstützt), zeige "P" als Text-Logo
    logo_added = False
    try:
        if company_logo_url:
            # Check if it's a PNG/JPG URL
            if company_logo_url.startswith('http') and (company_logo_url.endswith('.png') or company_logo_url.endswith('.jpg') or company_logo_url.endswith('.jpeg')):
                logo = Image(company_logo_url, width=1.5*inch, height=0.6*inch)
                logo.hAlign = 'LEFT'
                story.append(logo)
                story.append(Spacer(1, 0.1*inch))
                logo_added = True
            # Check if it's a base64 PNG/JPG
            elif company_logo_url.startswith('data:image/png') or company_logo_url.startswith('data:image/jpeg') or company_logo_url.startswith('data:image/jpg'):
                if ',' in company_logo_url:
                    header, encoded = company_logo_url.split(',', 1)
                    image_data = base64.b64decode(encoded)
                    logo_buffer = io.BytesIO(image_data)
                    logo = Image(logo_buffer, width=1.5*inch, height=0.6*inch)
                    logo.hAlign = 'LEFT'
                    story.append(logo)
                    story.append(Spacer(1, 0.1*inch))
                    logo_added = True
            # SVG logos: Zeige "P" als Text-Logo
            elif 'svg' in company_logo_url.lower():
                print(f"SVG Logo - verwende Text-Platzhalter 'P'")
                # Text-Logo "P" in einer Box
                logo_p = Paragraph(
                    "<para align=center><font size=36 color='#2C3E50'><b>P</b></font></para>",
                    ParagraphStyle('LogoP', parent=styles['Normal'], fontSize=36, alignment=TA_CENTER)
                )
                logo_table = Table([[logo_p]], colWidths=[2*cm], rowHeights=[2*cm])
                logo_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#ECF0F1')),
                    ('BOX', (0, 0), (0, 0), 2, colors.HexColor('#BDC3C7')),
                    ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                    ('VALIGN', (0, 0), (0, 0), 'MIDDLE')
                ]))
                logo_table.hAlign = 'LEFT'
                story.append(logo_table)
                story.append(Spacer(1, 0.1*inch))
                logo_added = True
    except Exception as e:
        print(f"Logo-Fehler: {e}")
    
    # Falls kein Logo, zeige "P" als Fallback
    if not logo_added:
        logo_p = Paragraph(
            "<para align=center><font size=36 color='#2C3E50'><b>P</b></font></para>",
            ParagraphStyle('LogoP', parent=styles['Normal'], fontSize=36, alignment=TA_CENTER)
        )
        logo_table = Table([[logo_p]], colWidths=[2*cm], rowHeights=[2*cm])
        logo_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#ECF0F1')),
            ('BOX', (0, 0), (0, 0), 2, colors.HexColor('#BDC3C7')),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('VALIGN', (0, 0), (0, 0), 'MIDDLE')
        ]))
        logo_table.hAlign = 'LEFT'
        story.append(logo_table)
        story.append(Spacer(1, 0.1*inch))
    
    # Header Layout: 2-Spalten (Links: Titel & Info, Rechts: Datum)
    header_left = []
    header_left.append(Paragraph(
        "<b>QA-Report</b>",
        ParagraphStyle('ReportTitle', parent=styles['Heading1'], fontSize=22, textColor=colors.HexColor('#2C3E50'), spaceAfter=4)
    ))
    header_left.append(Paragraph(
        f"<b>{company_name}</b>",
        ParagraphStyle('CompanySubtitle', parent=styles['Normal'], fontSize=12, textColor=colors.HexColor('#34495E'), spaceAfter=8)
    ))
    header_left.append(Paragraph(
        f"<b>Getestet von:</b> {current_user.first_name} {current_user.last_name}" if current_user.first_name else f"<b>Getestet von:</b> {current_user.username}",
        ParagraphStyle('TesterInfo', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#2C3E50'))
    ))
    header_left.append(Paragraph(
        f"<b>Test Umgebung:</b> {project.get('test_environment', 'Nicht angegeben')}",
        ParagraphStyle('TestEnv', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#2C3E50'))
    ))
    header_left.append(Paragraph(
        f"<b>Test Methodik:</b> {project.get('test_methodology', 'Nicht angegeben')}",
        ParagraphStyle('TestMeth', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#2C3E50'))
    ))
    
    header_right = []
    header_right.append(Paragraph(
        f"<b>Erstellungsdatum</b> | {datetime.utcnow().strftime('%d.%m.%Y')}",
        ParagraphStyle('DateRight', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#2C3E50'), alignment=TA_RIGHT)
    ))
    
    # Header Table (2 columns: left & right aligned)
    header_data = [[header_left, header_right]]
    header_table = Table(header_data, colWidths=[10*cm, 6*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT')
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.2*inch))
    
    # Project Info Tables: 2 columns side by side
    # Left Table
    left_info_data = [
        [Paragraph("<b>Projekt</b>", body_style), Paragraph(project["name"], body_style)],
        [Paragraph("<b>Test objekt</b>", body_style), Paragraph(project.get("test_object", "Nicht angegeben"), body_style)],
        [Paragraph("<b>Ziel des Testes</b>", body_style), Paragraph(project.get("test_goal", "Nicht angegeben"), body_style)]
    ]
    
    left_table = Table(left_info_data, colWidths=[3.5*cm, 6*cm])
    left_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (0, -1), 'LEFT'),
        ('ALIGN', (1, 0), (1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDC3C7'))
    ]))
    
    # Right Table
    # Version Format: v1.0.2 [project_id_first_4_chars]
    project_id_short = project['id'][:4]
    version_string = f"v1.0.2 {project_id_short}"
    
    right_info_data = [
        [Paragraph("<b>Version</b>", body_style), Paragraph(version_string, body_style)],
        [Paragraph("<b>Projekt ID</b>", body_style), Paragraph(project['id'][:8], body_style)]
    ]
    
    right_table = Table(right_info_data, colWidths=[2.5*cm, 3.5*cm])
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#BDC3C7'))
    ]))
    
    # Combine both tables side by side mit MEHR ABSTAND
    combined_info_data = [[left_table, Spacer(1.5*cm, 0), right_table]]
    combined_table = Table(combined_info_data, colWidths=[9.5*cm, 1.5*cm, 5*cm])
    combined_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP')
    ]))
    story.append(combined_table)
    story.append(Spacer(1, 0.3*inch))
    
    # === EXECUTIVE SUMMARY - KOMPAKT & PROFESSIONELL ===
    story.append(Paragraph(t["executive_summary"], heading_style))
    story.append(Spacer(1, 0.1*inch))
    
    # Kompakter Zusammenfassungstext in einer Zeile
    untested = status_counts["pending"] + status_counts["skipped"]
    
    # Kurze, prägnante Zusammenfassung
    if tested_count == 0:
        summary_text = f"<b>Status:</b> Keine Tests durchgeführt. {total_tests} Testfälle vorhanden, 0 geprüft."
    elif status_counts['error'] == 0 and status_counts['warning'] == 0 and tested_count == total_tests:
        summary_text = f"<b>Status:</b> Alle {total_tests} Testfälle erfolgreich bestanden. System bereit für Freigabe."
    elif status_counts['error'] > 0:
        summary_text = f"<b>Status:</b> {status_counts['success']} von {tested_count} Tests bestanden. {status_counts['error']} Fehler festgestellt. {untested} ungeprüft."
    else:
        summary_text = f"<b>Status:</b> {status_counts['success']} von {tested_count} Tests bestanden. {status_counts['warning']} Warnungen. {untested} ungeprüft."
    
    summary_para = Paragraph(
        summary_text,
        ParagraphStyle('SummaryText', parent=styles['Normal'], fontSize=10, textColor=colors.HexColor('#2C3E50'), spaceAfter=6, alignment=TA_LEFT)
    )
    story.append(summary_para)
    story.append(Spacer(1, 0.15*inch))
    
    # Professionelle Zahlen-Karten in einer Zeile (5 Spalten) - RICHTIG ZENTRIERT
    # Einfache Struktur mit fester Höhe und Zentrierung
    
    card_data = [[
        Paragraph(f"<para align=center><font size=36 color='#34495E'><b>{total_tests}</b></font><br/><br/><font size=8 color='#7F8C8D'><b>GESAMT</b></font></para>", body_style),
        Paragraph(f"<para align=center><font size=36 color='#27AE60'><b>{status_counts['success']}</b></font><br/><br/><font size=8 color='#27AE60'><b>✓ BESTANDEN</b></font></para>", body_style),
        Paragraph(f"<para align=center><font size=36 color='#E74C3C'><b>{status_counts['error']}</b></font><br/><br/><font size=8 color='#E74C3C'><b>✗ FEHLER</b></font></para>", body_style),
        Paragraph(f"<para align=center><font size=36 color='#F39C12'><b>{status_counts['warning']}</b></font><br/><br/><font size=8 color='#F39C12'><b>⚠ WARNUNG</b></font></para>", body_style),
        Paragraph(f"<para align=center><font size=36 color='#95A5A6'><b>{untested}</b></font><br/><br/><font size=8 color='#95A5A6'><b>⏸ OFFEN</b></font></para>", body_style)
    ]]
    
    card_table = Table(card_data, colWidths=[3.2*cm, 3.2*cm, 3.2*cm, 3.2*cm, 3.2*cm], rowHeights=[2.2*cm])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#ECF0F1')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#D5F4E6')),
        ('BACKGROUND', (2, 0), (2, 0), colors.HexColor('#FADBD8')),
        ('BACKGROUND', (3, 0), (3, 0), colors.HexColor('#FCF3CF')),
        ('BACKGROUND', (4, 0), (4, 0), colors.HexColor('#E8E8E8')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#BDC3C7')),
        ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor('#D5D8DC')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 25),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 25),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5)
    ]))
    story.append(card_table)
    story.append(Spacer(1, 0.3*inch))
    
    # === NEUE SEITE FÜR TESTFÄLLE ===
    story.append(PageBreak())
    
    # === TEST DETAILS - MODERNES BOX-DESIGN ===
    story.append(PageBreak())
    story.append(Paragraph(t["test_details"], heading_style))
    story.append(Spacer(1, 0.15*inch))
    
    # Group cases by suite
    for suite in suites:
        suite_cases = [c for c in cases if c["test_suite_id"] == suite["id"]]
        if not suite_cases:
            continue
        
        # Suite header - Blauer Balken
        suite_name = suite.get('name', 'Unbenannte Suite')
        suite_icon = suite.get('icon', '📁')
        
        suite_header_text = f"<b>{suite_icon} {suite_name} ({len(suite_cases)} Tests)</b>"
        suite_header = Paragraph(
            suite_header_text,
            ParagraphStyle('SuiteHeader', parent=styles['Normal'], fontSize=11, textColor=colors.white, 
                         leftIndent=10, spaceBefore=5, spaceAfter=5)
        )
        
        # Blauer Header-Balken als Tabelle
        suite_header_table = Table([[suite_header]], colWidths=[16*cm])
        suite_header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#3498DB')),
            ('TOPPADDING', (0, 0), (0, 0), 8),
            ('BOTTOMPADDING', (0, 0), (0, 0), 8),
            ('LEFTPADDING', (0, 0), (0, 0), 10),
            ('ROUNDEDCORNERS', [5, 5, 5, 5])
        ]))
        story.append(suite_header_table)
        story.append(Spacer(1, 0.1*inch))
        
        # Testfall-Karten (Box-Design)
        for case in suite_cases:
            case_status = case.get("status", "pending")
            case_name = case.get("name") or case.get("title", "N/A")
            case_description = case.get("description", "")
            case_test_id = case.get("test_id", "N/A")
            
            # Status-spezifische Farben
            status_config = {
                "success": {
                    "bg": colors.HexColor('#E8F8F5'),
                    "border": colors.HexColor('#27AE60'),
                    "badge_bg": colors.HexColor('#27AE60'),
                    "badge_text": "OK",
                    "label_color": '#27AE60'
                },
                "error": {
                    "bg": colors.HexColor('#FADBD8'),
                    "border": colors.HexColor('#E74C3C'),
                    "badge_bg": colors.HexColor('#E74C3C'),
                    "badge_text": "FEHLER",
                    "label_color": '#E74C3C'
                },
                "warning": {
                    "bg": colors.HexColor('#FEF5E7'),
                    "border": colors.HexColor('#F39C12'),
                    "badge_bg": colors.HexColor('#F39C12'),
                    "badge_text": "In Bearbeitung",
                    "label_color": '#F39C12'
                },
                "skipped": {
                    "bg": colors.HexColor('#F2F3F4'),
                    "border": colors.HexColor('#95A5A6'),
                    "badge_bg": colors.HexColor('#95A5A6'),
                    "badge_text": "Übersprungen",
                    "label_color": '#95A5A6'
                },
                "pending": {
                    "bg": colors.HexColor('#F8F9F9'),
                    "border": colors.HexColor('#BDC3C7'),
                    "badge_bg": colors.HexColor('#BDC3C7'),
                    "badge_text": "Offen",
                    "label_color": '#7F8C8D'
                }
            }
            
            config = status_config.get(case_status, status_config["pending"])
            
            # Linke Seite: Test-ID + Titel + Beschreibung
            left_content = []
            left_content.append(Paragraph(
                f"<font color='#3498DB' size=9><b>{case_test_id}</b></font>",
                ParagraphStyle('TestID', parent=styles['Normal'], fontSize=9, spaceAfter=3)
            ))
            left_content.append(Paragraph(
                f"<b>{case_name}</b>",
                ParagraphStyle('TestTitle', parent=styles['Normal'], fontSize=10, spaceAfter=3)
            ))
            if case_description:
                short_desc = case_description[:120] + "..." if len(case_description) > 120 else case_description
                left_content.append(Paragraph(
                    f"<font color='#7F8C8D' size=8>{short_desc}</font>",
                    ParagraphStyle('TestDesc', parent=styles['Normal'], fontSize=8)
                ))
            
            # Rechte Seite: Status-Badge
            badge_text = f"<font color='white'><b>[{config['badge_text']}]</b></font>"
            right_content = Paragraph(
                badge_text,
                ParagraphStyle('StatusBadge', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER)
            )
            
            # Badge als kleine Tabelle
            badge_table = Table([[right_content]], colWidths=[3*cm])
            badge_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (0, 0), config['badge_bg']),
                ('ALIGN', (0, 0), (0, 0), 'CENTER'),
                ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (0, 0), 6),
                ('BOTTOMPADDING', (0, 0), (0, 0), 6),
                ('LEFTPADDING', (0, 0), (0, 0), 8),
                ('RIGHTPADDING', (0, 0), (0, 0), 8),
                ('ROUNDEDCORNERS', [3, 3, 3, 3])
            ]))
            
            # Kombiniere links + rechts
            card_data = [[left_content, badge_table]]
            card_table = Table(card_data, colWidths=[12*cm, 4*cm])
            card_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), config['bg']),
                ('BOX', (0, 0), (-1, -1), 1.5, config['border']),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('ALIGN', (0, 0), (0, 0), 'LEFT'),
                ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
                ('TOPPADDING', (0, 0), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
                ('LEFTPADDING', (0, 0), (-1, -1), 12),
                ('RIGHTPADDING', (0, 0), (-1, -1), 12)
            ]))
            story.append(card_table)
            story.append(Spacer(1, 0.08*inch))
        
        story.append(Spacer(1, 0.15*inch))
    
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
        "pending": status_counts["pending"]
    }
