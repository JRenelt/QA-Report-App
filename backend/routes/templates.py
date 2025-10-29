"""
Template-Export für Projekt/Bereich/Testfälle
Excel (CSV) und JSON Templates zum Download
"""

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse, JSONResponse
from auth import get_current_user
import io
import csv
import json

router = APIRouter(tags=["templates"])

@router.get("/project-template-csv")
async def get_project_template_csv(current_user: dict = Depends(get_current_user)):
    """
    Download CSV-Template für Projekt/Bereich/Testfälle Import
    Formatiert als Formblatt zum einfachen Ausfüllen
    """
    # CSV Template erstellen mit Struktur
    output = io.StringIO()
    writer = csv.writer(output)
    
    # PROJEKT-INFORMATIONEN
    writer.writerow(['=== PROJEKT-INFORMATIONEN ==='])
    writer.writerow(['Feld', 'Wert'])
    writer.writerow(['Projekttitel', 'Hier Projekttitel eingeben'])
    writer.writerow(['Beschreibung', 'Hier Projektbeschreibung eingeben'])
    writer.writerow(['Notizen', 'Optionale Notizen zum Projekt'])
    writer.writerow([])  # Leerzeile
    
    # BEREICHE
    writer.writerow(['=== TESTBEREICHE ==='])
    writer.writerow(['Bereich', 'Beschreibung'])
    writer.writerow(['UI/UX Test', 'Benutzeroberfläche und Benutzererfahrung'])
    writer.writerow(['Funktionalität', 'Funktionale Anforderungen und Features'])
    writer.writerow(['Performance', 'Leistung und Geschwindigkeit'])
    writer.writerow([])  # Leerzeile
    
    # TESTFÄLLE
    writer.writerow(['=== TESTFÄLLE ==='])
    writer.writerow(['test_id', 'name', 'area', 'description', 'priority', 'expected_result', 'status'])
    writer.writerow(['', '', '', '', '1=Hoch, 2=Mittel, 3=Niedrig', '', 'pending/passed/failed'])
    writer.writerow([])  # Leerzeile für Eingabe
    
    # Beispiele mit Leerzeilen zum Ausfüllen
    writer.writerow(['TEST001', 'Login-Funktion testen', 'UI/UX Test', 'Prüfen ob Login funktioniert', '1', 'User wird eingeloggt', 'pending'])
    writer.writerow(['', '', '', '', '', '', ''])  # Leerzeile
    writer.writerow(['TEST002', 'Navigation testen', 'UI/UX Test', 'Alle Menüpunkte anklicken', '2', 'Navigation funktioniert', 'pending'])
    writer.writerow(['', '', '', '', '', '', ''])  # Leerzeile
    writer.writerow(['TEST003', 'Datenspeicherung testen', 'Funktionalität', 'Daten in DB speichern', '1', 'Daten werden gespeichert', 'pending'])
    writer.writerow(['', '', '', '', '', '', ''])  # Leerzeile
    writer.writerow(['TEST004', 'API-Endpoints testen', 'Funktionalität', 'Alle REST-APIs prüfen', '1', 'APIs antworten korrekt', 'pending'])
    writer.writerow(['', '', '', '', '', '', ''])  # Leerzeile
    writer.writerow(['TEST005', 'Ladezeiten messen', 'Performance', 'Seitenladezeit unter 2s', '2', 'Seite lädt schnell', 'pending'])
    writer.writerow(['', '', '', '', '', '', ''])  # Leerzeile
    writer.writerow(['TEST006', 'Stress-Test durchführen', 'Performance', '100 gleichzeitige User', '3', 'System bleibt stabil', 'pending'])
    
    # Zusätzliche Leerzeilen zum Ausfüllen
    for i in range(10):
        writer.writerow(['', '', '', '', '', '', ''])
    
    # String to bytes
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=projekt_testfaelle_template.csv"
        }
    )

@router.get("/project-template-json")
async def get_project_template_json(current_user: dict = Depends(get_current_user)):
    """
    Download JSON-Template für Projekt/Bereich/Testfälle Import
    """
    template = {
        "project": {
            "title": "Beispiel Projekt",
            "description": "Projekt-Beschreibung hier",
            "notes": "Optionale Notizen"
        },
        "test_cases": [
            {
                "test_id": "TEST001",
                "name": "Login-Funktion testen",
                "area": "UI/UX Test",
                "description": "Prüfen ob Login funktioniert",
                "priority": 1,
                "expected_result": "User wird eingeloggt",
                "status": "pending"
            },
            {
                "test_id": "TEST002",
                "name": "Navigation testen",
                "area": "UI/UX Test",
                "description": "Alle Menüpunkte anklicken",
                "priority": 2,
                "expected_result": "Navigation funktioniert",
                "status": "pending"
            },
            {
                "test_id": "TEST003",
                "name": "Datenspeicherung testen",
                "area": "Funktionalität",
                "description": "Daten in DB speichern",
                "priority": 1,
                "expected_result": "Daten werden gespeichert",
                "status": "pending"
            },
            {
                "test_id": "TEST004",
                "name": "API-Endpoints testen",
                "area": "Funktionalität",
                "description": "Alle REST-APIs prüfen",
                "priority": 1,
                "expected_result": "APIs antworten korrekt",
                "status": "pending"
            },
            {
                "test_id": "TEST005",
                "name": "Ladezeiten messen",
                "area": "Performance",
                "description": "Seitenladezeit unter 2s",
                "priority": 2,
                "expected_result": "Seite lädt schnell",
                "status": "pending"
            },
            {
                "test_id": "TEST006",
                "name": "Stress-Test durchführen",
                "area": "Performance",
                "description": "100 gleichzeitige User",
                "priority": 3,
                "expected_result": "System bleibt stabil",
                "status": "pending"
            }
        ]
    }
    
    return JSONResponse(
        content=template,
        headers={
            "Content-Disposition": "attachment; filename=projekt_testfaelle_template.json"
        }
    )

@router.get("/project-template-excel")
async def get_project_template_excel(current_user: dict = Depends(get_current_user)):
    """
    Download Excel-Template (als CSV mit Excel-Kompatibilität)
    """
    # Excel-kompatibles CSV erstellen (mit BOM für Umlaute)
    output = io.BytesIO()
    
    # UTF-8 BOM für Excel
    output.write('\ufeff'.encode('utf-8'))
    
    # CSV-Daten
    csv_data = "test_id;name;area;description;priority;expected_result;status\n"
    csv_data += 'TEST001;Login-Funktion testen;UI/UX Test;Prüfen ob Login funktioniert;1;User wird eingeloggt;pending\n'
    csv_data += 'TEST002;Navigation testen;UI/UX Test;Alle Menüpunkte anklicken;2;Navigation funktioniert;pending\n'
    csv_data += 'TEST003;Datenspeicherung testen;Funktionalität;Daten in DB speichern;1;Daten werden gespeichert;pending\n'
    csv_data += 'TEST004;API-Endpoints testen;Funktionalität;Alle REST-APIs prüfen;1;APIs antworten korrekt;pending\n'
    csv_data += 'TEST005;Ladezeiten messen;Performance;Seitenladezeit unter 2s;2;Seite lädt schnell;pending\n'
    csv_data += 'TEST006;Stress-Test durchführen;Performance;100 gleichzeitige User;3;System bleibt stabil;pending\n'
    
    output.write(csv_data.encode('utf-8'))
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=projekt_testfaelle_template.csv"
        }
    )
