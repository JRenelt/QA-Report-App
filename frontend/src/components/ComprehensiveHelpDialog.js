import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { HelpCircle, LockKeyhole, LockKeyholeOpen } from 'lucide-react';

const ComprehensiveHelpDialog = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = useState('lock-system');
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="comprehensive-help-dialog max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="help-title-inline">
            <HelpCircle className="w-5 h-5 mr-2" />
            FavOrg - ❓ Hilfe & Anleitung (V2.3.0)
          </DialogTitle>
        </DialogHeader>
        
        <div className="help-body-with-nav flex h-[75vh]">
          {/* Navigation Menu */}
          <div className="help-navigation w-64 border-r pr-4 overflow-y-auto">
            <div className="nav-section">
              <h4 className="nav-section-title text-sm font-semibold text-blue-600 mb-2">🔒 Neue Features V2.3.0</h4>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'lock-system' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('lock-system')}
              >
                Lock/Unlock System
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'enhanced-dialogs' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('enhanced-dialogs')}
              >
                Verbesserte Dialoge
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'card-view-improvements' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('card-view-improvements')}
              >
                Kartenansicht-Verbesserungen
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'enhanced-game' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('enhanced-game')}
              >
                Spielteppich-Spiel
              </button>
            </div>

            <div className="nav-section mt-4">
              <h4 className="nav-section-title text-sm font-semibold text-green-600 mb-2">📥 Import/Export</h4>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'favorites-import' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('favorites-import')}
              >
                Favoriten Importieren
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'favorites-export' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('favorites-export')}
              >
                Favoriten Exportieren
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'browser-scripts' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('browser-scripts')}
              >
                Browser-Sammel-Skripte
              </button>
            </div>

            <div className="nav-section mt-4">
              <h4 className="nav-section-title text-sm font-semibold text-purple-600 mb-2">⚙️ Funktionen</h4>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'status-management' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('status-management')}
              >
                Status-Management
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'category-management' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('category-management')}
              >
                Kategorien verwalten
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'advanced-settings' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('advanced-settings')}
              >
                Erweiterte Einstellungen
              </button>
            </div>

            <div className="nav-section mt-4">
              <h4 className="nav-section-title text-sm font-semibold text-orange-600 mb-2">⌨️ Bedienung</h4>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'shortcuts' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('shortcuts')}
              >
                Tastatur-Shortcuts
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'ui-guide' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('ui-guide')}
              >
                Benutzeroberfläche
              </button>
            </div>

            <div className="nav-section mt-4">
              <h4 className="nav-section-title text-sm font-semibold text-gray-600 mb-2">📋 Übersicht</h4>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'version-history' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('version-history')}
              >
                Versionshistorie
              </button>
              <button
                className={`nav-menu-item block w-full text-left px-2 py-1 text-sm rounded hover:bg-gray-100 ${activeSection === 'features-overview' ? 'bg-blue-100 text-blue-800' : ''}`}
                onClick={() => setActiveSection('features-overview')}
              >
                Vollständige Features
              </button>
            </div>
          </div>
          
          {/* Content Area */}
          <div className="help-content-area flex-1 pl-6 overflow-y-auto">
            {activeSection === 'lock-system' && (
              <div className="help-section">
                <h3 className="text-xl font-bold mb-4 text-blue-800">🔒 Lock/Unlock System</h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">✨ Neue Sicherheitsfunktionen</h4>
                    <p className="text-blue-700">Schützen Sie wichtige Favoriten vor versehentlichem Bearbeiten oder Löschen mit dem neuen Lock-System.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold flex items-center gap-2 mb-2">
                        <LockKeyhole className="w-4 h-4" />
                        Favorit sperren
                      </h5>
                      <ul className="text-sm space-y-1">
                        <li>• Klicken Sie auf das Schloss-Symbol 🔒</li>
                        <li>• Favorit wird vor Änderungen geschützt</li>
                        <li>• Edit/Delete Buttons werden deaktiviert</li>
                        <li>• Status wird auf "Gesperrt" gesetzt</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold flex items-center gap-2 mb-2">
                        <LockKeyholeOpen className="w-4 h-4" />
                        Favorit entsperren
                      </h5>
                      <ul className="text-sm space-y-1">
                        <li>• Klicken Sie auf das offene Schloss 🔓</li>
                        <li>• Favorit kann wieder bearbeitet werden</li>
                        <li>• Edit/Delete Buttons werden aktiviert</li>
                        <li>• Status wird auf ursprünglichen Wert zurückgesetzt</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-gray-50 border p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">📍 Position der Lock-Buttons</h5>
                    <p className="text-sm mb-2">Die Lock/Unlock-Buttons befinden sich <strong>links neben dem Mülleimer-Symbol</strong>:</p>
                    <div className="flex items-center gap-2 text-sm bg-white p-2 rounded border">
                      <span>Status: AKTIV</span>
                      <div className="flex gap-1 ml-auto">
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">ℹ️</div>
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">🔒</div>
                        <div className="w-6 h-6 bg-gray-100 rounded flex items-center justify-center">✏️</div>
                        <div className="w-6 h-6 bg-red-100 rounded flex items-center justify-center">🗑️</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-800 mb-2">💡 Anwendungsfälle</h5>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• <strong>Wichtige Arbeits-URLs:</strong> Schützen Sie geschäftskritische Links</li>
                      <li>• <strong>Häufig verwendete Seiten:</strong> Verhindern Sie versehentliches Löschen</li>
                      <li>• <strong>Temporäre Sperre:</strong> Während Wartungsarbeiten oder Reorganisation</li>
                      <li>• <strong>Geteilte Sammlungen:</strong> Schützen Sie wichtige Links in Team-Umgebungen</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-blue-500 pl-4">
                    <h5 className="font-semibold mb-2">🔍 Status-Filter "Gesperrt"</h5>
                    <p className="text-sm">Im Status-Filter-Dropdown finden Sie jetzt den neuen Eintrag <strong>"Gesperrt 🔒"</strong>. Damit können Sie alle gesperrten Favoriten auf einen Blick anzeigen lassen.</p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'enhanced-dialogs' && (
              <div className="help-section">
                <h3 className="text-xl font-bold mb-4 text-green-800">📝 Verbesserte Dialoge</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">✨ Neuer Favorit Dialog</h4>
                    <p className="text-green-700">Vollständig überarbeiteter Dialog mit verbesserter Benutzerfreundlichkeit und erweiterten Funktionen.</p>
                  </div>

                  <div className="grid gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">🏷️ Unterkategorien-Auswahl</h5>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Automatische Aktualisierung:</strong> Unterkategorien werden basierend auf der gewählten Hauptkategorie geladen</li>
                        <li>• <strong>Alphabetische Sortierung:</strong> Alle Kategorien werden übersichtlich sortiert</li>
                        <li>• <strong>Intelligente Auswahl:</strong> Dropdown zeigt nur verfügbare Unterkategorien</li>
                        <li>• <strong>Visuelle Hinweise:</strong> Anzahl verfügbarer Unterkategorien wird angezeigt</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">📝 Verbesserte Beschreibungsfelder</h5>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Bessere Lesbarkeit:</strong> Schwarzer Text statt hellgrau auf weiß</li>
                        <li>• <strong>Kontrastreich:</strong> Optimiert für bessere Sichtbarkeit</li>
                        <li>• <strong>Größere Eingabefelder:</strong> Mehr Platz für längere Beschreibungen</li>
                        <li>• <strong>Hilfe-Hinweise:</strong> Erklärungen zur Verwendung der Beschreibungen</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">⚙️ Erweiterte Einstellungen - Kategorisiert & Alphabetisch</h5>
                      <div className="space-y-2">
                        <div className="bg-gray-50 p-2 rounded">
                          <strong className="text-xs">🔒 Sicherheits-Einstellungen</strong>
                          <ul className="text-xs mt-1 space-y-1">
                            <li>• Favorit sperren</li>
                            <li>• Schreibschutz aktivieren</li>
                          </ul>
                        </div>
                        <div className="bg-blue-50 p-2 rounded">
                          <strong className="text-xs">👁️ Anzeige-Einstellungen</strong>
                          <ul className="text-xs mt-1 space-y-1">
                            <li>• Extra Info, Kartenansicht sichtbar = 0 (versteckt)</li>
                            <li>• Theme-Einstellungen</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">🎯 Extra Info Einstellung</h5>
                    <p className="text-blue-700 text-sm mb-2">
                      <strong>"Extra Info, Kartenansicht sichtbar = 0"</strong> bedeutet:
                    </p>
                    <ul className="text-blue-700 text-sm space-y-1">
                      <li>• <strong>0 = versteckt:</strong> Beschreibungen werden nur über Info-Button (ℹ️) angezeigt</li>
                      <li>• <strong>1 = sichtbar:</strong> Beschreibungen werden direkt in der Kartenansicht eingeblendet</li>
                      <li>• <strong>Standard:</strong> 0 (versteckt) für saubere Übersicht</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'card-view-improvements' && (
              <div className="help-section">
                <h3 className="text-xl font-bold mb-4 text-purple-800">📋 Kartenansicht-Verbesserungen</h3>
                <div className="space-y-4">
                  <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">✨ Neue Kartenansicht</h4>
                    <p className="text-purple-700">Überarbeitete Darstellung mit besserer Lesbarkeit und erweiterten Interaktionsmöglichkeiten.</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">👁️ Verbesserte Beschreibungsanzeige</h5>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Versteckte Ansicht:</strong> Beschreibungen sind standardmäßig ausgeblendet</li>
                        <li>• <strong>Info-Button (ℹ️):</strong> Öffnet Extra-Info-Fenster mit Details</li>
                        <li>• <strong>Schwarzer Text:</strong> Bessere Lesbarkeit statt hellgrau</li>
                        <li>• <strong>Optionale Einblendung:</strong> Per Einstellung steuerbar</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">🔧 Erweiterte Action-Buttons</h5>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Info-Button (ℹ️):</strong> Beschreibung anzeigen</li>
                        <li>• <strong>Lock-Button (🔒/🔓):</strong> Sperren/Entsperren</li>
                        <li>• <strong>Edit-Button (✏️):</strong> Bearbeiten</li>
                        <li>• <strong>Delete-Button (🗑️):</strong> Löschen</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h5 className="font-semibold mb-2">📊 Erweiterte Status-Anzeige</h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2"><span>✅</span> Aktiv</div>
                      <div className="flex items-center gap-2"><span>❌</span> Tot</div>
                      <div className="flex items-center gap-2"><span>🏠</span> Localhost</div>
                      <div className="flex items-center gap-2"><span>🔄</span> Duplikat</div>
                      <div className="flex items-center gap-2"><span>🔒</span> Gesperrt</div>
                      <div className="flex items-center gap-2"><span>⏱️</span> Timeout</div>
                      <div className="flex items-center gap-2"><span>❓</span> Ungeprüft</div>
                      <div className="flex items-center gap-2"><span>🛡️</span> Geschützt</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 border p-4 rounded-lg">
                    <h5 className="font-semibold mb-2">📅 Hinzugefügt-Datum</h5>
                    <p className="text-sm">Jede Favoriten-Karte zeigt jetzt das Datum an, wann der Favorit hinzugefügt wurde:</p>
                    <div className="bg-white p-2 rounded border mt-2 text-xs text-gray-500">
                      Hinzugefügt: 15.9.2025
                    </div>
                  </div>

                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                    <h5 className="font-semibold text-yellow-800 mb-2">💡 Extra-Info-Fenster</h5>
                    <p className="text-yellow-700 text-sm mb-2">Das neue Extra-Info-Fenster zeigt:</p>
                    <ul className="text-yellow-700 text-sm space-y-1">
                      <li>• Vollständige Beschreibung</li>
                      <li>• URL-Informationen</li>
                      <li>• Kategorisierung (Haupt- und Unterkategorie)</li>
                      <li>• Hinzugefügt-Datum</li>
                      <li>• Übersichtliche Darstellung aller Metadaten</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'enhanced-game' && (
              <div className="help-section">
                <h3 className="text-xl font-bold mb-4 text-orange-800">🎮 Spielteppich-Spiel "Fang die Maus"</h3>
                <div className="space-y-4">
                  <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">✨ Multi-Layer Spielfeld</h4>
                    <p className="text-orange-700">Vollständig überarbeitetes Spiel basierend auf dem authentischen Spielteppich-Design mit 6 Layern.</p>
                  </div>

                  <div className="grid gap-4">
                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">🎨 Layer-System</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-green-100 rounded text-center text-xs font-bold">1</div>
                          <span><strong>Layer 1:</strong> Spielteppich-Hintergrund (Straßen, Grünflächen, Gebäude)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded text-center text-xs font-bold">2</div>
                          <span><strong>Layer 2:</strong> Die Maus 🐭 (Ihr Ziel)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 rounded text-center text-xs font-bold">3</div>
                          <span><strong>Layer 3:</strong> Gebäude (im Hintergrund integriert)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-red-100 rounded text-center text-xs font-bold">4</div>
                          <span><strong>Layer 4:</strong> Fahrzeuge 🚗🚐🚛 auf Straßen</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-yellow-100 rounded text-center text-xs font-bold">5</div>
                          <span><strong>Layer 5:</strong> Personen 🚶🏃 auf Gehwegen</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 rounded text-center text-xs font-bold">6</div>
                          <span><strong>Layer 6:</strong> Tiere 🐦🐝🦋 in der Luft</span>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">⚙️ Layer-Element Konfiguration</h5>
                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="bg-red-50 p-3 rounded">
                          <strong className="text-sm">🚗 S-KFZ (Layer 4)</strong>
                          <p className="text-xs mt-1">Format: Anzahl,Typen</p>
                          <p className="text-xs">Standard: 3,2</p>
                          <p className="text-xs text-gray-600">3 Fahrzeuge mit 2 verschiedenen Typen</p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded">
                          <strong className="text-sm">🚶 S-Human (Layer 5)</strong>
                          <p className="text-xs mt-1">Format: Anzahl,Typen</p>
                          <p className="text-xs">Standard: 3,2</p>
                          <p className="text-xs text-gray-600">3 Personen mit 2 verschiedenen Typen</p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded">
                          <strong className="text-sm">🐦 S-Animal (Layer 6)</strong>
                          <p className="text-xs mt-1">Format: Anzahl,Typen</p>
                          <p className="text-xs">Standard: 3,2</p>
                          <p className="text-xs text-gray-600">3 Tiere mit 2 verschiedenen Typen</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">🎮 Spielmechanik</h5>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Ziel:</strong> Klicken Sie auf die Maus 🐭 um Punkte zu sammeln</li>
                        <li>• <strong>Bewegung:</strong> Die Maus bewegt sich zufällig und ist schwer zu fangen</li>
                        <li>• <strong>Hindernisse:</strong> Fahrzeuge, Personen und Tiere bewegen sich über das Spielfeld</li>
                        <li>• <strong>Realistische Bewegung:</strong> Fahrzeuge fahren auf Straßen, Personen auf Gehwegen</li>
                        <li>• <strong>Fliegende Objekte:</strong> Vögel und Bienen bewegen sich frei durch die Luft</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h5 className="font-semibold mb-2">🔧 Spieleinstellungen</h5>
                      <ul className="text-sm space-y-1">
                        <li>• <strong>Anzahl-Kontrolle:</strong> Bestimmen Sie die Anzahl der Elemente pro Layer</li>
                        <li>• <strong>Typ-Vielfalt:</strong> Stellen Sie ein, wie viele verschiedene Typen verwendet werden</li>
                        <li>• <strong>Spielzeit:</strong> Anpassbare Rundendauer (30-300 Sekunden)</li>
                        <li>• <strong>Sound-Effekte:</strong> Optional aktivierbare Sounds</li>
                        <li>• <strong>Schwierigkeitsgrad:</strong> Automatische Anpassung basierend auf Element-Anzahl</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-800 mb-2">🏆 Spielstrategie</h5>
                    <ul className="text-green-700 text-sm space-y-1">
                      <li>• Die Maus vermeidet Straßenbereiche (dort sind die Fahrzeuge)</li>
                      <li>• Konzentrieren Sie sich auf Grünflächen und ruhige Bereiche</li>
                      <li>• Beobachten Sie das Bewegungsmuster der Maus</li>
                      <li>• Nutzen Sie Pausen zwischen den beweglichen Objekten</li>
                      <li>• Je mehr Elemente aktiv sind, desto schwieriger wird das Spiel</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">📊 Scoring-System</h5>
                    <p className="text-blue-700 text-sm">
                      <strong>+10 Punkte</strong> pro gefangener Maus. Die Endpunktzahl wird zusammen mit der verwendeten Konfiguration angezeigt, 
                      damit Sie verschiedene Einstellungen vergleichen können.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'status-management' && (
              <div className="help-section">
                <h3 className="text-xl font-bold mb-4">📊 Status-Management</h3>
                <div className="space-y-4">
                  <p>FavOrg bietet umfassendes Status-Management mit 8 verschiedenen Status-Typen:</p>
                  
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <span className="text-xl">✅</span>
                      <div>
                        <strong>Aktiv</strong>
                        <p className="text-sm text-gray-600">Link ist erreichbar und funktioniert</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <span className="text-xl">❌</span>
                      <div>
                        <strong>Tot</strong>
                        <p className="text-sm text-gray-600">Link ist nicht mehr erreichbar</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <span className="text-xl">🏠</span>
                      <div>
                        <strong>Localhost</strong>
                        <p className="text-sm text-gray-600">Lokale Entwicklungslinks</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <span className="text-xl">🔄</span>
                      <div>
                        <strong>Duplikate</strong>
                        <p className="text-sm text-gray-600">Doppelte URL-Einträge</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded bg-blue-50">
                      <span className="text-xl">🔒</span>
                      <div>
                        <strong>Gesperrt</strong>
                        <p className="text-sm text-gray-600">Kann nicht bearbeitet/gelöscht werden</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <span className="text-xl">⏱️</span>
                      <div>
                        <strong>Timeout</strong>
                        <p className="text-sm text-gray-600">Link antwortet nicht rechtzeitig</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <span className="text-xl">❓</span>
                      <div>
                        <strong>Ungeprüft</strong>
                        <p className="text-sm text-gray-600">Noch nicht validiert</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 border rounded">
                      <span className="text-xl">📊</span>
                      <div>
                        <strong>Alle Status</strong>
                        <p className="text-sm text-gray-600">Zeigt alle Favoriten an</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'version-history' && (
              <div className="help-section">
                <h3 className="text-xl font-bold mb-4">📋 Versionshistorie</h3>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 bg-blue-50 p-4 rounded-r">
                    <h4 className="font-bold text-blue-800">Version 2.3.0 - September 2025</h4>
                    <p className="text-sm text-blue-700 mb-2">Aktuelle Version mit Lock-System und Spielverbesserungen</p>
                    <ul className="text-sm space-y-1">
                      <li>✨ Lock/Unlock System für Favoriten</li>
                      <li>🔒 Neuer Status "Gesperrt" mit Lucide Lock-Icons</li>
                      <li>📝 Verbesserte Dialoge mit Unterkategorien-Auswahl</li>
                      <li>📋 Kartenansicht mit versteckten Beschreibungen</li>
                      <li>🎮 Multi-Layer Spielteppich-Spiel</li>
                      <li>⚙️ Kategorisierte und alphabetisch sortierte Einstellungen</li>
                      <li>📅 Hinzugefügt-Datum in Kartenansicht</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-green-500 pl-4 bg-green-50 p-4 rounded-r">
                    <h4 className="font-bold text-green-800">Version 2.2.0 - August 2025</h4>
                    <p className="text-sm text-green-700 mb-2">Erweiterte Features und Spiel-Integration</p>
                    <ul className="text-sm space-y-1">
                      <li>🎮 Erstes "Fang die Maus" Spiel</li>
                      <li>📊 Erweiterte Statistiken</li>
                      <li>🔧 Verbesserte Backend-APIs</li>
                      <li>🎨 UI-Komponenten-Bibliothek</li>
                    </ul>
                  </div>

                  <div className="border-l-4 border-gray-500 pl-4 bg-gray-50 p-4 rounded-r">
                    <h4 className="font-bold text-gray-800">Version 2.1.0 - Juli 2025</h4>
                    <p className="text-sm text-gray-700 mb-2">Grundlegende FavOrg-Funktionalität</p>
                    <ul className="text-sm space-y-1">
                      <li>📥 Multi-Format Import/Export</li>
                      <li>🏷️ Hierarchische Kategorien</li>
                      <li>🔍 Link-Validierung</li>
                      <li>🔄 Duplikat-Erkennung</li>
                      <li>📱 Responsive Design</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'features-overview' && (
              <div className="help-section">
                <h3 className="text-xl font-bold mb-4">📋 Vollständige Features V2.3.0</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">🔒 Sicherheit & Schutz</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Lock/Unlock System</li>
                        <li>• Schreibschutz-Optionen</li>
                        <li>• Lösch-Bestätigungen</li>
                        <li>• Status-basierte Zugriffskontrolle</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-green-800 mb-2">📥 Import/Export</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Multi-Format Import (HTML, JSON, XML, CSV)</li>
                        <li>• Browser-Sammel-Skripte</li>
                        <li>• Automatische Duplikat-Erkennung</li>
                        <li>• Browser-spezifische Kompatibilität</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 mb-2">🏷️ Organisation</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Hierarchische Kategorien (unbegrenzte Ebenen)</li>
                        <li>• Drag & Drop Neuorganisation</li>
                        <li>• Automatische Spezial-Kategorien</li>
                        <li>• Live-Kategorie-Bearbeitung</li>
                        <li>• Resizable Sidebar</li>
                      </ul>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">📊 Status & Analyse</h4>
                      <ul className="text-sm space-y-1">
                        <li>• 8 verschiedene Status-Typen</li>
                        <li>• Automatische Link-Validierung</li>
                        <li>• Duplikat-Erkennung</li>
                        <li>• Localhost-Identifikation</li>
                        <li>• Umfassende Statistiken</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-teal-800 mb-2">🎨 Benutzeroberfläche</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Moderne Kartenansicht</li>
                        <li>• Dark Theme Support</li>
                        <li>• Responsive Design</li>
                        <li>• Extra-Info-Fenster</li>
                        <li>• Intuitive Navigation</li>
                      </ul>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h4 className="font-semibold text-pink-800 mb-2">🎮 Unterhaltung</h4>
                      <ul className="text-sm space-y-1">
                        <li>• Multi-Layer Spielteppich-Spiel</li>
                        <li>• Konfigurierbare Layer-Elemente</li>
                        <li>• Realistische Spielphysik</li>
                        <li>• Anpassbare Schwierigkeitsgrade</li>
                        <li>• Sound-Unterstützung</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 border p-4 rounded-lg mt-6">
                  <h4 className="font-semibold mb-2">🔧 Technische Spezifikationen</h4>
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <strong>Frontend:</strong>
                      <ul className="text-xs mt-1">
                        <li>• React 19</li>
                        <li>• Tailwind CSS</li>
                        <li>• Shadcn/UI Komponenten</li>
                        <li>• Lucide Icons</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Backend:</strong>
                      <ul className="text-xs mt-1">
                        <li>• FastAPI (Python)</li>
                        <li>• MongoDB Database</li>
                        <li>• Motor (Async MongoDB)</li>
                        <li>• Pydantic Models</li>
                      </ul>
                    </div>
                    <div>
                      <strong>Features:</strong>
                      <ul className="text-xs mt-1">
                        <li>• Progressive Web App</li>
                        <li>• Responsive Design</li>
                        <li>• Cross-Browser Support</li>
                        <li>• Real-time Updates</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional sections can be added here */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComprehensiveHelpDialog;