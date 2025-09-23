        console.log('🚀 AuditLog Script wird geladen...');
        
        // Global State
        let currentCategory = 'Allgemeines Design';
        let testStatuses = {};
        let testNotes = {};
        let dynamicTests = {};
        let editingNote = null;
        let statusFilter = '';

        console.log('✅ Globale Variablen initialisiert');

        // Test-Kategorien
        const testCategories = [
            { name: 'Allgemeines Design', icon: '🎨', tests: 4 },
            { name: 'Header-Bereich', icon: '🔝', tests: 4 },
            { name: 'Sidebar-Bereich', icon: '📋', tests: 5 },
            { name: 'Main-Content', icon: '📄', tests: 4 },
            { name: 'Bookmark-Karten', icon: '🎴', tests: 6 },
            { name: 'Einstellungen', icon: '⚙️', tests: 4 }
        ];

        // Test-Szenarien
        const predefinedTests = {
            'Allgemeines Design': [
                { name: '80% UI-Kompaktheit', icon: '📱', tooltip: '80% kompakte UI-Darstellung prüfen' },
                { name: 'Dark Theme', icon: '🌙', tooltip: 'Dark Theme Konsistenz testen' },
                { name: 'Responsiveness', icon: '📐', tooltip: 'Responsive Layout auf verschiedenen Größen' },
                { name: 'Typographie', icon: '🔤', tooltip: 'Typographie und Schriftarten prüfen' }
            ],
            'Header-Bereich': [
                { name: 'Logo & Titel Platzierung', icon: '🏷️', tooltip: 'Logo und Titel korrekt positioniert' },
                { name: 'Navigation Icons', icon: '🧭', tooltip: 'Alle Navigation-Icons funktional' },
                { name: 'Bookmark-Anzahl [X]', icon: '🔢', tooltip: 'Bookmark-Counter korrekt angezeigt' },
                { name: 'Header-Buttons Layout', icon: '🔘', tooltip: 'Button-Layout im Header prüfen' }
            ],
            'Sidebar-Bereich': [
                { name: 'Kategorie-Liste', icon: '📂', tooltip: 'Kategorien korrekt aufgelistet' },
                { name: 'Drag & Drop Kategorien', icon: '🎯', tooltip: 'Kategorie D&D funktional' },
                { name: 'Resizing Funktionalität', icon: '↔️', tooltip: 'Sidebar-Größenänderung' },
                { name: 'Kategorie-Tooltips', icon: '💬', tooltip: 'Tooltip-Positionierung testen' },
                { name: 'Unterkategorie-Hierarchie', icon: '🌳', tooltip: 'Hierarchische Darstellung prüfen' }
            ],
            'Main-Content': [
                { name: 'Bookmark-Darstellung', icon: '🎴', tooltip: 'Bookmark-Karten Layout' },
                { name: 'Tabellen-Ansicht Toggle', icon: '📋', tooltip: 'List/Grid View umschalten' },
                { name: 'Scroll-Performance', icon: '📜', tooltip: 'Scrolling bei vielen Bookmarks' },
                { name: 'Leere-State Anzeige', icon: '📭', tooltip: 'Anzeige wenn keine Bookmarks' }
            ],
            'Bookmark-Karten': [
                { name: 'Status-Farb-System', icon: '🎨', tooltip: 'Farben für verschiedene Status' },
                { name: 'Lock/Unlock Buttons', icon: '🔒', tooltip: 'Sperr-Funktionalität testen' },
                { name: 'Action-Buttons Layout', icon: '🔘', tooltip: 'Edit/Delete/Link Button-Layout' },
                { name: 'Drag-Handles sichtbar', icon: '⋮⋮', tooltip: 'Drag-Griffe erkennbar' },
                { name: 'Hover-States', icon: '👆', tooltip: 'Hover-Effekte auf Karten' },
                { name: 'Status-Badge Position', icon: '🏷️', tooltip: 'Status-Badges korrekt positioniert' }
            ],
            'Einstellungen': [
                { name: 'Tab-Navigation Icons', icon: '🗂️', tooltip: 'Settings-Tabs mit Icons' },
                { name: 'Theme-Einstellungen', icon: '🌙', tooltip: 'Dark/Light Theme Toggle' },
                { name: 'Meldungen Delay Checkbox', icon: '⏰', tooltip: 'Toast-Delay Einstellung' },
                { name: 'Gefahr-Bereich rot', icon: '⚠️', tooltip: 'Danger-Zone rote Markierung' }
            ]
        };

        console.log('✅ Test-Daten geladen');

        // Utility-Funktionen
        function getCurrentTests() {
            const baseTests = predefinedTests[currentCategory] || [];
            const categoryDynamicTests = dynamicTests[currentCategory] || [];
            return [...baseTests, ...categoryDynamicTests];
        }

        function getFilteredTests() {
            const allTests = getCurrentTests();
            if (!statusFilter) return allTests;
            return allTests.filter(test => testStatuses[test.name] === statusFilter);
        }

        function updateStatusCounts() {
            const allStatuses = Object.values(testStatuses);
            const counts = {
                all: allStatuses.length,
                success: allStatuses.filter(s => s === 'success').length,
                error: allStatuses.filter(s => s === 'error').length,
                warning: allStatuses.filter(s => s === 'warning').length,
                info: allStatuses.filter(s => s === 'info').length
            };

            document.getElementById('filterAll').textContent = `Alle (${counts.all})`;
            document.getElementById('filterSuccess').textContent = `✅ (${counts.success})`;
            document.getElementById('filterError').textContent = `❌ (${counts.error})`;
            document.getElementById('filterWarning').textContent = `⏳ (${counts.warning})`;
            document.getElementById('filterInfo').textContent = `🗑️ (${counts.info})`;
        }

        // Event-Handler
        function closeWindow() {
            window.close();
        }

        function goBackToFavOrg() {
            if (window.opener) {
                window.opener.focus();
                window.close();
            } else {
                window.location.href = '/';
            }
        }

        function addNewTest() {
            const input = document.getElementById('newTestInput');
            const newTestName = input.value.trim();

            if (!newTestName) {
                alert('Bitte geben Sie einen Testnamen ein');
                return;
            }

            if (!dynamicTests[currentCategory]) {
                dynamicTests[currentCategory] = [];
            }

            dynamicTests[currentCategory].push({
                name: newTestName,
                icon: '🔍',
                tooltip: 'Benutzerdefinierter Test',
                isDynamic: true
            });

            input.value = '';
            console.log(`✅ Test hinzugefügt: ${newTestName}`);
            renderTests();
            renderCategories();
        }

        function removeTest() {
            const input = document.getElementById('newTestInput');
            const testToRemove = input.value.trim();

            if (!testToRemove) {
                alert('Bitte geben Sie den Namen des zu löschenden Tests ein');
                return;
            }

            const categoryTests = dynamicTests[currentCategory] || [];
            const testExists = categoryTests.some(test => test.name === testToRemove);

            if (!testExists) {
                alert(`Test "${testToRemove}" nicht gefunden`);
                return;
            }

            dynamicTests[currentCategory] = categoryTests.filter(test => test.name !== testToRemove);
            input.value = '';
            console.log(`✅ Test entfernt: ${testToRemove}`);
            renderTests();
            renderCategories();
        }

        function setCurrentCategory(categoryName) {
            currentCategory = categoryName;
            const category = testCategories.find(cat => cat.name === categoryName);
            document.getElementById('currentCategoryTitle').textContent = `${category.icon} ${categoryName}`;
            renderCategories();
            renderTests();
        }

        function setTestStatus(testName, status) {
            testStatuses[testName] = status;
            console.log(`✅ Status gesetzt: ${testName} = ${status}`);
            renderTests();
            updateStatusCounts();
        }

        function setStatusFilter(filter) {
            statusFilter = filter;
            console.log(`✅ Filter gesetzt: ${filter}`);
            renderTests();
        }

        function toggleNoteEdit(testName) {
            editingNote = editingNote === testName ? null : testName;
            renderTests();
        }

        function updateNote(testName, note) {
            testNotes[testName] = note;
        }

        function saveNote(testName) {
            editingNote = null;
            renderTests();
        }

        // Placeholder-Funktionen
        function archiveTests() {
            console.log('📁 Archiv-Funktion');
            alert('Archiv-Funktion wird implementiert');
        }

        function downloadTests() {
            console.log('📄 PDF-Export wird gestartet...');
            generatePrintableReport();
        }

        function generateTestReport() {
            const timestamp = new Date();
            const categoryTests = getCurrentTests();
            const completedTests = categoryTests.filter(test => testStatuses[test.name]);
            
            return {
                id: Date.now().toString(),
                title: `AuditLog-Bericht: ${currentCategory}`,
                category: currentCategory,
                timestamp: timestamp.toISOString(),
                displayDate: timestamp.toLocaleString('de-DE'),
                totalTests: categoryTests.length,
                completedTests: completedTests.length,
                passedTests: completedTests.filter(test => testStatuses[test.name] === 'success').length,
                failedTests: completedTests.filter(test => testStatuses[test.name] === 'error').length,
                warningTests: completedTests.filter(test => testStatuses[test.name] === 'warning').length,
                skippedTests: completedTests.filter(test => testStatuses[test.name] === 'info').length,
                tests: categoryTests.map(test => ({
                    name: test.name,
                    icon: test.icon,
                    tooltip: test.tooltip,
                    status: testStatuses[test.name] || 'ungeprüft',
                    note: testNotes[test.name] || '',
                    isDynamic: test.isDynamic || false
                }))
            };
        }

        function generatePrintableReport() {
            const report = generateTestReport();
            
            // Erstelle neues Fenster für den strukturierten Bericht im FavOrg Look & Feel
            const printWindow = window.open('', '_blank', 'width=800,height=600');
            
            const printContent = `
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <title>FavOrg AuditLog-Bericht: ${report.category}</title>
                    <style>
                        @page { margin: 2cm; size: A4; }
                        
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                            color: #1f2937; margin: 0; padding: 0; line-height: 1.6; background: white;
                        }
                        
                        .header {
                            border-bottom: 3px solid #06b6d4; padding-bottom: 20px; margin-bottom: 30px; text-align: center;
                        }
                        
                        .logo { color: #06b6d4; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                        .title { font-size: 20px; font-weight: 600; color: #374151; margin: 0; }
                        
                        .meta-info {
                            display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0;
                            padding: 15px; background: #f9fafb; border-radius: 8px; border: 1px solid #e5e7eb;
                        }
                        
                        .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                        
                        .stat-card {
                            text-align: center; padding: 15px; border-radius: 8px; border: 2px solid;
                        }
                        
                        .stat-card.success { border-color: #059669; background: #ecfdf5; }
                        .stat-card.error { border-color: #dc2626; background: #fef2f2; }
                        .stat-card.warning { border-color: #2563eb; background: #eff6ff; }
                        .stat-card.info { border-color: #d97706; background: #fffbeb; }
                        
                        .stat-number { font-size: 24px; font-weight: bold; margin-bottom: 5px; }
                        .stat-label { font-size: 12px; color: #6b7280; font-weight: 500; }
                        
                        .test-item {
                            padding: 12px; margin-bottom: 8px; border-radius: 6px; border: 2px solid;
                            display: flex; align-items: flex-start; gap: 12px; break-inside: avoid;
                        }
                        
                        .test-item.success { border-color: #059669; background: #f0fdf4; }
                        .test-item.error { border-color: #dc2626; background: #fef2f2; }
                        .test-item.warning { border-color: #2563eb; background: #eff6ff; }
                        .test-item.info { border-color: #d97706; background: #fffbeb; }
                        .test-item.ungeprüft { border-color: #6b7280; background: #f9fafb; }
                        
                        .status-badge {
                            padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600;
                            white-space: nowrap; flex-shrink: 0;
                        }
                        
                        .status-success { background: #059669; color: white; }
                        .status-error { background: #dc2626; color: white; }
                        .status-warning { background: #2563eb; color: white; }
                        .status-info { background: #d97706; color: white; }
                        .status-ungeprüft { background: #6b7280; color: white; }
                        
                        @media print { .no-print { display: none; } body { -webkit-print-color-adjust: exact; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="logo">🔗 FavOrg</div>
                        <h1 class="title">AuditLog-Bericht: ${report.category}</h1>
                    </div>
                    
                    <div class="meta-info">
                        <div><strong>Bericht erstellt:</strong><br>${report.displayDate}</div>
                        <div><strong>Test-Bereich:</strong><br>${report.category}</div>
                    </div>
                    
                    <div class="stats">
                        <div class="stat-card success">
                            <div class="stat-number">${report.passedTests}</div>
                            <div class="stat-label">✅ Bestanden</div>
                        </div>
                        <div class="stat-card error">
                            <div class="stat-number">${report.failedTests}</div>
                            <div class="stat-label">❌ Fehlgeschlagen</div>
                        </div>
                        <div class="stat-card warning">
                            <div class="stat-number">${report.warningTests}</div>
                            <div class="stat-label">⏳ In Bearbeitung</div>
                        </div>
                        <div class="stat-card info">
                            <div class="stat-number">${report.skippedTests}</div>
                            <div class="stat-label">🗑️ Übersprungen</div>
                        </div>
                    </div>
                    
                    <h2>📋 Test-Details (${report.completedTests} von ${report.totalTests} getestet)</h2>
                    ${report.tests.map(test => `
                        <div class="test-item ${test.status}">
                            <div style="font-size: 16px; width: 20px; text-align: center; flex-shrink: 0;">${test.icon}</div>
                            <div style="flex: 1; min-width: 0;">
                                <div style="font-weight: 600; margin-bottom: 4px; color: #111827;">
                                    ${test.name}
                                    ${test.isDynamic ? '<span style="font-size: 10px; background: #06b6d4; color: white; padding: 1px 4px; border-radius: 3px; margin-left: 6px;">Custom</span>' : ''}
                                </div>
                                <div style="font-size: 13px; color: #6b7280; margin-bottom: 4px;">${test.tooltip}</div>
                                ${test.note ? '<div style="font-size: 12px; font-style: italic; color: #374151; background: rgba(249, 250, 251, 0.8); padding: 6px 8px; border-radius: 4px; margin-top: 6px; border-left: 3px solid #06b6d4;">📝 Notiz: ' + test.note + '</div>' : ''}
                            </div>
                            <span class="status-badge status-${test.status}">
                                ${test.status === 'success' ? '✅ Bestanden' :
                                  test.status === 'error' ? '❌ Fehlgeschlagen' :
                                  test.status === 'warning' ? '⏳ In Bearbeitung' :
                                  test.status === 'info' ? '🗑️ Übersprungen' :
                                  '⭕ Ungeprüft'}
                            </span>
                        </div>
                    `).join('')}
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center;">
                        <p><strong>Generiert von FavOrg AuditLog-System</strong> | ${report.displayDate}</p>
                        <p>Dieser strukturierte Bericht dokumentiert den aktuellen Status aller Tests im Bereich "${report.category}".</p>
                    </div>
                    
                    <script>
                        window.onload = function() {
                            setTimeout(() => {
                                window.print();
                                window.onafterprint = function() { window.close(); };
                            }, 500);
                        };
