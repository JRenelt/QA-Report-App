import React, { useState, useMemo } from 'react';
import { X, Search, BookOpen } from 'lucide-react';

interface GlossaryEntry {
  id: string;
  term: string;
  category: string;
  definition: string;
  examples?: string[];
  relatedTerms?: string[];
}

interface GlossaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}

const GlossaryModal: React.FC<GlossaryModalProps> = ({ isOpen, onClose, darkMode }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Glossar-Einträge
  const glossaryEntries: GlossaryEntry[] = [
    {
      id: 'id-format',
      term: 'ID-Format',
      category: 'Projektregeln',
      definition: 'Anfangsbuchstabe JEDES Wortes im Titel des Testfalles + laufende Nummer (3-stellig). Format: [BUCHSTABEN][NUMMER]. Sonderzeichen werden als Leerzeichen gewertet: & / % - + = ( ) [ ] { } < > | \\ : ; , . ? ! " \' ` ~ @ # $ ^ * _',
      examples: [
        'Logo Darstellung Desktop → LDD001 (3 Wörter + Nr. 001)',
        'Navigation Menü → NM002 (2 Wörter + Nr. 002)',
        'Modal Öffnen & Schließen → MÖS003 (& = Leerzeichen, 3 Wörter + Nr. 003)',
        'User-Verwaltung/Admin → UVA004 (- und / = Leerzeichen, 3 Wörter + Nr. 004)',
        'Performance (100% CPU) → P1C005 (Klammern und % = Leerzeichen, 3 Wörter + Nr. 005)'
      ],
      relatedTerms: ['Testfall', 'Testbereich', 'Test-Suites']
    },
    {
      id: 'id2-firma',
      term: 'ID2 GmbH',
      category: 'Projektregeln',
      definition: 'System-Firma die geschützt ist und NIEMALS gelöscht werden darf. Diese Firma ist essentiell für den Betrieb der Anwendung.',
      examples: [
        'Bei "Datenbank leeren": Alle Firmen werden gelöscht AUSSER ID2',
        'Papierkorb-Symbol wird bei ID2 ausgeblendet',
        'ID2 muss immer in localStorage vorhanden sein'
      ],
      relatedTerms: ['Firmenverwaltung', 'Geschützte Daten', 'localStorage']
    },
    {
      id: 'localstorage',
      term: 'localStorage',
      category: 'Technische Konzepte',
      definition: 'Browser-basierte Speicherung für Client-seitige Daten. Alle Projekt-, Firmen- und Testdaten werden hier gespeichert.',
      examples: [
        'qa_companies - Liste aller Firmen',
        'qa_projects - Liste aller Projekte',
        'qa_suites_{projectId} - Test-Suites für ein Projekt',
        'qa_cases_{projectId} - Test-Cases für ein Projekt'
      ],
      relatedTerms: ['Datenhaltung', 'Synchronisation', 'Polling']
    },
    {
      id: 'kaskadierendes-loeschen',
      term: 'Kaskadierendes Löschen',
      category: 'Projektregeln',
      definition: 'Beim Löschen einer übergeordneten Entität werden automatisch alle abhängigen Entitäten mitgelöscht.',
      examples: [
        'Firma löschen → Alle Projekte der Firma werden gelöscht',
        'Projekt löschen → Test-Suites und Test-Cases werden aus localStorage gelöscht',
        'Alle Änderungen werden sofort in localStorage gespeichert'
      ],
      relatedTerms: ['Firmenverwaltung', 'Projektverwaltung', 'localStorage']
    },
    {
      id: 'testbereich',
      term: 'Testbereich',
      category: 'QA-Konzepte',
      definition: 'Gruppierung von zusammengehörigen Testfällen (z.B. "Kopfzeile", "Login", "Sidebar"). Entspricht einer Test-Suite.',
      examples: [
        'Kopfzeile - Tests für Header-Bereich',
        'Login Bereich - Tests für Authentifizierung',
        'Responsive Design - Tests für verschiedene Bildschirmgrößen'
      ],
      relatedTerms: ['Test-Suite', 'Testfall', 'Projekt']
    },
    {
      id: 'testfall',
      term: 'Testfall',
      category: 'QA-Konzepte',
      definition: 'Einzelner Test mit Titel, Beschreibung, Status und eindeutiger Test-ID. Gehört zu einem Testbereich.',
      examples: [
        'Test-ID: LDD, Titel: Logo Darstellung Desktop',
        'Status: pending | success | warning | error',
        'Wird einem Testbereich zugeordnet'
      ],
      relatedTerms: ['Testbereich', 'ID-Format', 'Test-Status']
    },
    {
      id: 'dark-mode',
      term: 'Dark Mode',
      category: 'UI/UX',
      definition: 'Dunkles Farbschema für bessere Lesbarkeit bei wenig Licht. Alle Komponenten müssen Dark Mode unterstützen.',
      examples: [
        'Hintergrund: Dunkelgrau (#1f2937)',
        'Text: Hellgrau (#e5e7eb)',
        'Buttons: Angepasste Farben mit hover-States'
      ],
      relatedTerms: ['UI Standards', 'Barrierefreiheit']
    },
    {
      id: 'api-routen',
      term: 'API-Routen',
      category: 'Backend',
      definition: 'Alle Backend-API-Endpunkte MÜSSEN mit /api beginnen für korrektes Kubernetes Routing.',
      examples: [
        'Richtig: /api/admin/clear-database',
        'Richtig: /api/auth/login',
        'Falsch: /admin/clear-database'
      ],
      relatedTerms: ['Backend', 'Kubernetes', 'Deployment']
    },
    {
      id: 'polling',
      term: 'Polling',
      category: 'Technische Konzepte',
      definition: 'Regelmäßige Abfrage von localStorage alle 2 Sekunden, um Änderungen zu erkennen und die UI zu aktualisieren.',
      examples: [
        'Companies: Polling alle 2 Sekunden',
        'Projects: Polling alle 2 Sekunden',
        'Ermöglicht automatische Synchronisation zwischen Komponenten'
      ],
      relatedTerms: ['localStorage', 'Synchronisation', 'useEffect']
    },
    {
      id: 'mongo-uuid',
      term: 'MongoDB UUIDs',
      category: 'Backend',
      definition: 'Verwende AUSSCHLIESSLICH UUIDs für Datenbankeinträge. MongoDB ObjectIDs sind VERBOTEN, da sie nicht JSON-serialisierbar sind.',
      examples: [
        'Richtig: id = uuid.uuid4().hex',
        'Falsch: _id = ObjectId()',
        'UUIDs sind JSON-kompatibel und vermeiden Serialisierungs-Fehler'
      ],
      relatedTerms: ['Backend', 'MongoDB', 'Datenbank']
    }
  ];

  // Kategorien extrahieren
  const categories = useMemo(() => {
    const cats = new Set(glossaryEntries.map(e => e.category));
    return ['all', ...Array.from(cats)];
  }, []);

  // Filtern und Highlighten
  const filteredEntries = useMemo(() => {
    let filtered = glossaryEntries;

    // Kategorie-Filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(e => e.category === selectedCategory);
    }

    // Such-Filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.term.toLowerCase().includes(query) ||
        e.definition.toLowerCase().includes(query) ||
        e.category.toLowerCase().includes(query) ||
        e.examples?.some(ex => ex.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  // Text mit Highlighting
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;

    const query = searchQuery.trim();
    const regex = new RegExp(`(${query})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-1 rounded">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'} rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-cyan-500" />
            <h2 className="text-2xl font-bold">Projekt-Glossar & Wiki</h2>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Suche & Filter */}
        <div className="px-6 py-4 space-y-3">
          {/* Suchfeld */}
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suche nach Begriff, Definition, Beispiel..."
              className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-cyan-500`}
            />
          </div>

          {/* Kategorie-Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-white'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat === 'all' ? 'Alle Kategorien' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Suchergebnisse */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-12">
              <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                Keine Ergebnisse für "{searchQuery}" gefunden.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredEntries.map(entry => (
                <div
                  key={entry.id}
                  className={`p-6 rounded-lg border ${
                    darkMode 
                      ? 'bg-gray-750 border-gray-700' 
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  {/* Term & Kategorie */}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-xl font-bold text-cyan-500">
                      {highlightText(entry.term)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      darkMode 
                        ? 'bg-gray-600 text-gray-200' 
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {entry.category}
                    </span>
                  </div>

                  {/* Definition */}
                  <p className={`mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {highlightText(entry.definition)}
                  </p>

                  {/* Beispiele */}
                  {entry.examples && entry.examples.length > 0 && (
                    <div className="mb-4">
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Beispiele:
                      </h4>
                      <ul className="space-y-1">
                        {entry.examples.map((example, i) => (
                          <li
                            key={i}
                            className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                          >
                            • {highlightText(example)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Verwandte Begriffe */}
                  {entry.relatedTerms && entry.relatedTerms.length > 0 && (
                    <div>
                      <h4 className={`font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        Verwandte Begriffe:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {entry.relatedTerms.map((term, i) => (
                          <button
                            key={i}
                            onClick={() => setSearchQuery(term)}
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              darkMode 
                                ? 'bg-gray-700 text-cyan-400 hover:bg-gray-600' 
                                : 'bg-gray-200 text-cyan-600 hover:bg-gray-300'
                            }`}
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex justify-between items-center">
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {filteredEntries.length} von {glossaryEntries.length} Einträgen
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-colors"
            >
              Schließen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlossaryModal;
