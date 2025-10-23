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
    
    # Get dynamic conclusion für Fazit
    fazit_title, fazit_text, recommendation, fazit_color = calculate_conclusion(
        status_counts, total_tests, tested_count
    )
    
    # Create PDF in memory - mit 1.5cm Randabstand
    buffer = io.BytesIO()
    
    # Footer-Funktion für Seitenzahlen und Copyright
    # WICHTIG: Für "Seite X von Y" müssen wir das PDF zweimal durchlaufen (two-pass)
    # Erstmal speichern wir die Seitenzahl in einer globalen Variable
    page_count_holder = {'count': 0}
    
    def add_page_footer(canvas, doc):
        """Fügt Fusszeile auf jeder Seite hinzu: Copyright links, Seitenzahl rechts"""
        canvas.saveState()
        # Copyright links
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#7F8C8D'))
        canvas.drawString(1.5*cm, 1.2*cm, "© 2025 • Jörg Renelt • Hamburg")
        
        # Seitenzahl rechts - "Seite X von Y"
        page_num = canvas.getPageNumber()
        # Aktualisiere die maximale Seitenzahl
        if page_num > page_count_holder['count']:
            page_count_holder['count'] = page_num
        canvas.drawRightString(A4[0] - 1.5*cm, 1.2*cm, f"Seite {page_num}")
        canvas.restoreState()
    
    def add_page_footer_final(canvas, doc):
        """Fügt finale Fusszeile mit korrekter Gesamt-Seitenzahl hinzu"""
        canvas.saveState()
        # Copyright links
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#7F8C8D'))
        canvas.drawString(1.5*cm, 1.2*cm, "© 2025 • Jörg Renelt • Hamburg")
        
        # Seitenzahl rechts - "Seite X von Y"
        page_num = canvas.getPageNumber()
        total_pages = page_count_holder['count']
        canvas.drawRightString(A4[0] - 1.5*cm, 1.2*cm, f"Seite {page_num} von {total_pages}")
        canvas.restoreState()
    
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=1.5*cm,
        leftMargin=1.5*cm,
        topMargin=1.5*cm,
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
    # Logo: BEWEIS-TEST - Lade ID2-Logo (ÜBERGROSSE VERSION als Beweis)
    
    # Header Layout: Logo + Firma NEBENEINANDER (Logo als kleines Icon)
    # Erst Titel "QA-Report"
    story.append(Paragraph(
        "<b>QA-Report</b>",
        ParagraphStyle('ReportTitle', parent=styles['Heading1'], fontSize=22, textColor=colors.HexColor('#2C3E50'), spaceAfter=10)
    ))
    
    # Logo laden - KLEIN und proportional, NICHT überlappend
    logo_element = None
    try:
        # Verwende Company-Logo wenn vorhanden, sonst ID2-Default
        logo_url = company_logo_url
        print(f"🔍 DEBUG: Lade Logo von: {logo_url}")
        # KLEINERES Logo: 0.5x0.5 inch statt 0.8x0.8
        logo_img = Image(logo_url, width=0.5*inch, height=0.5*inch, kind='proportional')
        logo_element = logo_img
        print("✅ DEBUG: Logo erfolgreich geladen (0.5x0.5 inch)")
    except Exception as e:
        print(f"❌ Logo konnte nicht geladen werden: {e}")
        # Fallback: Text-Logo
        logo_p = Paragraph(
            "<para align=center><font size=10 color='#666666'><b>LOGO</b></font></para>",
            ParagraphStyle('LogoP', parent=styles['Normal'], fontSize=8, alignment=TA_CENTER)
        )
        logo_p_table = Table([[logo_p]], colWidths=[0.5*inch], rowHeights=[0.5*inch])
        logo_p_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F5F5F5')),
            ('ALIGN', (0, 0), (0, 0), 'CENTER'),
            ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
            ('BOX', (0, 0), (0, 0), 1, colors.HexColor('#DDDDDD'))
        ]))
        logo_element = logo_p_table
    
    firma_text = Paragraph(
        f"<b>{company_name}</b>",
        ParagraphStyle('CompanyName', parent=styles['Normal'], fontSize=14, textColor=colors.HexColor('#34495E'))
    )
    
    # Logo + Firma in einer Zeile - Logo KLEIN, Firma daneben, ALLES NACH LINKS (kein Padding)
    logo_firma_row = [[logo_element, firma_text]]
    logo_firma_table = Table(logo_firma_row, colWidths=[0.6*inch, 5*inch])
    logo_firma_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),  # ✅ Kein Padding - direkt am Rand
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 8),  # Nur 8pt zwischen Logo und Firma
        ('BOX', (0, 0), (0, 0), 2, colors.red)  # ⚠️ TEMPORÄRER ROTER RAHMEN UM LOGO ZUR PRÜFUNG
    ]))
    story.append(logo_firma_table)
    story.append(Spacer(1, 0.15*inch))
    
    # Info-Zeilen darunter - AUCH NACH LINKS
    header_left = []
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
    
    # Header Table - KEIN PADDING, volle Breite nutzen
    header_data = [[header_left, header_right]]
    header_table = Table(header_data, colWidths=[9*cm, 9*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),  # ✅ Kein Padding
        ('RIGHTPADDING', (0, 0), (-1, -1), 0)  # ✅ Kein Padding
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
    
    left_table = Table(left_info_data, colWidths=[1.4*inch, 2.4*inch])
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
        ('LEFTPADDING', (0, 0), (-1, -1), 6),  # Reduziert für mehr links
        ('RIGHTPADDING', (0, 0), (-1, -1), 6),
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
    
    right_table = Table(right_info_data, colWidths=[1*inch, 1.4*inch])
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
    
    # Combine both tables side by side - Linke Tabelle LINKS, rechte Tabelle GANZ RECHTS
    # Nutzbare Breite: 18cm = 7.087 inch
    # Strategy: Zwei-Spalten-Tabelle ohne mittleren Spacer, ALIGN steuert Position
    combined_info_data = [[left_table, right_table]]
    combined_table = Table(combined_info_data, colWidths=[3.8*inch, 3.287*inch])  # = 7.087 inch gesamt
    combined_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),   # Linke Tabelle linksbündig
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),  # Rechte Tabelle rechtsbündig
        ('LEFTPADDING', (0, 0), (-1, -1), 0),   # ✅ Kein Padding
        ('RIGHTPADDING', (0, 0), (-1, -1), 0)   # ✅ Kein Padding
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
    
    # Professionelle Zahlen-Karten - 50% KLEINER
    # WICHTIG: [Zahl] + weicher Umbruch + [Label] als EIN Objekt behandeln und zentrieren
    # Positionierung: ca. 20% höher durch spaceBefore in ParagraphStyle
    
    print(f"🔍 DEBUG: Executive Summary wird generiert. Total Tests: {total_tests}")
    
    # Custom Style für Karten mit erhöhtem spaceBefore für 20% höhere Position
    card_style = ParagraphStyle(
        'CardStyle',
        parent=body_style,
        alignment=TA_CENTER,
        spaceBefore=12,  # 20% höher: verschiebt den Inhalt nach unten
        spaceAfter=0,
        leading=18  # Mehr Abstand zwischen Zahl und Label
    )
    
    print("🔍 DEBUG: Executive Summary Karten wie HTML-Beispiel mit abgerundeten Ecken")
    
    # KARTEN WIE IM HTML-BEISPIEL: border-radius, farbiger Rahmen, transparenter Hintergrund
    # ReportLab unterstützt border-radius nicht direkt in Table, aber wir können es mit drawRoundRect simulieren
    # ODER wir verwenden eine einfachere Methode: normale Paragraph mit Zentrierung
    
    def create_html_style_card(number, label, border_color, bg_color):
        """Erstellt Karte wie HTML: abgerundete Ecken, farbiger Rahmen, transparenter Hintergrund"""
        # Zahl (große Schrift, fett, dunkel)
        num_para = Paragraph(
            f"<font size=42 color='#333333'><b>{number}</b></font>",
            ParagraphStyle('CardNum', parent=body_style, alignment=TA_CENTER, leading=50)
        )
        # Label (kleinere Schrift, grau)
        label_para = Paragraph(
            f"<font size=10 color='#555555'>{label}</font>",
            ParagraphStyle('CardLabel', parent=body_style, alignment=TA_CENTER, leading=14)
        )
        
        # Mini-Tabelle: 2 Zeilen (Zahl, Label)
        mini_table = Table([[num_para], [label_para]], colWidths=[1.2*inch])
        mini_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),  # Transparenter Hintergrund
            ('BOX', (0, 0), (-1, -1), 2, border_color),  # 2pt farbiger Rahmen
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 20),    # Großzügiges Padding
            ('BOTTOMPADDING', (0, 0), (-1, -1), 20),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('ROUNDEDCORNERS', [15, 15, 15, 15])  # Abgerundete Ecken (15pt radius)
        ]))
        return mini_table
    
    # Farben: border + transparenter Hintergrund (RGBA mit Alpha = 0.2)
    card_data = [[
        create_html_style_card(total_tests, "GESAMT", colors.HexColor('#666666'), colors.HexColor('#E8E8E8')),
        create_html_style_card(status_counts['success'], "BESTANDEN", colors.darkgreen, colors.Color(0, 0.5, 0, alpha=0.2)),
        create_html_style_card(status_counts['error'], "FEHLER", colors.darkred, colors.Color(1, 0, 0, alpha=0.2)),
        create_html_style_card(status_counts['warning'], "WARNUNG", colors.HexColor('#DAA520'), colors.Color(1, 1, 0, alpha=0.2)),
        create_html_style_card(untested, "OFFEN", colors.HexColor('#666666'), colors.Color(0.78, 0.78, 0.78, alpha=0.3))
    ]]
    
    card_table = Table(card_data, colWidths=[0.95*inch]*5, rowHeights=[0.85*inch])
    card_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#ECF0F1')),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor('#D5F4E6')),
        ('BACKGROUND', (2, 0), (2, 0), colors.HexColor('#FADBD8')),
        ('BACKGROUND', (3, 0), (3, 0), colors.HexColor('#FCF3CF')),
        ('BACKGROUND', (4, 0), (4, 0), colors.HexColor('#E8E8E8')),
        ('BOX', (0, 0), (-1, -1), 1.5, colors.HexColor('#BDC3C7')),
        ('INNERGRID', (0, 0), (-1, -1), 1, colors.HexColor('#D5D8DC')),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # MIDDLE für vertikale Zentrierung
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
    ]))
    story.append(card_table)
    story.append(Spacer(1, 0.2*inch))
    
    # === FAZIT UND EMPFEHLUNGEN - UNTER EXECUTIVE SUMMARY ===
    # Berechne dynamisches Fazit (wurde bereits in Zeile 214 berechnet, aber hier nochmal zur Sicherheit)
    
    # Fazit Box - 90% der Seitenbreite
    # Seitenbreite: A4 = 21cm, abzüglich 2x 1.5cm Margin = 18cm nutzbar
    # 90% von 18cm = 16.2cm
    fazit_width = 16.2*cm  # 90% der nutzbaren Breite
    print(f"🔍 DEBUG: Fazit-Box Breite: {fazit_width/cm:.2f}cm (90% von 18cm)")
    
    conclusion_data = [
        [Paragraph(f"<b>{fazit_title}</b>", body_style)],
        [Paragraph(fazit_text, body_style)],
        [Paragraph(f"<b>Empfehlung:</b> {recommendation}", body_style)]
    ]
    
    conclusion_table = Table(conclusion_data, colWidths=[fazit_width])
    conclusion_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), fazit_color),
        ('BACKGROUND', (0, 1), (0, -1), colors.white),
        ('TEXTCOLOR', (0, 0), (0, 0), colors.white),
        ('TEXTCOLOR', (0, 1), (0, -1), colors.HexColor('#2C3E50')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('FONTNAME', (0, 0), (0, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (0, 0), 10),
        ('FONTSIZE', (0, 1), (0, -1), 9),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('LEFTPADDING', (0, 0), (-1, -1), 10),
        ('RIGHTPADDING', (0, 0), (-1, -1), 10),
        ('BOX', (0, 0), (-1, -1), 1, fazit_color)
    ]))
    
    # Verwende KeepTogether um zu verhindern, dass Fazit über Seiten bricht
    # Wenn es nicht passt, wird automatisch ein PageBreak gemacht
    from reportlab.platypus import KeepTogether
    fazit_block = KeepTogether([
        Paragraph("<b>FAZIT UND EMPFEHLUNGEN</b>",
                ParagraphStyle('FazitTitle2', parent=styles['Heading2'], fontSize=12, 
                             textColor=colors.HexColor('#2C3E50'), spaceAfter=8)),
        conclusion_table
    ])
    story.append(fazit_block)
    
    # === SEITE 2: INHALTSVERZEICHNIS / MENÜ ===
    story.append(PageBreak())
    
    # Menü-Überschrift
    menu_title = Paragraph(
        "<b>INHALTSVERZEICHNIS</b>",
        ParagraphStyle('MenuTitle', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#2C3E50'), spaceAfter=20)
    )
    story.append(menu_title)
    
    # Menü-Einträge für jede Test-Suite
    for idx, suite in enumerate(suites, 1):
        suite_name = suite.get('name', 'Unbenannte Suite')
        suite_icon = suite.get('icon', '📁')
        suite_cases = [c for c in cases if c["test_suite_id"] == suite["id"]]
        test_count = len(suite_cases)
        
        # Menü-Eintrag
        menu_entry = Paragraph(
            f"<b>{idx}. {suite_icon} {suite_name}</b> ({test_count} Tests)",
            ParagraphStyle('MenuItem', parent=styles['Normal'], fontSize=12, textColor=colors.HexColor('#2C3E50'), 
                         leftIndent=20, spaceAfter=10)
        )
        
        # Als Zeile in Tabelle für bessere Formatierung
        menu_row = [[menu_entry]]
        menu_item_table = Table(menu_row, colWidths=[16*cm])
        menu_item_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 0), colors.HexColor('#F8F9FA')),
            ('BOX', (0, 0), (0, 0), 1, colors.HexColor('#BDC3C7')),
            ('TOPPADDING', (0, 0), (0, 0), 10),
            ('BOTTOMPADDING', (0, 0), (0, 0), 10),
            ('LEFTPADDING', (0, 0), (0, 0), 15)
        ]))
        story.append(menu_item_table)
        story.append(Spacer(1, 0.1*inch))
    
    # === SEITE 3+: TEST DETAILS - MODERNES BOX-DESIGN ===
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
    
    # Build PDF mit Footer-Funktion
    doc.build(story, onFirstPage=add_page_footer, onLaterPages=add_page_footer)
    buffer.seek(0)
    
    # Return as downloadable file
    # Format: QA-Report_PROJEKTNAME_IDXXXX_TT-MM-YY_HHMMSS.pdf (mit Timestamp für Cache-Buster)
    project_name_clean = project['name'].replace(" ", "_").replace("/", "-")
    project_id_short = project['id'][:8]  # Erste 8 Zeichen der UUID
    date_german = datetime.utcnow().strftime('%d-%m-%y')  # TT-MM-YY Format
    timestamp = datetime.utcnow().strftime('%H%M%S')  # HHMMSS für Cache-Buster
    
    filename = f"QA-Report_{project_name_clean}_{project_id_short}_{date_german}_{timestamp}.pdf"
    
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
