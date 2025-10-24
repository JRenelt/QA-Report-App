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
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer

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
    company_logo_url = company.get("logo_url") if company else DEFAULT_LOGO_URL
    
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
    
    # === EXECUTIVE SUMMARY ===
    
    # Überschrift "EXECUTIVE SUMMARY" (linksbündig, Primärfarbe)
    summary_title_style = ParagraphStyle(
        'SummaryTitle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#5771B2'),  # Primärfarbe
        leftIndent=0,
        spaceBefore=0,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    )
    story.append(Paragraph("<b>EXECUTIVE SUMMARY</b>", summary_title_style))
    
    # Testdaten aus Datenbank laden (später durch echte Daten ersetzen)
    from database import test_cases_collection
    test_cases = await test_cases_collection.find({"project_id": project_id}).to_list(None)
    
    total_tests = len(test_cases)
    success_count = len([t for t in test_cases if t.get('status') == 'success'])
    error_count = len([t for t in test_cases if t.get('status') == 'error'])
    warning_count = len([t for t in test_cases if t.get('status') == 'warning'])
    pending_count = len([t for t in test_cases if t.get('status') == 'pending'])
    
    # Status-Text
    status_text_style = ParagraphStyle('StatusText', parent=styles['Normal'], fontSize=9, textColor=colors.HexColor('#555555'))
    status_text = f"Status: {success_count} von {total_tests} Tests bestanden. {error_count} Fehler festgestellt. {pending_count} ungeprüft."
    story.append(Paragraph(status_text, status_text_style))
    story.append(Spacer(1, 0.3*cm))
    
    # === 5 KARTEN (vertikal, abgerundete Ecken) ===
    
    def create_card(number, label, border_color, bg_color):
        """Erstellt Karte: NOCHMAL 50% kleiner = 12.5% der Original-Höhe (dritte Reduktion)"""
        # Zahl (nochmal 50% kleiner: 10pt statt 20pt)
        num_para = Paragraph(
            f"<font size=10 color='#333333'><b>{number}</b></font>",
            ParagraphStyle('CardNum', parent=styles['Normal'], alignment=TA_CENTER, leading=12)
        )
        # Label (nochmal 50% kleiner: 6pt statt 8pt)
        label_para = Paragraph(
            f"<font size=6 color='#555555'>{label}</font>",
            ParagraphStyle('CardLabel', parent=styles['Normal'], alignment=TA_CENTER, leading=7, spaceBefore=0.025*cm)
        )
        
        # Mini-Tabelle: Zahl und Label untereinander
        card_table = Table([[num_para], [label_para]], colWidths=[2.9*cm])
        card_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), bg_color),
            ('BOX', (0, 0), (-1, -1), 2, border_color),  # 2pt Rahmen
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 0.13*cm),    # 50% von 0.265cm = 0.13cm
            ('BOTTOMPADDING', (0, 0), (-1, -1), 0.13*cm),
            ('LEFTPADDING', (0, 0), (-1, -1), 0),
            ('RIGHTPADDING', (0, 0), (-1, -1), 0),
            ('ROUNDEDCORNERS', [15, 15, 15, 15])  # border-radius: 15px
        ]))
        return card_table
    
    # 5 Karten erstellen
    card1 = create_card(total_tests, "GESAMT", colors.HexColor('#666666'), colors.Color(0.78, 0.78, 0.78, alpha=0.3))
    card2 = create_card(success_count, "BESTANDEN", colors.darkgreen, colors.Color(0, 0.5, 0, alpha=0.2))
    card3 = create_card(error_count, "FEHLER", colors.darkred, colors.Color(1, 0, 0, alpha=0.2))
    card4 = create_card(warning_count, "WARNUNG", colors.goldenrod, colors.Color(1, 1, 0, alpha=0.2))
    card5 = create_card(pending_count, "OFFEN", colors.HexColor('#666666'), colors.Color(0.78, 0.78, 0.78, alpha=0.3))
    
    # Outer Table mit ECHTEN Spacer-Spalten zwischen den Karten (nicht Padding!)
    # Struktur: [Card] [Spacer] [Card] [Spacer] [Card] [Spacer] [Card] [Spacer] [Card]
    cards_data = [[card1, '', card2, '', card3, '', card4, '', card5]]
    cards_table = Table(
        cards_data, 
        colWidths=[2.9*cm, 1*cm, 2.9*cm, 1*cm, 2.9*cm, 1*cm, 2.9*cm, 1*cm, 2.9*cm],  # Spacer = 1cm
        rowHeights=[0.56*cm]  # 50% von 1.125cm = 0.56cm (dritte Reduktion)
    )
    cards_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 0)
    ]))
    
    story.append(cards_table)
    story.append(Spacer(1, 0.5*cm))
    
    # Test-Text für Phase 4
    story.append(Paragraph("✅ Phase 4: Executive Summary mit 5 Karten implementiert!", styles['Normal']))
    
    # PDF generieren
    doc.build(story)
    buffer.seek(0)
    
    # Filename
    project_name_clean = project['name'].replace(" ", "_")
    filename = f"QA-Report_{project_name_clean}_{datetime.utcnow().strftime('%d-%m-%Y')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
