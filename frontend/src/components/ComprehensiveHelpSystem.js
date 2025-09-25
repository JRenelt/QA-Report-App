import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { 
  HelpCircle, 
  Download, 
  Search, 
  BookOpen, 
  Settings, 
  FolderPlus,
  Lock,
  Filter,
  Upload,
  Grid,
  Table,
  Play,
  MousePointer2,
  FileDown,
  Globe,
  Trash2
} from 'lucide-react';

const ComprehensiveHelpSystem = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('overview');

  const helpSections = {
    overview: {
      title: 'Übersicht',
      icon: <BookOpen className="w-5 h-5" />,
      content: {
        title: 'FavOrg - Professioneller Bookmark Manager',
        description: 'FavOrg ist ein moderner, webbasierter Lesezeichen-Manager mit erweiterten Funktionen für Organisation, Validierung und Verwaltung Ihrer Browser-Favoriten.',
        features: [
          'Hierarchische Kategorien-Verwaltung (unbegrenzte Ebenen)',
          'Automatische Link-Validierung und Duplikat-Erkennung',
          'Drag & Drop Sortierung und Cross-Over Verschiebung',
          'Lock/Unlock Schutz für wichtige Favoriten',
          'Import/Export in verschiedenen Formaten',
          'Erweiterte Such- und Filterfunktionen',
          'Responsive Design für alle Bildschirmgrößen',
          'Dunkles und helles Theme'
        ],
        quickStart: [
          '1. Importieren Sie Ihre Browser-Favoriten über "Datei wählen"',
          '2. Organisieren Sie Links in Kategorien über die Sidebar',
          '3. Verwenden Sie Filter um Links nach Status zu sortieren',
          '4. Sperren Sie wichtige Links mit dem Schloss-Symbol',
          '5. Exportieren Sie Ihre Sammlung in verschiedenen Formaten'
        ]
      }
    },
    categories: {
      icon: '🏷️',
      title: 'Kategorien-Verwaltung',
      description: 'Hierarchische Organisation mit unbegrenzten Ebenen und Excel-ähnlichem Drag & Drop.',
      content: {
        title: 'Hierarchische Kategorien-Verwaltung',
        description: 'Organisieren Sie Ihre Bookmarks in einer unbegrenzten Kategorie-Hierarchie mit Excel-ähnlichen Drag & Drop Funktionen.',
        features: [
          '🏷️ Unbegrenzte Kategorie-Ebenen (Haupt- und Unterkategorien)',
          '🔄 Excel-ähnliches Drag & Drop zwischen allen Ebenen',
          '⌨️ Shift-Modus für präzises Einfügen zwischen Kategorien',
          '📊 Live-Bearbeitung mit sofortiger Aktualisierung',
          '🔍 Suchfunktion innerhalb der Kategorie-Verwaltung',
          '🎯 Cross-Level Verschiebung (Unterkategorie ↔ Hauptkategorie)',
          '📍 "Alle" als Root-Drop-Ziel für Hauptkategorien-Erstellung'
        ],
        sections: [
          {
            title: 'Excel-ähnliches Drag & Drop System',
            steps: [
              '🖱️ **Standardmodus (ohne Shift)**: Kategorie greifen und an neue Position ziehen',
              '📂 **Hauptkategorie → Unterkategorie**: Auf andere Hauptkategorie ziehen',
              '📁 **Unterkategorie → Hauptkategorie**: Auf "Alle" ziehen',
              '🔄 **Cross-Level**: Zwischen allen Ebenen frei verschieben',
              '📍 **Erste Position**: Verschobene Kategorien erscheinen an erster Stelle'
            ]
          },
          {
            title: 'Shift-Modus (Excel-Einfügen)',
            steps: [
              '⌨️ **Shift gedrückt halten** während des Ziehens',
              '📏 **Grüne Linie erscheint**: Zeigt exakte Einfügeposition',
              '📋 **Einfügen zwischen Kategorien**: Bestehende rutschen nach unten',
              '🎯 **Präzise Positionierung**: Wie Excel-Zeilen einfügen'
            ]
          },
          {
            title: 'Live Kategorien-Verwaltung',
            steps: [
              '🏷️ **Dialog öffnen**: Plus-Symbol neben "Kategorien" in Sidebar',
              '🔍 **Interne Suche**: Suchfeld für schnelles Finden von Kategorien',
              '✏️ **Live-Edit**: Klick auf Edit-Symbol für Inline-Bearbeitung',
              '➕ **Neue Kategorien**: "Neue Hauptkategorie" Button',
              '🗑️ **CRUD-Operationen**: Create, Read, Update, Delete',
              '💾 **Enter/Escape**: Speichern oder Abbrechen'
            ]
          },
          {
            title: 'Kategorie-Sidebar Features',
            steps: [
              '👁️ **Ein-/Ausblendbar**: Toggle-Button für mehr Platz',
              '📏 **Größe anpassbar**: Ziehen am rechten Rand zum Vergrößern',
              '🔍 **Vollständiges Scrolling**: Alle Kategorien erreichbar',
              'ℹ️ **Info-Button**: Hilfe direkt neben "Kategorien" Titel',
              '🎯 **Drop-Zonen**: "Alle" und alle Kategorien als Drop-Targets'
            ]
          }
        ]
      }
    },
    bookmarks: {
      title: 'Lesezeichen-Verwaltung',
      icon: <MousePointer2 className="w-5 h-5" />,
      content: {
        title: 'Umfassende Bookmark-Verwaltung',
        description: 'Verwalten Sie Ihre Lesezeichen mit erweiterten CRUD-Operationen, Drag & Drop und Schutzfunktionen.',
        sections: [
          {
            title: 'Lesezeichen hinzufügen',
            steps: [
              'Klicken Sie auf "Neu" im Header',
              'Geben Sie Titel, URL und Beschreibung ein',
              'Wählen Sie Kategorie und Unterkategorie',
              'Klicken Sie "Speichern"'
            ]
          },
          {
            title: 'Lock/Unlock Schutz',
            steps: [
              'Grünes offenes Schloss = Favorit ist entsperrt',
              'Rotes geschlossenes Schloss = Favorit ist gesperrt',
              'Gesperrte Favoriten können nicht bearbeitet oder gelöscht werden',
              'Drag & Drop ist für gesperrte Favoriten deaktiviert',
              'Klick auf Schloss wechselt zwischen gesperrt/entsperrt'
            ]
          },
          {
            title: 'Drag & Drop Sortierung',
            steps: [
              'Ziehen Sie Favoriten auf andere Favoriten zum Umordnen',
              'Ziehen Sie Favoriten in die Sidebar um Kategorie zu ändern',
              'Gesperrte Favoriten können nicht verschoben werden',
              'Toast-Nachrichten bestätigen erfolgreiche Verschiebungen'
            ]
          }
        ]
      }
    },
    filtering: {
      title: 'Filter & Suche',
      icon: <Filter className="w-5 h-5" />,
      content: {
        title: 'Erweiterte Filter- und Suchfunktionen',
        description: 'Finden Sie schnell die gewünschten Lesezeichen mit intelligenten Filtern und Suchfunktionen.',
        sections: [
          {
            title: 'Status-Filter',
            steps: [
              'Alle: Zeigt alle Favoriten (ohne Symbol)',
              'Aktiv ✅: Funktionierende Links',
              'Tot ❌: Defekte Links (404 Fehler)',
              'Localhost 🏠: Lokale Entwicklungslinks',
              'Duplikate 🔄: Doppelte URLs',
              'Gesperrt 🔒: Mit Schloss geschützte Links',
              'Timeout ⏱️: Langsame oder zeitüberschreitende Links',
              'Ungeprüft ❓: Noch nicht validierte Links'
            ]
          },
          {
            title: 'Erweiterte Suche',
            steps: [
              'Durchsucht Titel, URL, Kategorie UND Beschreibung',
              'Suchbegriffe werden gelb hervorgehoben',
              'Treffer-Anzahl wird rechts in der Suchleiste angezeigt',
              'Echtzeit-Filterung während der Eingabe'
            ]
          }
        ]
      }
    },
    lock: {
      icon: '🔒',
      title: 'Sperr-System',
      description: 'CRUD-Schutz für wichtige Bookmarks mit visuellen Indikatoren.',
      content: {
        title: 'Bookmark-Sperr-System',
        description: 'Schützen Sie wichtige Bookmarks vor versehentlichem Löschen oder Bearbeiten.',
        features: [
          '🔒 Ein-Klick Sperren/Entsperren von Bookmarks',
          '🛡️ CRUD-Schutz: Gesperrte Bookmarks können nicht gelöscht/bearbeitet werden',
          '🔄 Drag & Drop erlaubt: Verschieben zwischen Kategorien möglich',
          '👁️ Visuelle Indikatoren: Schloss-Symbol und spezielle Styling',
          '📊 Status-Filter: Separate Anzeige gesperrter Bookmarks',
          '🎯 Bulk-Operationen: Mehrere Bookmarks gleichzeitig sperren'
        ],
        sections: [
          {
            title: 'Bookmark sperren/entsperren',
            steps: [
              '🔒 **Sperren**: Klick auf Schloss-Symbol (offen) in der Bookmark-Karte',
              '🔓 **Entsperren**: Klick auf Schloss-Symbol (geschlossen)',
              '👁️ **Visueller Status**: Gesperrte Bookmarks haben dunkles Schloss-Symbol',
              '⚠️ **CRUD-Schutz**: Edit/Delete-Buttons sind deaktiviert bei gesperrten Bookmarks'
            ]
          },
          {
            title: 'Was ist bei gesperrten Bookmarks möglich?',
            steps: [
              '✅ **Verschieben**: Zwischen Kategorien per Drag & Drop',
              '✅ **Anzeigen**: Normales Öffnen der Links',
              '✅ **Status ändern**: Von aktiv zu tot, timeout, etc.',
              '❌ **Löschen**: Nicht möglich - HTTP 403 Fehler',
              '❌ **Bearbeiten**: Nicht möglich - Buttons deaktiviert'
            ]
          },
          {
            title: 'Gesperrte Bookmarks finden',
            steps: [
              '🔍 **Status-Filter**: "Gesperrt" im Filter-Dropdown wählen',
              '📊 **Statistik**: Anzahl gesperrter Bookmarks im Dashboard',
              '🎯 **Suche**: Gesperrte Bookmarks durchsuchbar wie normale',
              '📱 **Tabellen-Ansicht**: Schloss-Symbol in separater Spalte'
            ]
          }
        ]
      }
    },
    status: {
      icon: '📊',
      title: 'Status-System',
      description: 'Umfassendes Status-Management mit 7 verschiedenen Bookmark-Zuständen.',
      content: {
        title: 'Bookmark Status-Verwaltung',
        description: 'FavOrg verwaltet automatisch verschiedene Bookmark-Zustände für bessere Organisation.',
        features: [
          '✅ **Aktiv**: Funktionierende, geprüfte Bookmarks',
          '💀 **Tote Links**: Nicht erreichbare URLs (404, DNS-Fehler)',
          '🔒 **Gesperrt**: Schreibgeschützte, wichtige Bookmarks',
          '⏱️ **Timeout**: URLs mit Verbindungsproblemen',
          '❓ **Ungeprüft**: Noch nicht validierte Bookmarks',
          '🏠 **Localhost**: Lokale Entwicklungs-URLs',
          '📋 **Duplikate**: Mehrfach vorhandene URLs'
        ],
        sections: [
          {
            title: 'Automatische Status-Erkennung',
            steps: [
              '🔍 **Link-Prüfung**: Automatische Validierung beim Import',
              '⏱️ **Timeout-Erkennung**: URLs die zu lange zum Laden brauchen',
              '💀 **Dead-Link-Detection**: 404, 500, DNS-Fehler automatisch erkannt',
              '🏠 **Localhost-Filter**: 127.0.0.1, localhost automatisch kategorisiert',
              '📋 **Duplikat-Suche**: Identische URLs werden markiert'
            ]
          },
          {
            title: 'Status-Filter & Navigation',
            steps: [
              '🎛️ **Filter-Dropdown**: Rechts in der Suchleiste',
              '📊 **Live-Zählung**: Anzahl pro Status in Klammern',
              '🔍 **Kombinierte Suche**: Status + Textsuche möglich',
              '⚡ **Schnellfilter**: Ein-Klick Zugriff auf problematische Links'
            ]
          },
          {
            title: 'Status-Management Aktionen',
            steps: [
              '🗑️ **Tote Links löschen**: Bulk-Aktion über "TOTE Links" Button',
              '🏠 **Localhost entfernen**: "localhost" Button für lokale URLs',
              '📋 **Duplikate bereinigen**: "Duplikate" Button findet & entfernt',
              '🔄 **Status manuell ändern**: Dropdown in Bookmark-Details'
            ]
          }
        ]
      }
    },
    validation: {
      title: 'Link-Validierung',
      icon: <Globe className="w-5 h-5" />,
      content: {
        title: 'Automatische Link-Validierung',
        description: 'Überprüfen Sie die Funktionsfähigkeit Ihrer Links mit der integrierten Validierungsfunktion.',
        sections: [
          {
            title: 'Prüfen-Button',
            color: 'bg-cyan-500',
            steps: [
              'Erster Klick: Findet und sortiert Links nach Status',
              'Zweiter Klick: Fragt nach Bestätigung für Aktionen',
              'Überprüft alle Links auf Erreichbarkeit',
              'Aktualisiert Status-Counter in Echtzeit'
            ]
          },
          {
            title: 'TOTE Links verwalten',
            color: 'bg-red-400',
            steps: [
              'Hellroter Button zeigt defekte Links',
              'Erster Klick: Sortiert nach toten Links',
              'Zweiter Klick: Löschen-Bestätigung',
              'Entfernt alle 404-Fehler Links'
            ]
          },
          {
            title: 'Duplikate bereinigen',
            color: 'bg-orange-500',
            steps: [
              'Oranger Button für doppelte URLs',
              'Erster Klick: Findet und gruppiert Duplikate',
              'Zweiter Klick: Löschen-Dialog',
              'Behält nur jeweils ein Original'
            ]
          },
          {
            title: 'Localhost Links',
            color: 'bg-white text-black',
            steps: [
              'Weißer Button für lokale Entwicklungslinks',
              'Findet alle localhost und 127.0.0.1 URLs',
              'Nützlich für Entwickler-Bookmarks',
              'Selektives Löschen möglich'
            ]
          }
        ]
      }
    },
    import: {
      title: 'Import/Export',
      icon: <Upload className="w-5 h-5" />,
      content: {
        title: 'Datenimport und -export',
        description: 'Importieren Sie Lesezeichen aus verschiedenen Browsern und exportieren Sie in multiple Formate.',
        sections: [
          {
            title: 'Testdaten-Import (100 Bookmarks)',
            steps: [
              '🎯 **Vollständiger Testsatz**: 100 diverse Bookmarks für alle Features',
              '✅ **54 Aktive (54%)**: Funktionierende URLs von GitHub, Stack Overflow, BBC News, etc.',
              '💀 **9 Tote Links (9%)**: Nicht erreichbare URLs für Dead-Link-Testing',
              '🔒 **14 Gesperrt (14%)**: Schreibgeschützte Bookmarks über alle Kategorien verteilt',
              '⏱️ **Timeout Links**: URLs mit Verbindungsproblemen für Timeout-Testing',
              '🏠 **10 Localhost (10%)**: Lokale Entwicklungs-URLs (127.0.0.1, localhost)',
              '📋 **7 Duplikate (7%)**: Mehrfach vorhandene URLs für Duplikat-Testing',
              '❓ **100 Ungeprüft (100%)**: Alle initial als ungeprüft markiert',
              '📂 **11 Hauptkategorien**: Development (20), News (15), Tools (15), Social Media (12), Entertainment (10), Reference (8), Shopping (6), Education (6), Health (4), Finance (2), Travel (2)',
              '🏷️ **49 Unterkategorien**: Frontend, Backend, JavaScript, Python für Development; DevOps, Mobile, etc.',
              '🔄 **Realistische URLs**: GitHub, LinkedIn, Netflix, Wikipedia, Amazon, Coursera, WebMD, Yahoo Finance, Booking.com',
              '📝 **Beschreibungen**: Jeder Bookmark hat aussagekräftige Beschreibung für Suchfunktion'
            ]
          },
          {
            title: 'BookmarkBox - Universal Browser Import',
            steps: [
              '💻 **Multi-Browser-Support**: Chrome, Firefox, Safari, Edge, Opera',
              '🔄 **Ein-Klick-Export**: Sammelt alle Browser-Bookmarks automatisch',
              '📋 **FavOrg-kompatibel**: Direkter Import ins JSON-Format',
              '🔐 **Sicherer Download**: ZIP mit Passwort "SpendefuerdenEntwickler"',
              '🖥️ **Cross-Platform**: Windows, macOS, Linux Versionen'
            ]
          },
          {
            title: 'UI-Nomenklatur Handbuch',
            steps: [
              '📋 Vollständige Bereichs-Terminologie für FavOrg',
              '🔸 Alle UI-Bereiche mit Positionen definiert',
              '📚 Technisches Glossar (CRUD, Excel-Funktionalität, etc.)',
              '📄 Als PDF oder Text-Datei verfügbar'
            ],
            action: {
              label: '📄 Nomenklatur PDF herunterladen',
              description: 'Komplette UI-Terminologie',
              onClick: () => {
                const backendUrl = import.meta.env.VITE_REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL;
                window.open(`${backendUrl}/api/documentation/download-nomenklatur`, '_blank');
              }
            }
          },
          {
            title: 'Unterstützte Import-Formate',
            steps: [
              'HTML: Standard Browser-Export Format',
              'JSON: Strukturierte Daten mit Metainformationen',
              'XML: Hierarchische Bookmark-Struktur',
              'CSV: Tabellarische Daten für Analyse',
              'JSONLZ4: Firefox komprimiertes Format'
            ]
          },
          {
            title: 'Export-Optionen',
            steps: [
              'HTML: Für Import in andere Browser',
              'JSON: Backup mit vollständigen Daten',
              'XML: Strukturierte Hierarchie',
              'CSV: Für Tabellenkalkulation',
              'Alle Formate: Gleichzeitiger Multi-Format Export'
            ]
          }
        ]
      }
    },
    views: {
      title: 'Ansichten',
      icon: <Grid className="w-5 h-5" />,
      content: {
        title: 'Verschiedene Ansichtsmodi',
        description: 'Wechseln Sie zwischen Karten- und Tabellenansicht je nach Ihren Bedürfnissen.',
        sections: [
          {
            title: 'Karten-Ansicht',
            icon: '⊞',
            steps: [
              'Standard-Ansicht mit visuellen Karten',
              'Zeigt Vorschaubilder und Metadaten',
              'Optimiert für visuelle Organisation',
              'Drag & Drop zwischen Karten'
            ]
          },
          {
            title: 'Tabellen-Ansicht',
            icon: '☰',
            steps: [
              'Kompakte tabellarische Darstellung',
              'Mehr Favoriten auf einen Blick',
              'Sortierbare Spalten',
              'Ideal für große Sammlungen'
            ]
          }
        ]
      }
    },
    settings: {
      title: 'Einstellungen',
      icon: <Settings className="w-5 h-5" />,
      content: {
        title: 'System-Einstellungen',
        description: 'Passen Sie FavOrg an Ihre Bedürfnisse an mit umfangreichen Konfigurationsoptionen.',
        sections: [
          {
            title: 'Darstellung',
            steps: [
              'Theme: Hell, Dunkel oder Automatisch',
              'Favoriten pro Seite: 25, 50, 100 oder Alle',
              'Meldungen Delay: Toast-Nachrichten permanent anzeigen',
              'Auto-Sync: Automatische Kategorie-Synchronisation'
            ]
          },
          {
            title: 'Erweitert',
            steps: [
              '🔍 **AuditLog-System**: Systematische Qualitätsprüfung aller FavOrg-Funktionen',
              '📊 **Testdaten-Generierung**: 100 Favoriten mit realistischen Daten aus 11 Kategorien',
              '🎯 **Status-Verteilung**: 54% aktiv, 9% tot, 14% gesperrt, 10% localhost, 7% duplikate',
              '🌐 **Realistische URLs**: GitHub, Stack Overflow, BBC News, LinkedIn, Netflix, Wikipedia',
              '📂 **Hierarchische Kategorien**: Development→Frontend/Backend, News→Tech/World, etc.',
              '⚙️ **Link-Validierung**: Timeout-Einstellungen und Batch-Größe konfigurieren',
              '🔍 **Duplikat-Behandlung**: Ignorieren, Ersetzen oder Beide behalten Optionen',
              '📤 **Export-Filter**: Status-basierte Export-Optionen für selektiven Export',
              '🔧 **Debug-Modus**: Erweiterte Logging-Optionen für Entwickler'
            ]
          }
        ]
      }
    },
    testdata: {
      title: 'Testdaten-System',
      icon: <Grid className="w-5 h-5" />,
      content: {
        title: '📊 Umfassende Testdaten-Generierung',
        description: 'Das integrierte Testdaten-System erstellt 100 realistische Bookmarks zur Demonstration aller FavOrg-Features.',
        sections: [
          {
            title: 'Automatische Testdaten-Erstellung',
            steps: [
              '🎯 **Ein-Klick-Generation**: Button "Testdaten generieren" in Einstellungen → Erweitert',
              '🗑️ **Bereinigung**: Löscht automatisch alle bestehenden Bookmarks vor Erstellung',
              '✨ **100 Bookmarks**: Exakte Anzahl für umfassende Tests',
              '🔄 **Wiederholbar**: Jederzeit neue Testdaten generieren möglich'
            ]
          },
          {
            title: 'Realistische Datenstruktur',
            steps: [
              '🌐 **Echte URLs**: GitHub, Stack Overflow, BBC News, LinkedIn, Netflix, Wikipedia',
              '🏢 **Bekannte Services**: Amazon, Coursera, WebMD, Yahoo Finance, Booking.com',
              '📝 **Beschreibungen**: Jeder Bookmark hat sinnvolle, durchsuchbare Beschreibung',
              '🏷️ **Kategorien**: Realistische Zuordnung (GitHub zu Development/Frontend)',
              '📅 **Timestamps**: Verschiedene Erstellungsdaten für zeitbasierte Tests'
            ]
          },
          {
            title: 'Status-Verteilung (Excel-Funktionalität)',
            steps: [
              '✅ **54 Aktive (54%)**: Funktionierende URLs für normalen Betrieb',
              '💀 **9 Tote Links (9%)**: Nicht erreichbare URLs für Dead-Link-Testing',
              '🔒 **14 Gesperrt (14%)**: Schreibgeschützte Bookmarks gleichmäßig verteilt',
              '🏠 **10 Localhost (10%)**: 127.0.0.1, localhost URLs für Entwicklung',
              '📋 **7 Duplikate (7%)**: Identische URLs für Duplikat-Erkennung',
              '❓ **100 Ungeprüft (100%)**: Alle initial ungeprüft für Validierungs-Tests',
              '⏱️ **Timeout**: Dynamisch generiert bei Validierung langsamer URLs'
            ]
          },
          {
            title: 'Hierarchische Kategorie-Struktur',
            steps: [
              '📂 **11 Hauptkategorien**: Development (20), News (15), Tools (15), Social Media (12)',
              '🎯 **Entertainment (10)**: Netflix, YouTube, Gaming-Plattformen',
              '📚 **Reference (8)**: Wikipedia, Dokumentationen, Nachschlagewerke',
              '🛒 **Shopping (6)**: Amazon, E-Commerce, Online-Shops',
              '🎓 **Education (6)**: Coursera, Online-Lernen, Tutorials',
              '🏥 **Health (4)**: WebMD, Gesundheits-Portale',
              '💰 **Finance (2)**: Yahoo Finance, Banking, Finanz-Tools',
              '✈️ **Travel (2)**: Booking.com, Reise-Portale'
            ]
          },
          {
            title: '49 Unterkategorien für Drag & Drop',
            steps: [
              '💻 **Development**: Frontend, Backend, JavaScript, Python, DevOps, Mobile',
              '📰 **News**: Tech News, World News, Local News, Sports',
              '🔧 **Tools**: Productivity, Design, Development Tools, Analytics',
              '📱 **Social Media**: Professional (LinkedIn), Personal (Facebook), Media (Instagram)',
              '🎮 **Entertainment**: Streaming, Gaming, Music, Videos',
              '📖 **Reference**: Documentation, Wikis, Guides, Standards'
            ]
          },
          {
            title: 'Test-Szenarien abgedeckt',
            steps: [
              '🔍 **Suchfunktion**: Verschiedene Begriffe in Titel, URL, Beschreibung, Kategorie',
              '📊 **Status-Filter**: Alle Status-Typen mit realistischen Zahlen',
              '🎯 **Drag & Drop**: Cross-Level-Verschiebung zwischen allen Hierarchie-Ebenen',
              '🔒 **Lock-System**: Gesperrte Bookmarks über alle Kategorien verteilt',
              '🗑️ **Bulk-Aktionen**: Genügend tote/doppelte Links für Bulk-Löschung',
              '📤 **Export-Tests**: Alle Formate (HTML, JSON, XML, CSV) mit realistischen Daten'
            ]
          }
        ]
      }
    },
    easter: {
      title: 'Easter Egg',
      icon: <Play className="w-5 h-5" />,
      content: {
        title: '🎮 Verstecktes Spiel',
        description: 'Entdecken Sie das versteckte "Fang die Maus" Spiel für eine kleine Pause vom Bookmark-Management.',
        sections: [
          {
            title: 'Wie zu aktivieren',
            steps: [
              'Scrollen Sie zum Footer am Ende der Seite',
              'Klicken Sie auf den Copyright-Text "© Jörg Renelt id2.de Hamburg 2025"',
              'Das Spiel "🐭 Fang die Maus!" öffnet sich',
              'Versuchen Sie die Maus zu fangen!'
            ]
          },
          {
            title: 'Spielregeln',
            steps: [
              'Bewegen Sie die Maus über das Spielfeld',
              'Die Maus wird vor Ihrem Cursor wegrennen',
              'Versuchen Sie sie in eine Ecke zu drängen',
              'Schließen Sie mit dem X-Button oder Escape'
            ]
          }
        ]
      }
    },
    auditlog: {
      title: 'AuditLog-System',
      icon: <Grid className="w-5 h-5" />,
      content: {
        title: '🔍 Systematische Qualitätsprüfung',
        description: 'Das AuditLog-System ermöglicht eine methodische Überprüfung aller FavOrg-Funktionen mit strukturierten Testbereichen und detaillierter Dokumentation.',
        sections: [
          {
            title: 'Zugriff und Navigation',
            steps: [
              '⚙️ **Öffnen**: Einstellungen → Erweitert → AuditLog',
              '📂 **Bereiche**: 13 Test-Kategorien von Design bis Performance',
              '🔄 **Navigation**: Toggle zwischen "Bereiche" und "Test anzeigen"',
              '🔗 **FavOrg-Link**: Direkter Zugriff auf Hauptanwendung zum Testen'
            ]
          },
          {
            title: 'Test-Bereiche Übersicht',
            steps: [
              '🎨 **Allgemeines Design**: UI-Kompaktheit, Dark Theme, Responsiveness, Typographie',
              '🔝 **Header-Bereich**: Logo, Action-Buttons, Icons, Status-Buttons',
              '📋 **Sidebar-Bereich**: Kategorien-Tree, Collapse/Expand, Navigation',
              '🔍 **Search-Section**: Suchfeld, Erweiterte Suche, Status-Filter',
              '📄 **Main-Content**: Grid Layout, View Toggle, Scrolling',
              '🎴 **Bookmark-Karten**: Card Design, Status-Badges, Lock/Edit Buttons',
              '🗨️ **Dialoge & Modals**: Bookmark-Dialog, Einstellungen, Hilfe-System',
              '🧭 **Navigation & Routing**: Sidebar-Navigation, Breadcrumb, Deep Links',
              '🎯 **Drag & Drop System**: Bookmark/Category D&D, Cross-Level Movement',
              '🎛️ **Filter & Sortierung**: Status-Filter, Kombinierte Filter',
              '📤 **Import/Export**: HTML Import, JSON/XML Export, Testdaten',
              '⚙️ **Einstellungen**: Theme-Switch, System-Tools, Meldungen',
              '⚡ **Performance & Responsive**: Load Speed, Mobile/Tablet/Desktop'
            ]
          },
          {
            title: 'Testpunkt-Management',
            steps: [
              '🔍 **Testpunkt-Suche**: Suchfeld zum Filtern spezifischer Testpunkte',
              '📝 **Status-Tracking**: Bestanden (✅), Fehlgeschlagen (❌), In Bearbeitung (⏳) mit Zeitstempel',
              '✏️ **Notizen-System**: Bleistift-Button zum Hinzufügen von Test-Notizen',
              '🎨 **Visuelle Kennzeichnung**: Grüner/Roter/Blauer Rahmen je nach Test-Status',
              '🧪 **Eigene Tests**: Über Inputfeld benutzerdefinierte Tests hinzufügen',
              '📊 **Fortschritts-Tracking**: Live-Counter in Footer für alle Status-Kategorien'
            ]
          },
          {
            title: 'Bericht-System',
            steps: [
              '📋 **Archiv-Funktion**: Alle Testberichte werden automatisch archiviert',
              '📊 **Status-Übersicht**: Kumulierte Darstellung aller Test-Status',
              '📄 **PDF-Export**: HTML-Export für PDF-Druck der Testergebnisse',
              '📥 **Berichte laden**: Laden einzelner Berichte aus dem Archiv',
              '🗑️ **Bereinigung**: Selective oder komplette Löschung von Testberichten',
              '📈 **Historische Verfolgung**: Verlauf der durchgeführten Tests einsehbar'
            ]
          },
          {
            title: 'Testmethodik',
            steps: [
              '🎯 **Systematisches Vorgehen**: Schritt-für-Schritt durch alle Bereiche',
              '🔗 **Parallel-Testing**: FavOrg in separatem Fenster für Live-Tests',
              '📋 **Checklisten-Prinzip**: Strukturierte Abarbeitung aller Testpunkte',
              '🏷️ **Status-Markierung**: Eindeutige Kennzeichnung des Testfortschritts',
              '📊 **Qualitätssicherung**: Vollständige Dokumentation für Nachvollziehbarkeit'
            ]
          }
        ]
      }
    }
  };

  const generatePDF = async () => {
    try {
      // Create comprehensive HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>FavOrg - Benutzerhandbuch</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6; 
              color: #000000; /* Schwarz für besseren Kontrast */
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px;
              background: #ffffff; /* Weißer Hintergrund */
            }
            .header { 
              text-align: center; 
              border-bottom: 3px solid #0ea5e9; 
              padding-bottom: 20px; 
              margin-bottom: 30px;
              background: linear-gradient(135deg, #0ea5e9, #06b6d4);
              color: white;
              padding: 30px;
              border-radius: 10px;
              margin: -20px -20px 30px -20px;
            }
            .section { 
              margin-bottom: 30px; 
              background: white;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              color: #000000; /* Schwarze Schrift für alle Sektionen */
            }
            .section h2 { 
              color: #0ea5e9; 
              border-bottom: 2px solid #e2e8f0; 
              padding-bottom: 10px;
              margin-top: 0;
            }
            .subsection {
              margin: 15px 0;
              padding: 15px;
              background: #f8fafc;
              border-left: 4px solid #0ea5e9;
              border-radius: 0 4px 4px 0;
              color: #000000; /* Schwarze Schrift in Subsektionen */
            }
            ul { margin: 10px 0; }
            li { margin: 5px 0; }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding: 20px;
              background: #1e293b;
              color: white;
              border-radius: 8px;
            }
            .feature-list {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
              gap: 10px;
              margin: 15px 0;
            }
            .feature-item {
              padding: 8px 12px;
              background: #e0f2fe;
              border-radius: 4px;
              border-left: 3px solid #0ea5e9;
            }
            .status-filter {
              display: inline-block;
              padding: 4px 8px;
              margin: 2px;
              border-radius: 4px;
              font-size: 0.9em;
            }
            .filter-all { background: #f1f5f9; }
            .filter-active { background: #dcfce7; }
            .filter-dead { background: #fecaca; }
            .filter-localhost { background: #fef3c7; }
            .filter-duplicate { background: #fed7aa; }
            .filter-locked { background: #fce7f3; }
            .filter-timeout { background: #e0e7ff; }
            .filter-unchecked { background: #f3f4f6; }
            
            /* Navigation Links */
            .navigation-index {
              background: #f8fafc;
              border: 2px solid #0ea5e9;
              border-radius: 8px;
              padding: 20px;
              margin: 20px 0;
            }
            .navigation-index h3 {
              margin-top: 0;
              color: #0ea5e9;
              text-align: center;
            }
            .nav-links {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
              gap: 8px;
              margin-top: 15px;
            }
            .nav-link {
              display: block;
              padding: 8px 12px;
              background: #ffffff;
              border: 1px solid #cbd5e0;
              border-radius: 4px;
              text-decoration: none;
              color: #2563eb;
              font-weight: 500;
              transition: all 0.2s;
              text-align: center;
            }
            .nav-link:hover {
              background: #dbeafe;
              border-color: #2563eb;
              transform: translateY(-1px);
            }
            
            /* Zurück nach oben Links */
            .back-to-top {
              display: inline-block;
              padding: 6px 12px;
              background: #10b981;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              font-size: 0.9em;
              font-weight: 500;
              transition: background-color 0.2s;
            }
            .back-to-top:hover {
              background: #059669;
            }
          </style>
        </head>
        <body>
          <div class="header" id="top">
            <h1>📚 FavOrg Benutzerhandbuch</h1>
            <p>Professioneller Bookmark Manager - Version 2.3.0</p>
            <p>Vollständige Dokumentation aller Funktionen</p>
            
            <!-- Navigation Links -->
            <div class="navigation-index">
              <h3>📋 Inhaltsverzeichnis - Schnellnavigation</h3>
              <div class="nav-links">
                ${Object.entries(helpSections).map(([key, section]) => `
                  <a href="#section-${key}" class="nav-link">
                    ${section.content.title}
                  </a>
                `).join('')}
              </div>
            </div>
          </div>
          
          ${Object.entries(helpSections).map(([key, section]) => `
            <div class="section" id="section-${key}">
              <h2>${section.content.title}</h2>
              <p><strong>${section.content.description}</strong></p>
              
              ${section.content.features ? `
                <div class="subsection">
                  <h3>🚀 Hauptfunktionen</h3>
                  <div class="feature-list">
                    ${section.content.features.map(feature => 
                      `<div class="feature-item">• ${feature}</div>`
                    ).join('')}
                  </div>
                </div>
              ` : ''}
              
              ${section.content.quickStart ? `
                <div class="subsection">
                  <h3>⚡ Schnellstart</h3>
                  <ol>
                    ${section.content.quickStart.map(step => `<li>${step}</li>`).join('')}
                  </ol>
                </div>
              ` : ''}
              
              ${section.content.sections ? section.content.sections.map(subsection => `
                <div class="subsection">
                  <h3>${subsection.title}</h3>
                  ${subsection.steps ? `
                    <ul>
                      ${subsection.steps.map(step => `<li>${step}</li>`).join('')}
                    </ul>
                  ` : ''}
                </div>
              `).join('') : ''}
              
              <!-- Zurück nach oben Link -->
              <div style="text-align: center; margin-top: 20px;">
                <a href="#top" class="back-to-top">⬆️ Zurück zum Inhaltsverzeichnis</a>
              </div>
            </div>
          `).join('')}
          
          <div class="footer">
            <h3>📧 Kontakt & Support</h3>
            <p><strong>Allgemeine Anfragen:</strong> info@id2.de</p>
            <p><strong>Technischer Support:</strong> support@id2.de</p>
            <p><strong>Website:</strong> id2.de</p>
            <hr style="margin: 20px 0; border: 1px solid #475569;">
            <p>&copy; 2025 Jörg Renelt, id2.de Hamburg - Alle Rechte vorbehalten</p>
            <p><em>FavOrg Version 2.3.0 - Generiert am ${new Date().toLocaleDateString('de-DE')}</em></p>
          </div>
        </body>
        </html>
      `;

      // Create blob and download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'FavOrg_Benutzerhandbuch_v2.3.0.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Benutzerhandbuch wurde heruntergeladen!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Fehler beim Erstellen des Handbuchs');
    }
  };

  const filteredSections = Object.entries(helpSections).filter(([key, section]) =>
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              FavOrg Benutzerhandbuch
            </div>
            <Button
              onClick={generatePDF}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Handbuch herunterladen
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="w-64 border-r pr-4 overflow-y-auto">
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Hilfe durchsuchen..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <nav className="space-y-1">
              {filteredSections.map(([key, section]) => (
                <button
                  key={key}
                  onClick={() => setSelectedSection(key)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                    selectedSection === key
                      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {section.icon}
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            {helpSections[selectedSection] && (
              <div className="space-y-6">
                <div className="border-b pb-4">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {helpSections[selectedSection].content.title}
                  </h1>
                  <p className="text-black dark:text-gray-100 mt-2">
                    {helpSections[selectedSection].content.description}
                  </p>
                </div>

                {/* Features */}
                {helpSections[selectedSection].content.features && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-3">
                      🚀 Hauptfunktionen
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {helpSections[selectedSection].content.features.map((feature, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <span className="text-blue-600">•</span>
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Start */}
                {helpSections[selectedSection].content.quickStart && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-3">
                      ⚡ Schnellstart
                    </h3>
                    <ol className="space-y-2">
                      {helpSections[selectedSection].content.quickStart.map((step, index) => (
                        <li key={index} className="text-sm flex gap-2">
                          <span className="font-bold text-green-600">{index + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Sections */}
                {helpSections[selectedSection].content.sections && (
                  <div className="space-y-4">
                    {helpSections[selectedSection].content.sections.map((section, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">
                          {section.title}
                        </h3>
                        {section.steps && (
                          <ul className="space-y-2">
                            {section.steps.map((step, stepIndex) => (
                              <li key={stepIndex} className="text-sm flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {section.action && (
                          <div className="mt-4">
                            <button
                              onClick={section.action.onClick}
                              className="help-action-button"
                            >
                              {section.action.label}
                            </button>
                            {section.action.description && (
                              <div className="help-action-description">
                                {section.action.description}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="border-t pt-4 text-center text-sm text-black dark:text-gray-100">
          <p>
            <strong>Kontakt:</strong> info@id2.de | <strong>Technischer Support:</strong> support@id2.de
          </p>
          <p>© 2025 Jörg Renelt, id2.de Hamburg - FavOrg Version 2.3.0</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ComprehensiveHelpSystem;