   // Configuration for each tab
        const config = {
            manuals: {
                FOLDER_ID: '1OcpzN2zN_WCB3g7FlmQW5s56XYTO_oY7',
                API_KEY: 'AIzaSyAbjIeVAXnYweF7PLH63ENzcNQKgCVAHDU',
                APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwKu0hWN7pDJNalPFc1IjqBGAf1LfjoVa9fogbu8u05HznbxezSLjnM0zbYsjn0W8Iyug/exec',
                confirmationText: "Are you sure the file name is set to its subject using the format-Section Name-Subject detail?"
            },
            orders: {
                FOLDER_ID: '1jESNrjs1iYVU14fhTZqR18cGKJtiX8V3',
                API_KEY: 'AIzaSyAbjIeVAXnYweF7PLH63ENzcNQKgCVAHDU',
                APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxIkgLX0g9EkT1jmdoeCG7M5bfWz9kuZvEDja8d79mY9ix7KtGvXtJXlwnW44uh9US0/exec',
                confirmationText: "Verify that file name is renamed to its subject?"
            },
            forms: {
                FOLDER_ID: '17bJfMoUDG64dRF5aWXJASc94xAWAkIZ6',
                API_KEY: 'AIzaSyAbjIeVAXnYweF7PLH63ENzcNQKgCVAHDU',
                APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzG_3vXEU3MBrnTP6GfoRIxJOHfPJPXUpI48gzKJYUJHkBwXrJ_D0uR9P-Lm8XTPWwdyQ/exec',
                confirmationText: "Are you sure the file name is set to its subject using the format-Section Name-Subject detail?"
            }
        };
        
        // Fixed File type icons (SVG data URLs)
        const fileIcons = {
            pdf: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2MzMDgwMCI+PHBhdGggZD0iTTggMTZIOFY4SDhWMThNMTAgMTZIMTBWOFYxNk0xMiAxNkgxMlY4SDEyVjE2TTE0IDJINkEyIDIgMCAwIDAgNCA0VjIwQTIgMiAwIDAgMCA2IDIySDE4QTIgMiAwIDAgMCAyMCAyMFY4TDE0IDJNMTQgNEgxNFY4SDE4TDE0IDRaIi8+PC9zdmc+',
            doc: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzFBNTlGRiI+PHBhdGggZD0iTTE0IDJINkEyIDIgMCAwIDAgNCA0VjIwQTIgMiAwIDAgMCA2IDIySDE4QTIgMiAwIDAgMCAyMCAyMFY4TDE0IDJNMTQgNEgxNFY4SDE4TDE0IDRaIi8+PC9zdmc+',
            xls: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzFBNzA0QyI+PHBhdGggZD0iTTE0IDJINkEyIDIgMCAwIDAgNCA0VjIwQTIgMiAwIDAgMCA2IDIySDE4QTIgMiAwIDAgMCAyMCAyMFY4TDE0IDJNMTQgNEgxNFY4SDE4TDE0IDRaIi8+PC9zdmc+',
            default: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzVGNjM2OCI+PHBhdGggZD0iTTE0IDJINkEyIDIgMCAwIDAgNCA0VjIwQTIgMiAwIDAgMCA2IDIySDE4QTIgMiAwIDAgMCAyMCAyMFY4TDE0IDJNMTQgNEgxNFY4SDE4TDE0IDRaIi8+PC9zdmc+'
        };
        
        // DataTable instances
        let dataTables = {
            manuals: null,
            orders: null,
            forms: null
        };
        
        // Current active tab
        let currentTab = 'manuals';
        
        // Function to get file icon based on file type
        function getFileIcon(mimeType) {
            if (mimeType.includes('pdf')) return fileIcons.pdf;
            if (mimeType.includes('document') || mimeType.includes('word')) return fileIcons.doc;
            if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return fileIcons.xls;
            return fileIcons.default;
        }
        
        // Function to get file format badge class
        function getFormatClass(mimeType) {
            if (mimeType.includes('pdf')) return 'pdf';
            if (mimeType.includes('document') || mimeType.includes('word')) return 'doc';
            if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'xls';
            return '';
        }
        
        // Function to get file format display name
        function getFormatName(mimeType) {
            if (mimeType.includes('pdf')) return 'PDF';
            if (mimeType.includes('document') || mimeType.includes('word')) return 'DOC';
            if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'XLS';
            return mimeType.split('/').pop().toUpperCase();
        }
        
        // Function to format date
        function formatDate(dateString) {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
        
        // Function to fetch files from Google Drive for a specific tab
        async function fetchFiles(tab) {
            const configForTab = config[tab];
            const loadingMessage = document.getElementById(`loadingMessage${capitalizeFirst(tab)}`);
            const errorMessage = document.getElementById(`errorMessage${capitalizeFirst(tab)}`);
            const filesTable = document.getElementById(`filesTable${capitalizeFirst(tab)}`);
            const filesTableBody = document.getElementById(`filesTableBody${capitalizeFirst(tab)}`);
            
            try {
                // Build the API URL - now including modifiedTime in the fields
                const apiUrl = `https://www.googleapis.com/drive/v3/files?q='${configForTab.FOLDER_ID}'+in+parents&key=${configForTab.API_KEY}&fields=files(id,name,mimeType,webViewLink,webContentLink,modifiedTime)`;
                
                // Make the API request
                const response = await fetch(apiUrl);
                
                if (!response.ok) {
                    throw new Error(`API request failed with status ${response.status}`);
                }
                
                const data = await response.json();
                
                // Hide loading message
                loadingMessage.style.display = 'none';
                
                // Check if we have files
                if (data.files && data.files.length > 0) {
                    // Sort files by modified date (newest first)
                    data.files.sort((a, b) => new Date(b.modifiedTime) - new Date(a.modifiedTime));
                    
                    // Populate the table
                    populateTable(tab, data.files);
                    filesTable.style.display = 'table';
                    initializeDataTable(tab);
                } else {
                    errorMessage.textContent = 'No files found in the specified folder.';
                    errorMessage.style.display = 'block';
                }
                
            } catch (error) {
                console.error(`Error fetching files for ${tab}:`, error);
                loadingMessage.style.display = 'none';
                errorMessage.textContent = `Error loading files: ${error.message}`;
                errorMessage.style.display = 'block';
            }
        }
        
        // Function to populate the table with file data for a specific tab
        function populateTable(tab, files) {
            const filesTableBody = document.getElementById(`filesTableBody${capitalizeFirst(tab)}`);
            filesTableBody.innerHTML = '';
            
            files.forEach((file, index) => {
                const row = document.createElement('tr');
                
                // SL.No
                const slCell = document.createElement('td');
                slCell.textContent = index + 1;
                row.appendChild(slCell);
                
                // File Name
                const nameCell = document.createElement('td');
                const icon = document.createElement('img');
                icon.src = getFileIcon(file.mimeType);
                icon.alt = 'File icon';
                icon.className = 'file-icon';
                nameCell.appendChild(icon);
                nameCell.appendChild(document.createTextNode(file.name));
                row.appendChild(nameCell);
                
                // Date Column
                const dateCell = document.createElement('td');
                dateCell.className = 'date-cell';
                dateCell.textContent = formatDate(file.modifiedTime);
                row.appendChild(dateCell);
                
                // File Format
                const formatCell = document.createElement('td');
                const formatBadge = document.createElement('span');
                formatBadge.className = `format-badge ${getFormatClass(file.mimeType)}`;
                formatBadge.textContent = getFormatName(file.mimeType);
                formatCell.appendChild(formatBadge);
                row.appendChild(formatCell);
                
                // View Button
                const actionCell = document.createElement('td');
                const viewButton = document.createElement('button');
                viewButton.className = 'view-btn';
                viewButton.textContent = 'View';
                viewButton.onclick = () => {
                    // Open the file in a new tab
                    window.open(file.webViewLink || `https://drive.google.com/file/d/${file.id}/view`, '_blank');
                };
                actionCell.appendChild(viewButton);
                row.appendChild(actionCell);
                
                filesTableBody.appendChild(row);
            });
        }
        
        // Function to initialize DataTable for a specific tab
      
function initializeDataTable(tab) {
    const tableId = `filesTable${capitalizeFirst(tab)}`;
    const searchInput = document.getElementById(`searchInput${capitalizeFirst(tab)}`);
    const tableInfo = document.getElementById(`tableInfo${capitalizeFirst(tab)}`);
    
    dataTables[tab] = $(`#${tableId}`).DataTable({
        "pageLength": 10,
        "lengthMenu": [5, 10, 25, 50],
        "dom": '<"top"if>rt<"bottom"lp><"clear">',
        "language": {
            "emptyTable": "No files found",
            "info": "Showing _START_ to _END_ of _TOTAL_ files",
            "infoEmpty": "Showing 0 to 0 of 0 files",
            "infoFiltered": "(filtered from _MAX_ total files)",
            "lengthMenu": "Show _MENU_ files",
            "loadingRecords": "Loading...",
            "processing": "Processing...",
            "search": "Search:",
            "zeroRecords": "No matching files found",
            "paginate": {
                "first": "First",
                "last": "Last",
                "next": "Next",
                "previous": "Previous"
            }
        },
        "columnDefs": [
            { "orderable": true, "targets": [0, 1, 2, 3] },
            { "orderable": false, "targets": [4] }
        ],
        "order": [[0, 'asc']] // Changed from [[2, 'desc']] to [[0, 'asc']] - Sort by SL.No ascending
    });
    
    // Custom search functionality
    searchInput.addEventListener('keyup', function() {
        dataTables[tab].search(this.value).draw();
    });
    
    // Update table info on draw
    dataTables[tab].on('draw', function() {
        updateTableInfo(tab);
    });
    
    // Initial table info update
    updateTableInfo(tab);
}
        // Function to update table information for a specific tab
        function updateTableInfo(tab) {
            const tableInfo = document.getElementById(`tableInfo${capitalizeFirst(tab)}`);
            if (dataTables[tab]) {
                const pageInfo = dataTables[tab].page.info();
                tableInfo.textContent = `Showing ${pageInfo.recordsDisplay} of ${pageInfo.recordsTotal} files`;
            }
        }
        
        // Function to capitalize first letter of a string
        function capitalizeFirst(string) {
            return string.charAt(0).toUpperCase() + string.slice(1);
        }
        
        // Function to open upload modal for the current tab
        function openUploadModal() {
            const configForTab = config[currentTab];
            
            // Show confirmation dialog first
            Swal.fire({
                title: 'File Upload',
                text: configForTab.confirmationText,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#4285f4',
                cancelButtonColor: '#d33',
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel'
            }).then((result) => {
                if (result.isConfirmed) {
                    // Load Apps Script upload interface
                    uploadFrame.src = configForTab.APP_SCRIPT_URL;
                    uploadModal.style.display = 'block';
                }
            });
        }
        
        // Function to close upload modal
        function closeUploadModal() {
            uploadModal.style.display = 'none';
            uploadFrame.src = '';
        }
        
        // Function to handle upload success
        function handleUploadSuccess() {
            closeUploadModal();
            Swal.fire({
                title: 'Success!',
                text: 'File uploaded successfully',
                icon: 'success',
                confirmButtonColor: '#4285f4'
            });
            
            // Refresh the file list for the current tab
            fetchFiles(currentTab);
        }
        
        // Listen for messages from the iframe
        window.addEventListener('message', function(event) {
            if (event.data === 'uploadSuccess') {
                handleUploadSuccess();
            }
        });
        
        // Initialize the page
        document.addEventListener('DOMContentLoaded', function() {
            // Set up tab switching
            const tabs = document.querySelectorAll('.tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', function() {
                    // Remove active class from all tabs and content
                    tabs.forEach(t => t.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(content => {
                        content.classList.remove('active');
                    });
                    
                    // Add active class to clicked tab and corresponding content
                    this.classList.add('active');
                    const tabId = this.getAttribute('data-tab');
                    document.getElementById(tabId).classList.add('active');
                    currentTab = tabId;
                    
                    // If this is the first time loading this tab, fetch its files
                    if (!dataTables[tabId]) {
                        fetchFiles(tabId);
                    }
                });
            });
            
            // Fetch files for the initially active tab
            fetchFiles(currentTab);
            
            // Set up upload button event listener
            uploadBtn.addEventListener('click', openUploadModal);
            
            // Set up close modal event listener
            closeModal.addEventListener('click', closeUploadModal);
            
            // Close modal when clicking outside
            uploadModal.addEventListener('click', function(event) {
                if (event.target === uploadModal) {
                    closeUploadModal();
                }
            });
        });
