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
            commitTableBody.innerHTML = '<tr><td colspan="2" class="text-center">No commit history available</td></tr>';
            return;
        }

        // Process each line of the commit data
        const lines = data.split('\n').filter(line => line.trim() !== '');

        lines.forEach(line => {
            const parts = line.split('|').map(part => part.trim());

            if (parts.length >= 2) {
                const commitDesc = parts[0];
                const filesLink = parts[2];

                const row = document.createElement('tr');

                // Commit description cell
                const descCell = document.createElement('td');
                descCell.textContent = commitDesc;
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
            }
        });

        // Store original table for search functionality
        commitTableBody.setAttribute('data-original', commitTableBody.innerHTML);
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

        // Create temporary container to search through original rows
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = originalHTML;
        const rows = tempContainer.getElementsByTagName('tr');

        // Clear current table
        commitTableBody.innerHTML = '';

        let matchFound = false;

        // Filter rows based on search
        Array.from(rows).forEach(row => {
            const text = row.textContent.toLowerCase();
            if (text.includes(searchText)) {
                commitTableBody.appendChild(row.cloneNode(true));
                matchFound = true;
            }
        });

        // Show message if no matches found
        if (!matchFound) {
            commitTableBody.innerHTML = '<tr><td colspan="2" class="text-center">No matching commits found</td></tr>';
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
