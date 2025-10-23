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
    Phase 1: Einfaches Test-PDF mit korrekten Margins
    """
    
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
    
    # Test-Überschrift
    title_style = ParagraphStyle(
        'Title',
        parent=styles['Heading1'],
        fontSize=22,
        textColor=colors.HexColor('#E74C3C'),  # Rot wie in Analyse
        leftIndent=0,
        spaceBefore=0,
        spaceAfter=12
    )
    
    story.append(Paragraph("<b>QA-Report</b>", title_style))
    story.append(Spacer(1, 1*cm))
    
    # Test-Text
    test_text = ParagraphStyle('Normal', parent=styles['Normal'])
    story.append(Paragraph("✅ Phase 1: Basis-Setup erfolgreich!", test_text))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f"Globale Margins:", test_text))
    story.append(Paragraph(f"• Links: 1.5 cm", test_text))
    story.append(Paragraph(f"• Rechts: 1.5 cm", test_text))
    story.append(Paragraph(f"• Oben: 1.2 cm", test_text))
    story.append(Paragraph(f"• Unten: 1.0 cm", test_text))
    story.append(Spacer(1, 0.5*cm))
    story.append(Paragraph(f"Getestet von: {current_user.username}", test_text))
    story.append(Paragraph(f"Datum: {datetime.utcnow().strftime('%d.%m.%Y')}", test_text))
    
    # PDF generieren
    doc.build(story)
    buffer.seek(0)
    
    # Filename
    filename = f"QA-Report_Phase1_Test_{datetime.utcnow().strftime('%d-%m-%Y_%H%M%S')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
