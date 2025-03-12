// filterManager.js - Handles filter operations

const FilterManager = (function() {
    // Populate filter dropdowns with unique values
    function populateFilters(csvData) {
        const developers = [...new Set(csvData.map(row => row['Developer Name']))].filter(Boolean).sort();
        const grades = [...new Set(csvData.map(row => row['Grade']))].filter(Boolean).sort();
        const teams = [...new Set(csvData.map(row => row['Team']))].filter(Boolean).sort();

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

    // Helper function to populate a dropdown with options
    function populateDropdown(elementId, options) {
        const dropdown = document.getElementById(elementId);
        dropdown.innerHTML = '';

        options.forEach(option => {
            if (option !== null && option !== undefined) { // Only add non-null/undefined options
                const optionElement = document.createElement('option');
                optionElement.value = option.toString(); // Convert to string to ensure consistency
                optionElement.textContent = option.toString();
                dropdown.appendChild(optionElement);
            }
        });
    }

    // Apply filters to the data
    function applyFilters() {
        const selectedDevelopers = getSelectedValues('developerFilter');
        const selectedGrades = getSelectedValues('gradeFilter');
        const selectedTeams = getSelectedValues('teamFilter');

        // Log selected filters for debugging
        if (DEBUG) {
            document.getElementById('debugInfo').innerHTML = `
                <div>Selected Developers: ${selectedDevelopers.join(', ') || 'None'}</div>
                <div>Selected Grades: ${selectedGrades.join(', ') || 'None'}</div>
                <div>Selected Teams: ${selectedTeams.join(', ') || 'None'}</div>
            `;
            console.log('Selected Developers:', selectedDevelopers);
            console.log('Selected Grades:', selectedGrades);
            console.log('Selected Teams:', selectedTeams);
        }

        let filteredData = [...DataProcessor.getAllData()]; // Start with a copy of the full dataset

        // Apply Developer filter
        if (selectedDevelopers.length > 0) {
            filteredData = filteredData.filter(row => {
                const developerName = String(row['Developer Name']).trim(); // Ensure it's a string and trim whitespace
                return selectedDevelopers.includes(developerName);
            });
        }

        // Apply Grade filter
        if (selectedGrades.length > 0) {
            filteredData = filteredData.filter(row => {
                const grade = String(row['Grade']).trim(); // Ensure it's a string and trim whitespace
                return selectedGrades.includes(grade);
            });
        }

        // Apply Team filter
        if (selectedTeams.length > 0) {
            filteredData = filteredData.filter(row => {
                const team = String(row['Team']).trim(); // Ensure it's a string and trim whitespace
                return selectedTeams.includes(team);
            });
        }

        // Log filtered data for debugging
        if (DEBUG) {
            console.log('Filtered Data:', filteredData);
            console.log('Filtered Data Count:', filteredData.length);
        }

        // Store the current filtered data
        DataProcessor.setFilteredData(filteredData);

        // Update visualizations with filtered data
        updateVisualizations(filteredData);

        // Update record count display
        TableManager.updateRecordCount(filteredData.length);
    }

    // Helper function to get selected values from a multiple select dropdown
    function getSelectedValues(elementId) {
        const select = document.getElementById(elementId);
        return Array.from(select.selectedOptions).map(option => option.value);
    }

    // Reset all filters and show all data
    function resetFilters() {
        document.getElementById('developerFilter').selectedIndex = -1;
        document.getElementById('gradeFilter').selectedIndex = -1;
        document.getElementById('teamFilter').selectedIndex = -1;

        const allData = DataProcessor.getAllData();
        DataProcessor.setFilteredData(allData);
        updateVisualizations(allData);

        // Update record count display
        TableManager.updateRecordCount(allData.length);

        // Clear debug info
        if (DEBUG) {
            document.getElementById('debugInfo').innerHTML = 'Filters reset';
        }
    }

    // Update all visualizations with the given data
    function updateVisualizations(data) {
        ChartManager.updatePerformanceChart(data);
        ChartManager.updateComparisonChart();
        TableManager.displayDataTable(data, DataProcessor.getMonthColumns());
    }

    // Return public methods
    return {
        populateFilters,
        applyFilters,
        resetFilters
    };
})();