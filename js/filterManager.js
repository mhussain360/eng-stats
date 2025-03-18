// filterManager.js
const FilterManager = (function () {
  // Private variables to store filter states
  let lastAppliedFilters = {
    developers: [],
    grades: [],
    teams: [],
  };

  /**
   * Normalize a string value for consistent comparison
   * @param {string} value - The value to normalize
   * @returns {string} - Normalized value
   */
  function normalizeValue(value) {
    if (value === null || value === undefined) return "";
    return String(value).trim().toLowerCase();
  }

  /**
   * Move selected items between lists
   * @param {string} filterType - Type of filter (developers/grades/teams)
   * @param {string} direction - Direction to move (left/right)
   */
  function moveSelected(filterType, direction) {
    const sourceId =
      direction === "left"
        ? `available${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`
        : `selected${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    const targetId =
      direction === "left"
        ? `selected${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`
        : `available${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;

    const sourceSelect = document.getElementById(sourceId);
    const targetSelect = document.getElementById(targetId);

    if (!sourceSelect || !targetSelect) {
      console.error(`Unable to find source or target select for ${filterType}`);
      return;
    }

    Array.from(sourceSelect.selectedOptions).forEach((option) => {
      targetSelect.appendChild(option);
    });

    // Sort options
    sortSelectOptions(targetSelect);

    // Update visualizations immediately
    applyFilters();
  }

  /**
   * Move all items between lists
   * @param {string} filterType - Type of filter (developers/grades/teams)
   * @param {string} direction - Direction to move (left/right)
   */
  function moveAll(filterType, direction) {
    const sourceId =
      direction === "left"
        ? `available${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`
        : `selected${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;
    const targetId =
      direction === "left"
        ? `selected${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`
        : `available${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`;

    const sourceSelect = document.getElementById(sourceId);
    const targetSelect = document.getElementById(targetId);

    if (!sourceSelect || !targetSelect) {
      console.error(`Unable to find source or target select for ${filterType}`);
      return;
    }

    Array.from(sourceSelect.options).forEach((option) => {
      targetSelect.appendChild(option);
    });

    // Sort options
    sortSelectOptions(targetSelect);

    // Update visualizations immediately
    applyFilters();
  }

  /**
   * Sort select options alphabetically
   * @param {HTMLSelectElement} select - Select element to sort
   */
  function sortSelectOptions(select) {
    const options = Array.from(select.options);
    options.sort((a, b) => a.text.localeCompare(b.text));
    options.forEach((option) => select.appendChild(option));
  }

  /**
   * Populate filter dropdowns with initial data
   * @param {Array} csvData - Array of data objects
   */
  function populateFilters(csvData) {
    const extractUniqueValues = (field) => {
      const values = new Set();
      csvData.forEach((row) => {
        if (row[field]) {
          const value = normalizeValue(row[field]);
          if (value) values.add(value);
        }
      });
      return [...values].sort();
    };

    const developers = extractUniqueValues("Developer Name");
    const grades = extractUniqueValues("Grade").sort((a, b) => {
      const numA = parseFloat(a);
      const numB = parseFloat(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return a.localeCompare(b);
    });
    const teams = extractUniqueValues("Team");

    // Initially populate available lists
    populateList("availableDevelopers", developers);
    populateList("availableGrades", grades);
    populateList("availableTeams", teams);

    // Store initial state
    lastAppliedFilters = {
      developers: [],
      grades: [],
      teams: [],
    };
  }

  /**
   * Helper function to populate a list
   * @param {string} elementId - ID of the select element
   * @param {Array} values - Array of values to populate
   */
  function populateList(elementId, values) {
    const select = document.getElementById(elementId);
    if (!select) {
      console.error(`Select element with ID '${elementId}' not found`);
      return;
    }

    select.innerHTML = "";
    values.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  /**
   * Apply filters and update visualizations
   */
  function applyFilters() {
    const selectedDevelopers = Array.from(
      document.getElementById("selectedDevelopers").options,
    ).map((opt) => opt.value);
    const selectedGrades = Array.from(
      document.getElementById("selectedGrades").options,
    ).map((opt) => opt.value);
    const selectedTeams = Array.from(
      document.getElementById("selectedTeams").options,
    ).map((opt) => opt.value);

    let filteredData = [...DataProcessor.getAllData()];

    // Apply filters
    if (selectedDevelopers.length > 0) {
      filteredData = filteredData.filter((row) =>
        selectedDevelopers.includes(normalizeValue(row["Developer Name"])),
      );
    }

    if (selectedGrades.length > 0) {
      filteredData = filteredData.filter((row) =>
        selectedGrades.includes(normalizeValue(row["Grade"])),
      );
    }

    if (selectedTeams.length > 0) {
      filteredData = filteredData.filter((row) =>
        selectedTeams.includes(normalizeValue(row["Team"])),
      );
    }

    // Store current filter state
    lastAppliedFilters = {
      developers: selectedDevelopers,
      grades: selectedGrades,
      teams: selectedTeams,
    };

    // Update data processor with filtered data
    DataProcessor.setFilteredData(filteredData);

    // Update visualizations
    updateVisualizations(filteredData);
  }

  /**
   * Update all visualizations with filtered data
   * @param {Array} filteredData - Array of filtered data objects
   */
  function updateVisualizations(filteredData) {
    // Update charts
    ChartManager.updatePerformanceChart(filteredData);
    ChartManager.updateComparisonChart();

    // Update data table
    TableManager.displayDataTable(
      filteredData,
      DataProcessor.getMonthColumns(),
    );
    TableManager.updateRecordCount(filteredData.length);

    // Update debug info if enabled
    if (window.DEBUG) {
      const debugInfo = document.getElementById("debugInfo");
      if (debugInfo) {
        debugInfo.innerHTML = `
                    <div>Active Filters:</div>
                    <div>Developers: ${lastAppliedFilters.developers.join(", ") || "None"}</div>
                    <div>Grades: ${lastAppliedFilters.grades.join(", ") || "None"}</div>
                    <div>Teams: ${lastAppliedFilters.teams.join(", ") || "None"}</div>
                    <div>Filtered Records: ${filteredData.length}</div>
                `;
      }
    }
  }

  /**
   * Reset all filters to initial state
   */
  function resetFilters() {
    ["Developers", "Grades", "Teams"].forEach((type) => {
      moveAll(type.toLowerCase(), "right");
    });

    // Reset stored filter state
    lastAppliedFilters = {
      developers: [],
      grades: [],
      teams: [],
    };

    // Update visualizations with all data
    const allData = DataProcessor.getAllData();
    DataProcessor.setFilteredData(allData);
    updateVisualizations(allData);
  }

  /**
   * Get current filter state
   * @returns {Object} Current filter state
   */
  function getCurrentFilters() {
    return { ...lastAppliedFilters };
  }

  // Return public methods
  return {
    populateFilters,
    moveSelected,
    moveAll,
    resetFilters,
    getCurrentFilters,
    applyFilters,
  };
})();
