// filterManager.js - Handles filter operations with robust data normalization

const FilterManager = (function() {
    // Reference to the DEBUG flag from the global scope
    const DEBUG = window.DEBUG || false;

    /**
     * Normalizes a string value for consistent comparison
     * - Converts to string
     * - Trims whitespace
     * - Converts to lowercase
     * - Returns empty string for null/undefined
     */
    function normalizeValue(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim().toLowerCase();
    }

    /**
     * Populate filter dropdowns with unique, normalized values
     */
    function populateFilters(csvData) {
        // Extract unique values and normalize them
        const extractNormalizedValues = (field) => {
            const values = new Set();
            csvData.forEach(row => {
                if (row[field]) {
                    const normalizedValue = normalizeValue(row[field]);
                    if (normalizedValue) values.add(normalizedValue);
                }
            });
            return [...values].sort();
        };

        const developers = extractNormalizedValues('Developer Name');
        const grades = extractNormalizedValues('Grade');
        const teams = extractNormalizedValues('Team');

        // Log filter options for debugging
        if (DEBUG) {
            console.log('Developer Filter Options:', developers);
            console.log('Grade Filter Options:', grades);
            console.log('Team Filter Options:', teams);
        }

        populateDropdown('developerFilter', developers);
        populateDropdown('gradeFilter', grades);
        populateDropdown('teamFilter', teams);
    }

    /**
     * Helper function to populate a dropdown with normalized options
     */
    function populateDropdown(elementId, options) {
        const dropdown = document.getElementById(elementId);
        if (!dropdown) {
            console.error(`Dropdown element with ID '${elementId}' not found`);
            return;
        }

        dropdown.innerHTML = '';

        options.forEach(option => {
            if (option !== null && option !== undefined && option !== '') {
                const optionElement = document.createElement('option');
                // Use the normalized value for both value and text
                optionElement.value = option;
                optionElement.textContent = option;
                dropdown.appendChild(optionElement);
            }
        });
    }

    /**
     * Apply filters to the data with consistent normalization
     */
    function applyFilters() {
        const selectedDevelopers = getSelectedValues('developerFilter');
        const selectedGrades = getSelectedValues('gradeFilter');
        const selectedTeams = getSelectedValues('teamFilter');

        // Log selected filters for debugging
        if (DEBUG) {
            const debugInfo = document.getElementById('debugInfo');
            if (debugInfo) {
                debugInfo.innerHTML = `
                    <div>Selected Developers (${selectedDevelopers.length}): ${selectedDevelopers.join(', ') || 'None'}</div>
                    <div>Selected Grades (${selectedGrades.length}): ${selectedGrades.join(', ') || 'None'}</div>
                    <div>Selected Teams (${selectedTeams.length}): ${selectedTeams.join(', ') || 'None'}</div>
                `;
                debugInfo.style.display = 'block';
            }

            console.log('Selected Developers:', selectedDevelopers);
            console.log('Selected Grades:', selectedGrades);
            console.log('Selected Teams:', selectedTeams);
        }

        // Get a copy of the full dataset
        let filteredData = [...DataProcessor.getAllData()];

        // Debug: Log the full dataset count
        if (DEBUG) {
            console.log('Total records before filtering:', filteredData.length);
        }

        // Create a helper function for filtering based on a field
        const filterByField = (data, fieldName, selectedValues) => {
            if (!selectedValues || selectedValues.length === 0) return data;

            return data.filter(row => {
                const normalizedFieldValue = normalizeValue(row[fieldName]);
                return selectedValues.includes(normalizedFieldValue);
            });
        };

        // Apply each filter in sequence
        if (selectedDevelopers.length > 0) {
            // Debug logging for developer filtering
            if (DEBUG) {
                const beforeCount = filteredData.length;

                // Count matches for each selected developer before filtering
                selectedDevelopers.forEach(dev => {
                    const matchCount = filteredData.filter(row =>
                        normalizeValue(row['Developer Name']) === dev
                    ).length;
                    console.log(`Records for developer "${dev}": ${matchCount}`);
                });

                // Apply filter
                filteredData = filterByField(filteredData, 'Developer Name', selectedDevelopers);

                console.log(`After developer filter: ${beforeCount} → ${filteredData.length} records`);
            } else {
                filteredData = filterByField(filteredData, 'Developer Name', selectedDevelopers);
            }
        }

        if (selectedGrades.length > 0) {
            // Debug logging for grade filtering
            if (DEBUG) {
                const beforeCount = filteredData.length;
                filteredData = filterByField(filteredData, 'Grade', selectedGrades);
                console.log(`After grade filter: ${beforeCount} → ${filteredData.length} records`);
            } else {
                filteredData = filterByField(filteredData, 'Grade', selectedGrades);
            }
        }

        if (selectedTeams.length > 0) {
            // Debug logging for team filtering
            if (DEBUG) {
                const beforeCount = filteredData.length;
                filteredData = filterByField(filteredData, 'Team', selectedTeams);
                console.log(`After team filter: ${beforeCount} → ${filteredData.length} records`);
            } else {
                filteredData = filterByField(filteredData, 'Team', selectedTeams);
            }
        }

        // Log filtered data for debugging
        if (DEBUG) {
            console.log('Final filtered data count:', filteredData.length);

            if (filteredData.length > 0) {
                console.log('Sample filtered records:', filteredData.slice(0, 3));
            } else {
                console.warn('No records match the selected filters!');

                // Diagnose potential issues
                const allData = DataProcessor.getAllData();

                // Show value distribution for debugging
                if (selectedDevelopers.length > 0) {
                    console.log('Developer names in data with their normalized forms:');
                    const devNameMap = new Map();

                    allData.forEach(row => {
                        if (row['Developer Name']) {
                            const original = row['Developer Name'];
                            const normalized = normalizeValue(original);
                            devNameMap.set(original, normalized);
                        }
                    });

                    console.table([...devNameMap].map(([original, normalized]) => ({
                        'Original': original,
                        'Normalized': normalized,
                        'Selected?': selectedDevelopers.includes(normalized) ? 'Yes' : 'No'
                    })));
                }
            }
        }

        // Store the current filtered data
        DataProcessor.setFilteredData(filteredData);

        // Update visualizations with filtered data
        updateVisualizations(filteredData);
    }

    /**
     * Get selected values from a dropdown with normalization
     */
    function getSelectedValues(elementId) {
        const select = document.getElementById(elementId);
        if (!select) {
            console.error(`Select element with ID '${elementId}' not found`);
            return [];
        }

        // Return normalized selected values
        return Array.from(select.selectedOptions).map(option => normalizeValue(option.value));
    }

    /**
     * Reset all filters and show all data
     */
    function resetFilters() {
        // Reset all dropdowns
        const dropdowns = ['developerFilter', 'gradeFilter', 'teamFilter'];
        dropdowns.forEach(id => {
            const dropdown = document.getElementById(id);
            if (dropdown) {
                // Deselect all options
                for (let i = 0; i < dropdown.options.length; i++) {
                    dropdown.options[i].selected = false;
                }
            }
        });

        // Get all data
        const allData = DataProcessor.getAllData();

        // Update data processor with unfiltered data
        DataProcessor.setFilteredData(allData);

        // Update all visualizations
        updateVisualizations(allData);

        // Clear debug info
        if (DEBUG) {
            const debugInfo = document.getElementById('debugInfo');
            if (debugInfo) {
                debugInfo.innerHTML = 'Filters reset';
                debugInfo.style.display = 'block';
            }
        }
    }

    /**
     * Update all visualizations with the given data
     */
    function updateVisualizations(data) {
        // Update performance chart
        if (typeof ChartManager !== 'undefined' && ChartManager.updatePerformanceChart) {
            ChartManager.updatePerformanceChart(data);
        } else {
            console.error('ChartManager.updatePerformanceChart is not available');
        }

        // Update comparison chart
        if (typeof ChartManager !== 'undefined' && ChartManager.updateComparisonChart) {
            ChartManager.updateComparisonChart();
        } else {
            console.error('ChartManager.updateComparisonChart is not available');
        }

        // Update data table
        if (typeof TableManager !== 'undefined' && TableManager.displayDataTable) {
            TableManager.displayDataTable(data, DataProcessor.getMonthColumns());

            // Update record count
            if (TableManager.updateRecordCount) {
                TableManager.updateRecordCount(data.length);
            }
        } else {
            console.error('TableManager.displayDataTable is not available');
        }
    }

    // Return public methods
    return {
        populateFilters,
        applyFilters,
        resetFilters
    };
})();
