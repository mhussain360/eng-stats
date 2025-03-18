// chartManager.js - Handles chart creation and updates

const ChartManager = (function() {
    // Module variables
    let performanceChart = null;
    let comparisonChart = null;

    // Create the main performance chart
    function createPerformanceChart(monthColumns) {
        const ctx = document.getElementById('performanceChart').getContext('2d');

        performanceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthColumns,
                datasets: [] // Will be populated in updatePerformanceChart
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Developer Activity Over Time',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'bottom'
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Work Completed'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Month'
                        }
                    }
                }
            }
        });

        // Initial update with all data
        updatePerformanceChart(DataProcessor.getAllData());
    }

    // Update the performance chart with new data
    function updatePerformanceChart(data) {
        const monthColumns = DataProcessor.getMonthColumns();

        // Generate random colors for each developer
        const colors = Utils.generateColors(data.length);

        // Prepare datasets for the chart
        const datasets = data.map((row, index) => {
            const monthlyData = monthColumns.map(month => row[month] || 0);

            return {
                label: row['Developer Name'],
                data: monthlyData,
                backgroundColor: colors[index] + '80', // 50% opacity
                borderColor: colors[index],
                borderWidth: 2,
                fill: false,
                tension: 0.4
            };
        });

        // Update chart with new datasets
        performanceChart.data.datasets = datasets;
        performanceChart.update();
    }

    // Create the comparison chart
    function createComparisonChart() {
        const ctx = document.getElementById('comparisonChart').getContext('2d');

        comparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [], // Will be populated in updateComparisonChart
                datasets: [] // Will be populated in updateComparisonChart
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Developer Statistics',
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Work Completed'
                        }
                    }
                }
            }
        });

        updateComparisonChart();
    }

    // Update the comparison chart based on selected comparison type
    function updateComparisonChart() {
        const data = DataProcessor.getFilteredData(); // Use currently filtered data
        const monthColumns = DataProcessor.getMonthColumns();
        const comparisonType = document.getElementById('comparisonType').value;
        const selectedMonth = document.getElementById('compareMonthSelect').value;

        if (data.length === 0) {
            // No data to display
            comparisonChart.data.labels = [];
            comparisonChart.data.datasets = [];
            comparisonChart.update();
            return;
        }

        const colors = Utils.generateColors(data.length);
        let chartData = [];
        let chartLabels = [];
        let chartTitle = '';

        switch (comparisonType) {
            case 'monthly':
                chartLabels = data.map(row => row['Developer Name']);
                chartData = data.map(row => row[selectedMonth] || 0);
                chartTitle = `Performance for ${selectedMonth}`;
                break;

            case 'total':
                chartLabels = data.map(row => row['Developer Name']);
                chartData = data.map(row => {
                    return monthColumns.reduce((sum, month) => sum + (row[month] || 0), 0);
                });
                chartTitle = 'Total Contribution Across All Months';
                break;

            case 'average':
                chartLabels = data.map(row => row['Developer Name']);
                chartData = data.map(row => {
                    const sum = monthColumns.reduce((sum, month) => sum + (row[month] || 0), 0);
                    return sum / monthColumns.length;
                });
                chartTitle = 'Average Monthly Contribution';
                break;
        }

        // Update comparison chart
        comparisonChart.data.labels = chartLabels;
        comparisonChart.data.datasets = [{
            data: chartData,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('0.8', '1')),
            borderWidth: 1
        }];
        comparisonChart.options.plugins.title.text = chartTitle;
        comparisonChart.update();
    }

    // Update the chart type
    function updateChartType() {
        const chartType = document.getElementById('chartType').value;
        performanceChart.config.type = chartType;
        performanceChart.update();
    }

    // Return public methods
    return {
        createPerformanceChart,
        updatePerformanceChart,
        createComparisonChart,
        updateComparisonChart,
        updateChartType
    };
})();
