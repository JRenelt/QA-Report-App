    <script>
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
