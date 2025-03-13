// commitModal.js - Handles commit history modal functionality

const CommitModal = (function() {
    // Modal element
    let commitModal = null;

    // Initialize the modal and event listeners
    function initializeModal() {
        commitModal = document.getElementById('commitModal');
        document.querySelector('.close-modal').addEventListener('click', closeModal);

        // Close modal when clicking outside of it
        window.addEventListener('click', function(event) {
            if (event.target === commitModal) {
                closeModal();
            }
        });
    }

    // Open the commit modal for a specific developer
    function openCommitModal(developerName) {
        // Set modal title
        document.getElementById('modalTitle').textContent = `${developerName}'s Commit History`;

        // Show loading spinner
        const loadingSpinner = document.createElement('div');
        loadingSpinner.className = 'loading-spinner';
        loadingSpinner.innerHTML = `
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Loading commit data...</p>
        `;

        // Add loading spinner to modal
        const modalContent = document.querySelector('.modal-content');
        const existingSpinner = document.querySelector('.loading-spinner');
        if (existingSpinner) {
            existingSpinner.style.display = 'block';
        } else {
            modalContent.insertBefore(loadingSpinner, document.getElementById('commitTable').parentNode);
        }

        // Hide the table until data is loaded
        document.getElementById('commitTable').style.display = 'none';

        // Clear previous search
        document.getElementById('commitSearch').value = '';
        document.getElementById('commitTable').getElementsByTagName('tbody')[0].innerHTML = '';

        // Show modal
        commitModal.style.display = 'block';

        // Create safe filename from developer name
        const safeName = developerName.replace(/[^a-z0-9]/gi, '_');
        const filename = `${safeName}_commit_history.txt`;

        // Fetch commit data from server API
        fetch(`/api/commit-descriptions/${filename}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch commit data');
                }
                return response.text();
            })
            .then(data => {
                // Hide loading spinner
                const spinner = document.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.style.display = 'none';
                }

                // Show table and display data
                document.getElementById('commitTable').style.display = 'table';
                displayCommitData(data);
            })
            .catch(error => {
                console.error('Error fetching commit data:', error);
                const spinner = document.querySelector('.loading-spinner');
                if (spinner) {
                    spinner.style.display = 'none';
                }
                document.getElementById('commitTable').style.display = 'table';
                document.getElementById('commitTable').getElementsByTagName('tbody')[0].innerHTML =
                    `<tr><td colspan="2" class="text-center">Error loading commit history. ${error.message}</td></tr>`;
            });
    }

    // Display commit data in table
    function displayCommitData(data) {
        const commitTableBody = document.getElementById('commitTable').getElementsByTagName('tbody')[0];
        commitTableBody.innerHTML = '';

        if (!data || data.trim() === '') {
            commitTableBody.innerHTML = '<tr><td colspan="3" class="text-center">No commit history available</td></tr>';
            return;
        }

        // Process each line of the commit data
        const lines = data.split('\n')
            .filter(line => line.trim() !== '')
            .map(line => {
                const parts = line.split('|').map(part => part.trim());
                return {
                    date: parts[0] || '', // New date field
                    desc: parts[1],
                    filesLink: parts[3]
                };
            })
            .sort((a, b) => {
                // Sort by date in descending order (most recent first)
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                return dateB - dateA;
            });

        lines.forEach(({date, desc, filesLink}) => {
            const row = document.createElement('tr');

            // Date cell
            const dateCell = document.createElement('td');
            dateCell.textContent = formatDate(date); // Format date as mm-yy
            row.appendChild(dateCell);

            // Commit description cell
            const descCell = document.createElement('td');
            descCell.textContent = desc;
            row.appendChild(descCell);

            // Files changed cell
            const filesCell = document.createElement('td');
            if (filesLink) {
                const fileAnchor = document.createElement('a');
                fileAnchor.href = filesLink;
                fileAnchor.textContent = 'View Changes';
                fileAnchor.target = '_blank';
                fileAnchor.className = 'commit-files-link';
                filesCell.appendChild(fileAnchor);
            } else {
                filesCell.textContent = 'No files available';
            }
            row.appendChild(filesCell);

            commitTableBody.appendChild(row);
        });

        // Store original table for search functionality
        commitTableBody.setAttribute('data-original', commitTableBody.innerHTML);
    }

    // Add helper function to format dates as mm-yy
    function formatDate(dateStr) {
        const date = new Date(dateStr);
        const day = (date.getDay() + 1).toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);
        return `${month}-${year}`;
    }
    // Filter commit table based on search input
    function filterCommitTable() {
        const searchText = document.getElementById('commitSearch').value.toLowerCase();
        const commitTableBody = document.getElementById('commitTable').getElementsByTagName('tbody')[0];
        const originalHTML = commitTableBody.getAttribute('data-original');

        if (!searchText) {
            // Restore original table if search is empty
            commitTableBody.innerHTML = originalHTML;
            return;
        }

        // Create temporary table to properly parse the HTML structure
        const tempTable = document.createElement('table');
        const tempTbody = document.createElement('tbody');
        tempTable.appendChild(tempTbody);
        tempTbody.innerHTML = originalHTML;

        const rows = tempTbody.getElementsByTagName('tr');

        // Clear current table
        commitTableBody.innerHTML = '';

        let matchFound = false;

        // Filter rows based on search
          Array.from(rows).forEach(row => {
              const cells = row.getElementsByTagName('td');
              const date = cells[0]?.textContent || '';
              const description = cells[1]?.textContent || '';

              // Search in both date and description
              if (date.toLowerCase().includes(searchText) ||
                  description.toLowerCase().includes(searchText)) {
                  commitTableBody.appendChild(row.cloneNode(true));
                  matchFound = true;
              }
          });

        // Show message if no matches found
        if (!matchFound) {
            commitTableBody.innerHTML = '<tr><td colspan="3" class="text-center">No matching commits found</td></tr>';
        }
    }

    // Close the modal
    function closeModal() {
        commitModal.style.display = 'none';
    }

    // Return public methods
    return {
        initializeModal,
        openCommitModal,
        filterCommitTable,
        closeModal
    };
})();
