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
    story.append(Spacer(1, 0.5*cm))
    
    # Test-Text für Phase 3
    story.append(Paragraph("✅ Phase 3: Tabellen implementiert!", styles['Normal']))
    
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
