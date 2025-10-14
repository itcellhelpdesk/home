   document.addEventListener('DOMContentLoaded', function() {
            // API Configuration
            const API_KEY = 'AIzaSyBAuS3Brpsw5JOJnjNJii1UlFa7ClXf8d4';
            const MASTER_SPREADSHEET_ID = '113Ebv-amVSvWsuZJeiX55rgBj_DrlBJ31J7xj7be8sI';
            const MASTER_SHEET_NAME = 'master';
            const MASTER_RANGE = 'A2:B'; // Sheet names in A, URLs in B
            const RANGE = 'A:C'; // Columns: Date, Old UTR, New UTR
            
            // DOM Elements
            const sheetSelect = document.getElementById('sheet-select');
            const utrInput = document.getElementById('utr-input');
            const lookupBtn = document.getElementById('lookup-btn');
            const clearBtn = document.getElementById('clear-btn');
            const resultSection = document.getElementById('result-section');
            const resultStatus = document.getElementById('result-status');
            const selectedSheetElement = document.getElementById('selected-sheet');
            const searchUtr = document.getElementById('search-utr');
            const extractedUtrDisplay = document.getElementById('extracted-utr-display');
            const newUtr = document.getElementById('new-utr');
            const resultDate = document.getElementById('result-date');
            const fullCellValue = document.getElementById('full-cell-value');
            const resultMessage = document.getElementById('result-message');
            const statusDiv = document.getElementById('status');
            const historySection = document.getElementById('history-section');
            const historyList = document.getElementById('history-list');
            const extractedUtrDiv = document.getElementById('extracted-utr');
            const extractedValue = document.getElementById('extracted-value');
            const instructionsDiv = document.getElementById('instructions');
            const closeInstructionsBtn = document.getElementById('close-instructions');
            const showInstructionsBtn = document.getElementById('show-instructions');
            const utrError = document.getElementById('utr-error');
            const charCount = document.getElementById('char-count');
            
            let searchHistory = JSON.parse(localStorage.getItem('utrSearchHistory')) || [];
            let instructionsHidden = localStorage.getItem('instructionsHidden') === 'true';
            let availableSheets = []; // Now will store objects with name and id
            
            // Initialize instructions display
            updateInstructionsDisplay();
            
            // Event Listeners
            lookupBtn.addEventListener('click', performLookup);
            clearBtn.addEventListener('click', clearSearch);
            closeInstructionsBtn.addEventListener('click', hideInstructions);
            showInstructionsBtn.addEventListener('click', showInstructions);
            
            // UTR Input validation events
            utrInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    performLookup();
                }
            });
            
            utrInput.addEventListener('input', function() {
                // Auto-format to uppercase
                this.value = this.value.toUpperCase();
                
                // Update character count
                const value = this.value.trim();
                charCount.textContent = value.length;
                
                // Extract and show UTR preview
                const extracted = extractUTR(this.value);
                if (extracted && extracted !== this.value) {
                    extractedValue.textContent = extracted;
                    extractedUtrDiv.style.display = 'block';
                } else {
                    extractedUtrDiv.style.display = 'none';
                }
                
                // Clear validation when user starts typing
                clearValidation();
                
                // Enable/disable lookup button based on input and sheet selection
                updateLookupButtonState();
            });
            
            // Minimum length validation on blur (lost focus)
            utrInput.addEventListener('blur', function() {
                validateUtrLength();
            });
            
            sheetSelect.addEventListener('change', function() {
                updateLookupButtonState();
            });
            
            // Fetch available sheets and initialize
            fetchAvailableSheets();
            
            // Update lookup button state based on input and selection
            function updateLookupButtonState() {
                const hasInput = utrInput.value.trim();
                const hasSheet = sheetSelect.value && sheetSelect.value !== '';
                lookupBtn.disabled = !hasInput || !hasSheet;
            }
            
            // Validate UTR minimum length
            function validateUtrLength() {
                const value = utrInput.value.trim();
                
                if (value.length === 0) {
                    clearValidation();
                    return true;
                }
                
                const isValid = value.length >= 16;
                
                if (!isValid) {
                    showValidationError();
                    return false;
                } else {
                    showValidationSuccess();
                    return true;
                }
            }
            
            // Show validation error
            function showValidationError() {
                utrInput.classList.add('is-invalid');
                utrInput.classList.remove('is-valid');
                utrError.style.display = 'block';
                lookupBtn.disabled = true;
            }
            
            // Show validation success
            function showValidationSuccess() {
                utrInput.classList.remove('is-invalid');
                utrInput.classList.add('is-valid');
                utrError.style.display = 'none';
                updateLookupButtonState();
            }
            
            // Clear validation
            function clearValidation() {
                utrInput.classList.remove('is-invalid', 'is-valid');
                utrError.style.display = 'none';
                updateLookupButtonState();
            }
            
            // Fetch available sheets from Master Google Sheet
            async function fetchAvailableSheets() {
                try {
                    showStatus('Loading available date ranges...', 'progress');
                    
                    const url = `https://sheets.googleapis.com/v4/spreadsheets/${MASTER_SPREADSHEET_ID}/values/${MASTER_SHEET_NAME}!${MASTER_RANGE}?key=${API_KEY}`;
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        throw new Error(`API error: ${response.status}`);
                    }
                    
                    const data = await response.json();
                    
                    if (data.values && data.values.length > 0) {
                        // Process the data to extract sheet names and IDs from URLs
                        availableSheets = processMasterData(data.values);
                        populateSheetDropdown(availableSheets);
                        showStatus('Date-range loaded successfully', 'success');
                        setTimeout(() => statusDiv.style.display = 'none', 2000);
                    } else {
                        throw new Error('No data found in master sheet');
                    }
                    
                } catch (error) {
                    console.error('Error fetching sheets:', error);
                    showStatus('Error loading sheets: ' + error.message, 'error');
                    sheetSelect.innerHTML = '<option value="" selected disabled>Error loading sheets</option>';
                }
            }
            
            // Process master sheet data to extract sheet names and IDs
            function processMasterData(values) {
                const sheets = [];
                
                for (let i = 0; i < values.length; i++) {
                    const row = values[i];
                    if (row.length >= 2) {
                        const sheetName = row[0] || '';
                        const url = row[1] || '';
                        
                        // Extract spreadsheet ID from URL
                        const sheetId = extractSheetIdFromUrl(url);
                        
                        if (sheetName && sheetId) {
                            sheets.push({
                                name: sheetName,
                                id: sheetId
                            });
                        }
                    }
                }
                
                return sheets;
            }
            
            // Extract spreadsheet ID from Google Sheets URL
            function extractSheetIdFromUrl(url) {
                if (!url) return null;
                
                // Try to match the spreadsheet ID pattern in the URL
                // Google Sheets URLs typically look like: https://docs.google.com/spreadsheets/d/{ID}/edit...
                const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
                
                if (match && match[1]) {
                    return match[1];
                }
                
                return null;
            }
            
          // Populate sheet dropdown
function populateSheetDropdown(sheets) {
    sheetSelect.innerHTML = '';
    
    if (sheets.length === 0) {
        sheetSelect.innerHTML = '<option value="" selected disabled>No sheets available</option>';
        return;
    }
    
    // Add default "Select date range" option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = "Select date range";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    sheetSelect.appendChild(defaultOption);
    
    // Sort sheets in ascending order
    const sortedSheets = sheets.sort((a, b) => {
        return a.name.localeCompare(b.name, undefined, {numeric: true, sensitivity: 'base'});
    });
    
    sortedSheets.forEach(sheet => {
        const option = document.createElement('option');
        option.value = sheet.name;
        option.textContent = sheet.name;
        option.dataset.sheetId = sheet.id; // Store the sheet ID in data attribute
        sheetSelect.appendChild(option);
    });
}
            
            // Extract UTR from various formats
            function extractUTR(input) {
                if (!input) return '';
                
                // Remove any spaces
                input = input.trim();
                
                // Case 1: Already in RBISH0 format
                if (input.startsWith('RBISH0')) {
                    return input;
                }
                
                // Case 2: Format like /XUTR/RBISH0123456789
                if (input.includes('/XUTR/')) {
                    const parts = input.split('/XUTR/');
                    if (parts.length > 1 && parts[1].startsWith('RBISH0')) {
                        return parts[1];
                    }
                }
                
                // Case 3: Try to extract RBISH0 followed by numbers
                const utrMatch = input.match(/RBISH0\d+/);
                if (utrMatch) {
                    return utrMatch[0];
                }
                
                // Case 4: Return original input (let API handle validation)
                return input;
            }
            
            // Perform UTR lookup
            async function performLookup() {
                const selectedOption = sheetSelect.options[sheetSelect.selectedIndex];
                const selectedSheetName = sheetSelect.value;
                const selectedSheetId = selectedOption.dataset.sheetId;
                const inputValue = utrInput.value.trim();
                
                if (!selectedSheetName) {
                    showStatus('Please select a date range', 'error');
                    sheetSelect.focus();
                    return;
                }
                
                if (!inputValue) {
                    showStatus('Please enter a UTR value', 'error');
                    utrInput.focus();
                    return;
                }
                
                // Validate UTR length before proceeding
                if (!validateUtrLength()) {
                    showStatus('UTR number must be at least 16 characters long', 'error');
                    utrInput.focus();
                    return;
                }
                
                const extractedUTR = extractUTR(inputValue);
                
                // Validate extracted UTR format
                if (!extractedUTR.startsWith('RBISH0')) {
                    showStatus('Invalid UTR format. Should start with RBISH0', 'error');
                    return;
                }
                
                showStatus(`Searching UTR - ${selectedSheetName}...`, 'progress');
                lookupBtn.disabled = true;
                
                try {
                    const result = await searchUTRInSheet(selectedSheetId, selectedSheetName, extractedUTR);
                    displayResult(selectedSheetName, inputValue, extractedUTR, result);
                    addToHistory(selectedSheetName, inputValue, extractedUTR, result);
                    
                } catch (error) {
                    console.error('Lookup error:', error);
                    showStatus('Error searching UTR - ' + error.message, 'error');
                    lookupBtn.disabled = false;
                }
            }
            
            // Search UTR in specific Google Sheet
            async function searchUTRInSheet(sheetId, sheetName, utrValue) {
                const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${sheetName}!${RANGE}?key=${API_KEY}`;
                
                const response = await fetch(url);
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (!data.values || data.values.length === 0) {
                    return { found: false, message: 'No data found in selected range' };
                }
                
                // Skip header row and search for UTR in column B (index 1)
                for (let i = 1; i < data.values.length; i++) {
                    const row = data.values[i];
                    if (row.length >= 2) {
                        const cellValue = row[1] || '';
                        
                        // Check if cell contains the UTR (in /XUTR/RBISH0 format)
                        if (cellValue.includes(utrValue)) {
                            return {
                                found: true,
                                date: row[0] || 'N/A',
                                newUTR: row[2] || 'N/A',
                                fullCellValue: cellValue,
                                message: 'UTR found in selected range'
                            };
                        }
                    }
                }
                
                return { found: false, message: 'UTR not found in selected range' };
            }
            
            // Display search result
            function displayResult(sheetName, inputValue, extractedUTR, result) {
                selectedSheetElement.textContent = sheetName;
                searchUtr.textContent = inputValue;
                extractedUtrDisplay.textContent = extractedUTR;
                
                if (result.found) {
                    resultStatus.textContent = 'Found';
                    resultStatus.className = 'badge rounded-pill status-found';
                    newUtr.textContent = result.newUTR;
                    resultDate.textContent = formatDate(result.date);
                    fullCellValue.textContent = result.fullCellValue || 'N/A';
                    resultMessage.textContent = result.message;
                    resultMessage.style.color = '#155724';
                } else {
                    resultStatus.textContent = 'Not Found';
                    resultStatus.className = 'badge rounded-pill status-not-found';
                    newUtr.textContent = 'N/A';
                    resultDate.textContent = 'N/A';
                    fullCellValue.textContent = 'N/A';
                    resultMessage.textContent = result.message;
                    resultMessage.style.color = '#721c24';
                }
                
                resultSection.style.display = 'block';
                showStatus(result.message, result.found ? 'success' : 'error');
                lookupBtn.disabled = false;
            }
            
            // Add search to history
            function addToHistory(sheetName, inputValue, extractedUTR, result) {
                const historyItem = {
                    sheet: sheetName,
                    input: inputValue,
                    extracted: extractedUTR,
                    found: result.found,
                    newUTR: result.newUTR || 'N/A',
                    timestamp: new Date().toLocaleString()
                };
                
                // Add to beginning of history
                searchHistory.unshift(historyItem);
                
                // Keep only last 10 items
                if (searchHistory.length > 10) {
                    searchHistory = searchHistory.slice(0, 10);
                }
                
                // Save to localStorage
                localStorage.setItem('utrSearchHistory', JSON.stringify(searchHistory));
                
                // Update display
                updateHistoryDisplay();
            }
            
            // Update history display
            function updateHistoryDisplay() {
                historyList.innerHTML = '';
                
                if (searchHistory.length === 0) {
                    historySection.style.display = 'none';
                    return;
                }
                
                searchHistory.forEach(item => {
                    const historyItem = document.createElement('div');
                    historyItem.className = 'd-flex justify-content-between align-items-center border-bottom pb-2 mb-2';
                    
                    historyItem.innerHTML = `
                        <div>
                            <div class="fw-bold">${item.input}</div>
                            <div class="small text-muted">Range: ${item.sheet} | Extracted: ${item.extracted}</div>
                            <div class="small text-muted">${item.timestamp}</div>
                        </div>
                        <div class="text-end">
                            <span class="badge ${item.found ? 'bg-success' : 'bg-danger'}">${item.found ? 'Found' : 'Not Found'}</span>
                            <div class="small text-muted mt-1">${item.newUTR}</div>
                        </div>
                    `;
                    
                    historyList.appendChild(historyItem);
                });
                
                historySection.style.display = 'block';
            }
            
            // Clear search
            function clearSearch() {
                utrInput.value = '';
                sheetSelect.value = ""; // Reset to default option
                resultSection.style.display = 'none';
                extractedUtrDiv.style.display = 'none';
                statusDiv.style.display = 'none';
                clearValidation();
                updateLookupButtonState();
                utrInput.focus();
            }
            
            // Format date for display
            function formatDate(dateValue) {
                if (!dateValue) return 'N/A';
                
                try {
                    // Try to parse as date
                    const date = new Date(dateValue);
                    if (!isNaN(date.getTime())) {
                        return date.toLocaleDateString();
                    }
                    return dateValue;
                } catch (error) {
                    return dateValue;
                }
            }
            
            // Show status message
            function showStatus(message, type) {
                statusDiv.textContent = message;
                statusDiv.className = 'alert';
                statusDiv.style.display = 'block';
                
                if (type === 'success') {
                    statusDiv.classList.add('alert-success');
                } else if (type === 'error') {
                    statusDiv.classList.add('alert-danger');
                } else if (type === 'progress') {
                    statusDiv.innerHTML = `<span class="loading"></span>${message}`;
                    statusDiv.classList.add('alert-info');
                }
                
                // Auto-hide success messages after 3 seconds
                if (type === 'success') {
                    setTimeout(() => {
                        if (statusDiv.style.display !== 'none') {
                            statusDiv.style.display = 'none';
                        }
                    }, 3000);
                }
            }
            
            // Hide instructions
            function hideInstructions() {
                instructionsHidden = true;
                localStorage.setItem('instructionsHidden', 'true');
                updateInstructionsDisplay();
            }
            
            // Show instructions
            function showInstructions() {
                instructionsHidden = false;
                localStorage.setItem('instructionsHidden', 'false');
                updateInstructionsDisplay();
            }
            
            // Update instructions display
            function updateInstructionsDisplay() {
                if (instructionsHidden) {
                    instructionsDiv.style.display = 'none';
                    showInstructionsBtn.style.display = 'block';
                } else {
                    instructionsDiv.style.display = 'block';
                    showInstructionsBtn.style.display = 'none';
                }
            }
            
            // Auto-focus on input
            utrInput.focus();
        });
