/**
 * Upload functionality for the Engineering Statistics Dashboard
 * Handles CSV file uploads and processing
 */
// File Upload Functionality
document.addEventListener('DOMContentLoaded', function() {
  // Set up upload button functionality
  const uploadButton = document.getElementById('uploadButton');
  const uploadModal = document.getElementById('uploadModal');
  const closeUploadModal = document.getElementById('closeUploadModal');
  const uploadForm = document.getElementById('uploadForm');
  const loadingOverlay = document.getElementById('loadingOverlay');

  // Open upload modal when clicking the upload button
  uploadButton.addEventListener('click', function() {
    uploadModal.style.display = 'block';
  });

  // Close upload modal when clicking the close button
  closeUploadModal.addEventListener('click', function() {
    uploadModal.style.display = 'none';
  });

  // Close modal when clicking outside of it
  window.addEventListener('click', function(event) {
    if (event.target === uploadModal) {
      uploadModal.style.display = 'none';
    }
  });

  // Handle form submission
  uploadForm.addEventListener('submit', function(e) {
    e.preventDefault();

    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];

    if (!file) {
      showUploadStatus('Please select a CSV file to upload', 'danger');
      return;
    }

    // Show progress bar
    const progressBar = document.getElementById('uploadProgressBar');
    const progressContainer = document.querySelector('.progress');
    progressContainer.style.display = 'flex';
    progressBar.style.width = '0%';
    progressBar.textContent = '';

    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    // Track upload progress
    xhr.upload.addEventListener('progress', function(e) {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        progressBar.style.width = percentComplete + '%';
        progressBar.textContent = percentComplete + '%';
      }
    });

    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          showUploadStatus('File uploaded successfully! Processing data...', 'success');

          // Close the upload modal
          setTimeout(function() {
            uploadModal.style.display = 'none';

            // Show loading overlay
            loadingOverlay.style.display = 'flex';

            // Wait a moment then refresh the data
            setTimeout(function() {
              // Refresh the data
              window.location.reload();
            }, 500);
          }, 1000);
        } else {
          showUploadStatus('Error processing file: ' + (xhr.responseText || 'Unknown error'), 'danger');
          progressContainer.style.display = 'none';
        }
      }
    };

    xhr.open('POST', '/api/upload', true);
    xhr.send(formData);
  });

  /**
   * Display upload status message
   * @param {string} message - Message to display
   * @param {string} type - Bootstrap alert type (success, danger, warning, etc.)
   */
  function showUploadStatus(message, type) {
    const statusDiv = document.getElementById('uploadStatus');
    statusDiv.className = 'alert mt-3 alert-' + type;
    statusDiv.textContent = message;
    statusDiv.style.display = 'block';
  }
});
