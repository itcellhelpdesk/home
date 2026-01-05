// API Configuration
const apiKey = 'AIzaSyBAuS3Brpsw5JOJnjNJii1UlFa7ClXf8d4';
const sheetId = '1UHuaKpHXhxIkBlFl8BS-w9mfcgkXQ0cnu9T6uKSZILs';
const menuSheetName = 'Menu';

// App State
let currentApp = null;
let currentSubmenu = null;
let menuData = [];
let appState = 'main';

// DOM Elements
const appContainer = document.getElementById('app-container');
const appsGrid = document.getElementById('apps-grid');
const submenuPopup = document.getElementById('submenu-popup');
const submenuItems = document.getElementById('submenu-items');
const submenuTitle = document.getElementById('submenu-title');
const closeSubmenu = document.getElementById('close-submenu');
const contentPage = document.getElementById('content-page');
const contentArea = document.getElementById('content-area');
const contentTitle = document.getElementById('content-title');
const contentClose = document.getElementById('content-close');
const backBtn = document.getElementById('back-btn');
const appTitle = document.getElementById('app-title');
const chatIcon = document.getElementById('chat-icon');
const chatPopup = document.getElementById('chat-popup');
const closePopup = document.getElementById('close-popup');
const newsReel = document.getElementById('news-reel');
const chatInput = document.getElementById('chat-input');
const sendMessage = document.getElementById('send-message');

// Initialize the app
function initApp() {
    setupEventListeners();
    loadApps();
    loadNewsReel();
}

// Setup event listeners
function setupEventListeners() {
    closeSubmenu.addEventListener('click', () => {
        submenuPopup.style.display = 'none';
        appState = 'main';
        history.pushState({
            page: 'main'
        }, '', window.location.href);
    });
    
    contentClose.addEventListener('click', () => {
        goBack();
    });
    
    backBtn.addEventListener('click', () => {
        goBack();
    });
    
    window.addEventListener('popstate', function(event) {
        if (event.state) {
            if (event.state.page === 'main') {
                contentPage.classList.remove('active');
                submenuPopup.style.display = 'none';
                backBtn.style.display = 'none';
                appTitle.textContent = 'IT Cell HelpDesk';
                appState = 'main';
            } else if (event.state.page === 'submenu') {
                contentPage.classList.remove('active');
                submenuPopup.style.display = 'flex';
                backBtn.style.display = 'block';
                appTitle.textContent = event.state.menuName;
                appState = 'submenu';
                
                if (event.state.menuName) {
                    const menu = findMenuByName(event.state.menuName);
                    if (menu) {
                        openSubmenu(menu, false);
                    }
                }
            } else if (event.state.page === 'content') {
                restoreContentPage(event.state);
            }
        } else {
            contentPage.classList.remove('active');
            submenuPopup.style.display = 'none';
            backBtn.style.display = 'none';
            appTitle.textContent = 'IT Cell HelpDesk';
            appState = 'main';
        }
    });
    
    chatIcon.addEventListener('click', () => {
        chatPopup.style.display = 'flex';
    });
    
    closePopup.addEventListener('click', () => {
        chatPopup.style.display = 'none';
    });
    
    sendMessage.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
}

// Load News Reel
// Enhanced Load News Reel
function loadNewsReel() {
    const reelSheetName = 'ScrollReel';
    // Fetch range A2:A for scroll reel content
    const reelUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${reelSheetName}!A2:A?key=${apiKey}`;
    
    fetch(reelUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const rows = data.values;
            let runningText = '';
            
            if (rows && rows.length > 0) {
                // Filter out empty rows and trim whitespace
                const nonEmptyRows = rows
                    .filter(row => row && row[0] && row[0].toString().trim() !== '')
                    .map(row => row[0].toString().trim());
                
                if (nonEmptyRows.length > 0) {
                    // Join all non-empty rows with a separator
                    runningText = nonEmptyRows.join(' • ');
                } else {
                    runningText = 'Welcome to IT Cell HelpDesk - Your one-stop solution for IT support';
                }
            } else {
                runningText = 'Welcome to IT Cell HelpDesk - Your one-stop solution for IT support';
            }
            
            // Update the marquee content
            newsReel.textContent = runningText;
            
            // Optionally, you can add a console log to debug
            console.log('Scroll reel loaded:', runningText);
        })
        .catch(error => {
            console.error('Error loading scroll reel:', error);
            // Fallback content
            newsReel.textContent = 'Welcome to IT Cell HelpDesk - Stay connected with latest updates';
        });
}

// Load Apps from Google Sheets
function loadApps(callback) {
    const menuUrl = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${menuSheetName}!A:F?key=${apiKey}`;
    
    fetch(menuUrl)
        .then(response => response.json())
        .then(data => {
            menuData = data.values || [];
            renderApps();
            if (callback) callback();
        })
        .catch(error => {
            console.error('Error loading menu:', error);
            // Use demo data without notification values
            menuData = [
                ['Main Menu', 'Sub Menu', 'Link', 'Content', 'Icon', ''],
                ['Dashboard', 'Overview', '/overview', '<div class="demo-content"><h3>Dashboard Overview</h3><p>Welcome to your IT HelpDesk dashboard.</p></div>', 'bi bi-speedometer2', ''],
                ['Tickets', 'Create Ticket', '/create', '<div class="demo-content"><h3>Create New Ticket</h3><p>Submit a new support ticket here.</p></div>', 'bi bi-ticket-perforated', ''],
                ['Tickets', 'View Tickets', '/view', '<div class="demo-content"><h3>My Tickets</h3><p>View and manage your support tickets.</p></div>', 'bi bi-ticket-perforated', ''],
                ['Resources', 'Knowledge Base', '/kb', '<div class="demo-content"><h3>Knowledge Base</h3><p>Browse solutions to common problems.</p></div>', 'bi bi-journal-bookmark', ''],
                ['Admin', 'User Management', '/users', '<div class="demo-content"><h3>User Management</h3><p>Manage user accounts and permissions.</p></div>', 'bi bi-people', '']
            ];
            renderApps();
            if (callback) callback();
        });
}

// Render Apps as Tiles (No badges)
function renderApps() {
    appsGrid.innerHTML = '';
    
    if (!menuData || menuData.length < 2) {
        appsGrid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 20px;">No apps available.</div>';
        return;
    }
    
    const mainMenus = {};
    
    // Create main menu structure
    menuData.slice(1).forEach(row => {
        if (row && row.length >= 4) {
            const mainMenu = row[0];
            const subMenu = row[1];
            const subMenuLink = row[2];
            const dynamicContent = row[3];
            const iconClass = row[4] || 'bi bi-folder';
            
            if (!mainMenus[mainMenu]) {
                mainMenus[mainMenu] = {
                    name: mainMenu,
                    icon: iconClass,
                    submenus: []
                };
            }
            
            if (subMenu && subMenuLink) {
                mainMenus[mainMenu].submenus.push({
                    name: subMenu,
                    link: subMenuLink,
                    content: dynamicContent
                });
            }
        }
    });
    
    // Create app tiles
    Object.values(mainMenus).forEach(menu => {
        const appTile = document.createElement('div');
        appTile.className = 'app-tile';
        
        const iconClass = menu.icon || 'bi bi-folder';
        
        appTile.innerHTML = `
            <div class="app-icon">
                <i class="${iconClass}"></i>
            </div>
            <div class="app-name">${menu.name}</div>
        `;
        
        appTile.addEventListener('click', () => {
            if (menu.submenus.length > 0) {
                openSubmenu(menu);
            } else {
                contentTitle.textContent = menu.name;
                contentArea.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
                contentPage.classList.add('active');
                backBtn.style.display = 'block';
                appTitle.textContent = menu.name;
                appState = 'content';
                
                history.pushState({
                    page: 'content',
                    menuName: menu.name,
                    submenuName: null,
                    content: null
                }, '', window.location.href);
                
                setTimeout(() => {
                    contentArea.innerHTML = `
                        <div style="text-align: center; padding: 40px 20px;">
                            <i class="fas fa-info-circle" style="font-size: 3rem; color: #6c757d; margin-bottom: 20px;"></i>
                            <h3>No Content Available</h3>
                            <p>This app doesn't have any content yet.</p>
                        </div>
                    `;
                }, 1000);
            }
        });
        
        appsGrid.appendChild(appTile);
    });
}

// Find menu by name
function findMenuByName(name) {
    const mainMenus = {};
    
    menuData.slice(1).forEach(row => {
        if (row && row.length >= 4) {
            const mainMenu = row[0];
            const subMenu = row[1];
            const subMenuLink = row[2];
            const dynamicContent = row[3];
            const iconClass = row[4] || 'bi bi-folder';
            
            if (!mainMenus[mainMenu]) {
                mainMenus[mainMenu] = {
                    name: mainMenu,
                    icon: iconClass,
                    submenus: []
                };
            }
            
            if (subMenu && subMenuLink) {
                mainMenus[mainMenu].submenus.push({
                    name: subMenu,
                    link: subMenuLink,
                    content: dynamicContent
                });
            }
        }
    });
    
    return mainMenus[name] || null;
}

// Open Submenu (No badges)
function openSubmenu(menu, addToHistory = true) {
    currentApp = menu;
    submenuTitle.textContent = menu.name;
    submenuItems.innerHTML = '';
    
    menu.submenus.forEach(submenu => {
        const item = document.createElement('div');
        item.className = 'submenu-item';
        item.textContent = submenu.name;
        
        item.addEventListener('click', () => {
            loadContent(submenu);
            submenuPopup.style.display = 'none';
        });
        
        submenuItems.appendChild(item);
    });
    
    submenuPopup.style.display = 'flex';
    appState = 'submenu';
    
    if (addToHistory) {
        history.pushState({
            page: 'submenu',
            menuName: menu.name
        }, '', window.location.href);
    }
}

// Load Content
function loadContent(submenu) {
    currentSubmenu = submenu;
    contentTitle.textContent = `${currentApp.name} / ${submenu.name}`;
    contentArea.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
    contentPage.classList.add('active');
    backBtn.style.display = 'block';
    appTitle.textContent = `${currentApp.name} / ${submenu.name}`;
    appState = 'content';
    
    history.pushState({
        page: 'content',
        menuName: currentApp.name,
        submenuName: submenu.name,
        content: submenu.content,
        link: submenu.link
    }, '', window.location.href);
    
    setTimeout(() => {
        if (submenu.content && submenu.content.startsWith('http')) {
            let srcUrl = submenu.content;
            
            contentArea.innerHTML = `
                <iframe src="${srcUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
            `;
        } else if (submenu.content) {
            contentArea.innerHTML = submenu.content;
        } else {
            contentArea.innerHTML = `
                <div class="demo-content">
                    <h3>${submenu.name}</h3>
                    <p>This is the content for ${submenu.name}.</p>
                    <p>Content would be loaded from: ${submenu.link}</p>
                </div>
            `;
        }
    }, 1000);
}

// Restore content page from history state
function restoreContentPage(state) {
    currentApp = findMenuByName(state.menuName);
    
    if (currentApp && state.submenuName) {
        const submenu = currentApp.submenus.find(s => s.name === state.submenuName);
        if (submenu) {
            currentSubmenu = submenu;
            contentTitle.textContent = `${currentApp.name} / ${submenu.name}`;
            contentArea.innerHTML = '<div class="loading-container"><div class="loading-spinner"></div></div>';
            contentPage.classList.add('active');
            backBtn.style.display = 'block';
            appTitle.textContent = `${currentApp.name} / ${submenu.name}`;
            appState = 'content';
            
            setTimeout(() => {
                if (submenu.content && submenu.content.startsWith('http')) {
                    let srcUrl = submenu.content;
                    
                    contentArea.innerHTML = `
                        <iframe src="${srcUrl}" style="width: 100%; height: 100%; border: none;"></iframe>
                    `;
                } else if (submenu.content) {
                    contentArea.innerHTML = submenu.content;
                } else {
                    contentArea.innerHTML = `
                        <div class="demo-content">
                            <h3>${submenu.name}</h3>
                            <p>This is the content for ${submenu.name}.</p>
                            <p>Content would be loaded from: ${submenu.link}</p>
                        </div>
                    `;
                }
            }, 500);
        }
    }
}

// Go back function
function goBack() {
    if (appState === 'content') {
        history.back();
    } else if (appState === 'submenu') {
        submenuPopup.style.display = 'none';
        backBtn.style.display = 'none';
        appTitle.textContent = 'IT Cell HelpDesk';
        appState = 'main';
        history.back();
    }
}

// Chat functionality
function sendChatMessage() {
    const message = chatInput.value.trim();
    if (message) {
        // Add user message
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user-message';
        userMessage.innerHTML = `<p>${message}</p>`;
        document.querySelector('.chat-content').appendChild(userMessage);
        
        // Clear input
        chatInput.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const botMessage = document.createElement('div');
            botMessage.className = 'chat-message bot-message';
            botMessage.innerHTML = `<p>Thank you for your message. Our support team will get back to you shortly.</p>`;
            document.querySelector('.chat-content').appendChild(botMessage);
            
            // Scroll to bottom
            const chatContent = document.querySelector('.chat-content');
            chatContent.scrollTop = chatContent.scrollHeight;
        }, 1000);
        
        // Scroll to bottom
        const chatContent = document.querySelector('.chat-content');
        chatContent.scrollTop = chatContent.scrollHeight;
    }
}

// Initialize the app when the page loads
window.addEventListener('load', function() {
    initApp();
});
