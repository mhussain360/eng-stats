// tableManager.js - Handles data table operations

const TableManager = (function() {
    // Display data in a table format
    function displayDataTable(data, monthColumns) {
        const table = document.getElementById('dataTable');
        table.innerHTML = '';

        if (data.length === 0) {
            table.innerHTML = '<tr><td colspan="100%" class="text-center">No data available</td></tr>';
            return;
        }

        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');

        // Get all column headers
        const headers = ['Developer Name', 'Developer', 'Grade', 'Team', ...monthColumns];

        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });

        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Create table body
        const tbody = document.createElement('tbody');
        data.forEach(row => {
            const tr = document.createElement('tr');

            headers.forEach(header => {
                const td = document.createElement('td');

                if (header === 'Developer Name') {
                    // Create button for developer name
                    const devButton = document.createElement('button');
                    devButton.className = 'btn btn-sm btn-outline-primary';
                    devButton.textContent = row[header] !== undefined ? row[header] : '';
                    devButton.onclick = function(e) {
                        e.preventDefault();
                        CommitModal.openCommitModal(row[header]);
                    };
                    td.appendChild(devButton);
                } else {
                    td.textContent = row[header] !== undefined ? row[header] : '';
                }

                tr.appendChild(td);
            });

            tbody.appendChild(tr);
        });

        table.appendChild(tbody);
    }

    // Update record count display
    function updateRecordCount(count) {
        document.getElementById('recordCount').textContent = `${count} records`;
    }

    // Return public methods
    return {
        displayDataTable,
        updateRecordCount
    };
})();