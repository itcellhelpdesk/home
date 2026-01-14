// Google Sheets API configuration
const SPREADSHEET_ID = '11AWbKR2rR2YQYm6AdjEQsw-na9QObL0wfw6eAi4MEdM';
const API_KEY = 'AIzaSyBAuS3Brpsw5JOJnjNJii1UlFa7ClXf8d4';
const SHEET_NAME = '101';
const SETTINGS_SHEET = 'settings';

// Voice files configuration
const VOICE_BASE_URL = 'https://itcellhelpdesk.github.io/home/voices/';

// Store section voice files that have been loaded
const sectionVoiceCache = new Map();

// Audio cache for common voice files
const audioCache = new Map();

// Configuration for max tokens to show
const MAX_TOKENS_TO_SHOW = {
    desktop: 6,
    tablet: 4,
    mobile: 3
};

// Store previous token data for comparison
let previousTokenData = {};
let previousAllPassedTokens = {};
let fetchRetryCount = 0;
const MAX_RETRIES = 3;

// Preload notification bell sound
const notificationBell = new Audio("https://itcellhelpdesk.github.io/home/voices/bell.mp3");

// Common voice files to preload - ONLY DIGIT FILES
const COMMON_VOICE_FILES = [
    '0.wav', '1.wav', '2.wav', '3.wav', '4.wav',
    '5.wav', '6.wav', '7.wav', '8.wav', '9.wav',
    'token_no.wav'
];

// Cache QR code image for offline use
function cacheQRImage() {
    const qrImage = new Image();
    qrImage.crossOrigin = "anonymous";
    qrImage.src = './tokentrackerqr.png';
    
    qrImage.onload = function() {
        console.log('QR code image cached successfully');
        // Store in localStorage as base64 for offline use
        const canvas = document.createElement('canvas');
        canvas.width = qrImage.width;
        canvas.height = qrImage.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(qrImage, 0, 0);
        
        try {
            const dataURL = canvas.toDataURL('image/png');
            localStorage.setItem('cachedQRCode', dataURL);
            console.log('QR code saved to local storage');
        } catch (error) {
            console.warn('Could not save QR code to local storage:', error);
        }
    };
    
    qrImage.onerror = function() {
        console.warn('Could not cache QR code image');
        // Create a fallback QR placeholder in storage
        const fallbackQR = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM0OThkQiIvPjx0ZXh0IHg9IjEwMCUgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDb2RlPC90ZXh0Pjx0ZXh0IHg9IjEwMCUiIHk9IjcwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2NhbiB0byB0cmFjazwvdGV4dD48L3N2Zz4=';
        localStorage.setItem('cachedQRCode', fallbackQR);
    };
}

// Get QR image from cache or fallback
function getQRImageSource() {
    const cachedQR = localStorage.getItem('cachedQRCode');
    if (cachedQR) {
        return cachedQR;
    }
    return './tokentrackerqr.png';
}

// Preload common voice files
function preloadCommonVoiceFiles() {
    console.log('Preloading common voice files...');
    COMMON_VOICE_FILES.forEach(filename => {
        const audio = new Audio();
        audio.src = VOICE_BASE_URL + filename;
        audio.preload = 'auto';
        audioCache.set(filename, audio);
        audio.load();
    });
    console.log('Common voice files preloading initiated');
}

// Extract section name and number
function extractSectionParts(sectionName) {
    const numberMatch = sectionName.match(/\d+$/);
    const sectionNumber = numberMatch ? numberMatch[0] : null;
    
    const baseSectionName = sectionNumber ? 
        sectionName.replace(new RegExp(`\\s*${sectionNumber}$`), '').trim() : 
        sectionName.trim();
    
    return {
        baseName: baseSectionName,
        number: sectionNumber
    };
}

// Load section voice file if not already loaded
async function loadSectionVoice(sectionName) {
    const { baseName } = extractSectionParts(sectionName);
    
    const fileName = baseName.toLowerCase().replace(/\s+/g, '_') + '.wav';
    
    if (sectionVoiceCache.has(fileName)) {
        return sectionVoiceCache.get(fileName);
    }
    
    const audio = new Audio();
    audio.src = VOICE_BASE_URL + fileName;
    audio.preload = 'auto';
    
    return new Promise((resolve) => {
        audio.addEventListener('canplaythrough', () => resolve(audio));
        audio.addEventListener('error', () => {
            console.warn(`Could not load voice file for section: ${baseName} (${fileName})`);
            resolve(null);
        });
        audio.load();
    }).then(audio => {
        if (audio) {
            sectionVoiceCache.set(fileName, audio);
        }
        return audio;
    });
}

// Play common voice file
async function playCommonVoice(fileName) {
    return new Promise((resolve) => {
        const audio = audioCache.get(fileName);
        
        if (audio) {
            audio.currentTime = 0;
            audio.play().then(() => {
                audio.onended = resolve;
            }).catch(error => {
                console.warn(`Could not play ${fileName}:`, error);
                resolve();
            });
        } else {
            console.warn(`Voice file not found: ${fileName}`);
            resolve();
        }
    });
}

// Play individual digit voice
function playDigitVoice(digit) {
    return playCommonVoice(`${digit}.wav`);
}

// Play "token number" phrase
async function playTokenNumberPhrase() {
    await playCommonVoice('token_no.wav');
}

// Play section voice with number (digit by digit)
async function playSectionVoiceWithNumber(sectionName) {
    try {
        const { baseName, number } = extractSectionParts(sectionName);
        
        if (!baseName) return;
        
        const fileName = baseName.toLowerCase().replace(/\s+/g, '_') + '.wav';
        const audio = sectionVoiceCache.get(fileName);
        
        if (audio) {
            audio.currentTime = 0;
            await audio.play();
            await new Promise(resolve => audio.onended = resolve);
        } else {
            console.warn(`Section voice file not loaded: ${fileName} for section ${sectionName}`);
            const newAudio = await loadSectionVoice(sectionName);
            if (newAudio) {
                newAudio.currentTime = 0;
                await newAudio.play();
                await new Promise(resolve => newAudio.onended = resolve);
            }
        }
        
        if (number) {
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const numberDigits = number.toString().split('');
            for (const digit of numberDigits) {
                await playDigitVoice(digit);
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
    } catch (error) {
        console.warn(`Could not play section voice for ${sectionName}:`, error);
    }
}

// Announce token in format: "Token number [digits] [section name] [section number]"
async function announceToken(section, tokenNumber) {
    if (!audioCache.size) {
        console.warn('Voice files not loaded yet');
        return;
    }
    
    try {
        await playTokenNumberPhrase();
        
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const tokenDigits = tokenNumber.toString().split('');
        
        for (const digit of tokenDigits) {
            await playDigitVoice(digit);
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        await new Promise(resolve => setTimeout(resolve, 200));
        
        await playSectionVoiceWithNumber(section);
        
    } catch (error) {
        console.error('Error in token announcement:', error);
    }
}

// Function to get max tokens to show based on screen width
function getMaxTokensToShow() {
    const width = window.innerWidth;
    if (width <= 768) {
        return MAX_TOKENS_TO_SHOW.mobile;
    } else if (width <= 1200) {
        return MAX_TOKENS_TO_SHOW.tablet;
    } else {
        return MAX_TOKENS_TO_SHOW.desktop;
    }
}

// Function to fetch data from Google Sheets
async function fetchTokenData() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SHEET_NAME}?key=${API_KEY}`;
        const response = await fetch(url, { 
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        
        if (!response.ok) {
            throw new Error(` API Error: ${response.status}`);
        }
        
        const data = await response.json();
        fetchRetryCount = 0;
        
        const processedData = processData(data.values);
        if (!processedData) {
            throw new Error('No valid token data found');
        }
        
        return processedData;
        
    } catch (error) {
        console.error('Error fetching token data:', error);
        fetchRetryCount++;
        
        let errorMessage = 'Unknown error occurred';
        
        if (error.name === 'TimeoutError' || error.message.includes('Failed to fetch')) {
            errorMessage = 'Network error: Cannot connect to server';
        } else if (error.message.includes(' API')) {
            errorMessage = 'Server error: ' + error.message;
        } else if (error.message.includes('No valid token data')) {
            errorMessage = 'No token data available';
        } else {
            errorMessage = 'Error: ' + error.message;
        }
        
        return {
            error: true,
            message: errorMessage,
            retryCount: fetchRetryCount
        };
    }
}

// Process the data from Google Sheets
function processData(values) {
    if (!values || values.length < 2) {
        console.error('No data received from Database');
        return null;
    }
    
    const headers = values[0];
    const rows = values.slice(1);
    
    const sectionsMap = {};
    
    rows.forEach(row => {
        if (row.length < headers.length) return;
        
        const section = row[1];
        const tokenNo = parseInt(row[2]);
        const status = row[5];
        
        if (!section || !tokenNo) return;
        
        if (!sectionsMap[section]) {
            sectionsMap[section] = {
                currentToken: null,
                queuedTokens: [],
                passedTokens: new Set()
            };
        }
        
        if (status === 'Pass') {
            sectionsMap[section].passedTokens.add(tokenNo);
            
            if (!sectionsMap[section].currentToken || tokenNo > sectionsMap[section].currentToken) {
                sectionsMap[section].currentToken = tokenNo;
            }
        } else if (status === 'In Que') {
            if (!sectionsMap[section].passedTokens.has(tokenNo)) {
                sectionsMap[section].queuedTokens.push(tokenNo);
            }
        }
    });
    
    for (const section in sectionsMap) {
        sectionsMap[section].queuedTokens = sectionsMap[section].queuedTokens
            .filter(token => !sectionsMap[section].passedTokens.has(token))
            .sort((a, b) => a - b);
    }
    
    return Object.keys(sectionsMap).length > 0 ? sectionsMap : null;
}

// Preload section voice files based on current sections
async function preloadSectionVoices(sections) {
    console.log('Preloading section voice files...');
    
    const uniqueBaseSections = new Set();
    sections.forEach(section => {
        const { baseName } = extractSectionParts(section);
        if (baseName) {
            uniqueBaseSections.add(baseName);
        }
    });
    
    for (const baseSection of uniqueBaseSections) {
        try {
            await loadSectionVoice(baseSection);
            console.log(`Loaded voice file for section type: ${baseSection}`);
        } catch (error) {
            console.warn(`Could not load voice file for section type ${baseSection}:`, error);
        }
    }
    
    console.log('Section voice files preloading completed');
}

// Check for changes and announce if needed
function checkForChangesAndAnnounce(newData) {
    if (!newData || Object.keys(previousTokenData).length === 0) {
        previousTokenData = JSON.parse(JSON.stringify(newData));
        for (const section in newData) {
            previousAllPassedTokens[section] = new Set();
            if (newData[section].passedTokens) {
                newData[section].passedTokens.forEach(token => {
                    previousAllPassedTokens[section].add(token);
                });
            }
        }
        return;
    }
    
    for (const section in newData) {
        if (!previousAllPassedTokens[section]) {
            previousAllPassedTokens[section] = new Set();
        }
        
        const newPassedTokens = newData[section].passedTokens || new Set();
        
        newPassedTokens.forEach(token => {
            if (!previousAllPassedTokens[section].has(token)) {
                console.log(`New token ${token} passed at ${section}`);
                playNotificationBell().then(() => {
                    announceToken(section, token);
                });
                
                previousAllPassedTokens[section].add(token);
            }
        });
    }
    
    previousTokenData = JSON.parse(JSON.stringify(newData));
}

// Play notification bell sound
function playNotificationBell() {
    return new Promise((resolve) => {
        notificationBell.currentTime = 0;
        notificationBell.volume = 0.7;
        notificationBell.play().then(() => {
            notificationBell.onended = resolve;
        }).catch(error => {
            console.warn('Could not play notification bell:', error);
            resolve();
        });
    });
}

// Sort sections - those with queue first, then those without
function sortSections(sectionsData) {
    const sectionsWithQueue = [];
    const sectionsWithoutQueue = [];
    
    for (const section in sectionsData) {
        if (sectionsData[section].queuedTokens && sectionsData[section].queuedTokens.length > 0) {
            sectionsWithQueue.push(section);
        } else {
            sectionsWithoutQueue.push(section);
        }
    }
    
    const sortByNumber = (a, b) => {
        const numA = parseInt(a.replace(/\D/g, '')) || 0;
        const numB = parseInt(b.replace(/\D/g, '')) || 0;
        return numA - numB;
    };
    
    sectionsWithQueue.sort(sortByNumber);
    sectionsWithoutQueue.sort(sortByNumber);
    
    return [...sectionsWithQueue, ...sectionsWithoutQueue];
}

// Generate the HTML table from processed data
function generateTable(data) {
    if (!data || Object.keys(data).length === 0) {
        return '<div class="error-message">No token data available</div>';
    }
    
    const sortedSections = sortSections(data);
    
    let html = `
        <table>
            <thead>
                <tr>
                    <th>Counter</th>
                    <th>Current Token</th>
                    <th>In Queue</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    const maxTokens = getMaxTokensToShow();
    
    for (const section of sortedSections) {
        const sectionData = data[section];
        const hasQueue = sectionData.queuedTokens && sectionData.queuedTokens.length > 0;
        const rowClass = hasQueue ? '' : 'no-queue-row';
        
        let queuedTokensHtml = '<div class="queued-tokens-container"><div class="queued-tokens-wrapper">';
        
        if (hasQueue) {
            const tokensToShow = sectionData.queuedTokens.slice(0, maxTokens);
            const remainingTokens = sectionData.queuedTokens.length - maxTokens;
            
            tokensToShow.forEach(token => {
                queuedTokensHtml += `<span class="queued-token" aria-label="Token ${token}">${token}</span>`;
            });
            
            if (remainingTokens > 0) {
                queuedTokensHtml += `<span class="more-tokens-indicator" title="${remainingTokens} more tokens">+${remainingTokens}</span>`;
            }
        } else {
            queuedTokensHtml += '<span class="no-queue-message">No tokens in queue</span>';
        }
        
        queuedTokensHtml += '</div></div>';
        
        const currentToken = sectionData.currentToken || '--';
        const tokenDisplay = currentToken === '--' ? currentToken : 
            `<div class="current-token" aria-label="Current token ${currentToken}">${currentToken}</div>`;
        
        html += `
            <tr class="${rowClass}">
                <td style="font-size: 3.8vw; font-weight: 800;" aria-label="Counter ${section}">${section}</td>
                <td>${tokenDisplay}</td>
                <td>${queuedTokensHtml}</td>
            </tr>
        `;
    }
    
    html += `
            </tbody>
        </table>
    `;
    
    return html;
}

// Show error messages with QR code - UPDATED FOR BETTER VISIBILITY
function showErrorMessage(message) {
    const qrSource = getQRImageSource();
    
    const errorHtml = `
        <div class="error-container">
            <div class="error-content">
                <div class="error-icon">⚠️</div>
                <div class="error-title">Connection Error</div>
                <div class="error-message-text">${message}</div>
                <div class="error-instruction">Please check your internet connection or contact support</div>
                <div class="retry-info">Auto-retrying in a few seconds...</div>
            </div>
            
            <div class="qr-section">
                <div class="qr-title">Scan QR Code for Offline Token Tracking</div>
                <div class="qr-image-container">
                    <img src="${qrSource}" alt="Token Tracker QR Code" class="qr-image" 
                         onerror="this.onerror=null; this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iIzM0OThkQiIvPjx0ZXh0IHg9IjEwMCUgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IiNmZmZmZmYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5RUiBDb2RlPC90ZXh0Pjx0ZXh0IHg9IjEwMCUiIHk9IjcwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSIjZmZmZmZmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+U2NhbiB0byB0cmFjazwvdGV4dD48L3N2Zz4='">
                </div>
                <div class="qr-note">Use your phone's camera to scan and track your token offline</div>
            </div>
        </div>
    `;
    document.getElementById('token-table').innerHTML = errorHtml;
}

// Update connection status indicator
function updateConnectionStatus(isConnected, errorMessage = '') {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        if (isConnected) {
            statusElement.className = 'connection-status connected';
            statusElement.title = 'Connected to server';
            statusElement.setAttribute('aria-label', 'Connected to server');
        } else {
            statusElement.className = 'connection-status disconnected';
            statusElement.title = 'Disconnected: ' + errorMessage;
            statusElement.setAttribute('aria-label', 'Disconnected: ' + errorMessage);
        }
    }
}

// Update the table with new data
async function updateTable() {
    try {
        const data = await fetchTokenData();
        
        if (data && data.error) {
            updateConnectionStatus(false, data.message);
            showErrorMessage(data.message);
            
            // Auto-retry logic
            if (fetchRetryCount < MAX_RETRIES) {
                setTimeout(() => {
                    updateTable();
                }, 3000);
            }
            return;
        }
        
        if (data) {
            updateConnectionStatus(true);
            
            if (Object.keys(previousTokenData).length === 0) {
                const sections = Object.keys(data);
                await preloadSectionVoices(sections);
            }
            
            checkForChangesAndAnnounce(data);
            document.getElementById('token-table').innerHTML = generateTable(data);
            
            // Reset retry count on successful fetch
            fetchRetryCount = 0;
        } else {
            updateConnectionStatus(false, 'No data received');
            showErrorMessage('No data received from server');
        }
        
    } catch (error) {
        console.error('Error updating table:', error);
        updateConnectionStatus(false, error.message);
        showErrorMessage('System error: ' + error.message);
    }
}

// Update scroll reel content
async function updateScrollReel() {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${SETTINGS_SHEET}!C2:C?key=${API_KEY}`;
        const response = await fetch(url, { 
            signal: AbortSignal.timeout(3000) // 3 second timeout for reel
        });
        
        if (response.ok) {
            const data = await response.json();
            const content = processScrollReelData(data.values);
            const container = document.getElementById('scroll-reel-container');
            const contentElement = document.getElementById('scroll-reel-content');
            
            if (content && content.trim() !== '') {
                contentElement.textContent = content;
                contentElement.setAttribute('aria-label', 'Announcement: ' + content);
                container.style.display = 'block';
                
                // Add accessibility role
                container.setAttribute('role', 'marquee');
                container.setAttribute('aria-live', 'polite');
            } else {
                container.style.display = 'none';
            }
        } else {
            document.getElementById('scroll-reel-container').style.display = 'none';
        }
    } catch (error) {
        console.error('Error fetching scroll reel:', error);
        document.getElementById('scroll-reel-container').style.display = 'none';
    }
}

function processScrollReelData(values) {
    if (!values || values.length === 0) return null;
    
    let content = '';
    for (let i = 0; i < values.length; i++) {
        if (values[i] && values[i][0] && values[i][0].trim() !== '') {
            content += values[i][0] + ' • ';
        }
    }
    
    if (content.endsWith(' • ')) {
        content = content.slice(0, -3);
    }
    
    return content;
}

// Android TV optimization
function optimizeForAndroidTV() {
    // Prevent screen sleep if supported
    if ('wakeLock' in navigator) {
        try {
            navigator.wakeLock.request('screen').then(wakeLock => {
                console.log('Wake Lock activated for Android TV');
            }).catch(err => {
                console.log('Wake Lock API not supported:', err);
            });
        } catch (err) {
            console.log('Wake Lock API error:', err);
        }
    }
    
    // Handle TV remote navigation
    document.addEventListener('keydown', function(e) {
        switch(e.key) {
            case 'Enter':
            case ' ':
                // Force refresh on OK/Enter/Space button
                updateTable();
                updateScrollReel();
                break;
            case 'ArrowUp':
            case 'ArrowDown':
                // Prevent default scrolling
                e.preventDefault();
                break;
        }
    });
    
    // Auto-refresh when TV becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            updateTable();
            updateScrollReel();
        }
    });
}

// Enhance accessibility for visually impaired
function enhanceAccessibility() {
    // Add ARIA labels to table
    const tableContainer = document.getElementById('token-table');
    if (tableContainer) {
        tableContainer.setAttribute('role', 'region');
        tableContainer.setAttribute('aria-label', 'Token queue display');
    }
    
    // Add skip to content link
    const skipLink = document.createElement('a');
    skipLink.href = '#token-table';
    skipLink.className = 'skip-link';
    skipLink.textContent = 'Skip to token table';
    skipLink.style.cssText = 'position: absolute; top: -40px; left: 0; background: #e74c3c; color: white; padding: 8px; z-index: 10000;';
    skipLink.addEventListener('focus', function() {
        this.style.top = '0';
    });
    skipLink.addEventListener('blur', function() {
        this.style.top = '-40px';
    });
    
    document.body.insertBefore(skipLink, document.body.firstChild);
}

// Initial load
window.addEventListener('load', function() {
    // Optimize for Android TV
    optimizeForAndroidTV();
    
    // Cache QR image immediately
    cacheQRImage();
    
    // Enhance accessibility
    enhanceAccessibility();
    
    // Preload voice files
    preloadCommonVoiceFiles();
    
    // Initial data load
    updateTable();
    updateScrollReel();
    
    // Set up regular updates
    setInterval(updateTable, 2000);
    setInterval(updateScrollReel, 30000);
    
    // Handle window resize for responsive design
    window.addEventListener('resize', function() {
        if (Object.keys(previousTokenData).length > 0) {
            document.getElementById('token-table').innerHTML = generateTable(previousTokenData);
        }
    });
    
    // Add offline/online detection
    window.addEventListener('online', function() {
        console.log('Network connection restored');
        updateTable();
        updateScrollReel();
    });
    
    window.addEventListener('offline', function() {
        console.log('Network connection lost');
        updateConnectionStatus(false, 'Network disconnected');
        showErrorMessage('Network connection lost. Please check your internet connection.');
    });
});

// Add timeout support for fetch
if (!AbortSignal.timeout) {
    AbortSignal.timeout = function(ms) {
        const controller = new AbortController();
        setTimeout(() => controller.abort(new DOMException("TimeoutError", "TimeoutError")), ms);
        return controller.signal;
    };
}