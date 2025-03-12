// app.js - Main application initialization

// Global configuration
const DEBUG = true;

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Set up event listeners
    document.getElementById('applyFilters').addEventListener('click', FilterManager.applyFilters);
    document.getElementById('resetFilters').addEventListener('click', FilterManager.resetFilters);
    document.getElementById('chartType').addEventListener('change', ChartManager.updateChartType);
    document.getElementById('comparisonType').addEventListener('change', ChartManager.updateComparisonChart);
    document.getElementById('compareMonthSelect').addEventListener('change', ChartManager.updateComparisonChart);
    document.getElementById('commitSearch').addEventListener('input', CommitModal.filterCommitTable);

    // Set up modal event listeners
    CommitModal.initializeModal();

    // Show debug info if in debug mode
    if (DEBUG) {
        document.getElementById('debugInfo').style.display = 'block';
    }

    // Load CSV data
    DataProcessor.parseCSV();
});
