// app.js - Main application initialization

// Global configuration
const DEBUG = false;

// Initialize when document is ready
document.addEventListener("DOMContentLoaded", function () {
  // Set up chart type change listener
  document
    .getElementById("chartType")
    .addEventListener("change", ChartManager.updateChartType);

  // Set up comparison chart listeners
  document
    .getElementById("comparisonType")
    .addEventListener("change", ChartManager.updateComparisonChart);
  document
    .getElementById("compareMonthSelect")
    .addEventListener("change", ChartManager.updateComparisonChart);

  // Set up commit search listener
  document
    .getElementById("commitSearch")
    .addEventListener("input", CommitModal.filterCommitTable);

  // Set up reset filters button
  document
    .getElementById("resetFilters")
    .addEventListener("click", FilterManager.resetFilters);

  // Set up dual-list filter selection listeners
  ["developers", "grades", "teams"].forEach((filterType) => {
    // Add double-click listeners for both available and selected lists
    document
      .getElementById(
        `available${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`,
      )
      .addEventListener("dblclick", () =>
        FilterManager.moveSelected(filterType, "left"),
      );

    document
      .getElementById(
        `selected${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`,
      )
      .addEventListener("dblclick", () =>
        FilterManager.moveSelected(filterType, "right"),
      );

    // Optional: Add keyboard support for transfer
    [
      `available${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`,
      `selected${filterType.charAt(0).toUpperCase() + filterType.slice(1)}`,
    ].forEach((listId) => {
      document.getElementById(listId).addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const direction = listId.startsWith("available") ? "left" : "right";
          FilterManager.moveSelected(filterType, direction);
        }
      });
    });
  });

  // Set up modal event listeners
  CommitModal.initializeModal();

  // Show debug info if in debug mode
  if (DEBUG) {
    document.getElementById("debugInfo").style.display = "block";
  }

  // Load CSV data
  DataProcessor.parseCSV();
});

// Optional: Add keyboard shortcuts for filter manipulation
document.addEventListener("keydown", function (e) {
  if (e.ctrlKey || e.metaKey) {
    // Ctrl or Command key
    switch (e.key.toLowerCase()) {
      case "r":
        e.preventDefault();
        FilterManager.resetFilters();
        break;
    }
  }
});

// Optional: Add window resize handler for chart responsiveness
let resizeTimeout;
window.addEventListener("resize", function () {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(function () {
    if (ChartManager.updatePerformanceChart) {
      ChartManager.updatePerformanceChart(DataProcessor.getFilteredData());
    }
    if (ChartManager.updateComparisonChart) {
      ChartManager.updateComparisonChart();
    }
  }, 250); // Debounce resize events
});
