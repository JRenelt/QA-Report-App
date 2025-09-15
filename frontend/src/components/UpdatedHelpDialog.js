import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { HelpCircle } from 'lucide-react';

const UpdatedHelpDialog = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('favorites-import');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="help-dialog max-w-4xl">
        <DialogHeader>
          <DialogTitle className="help-title-inline">
            <HelpCircle className="w-5 h-5 mr-2" />
            FavOrg - ❓ Hilfe & Anleitung (V2.2.0)
          </DialogTitle>
        </DialogHeader>
        
        <div className="help-body-with-nav">
          {/* Navigation Menu */}
          <div className="help-navigation">
            <div className="nav-section">
              <h4 className="nav-section-title">📥 Import/Export</h4>
              <button
                className={`nav-menu-item ${activeSection === 'favorites-import' ? 'active' : ''}`}
                onClick={() => setActiveSection('favorites-import')}
              >
                Favoriten Importieren
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'favorites-export' ? 'active' : ''}`}
                onClick={() => setActiveSection('favorites-export')}
              >
                Favoriten Exportieren
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'browser-scripts' ? 'active' : ''}`}
                onClick={() => setActiveSection('browser-scripts')}
              >
                Browser-Sammel-Skripte
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">⚙️ Funktionen</h4>
              <button
                className={`nav-menu-item ${activeSection === 'status-management' ? 'active' : ''}`}
                onClick={() => setActiveSection('status-management')}
              >
                Status-Management
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'lock-system' ? 'active' : ''}`}
                onClick={() => setActiveSection('lock-system')}
              >
                Sperr-System
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'category-management' ? 'active' : ''}`}
                onClick={() => setActiveSection('category-management')}
              >
                Kategorien verwalten
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'card-view' ? 'active' : ''}`}
                onClick={() => setActiveSection('card-view')}
              >
                Kartenansicht
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">🎮 Spiele</h4>
              <button
                className={`nav-menu-item ${activeSection === 'catch-mouse-game' ? 'active' : ''}`}
                onClick={() => setActiveSection('catch-mouse-game')}
              >
                Fang die Maus
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">🔧 Einstellungen</h4>
              <button
                className={`nav-menu-item ${activeSection === 'advanced-settings' ? 'active' : ''}`}
                onClick={() => setActiveSection('advanced-settings')}
              >
                Erweiterte Einstellungen
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'shortcuts' ? 'active' : ''}`}
                onClick={() => setActiveSection('shortcuts')}
              >
                Tastatur-Shortcuts
              </button>
            </div>

            <div className="nav-section">
              <h4 className="nav-section-title">📋 Übersicht</h4>
              <button
                className={`nav-menu-item ${activeSection === 'new-features' ? 'active' : ''}`}
                onClick={() => setActiveSection('new-features')}
              >
                Neue Features V2.2.0
              </button>
              <button
                className={`nav-menu-item ${activeSection === 'features-overview' ? 'active' : ''}`}
                onClick={() => setActiveSection('features-overview')}
              >
                Vollständige Features
              </button>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="help-content-area">
            {activeSection === 'favorites-import' && (
              <div className="help-section">
                <h4>📥 Favoriten Importieren</h4>
                <p>FavOrg unterstützt erweiterte Import-Funktionen mit automatischer Kategorisierung:</p>
                <ul>
                  <li><strong>Multi-Browser Unterstützung:</strong> Chrome, Firefox, Edge, Safari, Opera</li>
                  <li><strong>Automatische Duplikat-Erkennung:</strong> Verhindert doppelte Einträge</li>
                  <li><strong>Hierarchische Kategorien:</strong> Unterkategorien werden automatisch erstellt</li>
                  <li><strong>Status-Kategorisierung:</strong> Automatische Sortierung in spezielle Gruppen</li>
                  <li><strong>Link-Validierung:</strong> Sofortige Überprüfung auf Erreichbarkeit</li>
                </ul>
                <div className="feature-highlight">
                  <h5>✨ Neue Funktionen:</h5>
                  <ul>
                    <li>Automatische Sortierung in "Duplikate", "Defekte Links", "Localhost"</li>
                    <li>Erkennung und Markierung von Localhost-URLs</li>
                    <li>Erweiterte Unterkategorien-Unterstützung</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'favorites-export' && (
              <div className="help-section">
                <h4>📤 Favoriten Exportieren</h4>
                <p>Exportieren Sie Ihre Favoriten in verschiedene browserkompatible Formate:</p>
                <ul>
                  <li><strong>HTML Export:</strong> Standard-Format für alle Browser</li>
                  <li><strong>JSON Export:</strong> Chrome-kompatibel mit Metadaten</li>
                  <li><strong>XML Export:</strong> Strukturiert für Re-Import</li>
                  <li><strong>CSV Export:</strong> Tabellenformat für Excel</li>
                  <li><strong>Multi-Format Export:</strong> Alle Formate gleichzeitig</li>
                </ul>
                <div className="tip-box">
                  <p><strong>💡 Tipp:</strong> Verwenden Sie "Alle Formate exportieren" für maximale Kompatibilität.</p>
                </div>
              </div>
            )}

            {activeSection === 'browser-scripts' && (
              <div className="help-section">
                <h4>🤖 Browser-Sammel-Skripte</h4>
                <p>Automatisierte Skripte zum Sammeln von Favoriten aus allen installierten Browsern:</p>
                <ul>
                  <li><strong>collect_bookmarks.py:</strong> Python-Skript für alle Betriebssysteme</li>
                  <li><strong>collect_bookmarks.bat:</strong> Windows Batch-Datei</li>
                  <li><strong>collect_bookmarks.sh:</strong> Linux/macOS Shell-Skript</li>
                </ul>
                <div className="instructions">
                  <h5>🔧 Verwendung:</h5>
                  <ol>
                    <li>Laden Sie die Skripte aus dem /scripts Ordner herunter</li>
                    <li>Führen Sie das entsprechende Skript für Ihr System aus</li>
                    <li>Die gesammelten Favoriten werden als HTML-Datei gespeichert</li>
                    <li>Importieren Sie die HTML-Datei in FavOrg</li>
                  </ol>
                </div>
              </div>
            )}

            {activeSection === 'status-management' && (
              <div className="help-section">
                <h4>📊 Status-Management</h4>
                <p>FavOrg bietet erweiterte Status-Verwaltung für Ihre Favoriten:</p>
                <div className="status-grid">
                  <div className="status-item">
                    <span className="status-icon">✅</span>
                    <div>
                      <strong>Aktiv:</strong> Link ist erreichbar und funktioniert
                    </div>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">❌</span>
                    <div>
                      <strong>Tot:</strong> Link ist nicht mehr erreichbar
                    </div>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🏠</span>
                    <div>
                      <strong>Localhost:</strong> Lokale Entwicklungslinks
                    </div>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🔄</span>
                    <div>
                      <strong>Duplikate:</strong> Doppelte URL-Einträge
                    </div>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">🔒</span>
                    <div>
                      <strong>Gesperrt:</strong> Kann nicht bearbeitet/gelöscht werden
                    </div>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">⏱️</span>
                    <div>
                      <strong>Timeout:</strong> Link antwortet nicht rechtzeitig
                    </div>
                  </div>
                  <div className="status-item">
                    <span className="status-icon">❓</span>
                    <div>
                      <strong>Ungeprüft:</strong> Noch nicht validiert
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'lock-system' && (
              <div className="help-section">
                <h4>🔒 Sperr-System</h4>
                <p>Neue Sicherheitsfunktionen zum Schutz wichtiger Favoriten:</p>
                <ul>
                  <li><strong>Favorit sperren:</strong> Klicken Sie auf das Schloss-Symbol 🔒</li>
                  <li><strong>Favorit entsperren:</strong> Klicken Sie auf das offene Schloss 🔓</li>
                  <li><strong>Gesperrte Favoriten:</strong> Können nicht bearbeitet oder gelöscht werden</li>
                  <li><strong>Status-Filter:</strong> "Gesperrt" in der Dropdown-Liste wählen</li>
                  <li><strong>Schreibschutz:</strong> Zusätzlicher Schutz vor versehentlichen Änderungen</li>
                </ul>
                <div className="feature-highlight">
                  <h5>🔐 Anwendungsfälle:</h5>
                  <ul>
                    <li>Wichtige Arbeits-URLs schützen</li>
                    <li>Häufig verwendete Links vor versehentlichem Löschen bewahren</li>
                    <li>Temporäre Sperre während Wartungsarbeiten</li>
                  </ul>
                </div>
              </div>
            )}

            {activeSection === 'category-management' && (
              <div className="help-section">
                <h4>🏷️ Kategorien verwalten</h4>
                <p>Erweiterte Kategorie-Verwaltung mit unbegrenzten Hierarchie-Ebenen:</p>
                <ul>
                  <li><strong>Hauptkategorien:</strong> Oberste Organisationsebene</li>
                  <li><strong>Unterkategorien:</strong> Unbegrenzte Verschachtelung möglich</li>
                  <li><strong>Live-Bearbeitung:</strong> Kategorien direkt bearbeiten mit Enter</li>
                  <li><strong>Drag & Drop:</strong> Kategorien zwischen Ebenen verschieben</li>
                  <li><strong>Automatische Zählung:</strong> Anzahl Favoriten pro Kategorie</li>
                </ul>
                <div className="instructions">
                  <h5>📝 Neue Kategorie erstellen:</h5>
                  <ol>
                    <li>Text in "Neue Kategorie" eingeben</li>
                    <li>Enter drücken zum Erstellen</li>
                    <li>Für Unterkategorien: Parent-Kategorie auswählen</li>
                  </ol>
                </div>
              </div>
            )}

            {activeSection === 'card-view' && (
              <div className="help-section">
                <h4>📋 Kartenansicht</h4>
                <p>Neue verbesserte Kartenansicht mit erweiterten Informationen:</p>
                <ul>
                  <li><strong>Beschreibungsfeld:</strong> Verbesserte Lesbarkeit (nicht mehr hellgrau auf weiß)</li>
                  <li><strong>Extra-Info-Fenster:</strong> Klicken Sie auf das Info-Symbol ℹ️</li>
                  <li><strong>Status-Badges:</strong> Farbkodierte Status-Anzeigen</li>
                  <li><strong>Action-Buttons:</strong> Sperren/Entsperren, Bearbeiten, Löschen</li>
                  <li><strong>Responsive Design:</strong> Passt sich der Bildschirmgröße an</li>
                </ul>
                <div className="settings-info">
                  <h5>⚙️ Einstellungen:</h5>
                  <p><strong>Extra Info, Kartenansicht sichtbar = 1:</strong> Beschreibungen sind standardmäßig in der Kartenansicht verfügbar</p>
                </div>
              </div>
            )}

            {activeSection === 'catch-mouse-game' && (
              <div className="help-section">
                <h4>🐭 Fang die Maus - Multi-Layer Spiel</h4>
                <p>Neues interaktives Spiel basierend auf dem Spielteppich-Design:</p>
                
                <div className="game-layers">
                  <h5>🎨 Spiel-Layer:</h5>
                  <ul>
                    <li><strong>Layer 1:</strong> Hintergrund (Spielteppich mit Straßen und Grünflächen)</li>
                    <li><strong>Layer 2:</strong> Die Maus 🐭 (Ihr Ziel)</li>
                    <li><strong>Layer 3:</strong> Gebäude (Krankenhaus, Polizei, Shops, etc.)</li>
                    <li><strong>Layer 4:</strong> Fahrzeuge auf Straße 🚗🚐</li>
                    <li><strong>Layer 5:</strong> Personen auf Straße 🚶🏃</li>
                    <li><strong>Layer 6:</strong> Tiere (Vögel 🐦, Bienen 🐝)</li>
                  </ul>
                </div>
                
                <div className="game-settings">
                  <h5>⚙️ Spieleinstellungen:</h5>
                  <ul>
                    <li><strong>S-KFZ:</strong> Anzahl und Typen der Fahrzeuge (Standard: 3,2)</li>
                    <li><strong>S-Human:</strong> Anzahl und Typen der Personen (Standard: 3,2)</li>
                    <li><strong>S-Animal:</strong> Anzahl und Typen der Tiere (Standard: 3,2)</li>
                    <li><strong>Spielzeit:</strong> Anpassbare Rundendauer</li>
                  </ul>
                </div>
                
                <div className="game-instructions">
                  <h5>🎮 Spielanleitung:</h5>
                  <ol>
                    <li>Klicken Sie auf die Maus 🐭 um Punkte zu sammeln</li>
                    <li>Vermeiden Sie Kollisionen mit beweglichen Objekten</li>
                    <li>Je mehr Mäuse Sie fangen, desto höher Ihr Score</li>
                    <li>Das Spiel endet nach der eingestellten Zeit</li>
                  </ol>
                </div>
              </div>
            )}

            {activeSection === 'advanced-settings' && (
              <div className="help-section">
                <h4>🔧 Erweiterte Einstellungen</h4>
                <p>Neue kategorisierte Einstellungen für bessere Organisation:</p>
                
                <div className="settings-categories">
                  <div className="setting-category">
                    <h5>📊 Ansichts-Einstellungen</h5>
                    <ul>
                      <li><strong>Extra Info, Kartenansicht sichtbar = 1:</strong> Beschreibungen anzeigen</li>
                      <li><strong>Sidebar-Breite:</strong> Anpassbare Kategorien-Sidebar</li>
                      <li><strong>Theme-Modus:</strong> Hell/Dunkel-Umschaltung</li>
                    </ul>
                  </div>
                  
                  <div className="setting-category">
                    <h5>🔒 Sicherheits-Einstellungen</h5>
                    <ul>
                      <li><strong>Standard-Schutz:</strong> Neue Favoriten automatisch schützen</li>
                      <li><strong>Lösch-Bestätigung:</strong> Sicherheitsabfrage bei Löschvorgängen</li>
                      <li><strong>Bulk-Operationen:</strong> Massenänderungen erlauben</li>
                    </ul>
                  </div>
                  
                  <div className="setting-category">
                    <h5>🎮 Spiel-Einstellungen</h5>
                    <ul>
                      <li><strong>S-KFZ, S-Human, S-Animal:</strong> Layer-Element-Konfiguration</li>
                      <li><strong>Standard-Spielzeit:</strong> Vordefinierte Rundenlänge</li>
                      <li><strong>Schwierigkeitsgrad:</strong> Leicht, Mittel, Schwer</li>
                    </ul>
                  </div>
                </div>
                
                <div className="alphabetical-note">
                  <p><strong>📝 Hinweis:</strong> Alle Einstellungen werden alphabetisch sortiert dargestellt für bessere Übersichtlichkeit.</p>
                </div>
              </div>
            )}

            {activeSection === 'shortcuts' && (
              <div className="help-section">
                <h4>⌨️ Tastatur-Shortcuts</h4>
                
                <div className="shortcuts-grid">
                  <div className="shortcut-category">
                    <h5>📥 Import/Export</h5>
                    <ul>
                      <li><strong>Alt + I:</strong> Import-Dialog öffnen</li>
                      <li><strong>Alt + E:</strong> Export-Dialog öffnen</li>
                      <li><strong>Alt + S:</strong> Browser-Skripte herunterladen</li>
                    </ul>
                  </div>
                  
                  <div className="shortcut-category">
                    <h5>📝 Favoriten-Management</h5>
                    <ul>
                      <li><strong>Alt + N:</strong> Neuen Favorit erstellen</li>
                      <li><strong>Strg + L:</strong> Ausgewählte Favoriten sperren</li>
                      <li><strong>Strg + U:</strong> Ausgewählte Favoriten entsperren</li>
                      <li><strong>Del:</strong> Ausgewählte Favoriten löschen</li>
                    </ul>
                  </div>
                  
                  <div className="shortcut-category">
                    <h5>🏷️ Kategorien</h5>
                    <ul>
                      <li><strong>Alt + C:</strong> Kategorie-Management öffnen</li>
                      <li><strong>Enter:</strong> Kategorie-Bearbeitung bestätigen</li>
                      <li><strong>Escape:</strong> Kategorie-Bearbeitung abbrechen</li>
                    </ul>
                  </div>
                  
                  <div className="shortcut-category">
                    <h5>🎮 Spiel</h5>
                    <ul>
                      <li><strong>Space:</strong> Spiel pausieren/fortsetzen</li>
                      <li><strong>R:</strong> Spiel neu starten</li>
                      <li><strong>Escape:</strong> Spiel beenden</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'new-features' && (
              <div className="help-section">
                <h4>✨ Neue Features in Version 2.2.0</h4>
                
                <div className="new-features-list">
                  <div className="feature-item">
                    <h5>🔒 Sperr-System</h5>
                    <p>Neue "Gesperrt"-Status für Favoriten mit Lock/Unlock-Buttons</p>
                    <ul>
                      <li>Schloss-Symbol neben Mülleimer-Button</li>
                      <li>Gesperrt-Filter in Status-Dropdown</li>
                      <li>Schutz vor versehentlichem Bearbeiten/Löschen</li>
                    </ul>
                  </div>
                  
                  <div className="feature-item">
                    <h5>📋 Verbesserte Kartenansicht</h5>
                    <p>Überarbeitete Benutzeroberfläche mit besserer Lesbarkeit</p>
                    <ul>
                      <li>Kontrastreichere Beschreibungsfelder</li>
                      <li>Optional einblendbare Extra-Info-Fenster</li>
                      <li>Verbesserte Status-Badge-Darstellung</li>
                    </ul>
                  </div>
                  
                  <div className="feature-item">
                    <h5>🏷️ Erweiterte Unterkategorien</h5>
                    <p>Vollständige Unterkategorien-Unterstützung in Dialogen</p>
                    <ul>
                      <li>Dropdown für vorhandene Unterkategorien</li>
                      <li>Automatische Aktualisierung bei Kategorie-Wechsel</li>
                      <li>Hierarchische Anzeige in Auswahl-Listen</li>
                    </ul>
                  </div>
                  
                  <div className="feature-item">
                    <h5>🎮 Fang die Maus Spiel</h5>
                    <p>Neues interaktives Multi-Layer-Spiel</p>
                    <ul>
                      <li>6-Layer Spielfeld basierend auf Spielteppich</li>
                      <li>Konfigurierbare Element-Anzahl pro Layer</li>
                      <li>Anpassbare Spielzeit und Schwierigkeitsgrad</li>
                    </ul>
                  </div>
                  
                  <div className="feature-item">
                    <h5>⚙️ Kategorisierte Einstellungen</h5>
                    <p>Alphabetisch sortierte und kategorisierte Einstellungen</p>
                    <ul>
                      <li>Ansichts-, Sicherheits- und Spiel-Einstellungen</li>
                      <li>Neue Option: "Extra Info, Kartenansicht sichtbar = 1"</li>
                      <li>Verbesserte Organisation aller Optionen</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'features-overview' && (
              <div className="help-section">
                <h4>📋 Vollständige Features-Übersicht</h4>
                <p>FavOrg V2.2.0 bietet umfassende Funktionen für professionelle Favoriten-Verwaltung:</p>
                
                <div className="features-grid">
                  <div className="feature-group">
                    <h5>📥 Import/Export</h5>
                    <ul>
                      <li>Multi-Format Import (HTML, JSON, XML, CSV)</li>
                      <li>Browser-Sammel-Skripte</li>
                      <li>Automatische Duplikat-Erkennung</li>
                      <li>Multi-Format Export</li>
                      <li>Browser-spezifische Kompatibilität</li>
                    </ul>
                  </div>
                  
                  <div className="feature-group">
                    <h5>🏷️ Organisation</h5>
                    <ul>
                      <li>Hierarchische Kategorien (unbegrenzte Ebenen)</li>
                      <li>Drag & Drop Neuorganisation</li>
                      <li>Automatische Spezial-Kategorien</li>
                      <li>Live-Kategorie-Bearbeitung</li>
                      <li>Resizable Sidebar</li>
                    </ul>
                  </div>
                  
                  <div className="feature-group">
                    <h5>🔒 Sicherheit</h5>
                    <ul>
                      <li>Favoriten-Sperr-System</li>
                      <li>Schreibschutz-Optionen</li>
                      <li>Lösch-Bestätigungen</li>
                      <li>Bulk-Operation-Kontrolle</li>
                      <li>Status-basierte Zugriffskontrolle</li>
                    </ul>
                  </div>
                  
                  <div className="feature-group">
                    <h5>📊 Status & Analyse</h5>
                    <ul>
                      <li>7 verschiedene Status-Typen</li>
                      <li>Automatische Link-Validierung</li>
                      <li>Duplikat-Erkennung</li>
                      <li>Localhost-Identifikation</li>
                      <li>Umfassende Statistiken</li>
                    </ul>
                  </div>
                  
                  <div className="feature-group">
                    <h5>🎨 Benutzeroberfläche</h5>
                    <ul>
                      <li>Moderne Kartenansicht</li>
                      <li>Dark Theme Support</li>
                      <li>Responsive Design</li>
                      <li>Extra-Info-Fenster</li>
                      <li>Intuitive Navigation</li>
                    </ul>
                  </div>
                  
                  <div className="feature-group">
                    <h5>🎮 Unterhaltung</h5>
                    <ul>
                      <li>Fang die Maus Multi-Layer-Spiel</li>
                      <li>Konfigurierbare Spiel-Elemente</li>
                      <li>Anpassbare Schwierigkeitsgrade</li>
                      <li>High-Score-System</li>
                      <li>Pause/Resume-Funktionalität</li>
                    </ul>
                  </div>
                </div>
                
                <div className="version-info">
                  <p><strong>Version:</strong> 2.2.0</p>
                  <p><strong>Release-Datum:</strong> September 2025</p>
                  <p><strong>Neue Features:</strong> Sperr-System, Kartenansicht-Verbesserungen, Fang die Maus Spiel, erweiterte Einstellungen</p>
                  <p><strong>Kompatibilität:</strong> Alle modernen Browser, responsive Design für Mobile/Tablet/Desktop</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpdatedHelpDialog;