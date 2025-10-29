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
    Mit ausführlichen Kommentaren und Anleitung
    """
    # CSV Template erstellen mit Struktur
    output = io.StringIO()
    writer = csv.writer(output)
    
    # ANLEITUNG
    writer.writerow(['=== ANLEITUNG ZUM AUSFÜLLEN ==='])
    writer.writerow([''])
    writer.writerow(['1. PROJEKT-INFORMATIONEN:'])
    writer.writerow(['   - Projekttitel: Name Ihres Projekts'])
    writer.writerow(['   - Beschreibung: Kurze Beschreibung des Projekts'])
    writer.writerow(['   - Notizen: Optionale zusätzliche Informationen'])
    writer.writerow(['   - Projekt-ID wird AUTOMATISCH vom System generiert!'])
    writer.writerow([''])
    writer.writerow(['2. TESTBEREICHE:'])
    writer.writerow(['   - Definieren Sie die Bereiche, in denen getestet wird'])
    writer.writerow(['   - Beispiele: UI/UX Test, Funktionalität, Performance, Sicherheit'])
    writer.writerow([''])
    writer.writerow(['3. TESTFÄLLE:'])
    writer.writerow(['   - test_id: LEER LASSEN (wird automatisch generiert)'])
    writer.writerow(['   - name: Bezeichnung des Testfalls'])
    writer.writerow(['   - area: Wählen Sie einen der definierten Testbereiche'])
    writer.writerow(['   - description: Detaillierte Beschreibung des Tests'])
    writer.writerow(['   - priority: 1=Hoch, 2=Mittel, 3=Niedrig'])
    writer.writerow(['   - expected_result: Was soll das Ergebnis sein?'])
    writer.writerow(['   - status: pending, passed, failed, skipped (Standard: pending)'])
    writer.writerow([''])
    writer.writerow(['WICHTIG: Löschen Sie diese Anleitung VOR dem Import!'])
    writer.writerow([''])
    writer.writerow(['========================================'])
    writer.writerow([''])
    
    # PROJEKT-INFORMATIONEN
    writer.writerow(['=== PROJEKT-INFORMATIONEN ==='])
    writer.writerow(['# Projekt-ID wird automatisch vom System generiert'])
    writer.writerow(['Feld', 'Wert', 'Erklärung'])
    writer.writerow(['Projekttitel', 'Mein Test-Projekt', 'Name des Projekts (PFLICHTFELD)'])
    writer.writerow(['Beschreibung', 'Beschreibung hier eingeben', 'Kurze Projektbeschreibung'])
    writer.writerow(['Notizen', 'Optionale Notizen', 'Zusätzliche Informationen (optional)'])
    writer.writerow(['company_id', '', 'Wird automatisch zugewiesen - NICHT ausfüllen!'])
    writer.writerow([])  # Leerzeile
    
    # BEREICHE
    writer.writerow(['=== TESTBEREICHE ==='])
    writer.writerow(['# Definieren Sie hier die Bereiche für Ihre Tests'])
    writer.writerow(['Bereich', 'Beschreibung'])
    writer.writerow(['UI/UX Test', 'Tests der Benutzeroberfläche und Benutzererfahrung'])
    writer.writerow(['Funktionalität', 'Tests der funktionalen Anforderungen'])
    writer.writerow(['Performance', 'Tests der Systemleistung und Geschwindigkeit'])
    writer.writerow(['Sicherheit', 'Tests der Sicherheitsmechanismen'])
    writer.writerow([])  # Leerzeile
    
    # TESTFÄLLE
    writer.writerow(['=== TESTFÄLLE ==='])
    writer.writerow(['# test_id LEER LASSEN - wird automatisch generiert!'])
    writer.writerow(['# Status-Werte: pending, passed, failed, skipped'])
    writer.writerow(['# Priority-Werte: 1 (Hoch), 2 (Mittel), 3 (Niedrig)'])
    writer.writerow([''])
    writer.writerow(['test_id', 'name', 'area', 'description', 'priority', 'expected_result', 'status'])
    writer.writerow(['LEER', 'Beispiel: Login-Funktion testen', 'UI/UX Test', 'Prüfen ob Login funktioniert', '1', 'User wird eingeloggt', 'pending'])
    writer.writerow([])  # Leerzeile zum Ausfüllen
    
    # Beispiele mit Leerzeilen
    writer.writerow(['', 'Login-Funktion testen', 'UI/UX Test', 'Prüfen ob Login mit gültigen Daten funktioniert', '1', 'User wird eingeloggt', 'pending'])
    writer.writerow([])
    writer.writerow(['', 'Navigation testen', 'UI/UX Test', 'Alle Menüpunkte anklicken und Erreichbarkeit prüfen', '2', 'Navigation funktioniert fehlerfrei', 'pending'])
    writer.writerow([])
    writer.writerow(['', 'Datenspeicherung testen', 'Funktionalität', 'Daten in Datenbank speichern und abrufen', '1', 'Daten werden korrekt gespeichert', 'pending'])
    writer.writerow([])
    writer.writerow(['', 'API-Endpoints testen', 'Funktionalität', 'Alle REST-APIs auf Funktionsfähigkeit prüfen', '1', 'APIs antworten mit Status 200', 'pending'])
    writer.writerow([])
    writer.writerow(['', 'Ladezeiten messen', 'Performance', 'Seitenladezeit unter 2 Sekunden prüfen', '2', 'Seite lädt in unter 2s', 'pending'])
    writer.writerow([])
    writer.writerow(['', 'Stress-Test durchführen', 'Performance', '100 gleichzeitige User simulieren', '3', 'System bleibt stabil', 'pending'])
    writer.writerow([])
    writer.writerow(['', 'SQL-Injection Test', 'Sicherheit', 'Eingabefelder auf SQL-Injection prüfen', '1', 'Keine SQL-Injection möglich', 'pending'])
    
    # Zusätzliche Leerzeilen zum Ausfüllen
    writer.writerow([])
    writer.writerow(['# HIER EIGENE TESTFÄLLE EINTRAGEN (test_id LEER lassen!)'])
    for i in range(15):
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
    
    return StreamingResponse(
        iter([json.dumps(template, indent=2, ensure_ascii=False)]),
        media_type="application/json",
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
