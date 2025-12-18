// Audit Analytics Pro - Main Application Logic

class AuditAnalyticsTool {
    constructor() {
        this.data = [];
        this.hot = null;
        this.analyses = new Map();
        this.currentResults = {};
        
        this.init();
    }

    init() {
        this.initTypewriter();
        this.initEventListeners();
        this.initGrid();
        this.loadSampleData();
        this.animateCounters();
    }

    initTypewriter() {
        new Typed('#typed-text', {
            strings: [
                'Welcome to Audit Analytics Pro',
                'Professional Data Analysis',
                'Excel-Integrated Audit Tool',
                'Advanced Analytics Made Simple'
            ],
            typeSpeed: 50,
            backSpeed: 30,
            backDelay: 2000,
            loop: true,
            showCursor: true,
            cursorChar: '|'
        });
    }

    initEventListeners() {
        // Data management
        document.getElementById('loadSampleBtn').addEventListener('click', () => this.loadSampleData());
        document.getElementById('importCsvBtn').addEventListener('click', () => this.importCSV());
        document.getElementById('clearDataBtn').addEventListener('click', () => this.clearData());
        document.getElementById('csvFileInput').addEventListener('change', (e) => this.handleFileUpload(e));

        // Quick analysis
        document.getElementById('runDuplicates').addEventListener('click', () => this.runDuplicateDetection());
        document.getElementById('runGaps').addEventListener('click', () => this.runGapDetection());
        document.getElementById('runBenford').addEventListener('click', () => this.runBenfordAnalysis());

        // Advanced analytics
        document.getElementById('stratificationBtn').addEventListener('click', () => this.showStratificationDialog());
        document.getElementById('trendAnalysisBtn').addEventListener('click', () => this.showTrendAnalysis());
        document.getElementById('anomalyDetectionBtn').addEventListener('click', () => this.showAnomalyDetection());

        // Audit templates
        document.getElementById('invoiceAuditBtn').addEventListener('click', () => this.runInvoiceAudit());
        document.getElementById('financialAuditBtn').addEventListener('click', () => this.runFinancialAudit());
        document.getElementById('complianceAuditBtn').addEventListener('click', () => this.runComplianceAudit());

        // Export and navigation
        document.getElementById('exportBtn').addEventListener('click', () => this.exportResults());
        document.getElementById('viewFullResults').addEventListener('click', () => this.viewFullResults());
    }

    initGrid() {
        const container = document.getElementById('dataGrid');
        this.hot = new Handsontable(container, {
            data: [],
            colHeaders: true,
            rowHeaders: true,
            contextMenu: true,
            manualColumnResize: true,
            manualRowResize: true,
            filters: true,
            dropdownMenu: true,
            columnSorting: true,
            sortIndicator: true,
            licenseKey: 'non-commercial-and-evaluation'
        });
    }

    async loadSampleData() {
        try {
            // Load invoice sample data
            const response = await fetch('resources/sample_invoice_data.csv');
            const csvText = await response.text();
            
            // Parse CSV
            const lines = csvText.trim().split('\\n');
            const headers = lines[0].split(',');
            const data = lines.slice(1).map(line => {
                const values = line.split(',');
                return headers.reduce((obj, header, index) => {
                    obj[header.trim()] = values[index] ? values[index].trim() : '';
                    return obj;
                }, {});
            });

            this.data = data;
            this.updateGrid(data);
            this.updateColumnSelectors();
            this.updateDataSummary();
            this.showNotification('Sample data loaded successfully', 'success');
        } catch (error) {
            console.error('Error loading sample data:', error);
            this.showNotification('Error loading sample data', 'error');
        }
    }

    updateGrid(data) {
        if (data.length === 0) {
            this.hot.loadData([]);
            return;
        }

        const headers = Object.keys(data[0]);
        const gridData = data.map(row => headers.map(header => row[header]));
        
        this.hot.updateSettings({
            data: gridData,
            colHeaders: headers,
            columns: headers.map(header => ({
                data: headers.indexOf(header),
                title: header,
                type: this.inferColumnType(data, header)
            }))
        });
    }

    inferColumnType(data, column) {
        const sampleValues = data.slice(0, 10).map(row => row[column]).filter(val => val && val !== '');
        if (sampleValues.length === 0) return 'text';

        // Check for numeric
        if (sampleValues.every(val => !isNaN(parseFloat(val)))) return 'numeric';
        
        // Check for dates
        if (sampleValues.every(val => !isNaN(Date.parse(val)))) return 'date';
        
        return 'text';
    }

    updateColumnSelectors() {
        if (this.data.length === 0) return;

        const headers = Object.keys(this.data[0]);
        const numericColumns = headers.filter(header => 
            this.inferColumnType(this.data, header) === 'numeric'
        );

        // Update selectors
        const selectors = [
            'duplicateColumn',
            'gapColumn', 
            'benfordColumn'
        ];

        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            selector.innerHTML = '<option value="">Select column...</option>';
            
            const columns = selectorId === 'benfordColumn' ? numericColumns : headers;
            columns.forEach(header => {
                const option = document.createElement('option');
                option.value = header;
                option.textContent = header;
                selector.appendChild(option);
            });
        });
    }

    updateDataSummary() {
        if (this.data.length === 0) {
            document.getElementById('rowCount').textContent = '0';
            document.getElementById('colCount').textContent = '0';
            document.getElementById('numericCols').textContent = '0';
            document.getElementById('dateCols').textContent = '0';
            document.getElementById('totalRecords').textContent = '0';
            return;
        }

        const headers = Object.keys(this.data[0]);
        const numericColumns = headers.filter(header => 
            this.inferColumnType(this.data, header) === 'numeric'
        );
        const dateColumns = headers.filter(header => 
            this.inferColumnType(this.data, header) === 'date'
        );

        document.getElementById('rowCount').textContent = this.data.length.toLocaleString();
        document.getElementById('colCount').textContent = headers.length;
        document.getElementById('numericCols').textContent = numericColumns.length;
        document.getElementById('dateCols').textContent = dateColumns.length;
        document.getElementById('totalRecords').textContent = this.data.length.toLocaleString();
    }

    // Duplicate Detection
    runDuplicateDetection() {
        const column = document.getElementById('duplicateColumn').value;
        if (!column) {
            this.showNotification('Please select a column for duplicate detection', 'warning');
            return;
        }

        this.showProcessing('duplicateCount', 'Running...');
        
        setTimeout(() => {
            const duplicates = this.findDuplicates(this.data, column);
            const count = duplicates.length;
            
            document.getElementById('duplicateCount').textContent = `${count} found`;
            document.getElementById('duplicateCount').className = count > 0 ? 'result-badge warning' : 'result-badge success';
            
            this.currentResults.duplicates = {
                column: column,
                count: count,
                records: duplicates
            };
            
            this.showResultsPanel();
            this.updateActiveAnalyses();
            
            if (count > 0) {
                this.showNotification(`${count} duplicates found in ${column}`, 'warning');
            } else {
                this.showNotification('No duplicates found', 'success');
            }
        }, 1000);
    }

    findDuplicates(data, column) {
        const valueCounts = {};
        data.forEach(row => {
            const value = row[column];
            if (value) {
                valueCounts[value] = (valueCounts[value] || 0) + 1;
            }
        });

        return data.filter(row => valueCounts[row[column]] > 1);
    }

    // Gap Detection
    runGapDetection() {
        const column = document.getElementById('gapColumn').value;
        if (!column) {
            this.showNotification('Please select a column for gap detection', 'warning');
            return;
        }

        this.showProcessing('gapCount', 'Running...');
        
        setTimeout(() => {
            const gaps = this.findGaps(this.data, column);
            const count = gaps.length;
            
            document.getElementById('gapCount').textContent = `${count} found`;
            document.getElementById('gapCount').className = count > 0 ? 'result-badge warning' : 'result-badge success';
            
            this.currentResults.gaps = {
                column: column,
                count: count,
                gaps: gaps
            };
            
            this.showResultsPanel();
            this.updateActiveAnalyses();
            
            if (count > 0) {
                this.showNotification(`${count} gaps found in ${column}`, 'warning');
            } else {
                this.showNotification('No gaps found', 'success');
            }
        }, 1000);
    }

    findGaps(data, column) {
        const numericValues = data
            .map(row => parseFloat(row[column]))
            .filter(val => !isNaN(val))
            .sort((a, b) => a - b);
        
        if (numericValues.length < 2) return [];
        
        const gaps = [];
        for (let i = 1; i < numericValues.length; i++) {
            const expected = numericValues[i - 1] + 1;
            if (numericValues[i] > expected) {
                gaps.push({
                    start: expected,
                    end: numericValues[i] - 1,
                    type: 'missing_sequence'
                });
            }
        }
        
        return gaps;
    }

    // Benford's Law Analysis
    runBenfordAnalysis() {
        const column = document.getElementById('benfordColumn').value;
        if (!column) {
            this.showNotification('Please select a numeric column for Benford\'s Law analysis', 'warning');
            return;
        }

        this.showProcessing('benfordResult', 'Analyzing...');
        
        setTimeout(() => {
            const result = this.analyzeBenford(this.data, column);
            
            document.getElementById('benfordResult').textContent = result.conclusion;
            document.getElementById('benfordResult').className = result.deviation > 0.1 ? 'result-badge warning' : 'result-badge success';
            
            this.currentResults.benford = {
                column: column,
                ...result
            };
            
            this.showResultsPanel();
            this.updateActiveAnalyses();
            
            const message = result.deviation > 0.1 ? 
                'Significant deviation from Benford\'s Law detected' : 
                'Data conforms to Benford\'s Law';
            this.showNotification(message, result.deviation > 0.1 ? 'warning' : 'success');
        }, 1500);
    }

    analyzeBenford(data, column) {
        // Expected Benford's Law distribution
        const expected = [0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
        
        // Extract first digits
        const firstDigits = data
            .map(row => {
                const value = parseFloat(row[column]);
                if (!isNaN(value) && value > 0) {
                    return parseInt(Math.abs(value).toString()[0]);
                }
                return null;
            })
            .filter(digit => digit !== null);
        
        if (firstDigits.length === 0) {
            return { conclusion: 'No valid data', deviation: 0 };
        }
        
        // Calculate actual distribution
        const actual = Array(9).fill(0);
        firstDigits.forEach(digit => {
            actual[digit - 1]++;
        });
        
        // Normalize to proportions
        const total = firstDigits.length;
        const actualProportions = actual.map(count => count / total);
        
        // Calculate deviation
        const deviation = actualProportions.reduce((sum, prop, i) => {
            return sum + Math.abs(prop - expected[i]);
        }, 0) / 9;
        
        const conclusion = deviation > 0.1 ? 'Non-conforming' : 'Conforming';
        
        return {
            total: total,
            expected: expected,
            actual: actualProportions,
            deviation: deviation,
            conclusion: conclusion
        };
    }

    // Advanced Analytics
    showStratificationDialog() {
        this.showNotification('Stratification feature coming soon', 'info');
    }

    showTrendAnalysis() {
        this.showNotification('Trend analysis feature coming soon', 'info');
    }

    showAnomalyDetection() {
        this.showNotification('Anomaly detection feature coming soon', 'info');
    }

    // Audit Templates
    runInvoiceAudit() {
        this.showNotification('Running invoice audit template...', 'info');
        
        // Simulate running multiple analyses
        setTimeout(() => {
            this.runDuplicateDetection();
            setTimeout(() => this.runGapDetection(), 500);
            this.showNotification('Invoice audit template completed', 'success');
        }, 500);
    }

    runFinancialAudit() {
        this.showNotification('Running financial audit template...', 'info');
        
        setTimeout(() => {
            this.runBenfordAnalysis();
            this.showNotification('Financial audit template completed', 'success');
        }, 500);
    }

    runComplianceAudit() {
        this.showNotification('Running compliance audit template...', 'info');
        
        setTimeout(() => {
            this.runDuplicateDetection();
            setTimeout(() => this.runGapDetection(), 500);
            setTimeout(() => this.runBenfordAnalysis(), 1000);
            this.showNotification('Compliance audit template completed', 'success');
        }, 500);
    }

    // Data Management
    importCSV() {
        document.getElementById('csvFileInput').click();
    }

    handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const csv = e.target.result;
                const data = this.parseCSV(csv);
                this.data = data;
                this.updateGrid(data);
                this.updateColumnSelectors();
                this.updateDataSummary();
                this.showNotification('CSV file imported successfully', 'success');
            } catch (error) {
                console.error('Error parsing CSV:', error);
                this.showNotification('Error parsing CSV file', 'error');
            }
        };
        reader.readAsText(file);
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
            const values = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            values.push(current.trim());
            
            return headers.reduce((obj, header, index) => {
                obj[header] = values[index] || '';
                return obj;
            }, {});
        });
    }

    clearData() {
        this.data = [];
        this.updateGrid([]);
        this.updateColumnSelectors();
        this.updateDataSummary();
        this.hideResultsPanel();
        this.showNotification('Data cleared', 'info');
    }

    // Results Management
    showResultsPanel() {
        const panel = document.getElementById('resultsPanel');
        panel.style.display = 'block';
        
        // Update results content
        this.updateResultsContent();
        
        // Animate panel appearance
        anime({
            targets: panel,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutQuart'
        });
    }

    hideResultsPanel() {
        const panel = document.getElementById('resultsPanel');
        anime({
            targets: panel,
            opacity: [1, 0],
            translateY: [0, -20],
            duration: 300,
            easing: 'easeInQuart',
            complete: () => {
                panel.style.display = 'none';
            }
        });
    }

    updateResultsContent() {
        const container = document.getElementById('resultsContent');
        container.innerHTML = '';

        // Duplicate detection results
        if (this.currentResults.duplicates) {
            const card = this.createResultCard(
                'Duplicate Detection',
                `Found ${this.currentResults.duplicates.count} duplicates in ${this.currentResults.duplicates.column}`,
                this.currentResults.duplicates.count > 0 ? 'warning' : 'success'
            );
            container.appendChild(card);
        }

        // Gap detection results
        if (this.currentResults.gaps) {
            const card = this.createResultCard(
                'Gap Detection',
                `Found ${this.currentResults.gaps.count} gaps in ${this.currentResults.gaps.column}`,
                this.currentResults.gaps.count > 0 ? 'warning' : 'success'
            );
            container.appendChild(card);
        }

        // Benford's Law results
        if (this.currentResults.benford) {
            const card = this.createResultCard(
                'Benford\'s Law',
                `Data ${this.currentResults.benford.conclusion} (deviation: ${(this.currentResults.benford.deviation * 100).toFixed(1)}%)`,
                this.currentResults.benford.deviation > 0.1 ? 'warning' : 'success'
            );
            container.appendChild(card);
        }
    }

    createResultCard(title, description, type) {
        const card = document.createElement('div');
        card.className = `p-4 rounded-lg border ${
            type === 'warning' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'
        }`;
        
        card.innerHTML = `
            <h4 class="font-semibold ${type === 'warning' ? 'text-amber-800' : 'text-green-800'} mb-2">${title}</h4>
            <p class="text-sm ${type === 'warning' ? 'text-amber-700' : 'text-green-700'}">${description}</p>
        `;
        
        return card;
    }

    updateActiveAnalyses() {
        const count = Object.keys(this.currentResults).length;
        document.getElementById('activeAnalyses').textContent = count;
        
        // Animate counter
        anime({
            targets: '#activeAnalyses',
            scale: [1.2, 1],
            duration: 300,
            easing: 'easeOutBack'
        });
    }

    // Export and Navigation
    exportResults() {
        if (Object.keys(this.currentResults).length === 0) {
            this.showNotification('No results to export', 'warning');
            return;
        }

        const exportData = {
            timestamp: new Date().toISOString(),
            data_summary: {
                total_records: this.data.length,
                columns: this.data.length > 0 ? Object.keys(this.data[0]) : []
            },
            analyses: this.currentResults
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit_results_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Results exported successfully', 'success');
    }

    viewFullResults() {
        window.location.href = 'results.html';
    }

    // Utility Functions
    showProcessing(elementId, message) {
        const element = document.getElementById(elementId);
        element.textContent = message;
        element.className = 'result-badge running';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'warning' ? 'bg-amber-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        anime({
            targets: notification,
            translateX: [300, 0],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            anime({
                targets: notification,
                translateX: [0, 300],
                opacity: [1, 0],
                duration: 300,
                easing: 'easeInQuart',
                complete: () => {
                    document.body.removeChild(notification);
                }
            });
        }, 3000);
    }

    animateCounters() {
        anime({
            targets: '#totalRecords',
            innerHTML: [0, this.data.length],
            duration: 1000,
            round: 1,
            easing: 'easeOutQuart'
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AuditAnalyticsTool();
});

// Add some additional utility animations
document.addEventListener('DOMContentLoaded', () => {
    // Animate cards on page load
    anime({
        targets: '.card-hover',
        opacity: [0, 1],
        translateY: [20, 0],
        delay: anime.stagger(100),
        duration: 600,
        easing: 'easeOutQuart'
    });
    
    // Animate analysis panels
    anime({
        targets: '.analysis-panel',
        opacity: [0, 1],
        scale: [0.95, 1],
        delay: anime.stagger(150, {start: 300}),
        duration: 500,
        easing: 'easeOutQuart'
    });
});