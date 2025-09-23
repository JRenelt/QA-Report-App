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
                    </script>
                </body>
                </html>
            `;
            
            printWindow.document.write(printContent);
            printWindow.document.close();
        }

        function trashTests() {
            if (confirm('Alle Tests zurücksetzen?')) {
                testStatuses = {};
                testNotes = {};
                editingNote = null;
                renderTests();
                updateStatusCounts();
            }
        }

        // Render-Funktionen
        function renderCategories() {
            console.log('🔄 Rendering Kategorien...');
            const container = document.getElementById('categoryList');
            container.innerHTML = '';

            testCategories.forEach(category => {
                const button = document.createElement('button');
                button.className = `category-btn ${category.name === currentCategory ? 'active' : ''}`;
                button.onclick = () => setCurrentCategory(category.name);
                
                button.innerHTML = `
                    <span>${category.icon}</span>
                    <span style="flex: 1;">${category.name}</span>
                    <span class="status-badge status-info">${category.tests}</span>
                `;
                
                container.appendChild(button);
            });
            console.log('✅ Kategorien gerendert');
        }

        function renderTests() {
            console.log('🔄 Rendering Tests...');
            const container = document.getElementById('testList');
            const tests = getFilteredTests();
            
            container.innerHTML = '';
            document.getElementById('testCount').textContent = `${tests.length} Tests`;

            if (tests.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
                        <p>Keine Tests für "${currentCategory}" gefunden.</p>
                        <p>Verwenden Sie das Input-Feld im Header, um neue Tests hinzuzufügen.</p>
                    </div>
                `;
                return;
            }

            tests.forEach((test, index) => {
                const testStatus = testStatuses[test.name];
                const testNote = testNotes[test.name];
                
                const testDiv = document.createElement('div');
                testDiv.className = `test-point ${testStatus ? 'status-' + testStatus : ''}`;
                
                let statusBadgeHtml = '';
                if (testStatus) {
                    const statusConfig = {
                        'success': { icon: '✅', text: 'Bestanden' },
                        'error': { icon: '❌', text: 'Fehlgeschlagen' },
                        'warning': { icon: '⏳', text: 'In Bearbeitung' },
                        'info': { icon: '🗑️', text: 'Übersprungen' }
                    };
                    const config = statusConfig[testStatus];
                    statusBadgeHtml = `<span class="status-badge status-${testStatus}">${config.icon} ${config.text}</span>`;
                }

                let noteHtml = '';
                if (testNote) {
                    noteHtml = `<div class="note-box">📝 ${testNote}</div>`;
                }

                let noteEditHtml = '';
                if (editingNote === test.name) {
                    noteEditHtml = `
                        <div style="margin-top: 8px;">
                            <input type="text" class="input" placeholder="Notiz hinzufügen..." 
                                   value="${testNote || ''}" style="width: 100%; font-size: 13px;"
                                   onchange="updateNote('${test.name}', this.value)"
                                   onkeypress="if(event.key==='Enter') saveNote('${test.name}')" />
                        </div>
                    `;
                }

                testDiv.innerHTML = `
                    <div class="test-point-header">
                        <div class="flex align-center gap-8">
                            <span style="font-size: 16px;">${test.icon}</span>
                            <div style="flex: 1;">
                                <strong>${test.name}</strong>
                                ${test.isDynamic ? '<span class="status-badge" style="background: var(--accent-cyan); color: white; margin-left: 8px;">Custom</span>' : ''}
                            </div>
                        </div>
                        ${statusBadgeHtml}
                    </div>
                    
                    <p class="text-secondary text-sm" style="margin: 4px 0 8px 0;">${test.tooltip}</p>
                    ${noteHtml}

                    <div class="test-point-actions">
                        <button class="btn btn-success btn-small" onclick="setTestStatus('${test.name}', 'success')" title="Test bestanden">✅</button>
                        <button class="btn btn-danger btn-small" onclick="setTestStatus('${test.name}', 'error')" title="Test fehlgeschlagen">❌</button>
                        <button class="btn btn-warning btn-small" onclick="setTestStatus('${test.name}', 'warning')" title="Test in Bearbeitung">⏳</button>
                        <button class="btn btn-info btn-small" onclick="setTestStatus('${test.name}', 'info')" title="Test übersprungen">🗑️</button>
                        <button class="btn btn-secondary btn-small" onclick="toggleNoteEdit('${test.name}')" title="Notiz bearbeiten">✏️</button>
                    </div>
                    ${noteEditHtml}
                `;
                
                container.appendChild(testDiv);
            });
            console.log('✅ Tests gerendert:', tests.length);
        }

        // Initialisierung
        document.addEventListener('DOMContentLoaded', function() {
            console.log('📄 DOM Content Loaded - Starte Initialisierung...');
            renderCategories();
            renderTests();
            updateStatusCounts();
            console.log('🎉 AuditLog System erfolgreich initialisiert!');
        });

        console.log('📝 Script vollständig geladen');
