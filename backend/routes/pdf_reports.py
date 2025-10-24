"""
PDF Report Generation Routes - NEU IMPLEMENTIERT
Phase 1: Basis-Setup mit korrekten Margins
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from datetime import datetime
import io

# ReportLab Imports
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, KeepTogether, PageBreak

# Database und Auth
from database import projects_collection, companies_collection
from auth import get_current_user
from models import User

router = APIRouter()

# Globale Konfiguration basierend auf detaillierter Analyse
GLOBAL_MARGINS = {
    'left': 1.5 * cm,
    'right': 1.5 * cm,
    'top': 1.2 * cm,
    'bottom': 1.0 * cm
}

# Logo URL
DEFAULT_LOGO_URL = "https://customer-assets.emergentagent.com/job_test-result-dash/artifacts/fc0bo5xn_image.png"


@router.get("/generate/{project_id}")
async def generate_pdf_report(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """
    Phase 2: Header-Bereich mit Logo, Firmenname, Datum und Metadaten
    """
    
    # Projekt- und Firmen-Daten abrufen
    project = await projects_collection.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Projekt nicht gefunden")
    
    company = await companies_collection.find_one({"id": project.get("company_id")})
    company_name = company.get("name", "Unbekannte Firma") if company else "Unbekannte Firma"
    
    # Check for logo_url in both snake_case and camelCase formats
    company_logo_url = None
    if company:
        company_logo_url = company.get("logo_url") or company.get("logoUrl")
    
    # Skip SVG data URLs as ReportLab doesn't support them
    if company_logo_url and company_logo_url.startswith("data:image/svg"):
        company_logo_url = None
    
    # Use default logo if no valid logo found
    if not company_logo_url:
        company_logo_url = DEFAULT_LOGO_URL
    
    # PDF in Memory erstellen
    buffer = io.BytesIO()
    
    # SimpleDocTemplate mit globalen Margins
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=GLOBAL_MARGINS['left'],
        rightMargin=GLOBAL_MARGINS['right'],
        topMargin=GLOBAL_MARGINS['top'],
        bottomMargin=GLOBAL_MARGINS['bottom']
    )
    
    # Story-Elemente sammeln
    story = []
    
    # Basis-Styles
    styles = getSampleStyleSheet()
    
    # === ZEILE 1: "QA-Report" Überschrift (Primärfarbe #5771B2) ===
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#5771B2'),  # Primärfarbe aus Farbraum
        leftIndent=0,
        spaceBefore=0,
        spaceAfter=8
    )
    story.append(Paragraph("<b>QA-Report</b>", title_style))
    
    # === ZEILE 2: [LOGO] [FIRMA] nebeneinander + Erstellungsdatum (rechts) ===
    from reportlab.platypus import Table, TableStyle, Image
    
    # Logo laden
    try:
        logo_img = Image(company_logo_url, width=1.2*cm, height=1.2*cm, kind='proportional')
    except:
        # Fallback: Text statt Logo
        logo_img = Paragraph("[LOGO]", ParagraphStyle('LogoFallback', parent=styles['Normal'], fontSize=10))
    
    # Firmenname
    firma_para = Paragraph(
        f"<b>{company_name}</b>",
        ParagraphStyle('FirmaName', parent=styles['Normal'], fontSize=14, textColor=colors.HexColor('#2C3E50'))
    )
    
    # Logo + Firma in Sub-Table (nebeneinander)
    logo_firma_data = [[logo_img, firma_para]]
    logo_firma_table = Table(logo_firma_data, colWidths=[1.5*cm, 8*cm])
    logo_firma_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'LEFT'),
        ('LEFTPADDING', (0, 0), (0, 0), 0.3*cm),  # Logo: 1 Zeichen weiter rechts (~0.3cm)
        ('LEFTPADDING', (1, 0), (1, 0), 0.2*cm),  # Firma: kleiner Abstand vom Logo
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
    ]))
    
    # Erstellungsdatum
    datum_para = Paragraph(
        f"<b>Erstellungsdatum</b> | {datetime.utcnow().strftime('%d.%m.%Y')}",
        ParagraphStyle('Datum', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#2C3E50'), alignment=TA_RIGHT)
    )
    
    # Haupttabelle: Logo+Firma (links) und Datum (rechts)
    header_data = [[logo_firma_table, datum_para]]
    header_table = Table(header_data, colWidths=[10*cm, 8*cm])
    header_table.setStyle(TableStyle([
        ('VALIGN', (0, 0), (0, 0), 'MIDDLE'),
        ('VALIGN', (1, 0), (1, 0), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
    ]))
    story.append(header_table)
    story.append(Spacer(1, 0.3*cm))
    
    # === ZEILE 3-5: Metadaten-Block ===
    meta_style = ParagraphStyle('Meta', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#2C3E50'))
    
    username = f"{current_user.first_name} {current_user.last_name}" if current_user.first_name else current_user.username
    story.append(Paragraph(f"<b>Getestet von:</b> {username}", meta_style))
    story.append(Paragraph(f"<b>Test Umgebung:</b> {project.get('test_environment', 'Nicht angegeben')}", meta_style))
    story.append(Paragraph(f"<b>Test Methodik:</b> {project.get('test_methodology', 'Nicht angegeben')}", meta_style))
    
    story.append(Spacer(1, 0.5*cm))
    
    # === TABELLEN: Projekt-Details (links) und Version/Projekt-ID (rechts) ===
    
    # === TABELLEN-AUFTEILUNG: 48% + 4% + 48% ===
    # Nutzbare Breite: 18cm
    # Linke Tabelle: 48% = 8.64cm
    # Abstand: 4% = 0.72cm
    # Rechte Tabelle: 48% = 8.64cm
    
    # Linke Tabelle: Projekt-Details (48% der nutzbaren Breite)
    left_data = [
        [Paragraph("<b>Projekt</b>", meta_style), Paragraph(project.get('name', 'N/A'), meta_style)],
        [Paragraph("<b>Test objekt</b>", meta_style), Paragraph(project.get('test_object', 'Nicht angegeben'), meta_style)],
        [Paragraph("<b>Ziel des Testes</b>", meta_style), Paragraph(project.get('test_goal', 'Nicht angegeben'), meta_style)]
    ]
    
    left_table = Table(left_data, colWidths=[3*cm, 5.64*cm])  # Gesamt 8.64cm
    left_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),  # Graue Spalte links
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0.3*cm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0.3*cm),
        ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm)
    ]))
    
    # Rechte Tabelle: Version und Projekt-ID (48% der nutzbaren Breite)
    project_id_short = project['id'][:8] if len(project['id']) > 8 else project['id']
    right_data = [
        [Paragraph("<b>Version</b>", meta_style), Paragraph("v1.0.0", meta_style)],
        [Paragraph("<b>Projekt ID</b>", meta_style), Paragraph(project_id_short, meta_style)]
    ]
    
    right_table = Table(right_data, colWidths=[2.5*cm, 6.14*cm])  # Gesamt 8.64cm
    right_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#ECF0F1')),
        ('BACKGROUND', (1, 0), (1, -1), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#BDC3C7')),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0.3*cm),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0.3*cm),
        ('TOPPADDING', (0, 0), (-1, -1), 0.2*cm),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0.2*cm)
    ]))
    
    # Beide Tabellen nebeneinander: 48% + 4% + 48% = 100%
    tables_data = [[left_table, '', right_table]]
    tables_combined = Table(tables_data, colWidths=[8.64*cm, 0.72*cm, 8.64*cm])  # Exakte Aufteilung
    tables_combined.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('ALIGN', (2, 0), (2, 0), 'LEFT'),  # Beide linksbündig in ihren Spalten
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
    ]))
    
    story.append(tables_combined)
    story.append(Spacer(1, 0.6*cm))
    
    # === EXECUTIVE SUMMARY - KOMPLETT UMSTRUKTURIERT ===
    
    # Überschrift "EXECUTIVE SUMMARY" (linksbündig, Primärfarbe)
    summary_title_style = ParagraphStyle(
        'SummaryTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#5771B2'),  # Primärfarbe
        leftIndent=0,
        spaceBefore=0,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    )
    story.append(Paragraph("<b>EXECUTIVE SUMMARY</b>", summary_title_style))
    
    # Testdaten aus Datenbank laden
    from database import test_cases_collection
    test_cases = await test_cases_collection.find({"project_id": project_id}).to_list(None)
    
    total_tests = len(test_cases)
    success_count = len([t for t in test_cases if t.get('status') == 'success'])
    error_count = len([t for t in test_cases if t.get('status') == 'error'])
    warning_count = len([t for t in test_cases if t.get('status') == 'warning'])
    pending_count = len([t for t in test_cases if t.get('status') == 'pending'])
    
    # === BLOCK 1: Status-Text (separate Struktur) ===
    status_text_style = ParagraphStyle('StatusText', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#555555'))
    status_text = f"Status: {success_count} von {total_tests} Tests bestanden. {error_count} Fehler festgestellt. {pending_count} ungeprüft."
    story.append(Paragraph(status_text, status_text_style))
    story.append(Spacer(1, 1.2*cm))  # GROSSER Abstand (1.2cm statt 0.8cm)
    
    # === BLOCK 2: Badges (50% KLEINER in Höhe, Content +3pt größer) ===
    
    def create_simple_card(number, label, border_color, bg_color):
        """Erstellt Karte: 50% kleiner in Höhe, Text +3pt größer"""
        # Zwei Rows: Zahl + Label (BEIDE +3pt größer)
        card_data = [
            [Paragraph(f"<b>{number}</b>", ParagraphStyle('Num', parent=styles['Normal'], fontSize=13, alignment=TA_CENTER, textColor=colors.HexColor('#333333'), leading=15))],  # 10pt + 3pt = 13pt
            [Paragraph(label, ParagraphStyle('Lbl', parent=styles['Normal'], fontSize=9, alignment=TA_CENTER, textColor=colors.HexColor('#555555'), leading=11))]  # 6pt + 3pt = 9pt
        ]
        
        # Höhe um 50% reduziert: Padding von 1.0cm auf 0.5cm
        card_table = Table(card_data, colWidths=[2.9*cm])
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, 1), bg_color),
            ('BOX', (0, 0), (0, 1), 2, border_color),
            ('ALIGN', (0, 0), (0, 1), 'CENTER'),
            ('VALIGN', (0, 0), (0, 1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (0, 1), 0.5*cm),    # 50% von 1.0cm
            ('BOTTOMPADDING', (0, 0), (0, 1), 0.5*cm),  # 50% von 1.0cm
            ('LEFTPADDING', (0, 0), (0, 1), 0.2*cm),
            ('RIGHTPADDING', (0, 0), (0, 1), 0.2*cm),
            ('ROUNDEDCORNERS', [15, 15, 15, 15])
        ]))
        return card_table
    
    # 5 Karten erstellen
    card1 = create_simple_card(str(total_tests), "GESAMT", colors.HexColor('#666666'), colors.Color(0.78, 0.78, 0.78, alpha=0.3))
    card2 = create_simple_card(str(success_count), "BESTANDEN", colors.darkgreen, colors.Color(0, 0.5, 0, alpha=0.2))
    card3 = create_simple_card(str(error_count), "FEHLER", colors.darkred, colors.Color(1, 0, 0, alpha=0.2))
    card4 = create_simple_card(str(warning_count), "WARNUNG", colors.goldenrod, colors.Color(1, 1, 0, alpha=0.2))
    card5 = create_simple_card(str(pending_count), "OFFEN", colors.HexColor('#666666'), colors.Color(0.78, 0.78, 0.78, alpha=0.3))
    
    # Container Table OHNE feste Row Heights - nur VALIGN=TOP für korrekte Positionierung
    cards_data = [[card1, '', card2, '', card3, '', card4, '', card5]]
    cards_container = Table(
        cards_data, 
        colWidths=[2.9*cm, 1*cm, 2.9*cm, 1*cm, 2.9*cm, 1*cm, 2.9*cm, 1*cm, 2.9*cm]
    )
    cards_container.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),  # WICHTIG: TOP verhindert Überlappung
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
    ]))
    
    # Mit KeepTogether gruppieren
    badges_block = KeepTogether([cards_container])
    story.append(badges_block)
    story.append(Spacer(1, 1.0*cm))
    
    # === FAZIT UND EMPFEHLUNGEN (volle Breite) ===
    
    # Überschrift "FAZIT UND EMPFEHLUNGEN"
    fazit_title_style = ParagraphStyle(
        'FazitTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#5771B2'),  # Primärfarbe
        leftIndent=0,
        spaceBefore=0,
        spaceAfter=10,
        fontName='Helvetica-Bold'
    )
    story.append(Paragraph("<b>FAZIT UND EMPFEHLUNGEN</b>", fazit_title_style))
    
    # Orange Box mit Fazit-Inhalt
    fazit_content_style = ParagraphStyle(
        'FazitContent',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#2C3E50'),
        leftIndent=0,
        alignment=TA_LEFT,
        leading=14
    )
    
    fazit_text = f"""
    <b>Zusammenfassung:</b><br/>
    Von {total_tests} durchgeführten Tests wurden {success_count} erfolgreich bestanden. 
    Es wurden {error_count} Fehler identifiziert, die einer weiteren Analyse bedürfen. 
    {pending_count} Tests sind noch offen und müssen abgeschlossen werden.<br/><br/>
    <b>Empfehlung:</b><br/>
    Die identifizierten Fehler sollten priorisiert und zeitnah behoben werden. 
    Eine Re-Evaluation der fehlgeschlagenen Tests wird nach der Fehlerbehebung empfohlen.
    """
    
    fazit_para = Paragraph(fazit_text, fazit_content_style)
    
    # Fazit-Box: Orange Rahmen, leicht transparenter Hintergrund, volle Breite
    fazit_table = Table([[fazit_para]], colWidths=[18*cm])  # 18cm = volle nutzbare Breite
    fazit_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, 0), colors.Color(1, 0.65, 0, alpha=0.1)),  # Orange transparent
        ('BOX', (0, 0), (0, 0), 2, colors.Color(1, 0.55, 0)),  # Orange Rahmen
        ('ALIGN', (0, 0), (0, 0), 'LEFT'),
        ('VALIGN', (0, 0), (0, 0), 'TOP'),
        ('TOPPADDING', (0, 0), (0, 0), 0.4*cm),
        ('BOTTOMPADDING', (0, 0), (0, 0), 0.4*cm),
        ('LEFTPADDING', (0, 0), (0, 0), 0.5*cm),
        ('RIGHTPADDING', (0, 0), (0, 0), 0.5*cm),
        ('ROUNDEDCORNERS', [10, 10, 10, 10])
    ]))
    
    story.append(fazit_table)
    story.append(Spacer(1, 1.0*cm))
    
    story.append(Paragraph("✅ Phase 5: Fazit und Empfehlungen + Footer implementiert!", styles['Normal']))
    
    # PDF generieren mit Custom Footer
    def add_footer(canvas, doc):
        """Fügt Footer auf jeder Seite hinzu"""
        canvas.saveState()
        
        # Footer-Text Style
        footer_left = "© 2025 • Jörg Renelt • Hamburg"
        footer_right = f"Seite {doc.page} von {doc.page_count if hasattr(doc, 'page_count') else doc.page}"
        
        # Footer Position (1cm vom unteren Rand)
        y_position = 1.0 * cm
        
        # Linker Text
        canvas.setFont('Helvetica', 8)
        canvas.setFillColor(colors.HexColor('#666666'))
        canvas.drawString(GLOBAL_MARGINS['left'], y_position, footer_left)
        
        # Rechter Text
        text_width = canvas.stringWidth(footer_right, 'Helvetica', 8)
        canvas.drawString(A4[0] - GLOBAL_MARGINS['right'] - text_width, y_position, footer_right)
        
        canvas.restoreState()
    
    doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
    buffer.seek(0)
    
    # Filename
    project_name_clean = project['name'].replace(" ", "_")
    filename = f"QA-Report_{project_name_clean}_{datetime.utcnow().strftime('%d-%m-%Y')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
