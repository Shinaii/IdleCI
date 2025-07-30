document.addEventListener('DOMContentLoaded', () => {
    // Navigation Elements (updated selectors for new design)
    const navItems = document.querySelectorAll('.nav-item');
    const contentPanels = document.querySelectorAll('.content-panel');

    // Cheat Tab Elements
    const cheatListDiv = document.getElementById('cheat-buttons');
    const loadingCheatsP = document.getElementById('loading-cheats');
    const filterInput = document.getElementById('filter-input');

    // Config Tab Elements (Revised)
    const configNavItems = document.querySelectorAll('.config-nav-item');
    const configPanes = document.querySelectorAll('.config-pane');
    const cheatConfigOptionsDiv = document.getElementById('cheatconfig-options');
    const cheatConfigCategorySelect = document.getElementById('cheatconfig-category-select'); // Added dropdown select
    const startupCheatsOptionsDiv = document.getElementById('startupcheats-options');
    const loadingCheatConfigP = document.getElementById('loading-cheatconfig'); // Specific loading indicators
    const loadingStartupCheatsP = document.getElementById('loading-startupcheats');

    // Removed: configCategorySelect, configOptionsDiv, topLevelOptionsDiv, categorizedOptionsDiv, loadingConfigP (using specific ones now)

    // DevTools Tab Elements
    const devtoolsIframe = document.getElementById('devtools-iframe');
    const devtoolsMessage = document.getElementById('devtools-message');

    // Terminal Tab Elements
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');
    const clearTerminalBtn = document.getElementById('clear-terminal');
    const helpTerminalBtn = document.getElementById('help-terminal');
    
    // Header Action Button Elements
    const themeToggleBtn = document.getElementById('theme-toggle');
    const refreshBtn = document.getElementById('refresh-btn');
    
    // Debug: Check if terminal elements are found
    console.log('Terminal elements found:', {
        terminalOutput: !!terminalOutput,
        terminalInput: !!terminalInput,
        clearTerminalBtn: !!clearTerminalBtn,
        helpTerminalBtn: !!helpTerminalBtn,
        themeToggleBtn: !!themeToggleBtn,
        refreshBtn: !!refreshBtn
    });

    // --- Terminal Functions (declare before event listeners) ---

    function addTerminalLine(text, type = 'info') {
        if (!terminalOutput) {
            console.error('Terminal output element not found!');
            return;
        }
        
        const line = document.createElement('div');
        line.className = `terminal-line terminal-${type}`;
        
        if (type === 'command') {
            line.textContent = `idleci> ${text}`;
        } else {
            line.textContent = text;
        }
        
        terminalOutput.appendChild(line);
        
        // Limit terminal history to prevent performance issues
        const maxLines = 1000;
        const lines = terminalOutput.children;
        if (lines.length > maxLines) {
            // Remove oldest lines
            const linesToRemove = lines.length - maxLines;
            for (let i = 0; i < linesToRemove; i++) {
                terminalOutput.removeChild(lines[0]);
            }
        }
        
        // Auto-scroll to bottom
        requestAnimationFrame(() => {
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
        });
    }

    function clearTerminal() {
        if (!terminalOutput) {
            console.error('Terminal output element not found!');
            return;
        }
        
        terminalOutput.innerHTML = '';
        
        // Re-add welcome message at the top after clearing
        addTerminalLine('Welcome to IdleCI Terminal', 'info');
        addTerminalLine('Type "help" for available commands', 'info');
        addTerminalLine('Use ↑/↓ arrows to navigate command history', 'info');
        addTerminalLine('─'.repeat(45), 'info');
        addTerminalLine('Terminal cleared', 'success');
        
        // Ensure scroll position is reset to top
        terminalOutput.scrollTop = 0;
    }

    async function executeTerminalCommand(command) {
        // Add command to output
        addTerminalLine(command, 'command');
        
        // Add to history
        if (command.trim() && terminalHistory[terminalHistory.length - 1] !== command) {
            terminalHistory.push(command);
        }
        terminalHistoryIndex = terminalHistory.length;

        try {
            // Log to backend terminal before execution
            console.log(`[WebUI Terminal] Executing command: ${command.trim()}`);
            
            const response = await fetch('/api/terminal/execute', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ command: command.trim() })
            });

            const result = await response.json();

            if (result.type === 'clear') {
                clearTerminal();
                console.log(`[WebUI Terminal] Terminal cleared`);
                return;
            }

            if (result.success) {
                addTerminalLine(result.output, result.type || 'success');
                console.log(`[WebUI Terminal] Command executed successfully: ${command.trim()}`);
            } else {
                addTerminalLine(result.output || result.error, 'error');
                console.log(`[WebUI Terminal] Command failed: ${command.trim()} - ${result.output || result.error}`);
            }
        } catch (error) {
            addTerminalLine(`Network error: ${error.message}`, 'error');
            console.error(`[WebUI Terminal] Network error for command "${command.trim()}": ${error.message}`);
        }
    }

    async function loadTerminalSuggestions() {
        try {
            // Load from both terminal autocomplete and regular cheats API
            const [terminalResponse, cheatsResponse] = await Promise.all([
                fetch('/api/terminal/autocomplete'),
                fetch('/api/cheats')
            ]);
            
            const terminalResult = await terminalResponse.json();
            const cheatsResult = await cheatsResponse.json();
            
            let suggestions = [];
            
            // Add built-in terminal commands
            if (terminalResult.success) {
                suggestions = [...terminalResult.suggestions];
            }
            
            // Add all available cheats
            if (cheatsResult && Array.isArray(cheatsResult)) {
                const cheatSuggestions = cheatsResult.map(cheat => ({
                    name: cheat.name,
                    description: cheat.description || `Execute ${cheat.name} cheat`
                }));
                suggestions = [...suggestions, ...cheatSuggestions];
            }
            
            // Remove duplicates based on name
            const uniqueSuggestions = suggestions.filter((suggestion, index, self) => 
                index === self.findIndex(s => s.name === suggestion.name)
            );
            
            terminalSuggestions = uniqueSuggestions;
            console.log(`[WebUI Terminal] Loaded ${terminalSuggestions.length} terminal suggestions for autocomplete`);
            
        } catch (error) {
            console.error('Failed to load terminal suggestions:', error);
        }
    }

    // Autocomplete variables
    let currentSuggestionIndex = -1;
    let currentSuggestions = [];
    let suggestionElement = null;

    // Create autocomplete suggestion element
    function createSuggestionElement() {
        if (suggestionElement) return suggestionElement;
        
        suggestionElement = document.createElement('div');
        suggestionElement.className = 'terminal-suggestions';
        suggestionElement.style.cssText = `
            position: absolute;
            bottom: 100%;
            left: 0;
            right: 0;
            background: #23263a;
            border: 1px solid var(--color-border);
            border-radius: 6px 6px 0 0;
            max-height: 300px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
            box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        terminalInput.parentElement.style.position = 'relative';
        terminalInput.parentElement.appendChild(suggestionElement);
        return suggestionElement;
    }

    // Show autocomplete suggestions
    function showSuggestions(input) {
        if (!terminalSuggestions.length) return;
        
        const filtered = terminalSuggestions.filter(suggestion => 
            suggestion.name.toLowerCase().includes(input.toLowerCase())
        ); // Show all matching suggestions
        
        if (filtered.length === 0) {
            hideSuggestions();
            return;
        }
        
        currentSuggestions = filtered;
        currentSuggestionIndex = -1;
        
        const suggestEl = createSuggestionElement();
        
        // Add header with count
        const headerHtml = `
            <div style="
                padding: 6px 12px;
                background: var(--color-primary);
                color: white;
                font-size: 12px;
                font-weight: bold;
                text-align: center;
                border-bottom: 1px solid var(--color-border);
            ">
                ${filtered.length} matching command${filtered.length !== 1 ? 's' : ''}
            </div>
        `;
        
        const itemsHtml = filtered.map((suggestion, index) => `
            <div class="terminal-suggestion-item" data-index="${index}" style="
                padding: 8px 12px;
                cursor: pointer;
                color: var(--color-text);
                border-bottom: 1px solid var(--color-border);
            ">
                <strong>${suggestion.name}</strong>
                ${suggestion.description ? `<br><small style="color: #888;">${suggestion.description}</small>` : ''}
            </div>
        `).join('');
        
        suggestEl.innerHTML = headerHtml + itemsHtml;
        
        // Add click handlers
        suggestEl.querySelectorAll('.terminal-suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                selectSuggestion(index);
            });
        });
        
        suggestEl.style.display = 'block';
    }

    // Hide autocomplete suggestions
    function hideSuggestions() {
        if (suggestionElement) {
            suggestionElement.style.display = 'none';
        }
        currentSuggestions = [];
        currentSuggestionIndex = -1;
    }

    // Select a suggestion
    function selectSuggestion(index) {
        if (index >= 0 && index < currentSuggestions.length) {
            terminalInput.value = currentSuggestions[index].name;
            hideSuggestions();
            terminalInput.focus();
        }
    }

    // Update suggestion selection
    function updateSuggestionSelection() {
        if (!suggestionElement || currentSuggestions.length === 0) return;
        
        const items = suggestionElement.querySelectorAll('.terminal-suggestion-item');
        items.forEach((item, index) => {
            if (index === currentSuggestionIndex) {
                item.style.background = 'var(--color-primary)';
                item.style.color = '#fff';
            } else {
                item.style.background = 'transparent';
                item.style.color = 'var(--color-text)';
            }
        });
    }

    // Setup terminal event listeners immediately after elements are found
    if (terminalInput) {
        // Input event for autocomplete
        terminalInput.addEventListener('input', (e) => {
            const value = e.target.value;
            if (value.length > 0) {
                showSuggestions(value);
            } else {
                hideSuggestions();
            }
        });

        // Keydown event for navigation and commands
        terminalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (currentSuggestionIndex >= 0) {
                    // Select current suggestion
                    selectSuggestion(currentSuggestionIndex);
                    return;
                }
                
                const command = terminalInput.value;
                if (command.trim()) {
                    executeTerminalCommand(command);
                    terminalInput.value = '';
                    hideSuggestions();
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (currentSuggestions.length > 0) {
                    currentSuggestionIndex = Math.max(0, currentSuggestionIndex - 1);
                    updateSuggestionSelection();
                } else if (terminalHistoryIndex > 0) {
                    terminalHistoryIndex--;
                    terminalInput.value = terminalHistory[terminalHistoryIndex];
                    hideSuggestions();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (currentSuggestions.length > 0) {
                    currentSuggestionIndex = Math.min(currentSuggestions.length - 1, currentSuggestionIndex + 1);
                    updateSuggestionSelection();
                } else if (terminalHistoryIndex < terminalHistory.length - 1) {
                    terminalHistoryIndex++;
                    terminalInput.value = terminalHistory[terminalHistoryIndex];
                } else {
                    terminalHistoryIndex = terminalHistory.length;
                    terminalInput.value = '';
                }
                hideSuggestions();
            } else if (e.key === 'Escape') {
                hideSuggestions();
            } else if (e.key === 'Tab') {
                e.preventDefault();
                if (currentSuggestionIndex >= 0) {
                    selectSuggestion(currentSuggestionIndex);
                } else if (currentSuggestions.length > 0) {
                    selectSuggestion(0);
                }
            }
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!terminalInput.contains(e.target) && !suggestionElement?.contains(e.target)) {
                hideSuggestions();
            }
        });

    } else {
        console.error('Terminal input element not found!');
    }

    if (clearTerminalBtn) {
        clearTerminalBtn.addEventListener('click', () => {
            clearTerminal();
        });
    }

    if (helpTerminalBtn) {
        helpTerminalBtn.addEventListener('click', () => {
            executeTerminalCommand('help');
        });
    }

    // --- Theme Toggle Functionality ---
    
    function initializeTheme() {
        // Check for saved theme preference or default to dark
        const savedTheme = localStorage.getItem('idleci-theme') || 'dark';
        applyTheme(savedTheme);
        updateThemeButton(savedTheme);
    }
    
    function applyTheme(theme) {
        const root = document.documentElement;
        
        if (theme === 'light') {
            // Light theme color overrides
            root.style.setProperty('--bg-primary', '#f8fafc');
            root.style.setProperty('--bg-secondary', '#f1f5f9');
            root.style.setProperty('--bg-tertiary', '#e2e8f0');
            root.style.setProperty('--bg-glass', 'rgba(248, 250, 252, 0.85)');
            
            root.style.setProperty('--text-primary', '#1e293b');
            root.style.setProperty('--text-secondary', '#475569');
            root.style.setProperty('--text-muted', '#64748b');
            
            root.style.setProperty('--border-primary', '#e2e8f0');
            root.style.setProperty('--border-accent', '#cbd5e1');
            
            document.body.classList.add('light-theme');
            document.body.classList.remove('dark-theme');
        } else {
            // Dark theme (default) - reset to original values
            root.style.setProperty('--bg-primary', '#0a0a0f');
            root.style.setProperty('--bg-secondary', '#12121a');
            root.style.setProperty('--bg-tertiary', '#1a1a24');
            root.style.setProperty('--bg-glass', 'rgba(18, 18, 26, 0.85)');
            
            root.style.setProperty('--text-primary', '#ffffff');
            root.style.setProperty('--text-secondary', '#b4b6c7');
            root.style.setProperty('--text-muted', '#7a7d93');
            
            root.style.setProperty('--border-primary', '#2a2a38');
            root.style.setProperty('--border-accent', '#3a3a48');
            
            document.body.classList.add('dark-theme');
            document.body.classList.remove('light-theme');
        }
        
        // Save theme preference
        localStorage.setItem('idleci-theme', theme);
    }
    
    function updateThemeButton(theme) {
        if (!themeToggleBtn) return;
        
        const icon = themeToggleBtn.querySelector('span');
        if (icon) {
            icon.textContent = theme === 'light' ? '🌙' : '☀️';
        }
        themeToggleBtn.title = theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode';
    }
    
    function toggleTheme() {
        const currentTheme = localStorage.getItem('idleci-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        applyTheme(newTheme);
        updateThemeButton(newTheme);
        
        showToast(
            '🎨 Theme Changed',
            `Switched to ${newTheme} mode`,
            'success',
            2000
        );
    }
    
    // --- Refresh Data Functionality ---
    
    async function refreshAllData() {
        if (!refreshBtn) return;
        
        // Visual feedback
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<span>🔄</span>';
        refreshBtn.style.animation = 'spin 1s linear infinite';
        refreshBtn.disabled = true;
        
        showToast(
            '🔄 Refreshing Data',
            'Reloading cheats and configuration...',
            'info',
            3000
        );
        
        try {
            // Refresh cheats data
            await loadAndRenderCheats();
            
            // Refresh config if on config tab
            const currentTab = document.querySelector('.nav-item.active')?.getAttribute('data-tab');
            if (currentTab === 'config-tab') {
                await loadAndRenderConfig();
            }
            
            // Update stats
            setTimeout(() => {
                if (typeof window.updateCheatStats === 'function') {
                    window.updateCheatStats();
                }
            }, 500);
            
            showToast(
                '✅ Refresh Complete',
                'All data has been updated',
                'success',
                2000
            );
            
        } catch (error) {
            console.error('Error refreshing data:', error);
            showToast(
                '❌ Refresh Failed',
                `Error: ${error.message}`,
                'error',
                5000
            );
        } finally {
            // Restore button
            setTimeout(() => {
                refreshBtn.innerHTML = originalText;
                refreshBtn.style.animation = '';
                refreshBtn.disabled = false;
            }, 1000);
        }
    }
    
    // --- Initialize Theme and Button Handlers ---
    
    // Initialize theme on page load
    initializeTheme();
    
    // Add event listeners for header buttons
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', toggleTheme);
    }
    
    if (refreshBtn) {
        refreshBtn.addEventListener('click', refreshAllData);
    }

    // General Elements (status bar removed - using toast notifications now)

    // State Variables
    let allCheatButtons = [];
    let cheatsNeedingConfirmation = [];
    let devtoolsLoaded = false;
    let availableCheatsForSearch = []; // Store all cheats for config search
    let currentFullConfig = null; // Store the fetched config
    let configTabInitialized = false; // Flag to track if config tab has been loaded once
    let terminalHistory = []; // Store command history
    let terminalHistoryIndex = -1; // Current position in history
    let terminalSuggestions = []; // Store autocomplete suggestions

    // Toast Notification System
    function createToastContainer() {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function showToast(title, message, type = 'info', duration = 4000) {
        const container = createToastContainer();
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = getToastIcon(type);
        
        toast.innerHTML = `
            <div class="toast-icon">${icon}</div>
            <div class="toast-content">
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close">✕</button>
        `;
        
        container.appendChild(toast);
        
        // Auto remove after duration
        const autoRemove = setTimeout(() => {
            removeToast(toast);
        }, duration);
        
        // Manual close button
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            clearTimeout(autoRemove);
            removeToast(toast);
        });
        
        return toast;
    }
    
    function removeToast(toast) {
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }
    
    function getToastIcon(type) {
        switch(type) {
            case 'success': return '✅';
            case 'error': return '❌';
            case 'warning': return '⚠️';
            case 'info': return 'ℹ️';
            default: return '🔔';
        }
    }
    
    // Enhanced status function with toast notifications only
    function showStatus(message, isError = false) {
        // Extract action and result from message
        const parts = message.split(': ');
        const title = isError ? 'Cheat Failed' : 'Cheat Executed';
        const content = parts.length > 1 ? parts[1] : message;
        const type = isError ? 'error' : 'success';
        
        // Show toast notification (no more status bar messages)
        showToast(title, content, type);
    }

    // --- API Interaction Functions ---

    async function executeCheatAction(action) {
        try {
            const response = await fetch('/api/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: action }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || data.error || `HTTP error! status: ${response.status}`);
            
            // Enhanced notification with better formatting
            const actionName = action.split(' ')[0];
            const actionTarget = action.split(' ').slice(1).join(' ') || 'operation';
            showToast(
                '🎮 Cheat Executed',
                `${actionName} ${actionTarget} - ${data.result || 'Success'}`,
                'success',
                3000
            );
            console.log(`[Action] Executed '${action}':`, data);
        } catch (error) {
            console.error('Error executing action:', error);
            showToast(
                '❌ Execution Failed',
                `${action}: ${error.message}`,
                'error',
                5000
            );
        }
    }

    window.fetchConfig = async function() {
        // Return cached config if available
        if (currentFullConfig) return currentFullConfig;
        try {
            const response = await fetch('/api/config');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || `HTTP error! Status: ${response.status}`);
            }
            currentFullConfig = await response.json(); // Cache the config
            return currentFullConfig;
        } catch (error) {
            console.error('Error fetching config:', error);
            showStatus(`Error fetching configuration: ${error.message}`, true);
            currentFullConfig = null; // Reset cache on error
            return null;
        }
    };

    async function fetchAvailableCheats() {
        if (availableCheatsForSearch.length > 0) return availableCheatsForSearch;
        try {
            const response = await fetch('/api/cheats');
            if (!response.ok) throw new Error(`HTTP error fetching cheats! status: ${response.status}`);
            availableCheatsForSearch = await response.json();
            console.log('[Config] Fetched available cheats for search:', availableCheatsForSearch);
            return availableCheatsForSearch;
        } catch (error) {
            console.error('Error fetching available cheats:', error);
            showStatus(`Error fetching cheat list for search: ${error.message}`, true);
            return [];
        }
    }

    async function updateSessionConfig(updatedConfig) {
        try {
            const response = await fetch('/api/config/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConfig),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || data.error || `HTTP error! Status: ${response.status}`);
            showStatus(data.message || 'Configuration updated in session successfully.');
            console.log('[Config] Session Update successful:', data);
            currentFullConfig = updatedConfig; // Update cached config
        } catch (error) {
            console.error('Error updating session config:', error);
            showStatus(`Error updating session configuration: ${error.message}`, true);
        }
    }

    async function saveConfigFile(configToSave) {
        try {
            const response = await fetch('/api/config/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(configToSave),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.details || data.error || `HTTP error! Status: ${response.status}`);
            showStatus(data.message || 'Configuration saved to file successfully.');
            console.log('[Config] Save to file successful:', data);
            currentFullConfig = configToSave; // Update cached config
        } catch (error) {
            console.error('Error saving config file:', error);
            showStatus(`Error saving configuration file: ${error.message}`, true);
        }
    }

    async function fetchDevToolsUrl() {
        try {
            const response = await fetch('/api/devtools-url');
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || `HTTP error! Status: ${response.status}`);
            }
            const data = await response.json();
            if (data.url) return data.url;
            else throw new Error('No URL received from backend.');
        } catch (error) {
            console.error('Error fetching DevTools URL:', error);
            showStatus(`Error loading DevTools URL: ${error.message}`, true);
            return null;
        }
    }

    // --- UI Rendering Functions ---

    // --- Helper Functions for Cheat Display ---
    
    function parseCheatInfo(cheat) {
        const value = cheat.value.toLowerCase();
        const message = cheat.message;
        
        // Determine icon based on cheat action
        let icon = '⚙️'; // default
        if (value.includes('add') || value.includes('give')) icon = '➕';
        else if (value.includes('remove') || value.includes('take')) icon = '➖';
        else if (value.includes('set')) icon = '🎯';
        else if (value.includes('get') || value.includes('show')) icon = '📋';
        else if (value.includes('toggle')) icon = '🔄';
        else if (value.includes('reset') || value.includes('clear')) icon = '🔄';
        else if (value.includes('max') || value.includes('fill')) icon = '⬆️';
        else if (value.includes('unlock')) icon = '🔓';
        else if (value.includes('complete')) icon = '✅';
        else if (value.includes('kill') || value.includes('destroy')) icon = '💀';
        else if (value.includes('spawn') || value.includes('create')) icon = '✨';
        else if (value.includes('speed') || value.includes('fast')) icon = '⚡';
        else if (value.includes('money') || value.includes('coin')) icon = '💰';
        else if (value.includes('exp') || value.includes('xp')) icon = '⭐';
        else if (value.includes('item')) icon = '📦';
        else if (value.includes('skill')) icon = '🎯';
        else if (value.includes('quest')) icon = '📜';
        else if (value.includes('talent')) icon = '🌟';
        else if (value.includes('build') || value.includes('construct')) icon = '🏗️';
        else if (value.includes('worship')) icon = '⛪';
        else if (value.includes('arcade') || value.includes('game')) icon = '🎮';
        else if (value.includes('monster') || value.includes('mob')) icon = '👹';
        else if (value.includes('debug') || value.includes('test')) icon = '🐛';
        
        // Create a cleaner title from the message
        let title = message.replace(/^(Add|Remove|Set|Get|Toggle|Reset|Clear|Max|Unlock|Complete|Kill|Spawn|Create|Give|Take|Show)\s*/i, '');
        title = title.charAt(0).toUpperCase() + title.slice(1);
        
        // Generate description based on action type
        let description = '';
        if (value.includes('add') || value.includes('give')) {
            description = `Add or give ${extractTarget(value, message)}`;
        } else if (value.includes('remove') || value.includes('take')) {
            description = `Remove or take ${extractTarget(value, message)}`;
        } else if (value.includes('set')) {
            description = `Set ${extractTarget(value, message)} to specific value`;
        } else if (value.includes('get') || value.includes('show')) {
            description = `Display current ${extractTarget(value, message)}`;
        } else if (value.includes('toggle')) {
            description = `Toggle ${extractTarget(value, message)} on/off`;
        } else if (value.includes('reset') || value.includes('clear')) {
            description = `Reset ${extractTarget(value, message)} to default`;
        } else if (value.includes('max') || value.includes('fill')) {
            description = `Maximize ${extractTarget(value, message)}`;
        } else if (value.includes('unlock')) {
            description = `Unlock ${extractTarget(value, message)}`;
        } else if (value.includes('complete')) {
            description = `Complete ${extractTarget(value, message)}`;
        } else {
            description = `Execute ${message.toLowerCase()}`;
        }
        
        // Determine button style and text
        let buttonClass = '';
        let buttonText = 'Execute';
        
        if (value.includes('remove') || value.includes('clear') || value.includes('reset') || value.includes('kill')) {
            buttonClass = 'danger';
            buttonText = 'Execute';
        } else if (value.includes('add') || value.includes('give') || value.includes('unlock') || value.includes('complete')) {
            buttonClass = 'success';
            buttonText = 'Apply';
        } else if (value.includes('get') || value.includes('show') || value.includes('display')) {
            buttonClass = 'secondary';
            buttonText = 'Show';
        } else {
            buttonClass = '';
            buttonText = 'Execute';
        }
        
        // Generate tags based on cheat characteristics
        const tags = [];
        if (value.includes('dangerous') || value.includes('kill') || value.includes('destroy') || value.includes('reset')) {
            tags.push('dangerous');
        }
        if (value.includes('safe') || value.includes('get') || value.includes('show') || value.includes('display')) {
            tags.push('safe');
        }
        if (value.includes('money') || value.includes('coin') || value.includes('cash')) {
            tags.push('economy');
        }
        if (value.includes('exp') || value.includes('xp') || value.includes('level')) {
            tags.push('progression');
        }
        if (value.includes('item') || value.includes('gear') || value.includes('equipment')) {
            tags.push('items');
        }
        if (value.includes('skill') || value.includes('talent') || value.includes('ability')) {
            tags.push('skills');
        }
        if (value.includes('quest') || value.includes('mission') || value.includes('task')) {
            tags.push('quests');
        }
        if (value.includes('build') || value.includes('construct') || value.includes('craft')) {
            tags.push('building');
        }
        if (value.includes('debug') || value.includes('test') || value.includes('dev')) {
            tags.push('debug');
        }
        
        // Add "value required" tag if needed (will be checked later)
        // This will be handled in the main rendering function
        
        // Generate appropriate input placeholder
        let inputPlaceholder = 'Enter value...';
        if (value.includes('amount') || value.includes('quantity')) {
            inputPlaceholder = 'Enter amount...';
        } else if (value.includes('level')) {
            inputPlaceholder = 'Enter level...';
        } else if (value.includes('id') || value.includes('index')) {
            inputPlaceholder = 'Enter ID...';
        } else if (value.includes('name')) {
            inputPlaceholder = 'Enter name...';
        }
        
        return {
            title,
            description,
            icon,
            buttonClass,
            buttonText,
            tags,
            inputPlaceholder
        };
    }
    
    function extractTarget(value, message) {
        // Try to extract what the cheat is targeting
        if (value.includes('money') || value.includes('coin')) return 'currency';
        if (value.includes('exp') || value.includes('xp')) return 'experience';
        if (value.includes('item')) return 'items';
        if (value.includes('skill')) return 'skills';
        if (value.includes('talent')) return 'talents';
        if (value.includes('quest')) return 'quests';
        if (value.includes('level')) return 'level';
        if (value.includes('monster')) return 'monsters';
        if (value.includes('building')) return 'buildings';
        
        // Fallback to a cleaned version of the message
        return message.toLowerCase().replace(/^(add|remove|set|get|toggle|reset|clear|max|unlock|complete|kill|spawn|create|give|take|show)\s*/i, '');
    }
    
    function getTagClass(tagText) {
        switch(tagText) {
            case 'dangerous': return 'dangerous';
            case 'safe': return 'safe';
            case 'value-required': return 'value-required';
            default: return '';
        }
    }

    async function loadAndRenderCheats() {
        // ... (loadAndRenderCheats function remains unchanged) ...
        if (!cheatListDiv) return; // Don't run if the element isn't present
        cheatListDiv.innerHTML = ''; // Clear previous buttons
        if (loadingCheatsP) loadingCheatsP.style.display = 'block'; // Show loading message

        try {
            // Fetch both cheats and the list needing confirmation
            const [cheatsResponse, confirmationResponse] = await Promise.all([
                fetch('/api/cheats'),
                fetch('/api/needs-confirmation') // Still needed for input fields on cheat buttons
            ]);

            if (loadingCheatsP) loadingCheatsP.style.display = 'none'; // Hide loading message

            if (!cheatsResponse.ok) {
                throw new Error(`HTTP error fetching cheats! status: ${cheatsResponse.status}`);
            }
            if (!confirmationResponse.ok) {
                // Log error but don't necessarily block rendering
                console.error(`HTTP error fetching confirmation list! status: ${confirmationResponse.status}`);
                showStatus(`Warning: Could not load value requirement list. Input fields may not appear.`, true);
            }

            const cheats = await cheatsResponse.json(); // Expecting array of { message: "...", value: "..." }
            cheatsNeedingConfirmation = confirmationResponse.ok ? await confirmationResponse.json() : []; // Store the list

            cheatListDiv.innerHTML = ''; // Clear loading message

            if (!cheats || cheats.length === 0) {
                cheatListDiv.innerHTML = '<p>No cheats found or unable to load.</p>';
                return;
            }

            // --- Grouping Logic ---
            const groupedCheats = {}; // Start empty, don't assume 'General' exists
            const categoryHeaders = new Set();
            allCheatButtons = []; // Reset button list for filtering

            // Identify single-word commands as category headers
            cheats.forEach(cheat => {
                const cheatValue = typeof cheat === 'object' ? cheat.value : cheat;
                if (cheatValue && !cheatValue.includes(' ')) {
                    categoryHeaders.add(cheatValue);
                }
            });

            // Group cheats
            cheats.forEach(cheat => {
                const cheatValue = typeof cheat === 'object' ? cheat.value : cheat;
                const cheatName = typeof cheat === 'object' ? cheat.message : cheat; // Use message for display

                if (!cheatValue) return; // Skip if no value

                const parts = cheatValue.split(' ');
                let category = 'General';

                if (parts.length > 1 && categoryHeaders.has(parts[0])) {
                    category = parts[0];
                }

                if (!groupedCheats[category]) {
                    groupedCheats[category] = [];
                }
                // Store the full cheat object for rendering
                // Store the full cheat object for rendering
                // Also store the base command (first word) for confirmation check
                const baseCommand = cheatValue.split(' ')[0];
                groupedCheats[category].push({ message: cheatName, value: cheatValue, baseCommand: baseCommand });
            });


            // --- Rendering Logic ---
            const sortedCategories = Object.keys(groupedCheats).sort((a, b) => {
                if (a === 'General') return 1; // Put General last
                if (b === 'General') return -1;
                return a.localeCompare(b); // Sort others alphabetically
            });

            sortedCategories.forEach(category => {
                if (groupedCheats[category].length === 0) return; // Skip empty categories

                const details = document.createElement('details');
                details.className = 'cheat-category';
                // Optionally open General by default, or specific categories
                // if (category === 'General') {
                //     details.open = true;
                // }

                const summary = document.createElement('summary');
                // Capitalize first letter for display
                summary.textContent = category.charAt(0).toUpperCase() + category.slice(1);
                details.appendChild(summary);

                const categoryContent = document.createElement('div');
                categoryContent.className = 'cheat-category-content';

                groupedCheats[category].forEach(cheat => {
                    // Create main container
                    const container = document.createElement('div');
                    container.className = 'cheat-item-container';

                    // Parse cheat information
                    const cheatInfo = parseCheatInfo(cheat);

                    // Check if this cheat needs a value and add to tags
                    const needsValue = cheatsNeedingConfirmation.some(confirmCmd =>
                        cheat.value.startsWith(confirmCmd)
                    );
                    if (needsValue) {
                        cheatInfo.tags.push('value-required');
                    }
                    
                    // Create header section
                    const header = document.createElement('div');
                    header.className = 'cheat-header';
                    
                    const infoDiv = document.createElement('div');
                    infoDiv.className = 'cheat-info';
                    
                    const title = document.createElement('div');
                    title.className = 'cheat-title';
                    title.textContent = cheatInfo.title;
                    
                    const description = document.createElement('div');
                    description.className = 'cheat-description';
                    description.textContent = cheatInfo.description;
                    
                    const command = document.createElement('div');
                    command.className = 'cheat-command';
                    command.textContent = cheat.value;
                    
                    infoDiv.appendChild(title);
                    infoDiv.appendChild(description);
                    infoDiv.appendChild(command);
                    
                    const icon = document.createElement('div');
                    icon.className = 'cheat-icon';
                    icon.textContent = cheatInfo.icon;
                    
                    header.appendChild(infoDiv);
                    header.appendChild(icon);
                    
                    // Create controls section
                    const controls = document.createElement('div');
                    controls.className = 'cheat-controls';

                    // needsValue already determined above

                    let inputField = null;
                    if (needsValue) {
                        inputField = document.createElement('input');
                        inputField.type = 'text';
                        inputField.className = 'cheat-input';
                        inputField.id = `input-${cheat.value.replace(/\s+/g, '-')}`;
                        inputField.placeholder = cheatInfo.inputPlaceholder || 'Enter value...';
                        controls.appendChild(inputField);
                    }

                    // Create execute button
                    const button = document.createElement('button');
                    button.className = `cheat-button ${cheatInfo.buttonClass}`;
                    button.dataset.action = cheat.value;
                    button.textContent = cheatInfo.buttonText;

                    controls.appendChild(button);

                    // Create tags section
                    const tags = document.createElement('div');
                    tags.className = 'cheat-tags';
                    
                    cheatInfo.tags.forEach(tagText => {
                        const tag = document.createElement('span');
                        tag.className = `cheat-tag ${getTagClass(tagText)}`;
                        tag.textContent = tagText;
                        tags.appendChild(tag);
                    });

                    // Add click handler
                    button.addEventListener('click', () => {
                        button.classList.add('executing');
                        container.classList.add('recently-used');
                        
                        let actionToSend = cheat.value;
                        if (needsValue && inputField) {
                            const inputValue = inputField.value.trim();
                            if (inputValue) {
                                actionToSend = `${cheat.value} ${inputValue}`;
                            } else {
                                showToast(
                                    '⚠️ Value Required',
                                    `Please enter a value for ${cheatInfo.title}`,
                                    'warning',
                                    3000
                                );
                                button.classList.remove('executing');
                                return;
                            }
                        }
                        
                        executeCheatAction(actionToSend);
                        
                        // Remove executing state after a delay
                        setTimeout(() => {
                            button.classList.remove('executing');
                        }, 1500);
                        
                        // Remove recently-used highlight after longer delay
                        setTimeout(() => {
                            container.classList.remove('recently-used');
                        }, 3000);
                    });

                    // Assemble the card
                    container.appendChild(header);
                    container.appendChild(controls);
                    container.appendChild(tags);
                    categoryContent.appendChild(container);
                });

                details.appendChild(categoryContent);
                cheatListDiv.appendChild(details); // Append to the button container
                // Store buttons for filtering
                categoryContent.querySelectorAll('.cheat-item-container').forEach(item => allCheatButtons.push(item));
            });

            // Update stats after cheats are rendered (only once)
            setTimeout(() => {
                if (typeof window.updateCheatStats === 'function') {
                    window.updateCheatStats();
                    console.log('[Cheats] Stats updated after initial rendering');
                }
            }, 500); // Increased delay to ensure DOM is settled

            // Add filter listener after buttons are created
            if (filterInput && cheatListDiv) { // Ensure cheatListDiv is available
                filterInput.addEventListener('input', (e) => {
                    const filterText = e.target.value.toLowerCase();
                    let visibleCategories = new Set(); // Keep track of categories with visible items

                    // Filter individual cheat items
                    allCheatButtons.forEach(itemContainer => {
                        const button = itemContainer.querySelector('.cheat-button');
                        const buttonText = button.textContent.toLowerCase();
                        const categoryDetails = itemContainer.closest('.cheat-category'); // Find parent category

                        if (buttonText.includes(filterText)) {
                            itemContainer.style.display = ''; // Show item
                            if (categoryDetails) {
                                visibleCategories.add(categoryDetails); // Mark category as having visible items
                            }
                        } else {
                            itemContainer.style.display = 'none'; // Hide item
                        }
                    });

                    // Show/Hide entire category groups based on visible items
                    const allCategories = cheatListDiv.querySelectorAll('.cheat-category');
                    allCategories.forEach(categoryDetails => {
                        if (visibleCategories.has(categoryDetails)) {
                            categoryDetails.style.display = ''; // Show category group
                        } else {
                            categoryDetails.style.display = 'none'; // Hide category group
                        }
                    });
                });
            }

        } catch (error) {
            console.error('Error loading or processing cheats:', error);
            if (cheatListDiv) {
                cheatListDiv.innerHTML = `<p class="status-error">Error loading cheats: ${error.message}</p>`;
            } else if (loadingCheatsP) {
                loadingCheatsP.textContent = `Error loading cheats: ${error.message}`;
                loadingCheatsP.className = 'status-error';
            }
        }
    }


    // REVISED: Function to load and render the configuration options into sub-tabs
    async function loadAndRenderConfig() {
        // Only run if the necessary elements exist and the tab hasn't been initialized
        if (!cheatConfigOptionsDiv || !startupCheatsOptionsDiv || !loadingCheatConfigP || !loadingStartupCheatsP || configTabInitialized) {
            // If elements are missing, log an error. If already initialized, just return.
            if (!cheatConfigOptionsDiv || !startupCheatsOptionsDiv) console.error("Config sub-tab elements missing!");
            return;
        }

        console.log("[Config] Initializing Config Tab Content...");
        loadingCheatConfigP.style.display = 'block';
        loadingStartupCheatsP.style.display = 'block';
        cheatConfigOptionsDiv.innerHTML = '';
        startupCheatsOptionsDiv.innerHTML = '';

        const config = await fetchConfig(); // Use cached or fetch anew

        loadingCheatConfigP.style.display = 'none';
        loadingStartupCheatsP.style.display = 'none';

        if (!config) {
            cheatConfigOptionsDiv.innerHTML = '<p class="status-error">Failed to load configuration.</p>';
            startupCheatsOptionsDiv.innerHTML = '<p class="status-error">Failed to load configuration.</p>';
            return;
        }

        // --- Render CheatConfig ---
        if (config.cheatConfig && typeof config.cheatConfig === 'object') {
            // Populate category dropdown
            if (cheatConfigCategorySelect) {
                // Clear existing options except "All"
                while (cheatConfigCategorySelect.options.length > 1) {
                    cheatConfigCategorySelect.remove(1);
                }
                // Add categories from config
                Object.keys(config.cheatConfig).sort().forEach(categoryKey => {
                    const option = document.createElement('option');
                    option.value = categoryKey;
                    option.textContent = categoryKey;
                    cheatConfigCategorySelect.appendChild(option);
                });

                // Add event listener for filtering
                cheatConfigCategorySelect.removeEventListener('change', handleCheatConfigCategoryChange); // Remove previous listener if any
                cheatConfigCategorySelect.addEventListener('change', handleCheatConfigCategoryChange);
            }

            // Initial render (show all)
            renderCategorizedOptions(config.cheatConfig, 'cheatConfig', cheatConfigOptionsDiv);
        } else {
            cheatConfigOptionsDiv.innerHTML = '<p>No CheatConfig found or it is not an object.</p>';
            console.warn("[Config] 'cheatconfig' key missing or not an object in fetched config:", config);
        }

        // --- Render StartupCheats ---
        if (config.startupCheats && Array.isArray(config.startupCheats)) {
            // Use renderSingleOption specifically for the startupCheats array structure
            renderSingleOption('startupCheats', config.startupCheats, '', startupCheatsOptionsDiv);
        } else {
            startupCheatsOptionsDiv.innerHTML = '<p>No Startup Cheats found or it is not an array.</p>';
            console.warn("[Config] 'startupCheats' key missing or not an array in fetched config:", config);
            // Optionally render an empty editor if the key exists but is wrong type/null
            // renderSingleOption('startupCheats', [], '', startupCheatsOptionsDiv);
        }

        configTabInitialized = true; // Mark as initialized
        console.log("[Config] Config Tab Content Initialized.");
        


    } // End of loadAndRenderConfig

    // Event handler for cheat config category dropdown change
    async function handleCheatConfigCategoryChange(event) {
        const selectedCategory = event.target.value;
        console.log(`[Config] Category selected: ${selectedCategory}`);
        const config = await fetchConfig(); // Ensure we have the latest config structure

        if (!config || !config.cheatConfig) {
            cheatConfigOptionsDiv.innerHTML = '<p class="status-error">Error loading config for filtering.</p>';
            return;
        }

        cheatConfigOptionsDiv.innerHTML = ''; // Clear current options

        if (selectedCategory === 'all') {
            // Render all categories
            renderCategorizedOptions(config.cheatConfig, 'cheatConfig', cheatConfigOptionsDiv);
        } else if (config.cheatConfig[selectedCategory]) {
            // Render only the selected category's items directly
            // We pass the sub-object and the full parent key path
            const categoryObj = { [selectedCategory]: config.cheatConfig[selectedCategory] }; // Wrap it to keep structure
            renderCategorizedOptions(categoryObj, 'cheatConfig', cheatConfigOptionsDiv);
        } else {
            cheatConfigOptionsDiv.innerHTML = `<p>Category "${selectedCategory}" not found in config.</p>`;
        }
    }


    // Renders all options within a selected category object (now used for cheatconfig)
    function renderCategorizedOptions(categoryObj, parentKey, container) {
        // DO NOT clear container here if called from event handler, clear it there.
        // container.innerHTML = ''; // Clear container first - Moved clearing logic to caller

        // If the container is being rendered initially (not via dropdown change), clear it.
        // This check is a bit implicit, maybe improve later. For now, assume if parentKey is 'cheatConfig' and container is cheatConfigOptionsDiv, it's the main call.
        if (parentKey === 'cheatConfig' && container === cheatConfigOptionsDiv && cheatConfigCategorySelect && cheatConfigCategorySelect.value === 'all') {
            container.innerHTML = '';
        }


        for (const key in categoryObj) {
            if (!Object.hasOwnProperty.call(categoryObj, key)) continue;
            renderSingleOption(key, categoryObj[key], parentKey, container);
        }
    }


    // Renders a single configuration item (key-value pair) - Now also handles startupCheats rendering
    function renderSingleOption(key, value, parentKey = '', container) {
        const fullKey = parentKey ? `${parentKey}.${key}` : key;

        // Ensure container exists before proceeding
        if (!container) {
            console.error(`[Render] Attempted to render option "${fullKey}" but container is invalid.`);
            return;
        }

        const itemDiv = document.createElement('div');
        itemDiv.className = 'config-item';
        itemDiv.dataset.configKey = fullKey;

        // Collapsible logic
        const header = document.createElement('div');
        header.className = 'config-item-header';
        
        const label = document.createElement('span');
        label.textContent = key;
        
        const chevron = document.createElement('span');
        chevron.className = 'config-chevron';
        chevron.textContent = '▶';
        
        header.appendChild(label);
        header.appendChild(chevron);
        header.style.cursor = 'pointer';
        header.tabIndex = 0;
        itemDiv.appendChild(header);

        // Content container (collapsible)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'config-item-content';

        // --- Special Handling for startupCheats ---
        if (fullKey === 'startupCheats' && Array.isArray(value)) {
            // Hide content for modal-based editing
            contentDiv.style.display = 'none';
        } else if (typeof value === 'object' && value !== null) {
            // Hide content for modal-based editing  
            contentDiv.style.display = 'none';
        } else {
            // Hide content for modal-based editing
            contentDiv.style.display = 'none';
        }

        // Keep the old startup cheats handling for reference but don't use it
        if (false && fullKey === 'startupCheats' && Array.isArray(value)) {
            const cheatsContainer = document.createElement('div');
            cheatsContainer.className = 'startup-cheats-editor';
            cheatsContainer.id = `config-${fullKey}-editor`;
            cheatsContainer.dataset.key = fullKey; // Store key for gathering data

            const listElement = document.createElement('ul');
            listElement.className = 'startup-cheats-list';
            cheatsContainer.appendChild(listElement);

            // Function to render a single cheat item
            function renderCheatItem(cheatCommand, index) {
                const listItem = document.createElement('li');
                listItem.dataset.index = index;

                const inputField = document.createElement('input');
                inputField.type = 'text';
                inputField.value = cheatCommand;
                inputField.className = 'startup-cheat-input';
                // No specific change listener needed here, gather on save/update
                listItem.appendChild(inputField);

                const removeButton = document.createElement('button');
                removeButton.textContent = '';
                removeButton.className = 'remove-cheat-button';
                removeButton.type = 'button';
                removeButton.setAttribute('aria-label', 'Remove cheat');
                removeButton.innerHTML = '';
                // Icon will be added by CSS ::before
                removeButton.addEventListener('click', () => listItem.remove());
                listItem.appendChild(removeButton);

                return listItem;
            }

            // Render existing cheats
            value.forEach((cheat, index) => {
                listElement.appendChild(renderCheatItem(cheat, index));
            });

            // Add Cheat Button and Search Area
            const addArea = document.createElement('div');
            addArea.className = 'add-cheat-area';
            const addButton = document.createElement('button');
            addButton.textContent = '';
            addButton.className = 'add-cheat-button';
            addButton.type = 'button';
            addButton.setAttribute('aria-label', 'Add cheat');
            addButton.innerHTML = '';
            // Icon will be added by CSS ::before
            const searchInput = document.createElement('input');
            searchInput.type = 'text';
            searchInput.placeholder = 'Search cheats...';
            searchInput.className = 'cheat-search-input';
            searchInput.style.display = 'none';
            const searchResults = document.createElement('ul');
            searchResults.className = 'cheat-search-results';
            searchResults.style.display = 'none';
            const cancelButton = document.createElement('button');
            cancelButton.textContent = '';
            cancelButton.className = 'cancel-add-cheat-button';
            cancelButton.type = 'button';
            cancelButton.setAttribute('aria-label', 'Cancel add cheat');
            cancelButton.innerHTML = '';
            // Icon will be added by CSS ::before

            addArea.appendChild(addButton);
            addArea.appendChild(searchInput);
            addArea.appendChild(cancelButton);

            addButton.addEventListener('click', async () => {
                addButton.style.display = 'none';
                searchInput.style.display = 'inline-block';
                cancelButton.style.display = 'inline-block';
                searchInput.value = '';
                searchResults.innerHTML = '';
                searchResults.style.display = 'none';
                searchInput.focus();
                await fetchAvailableCheats(); // Ensure list is loaded
            });

            cancelButton.addEventListener('click', () => {
                searchInput.value = '';
                searchResults.style.display = 'none';
            });

            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                searchResults.innerHTML = '';
                if (searchTerm.length < 2) {
                    searchResults.style.display = 'none';
                    return;
                }
                const matches = availableCheatsForSearch.filter(cheat =>
                    cheat.message.toLowerCase().includes(searchTerm) ||
                    cheat.value.toLowerCase().includes(searchTerm)
                ).slice(0, 10);

                if (matches.length > 0) {
                    matches.forEach(cheat => {
                        const li = document.createElement('li');
                        li.textContent = `${cheat.message} (${cheat.value})`;
                        li.dataset.cheatValue = cheat.value;
                        li.addEventListener('click', () => {
                            const newIndex = listElement.children.length;
                            listElement.appendChild(renderCheatItem(cheat.value, newIndex));
                            window.markConfigChanged('startupCheats', cheats);
                            // Reset add area
                            searchInput.value = '';
                            searchResults.innerHTML = '';
                            searchResults.style.display = 'none';
                        });
                        searchResults.appendChild(li);
                    });
                    searchResults.style.display = 'block';
                } else {
                    searchResults.style.display = 'none';
                }
            });


            contentDiv.appendChild(cheatsContainer); // Append the editor container

        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Render nested object (within cheatconfig)
            const nestedContainer = document.createElement('div');
            nestedContainer.className = 'config-nested';
            nestedContainer.id = `config-${fullKey}-nested`;
            // Call renderCategorizedOptions for nested objects - this should only happen within cheatconfig pane
            renderCategorizedOptions(value, fullKey, nestedContainer);
            contentDiv.appendChild(nestedContainer);
        } else {
            // Render standard input field (boolean, number, string, other non-handled types) - for cheatconfig items
            let input;
            if (typeof value === 'boolean') {
                input = document.createElement('input');
                input.type = 'checkbox';
                input.checked = value;
            } else if (typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number';
                input.value = value;
            } else if (typeof value === 'string') {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value;
            } else {
                input = document.createElement('textarea');
                input.value = JSON.stringify(value, null, 2);
                input.rows = 3;
                input.disabled = true; // Disable editing for unknown types
            }
            input.id = `config-${fullKey}`;
            input.dataset.key = fullKey; // Store the full key path for gathering
            contentDiv.appendChild(input);
        }
        itemDiv.appendChild(contentDiv);

        // Modal-based editing - convert cards to buttons
        header.addEventListener('click', () => {
            openConfigModal(key, fullKey, value, parentKey);
        });

        container.appendChild(itemDiv);
    }


    // Function to load the DevTools iframe URL
    async function loadDevTools() {
        // ... (loadDevTools function remains unchanged) ...
        if (devtoolsLoaded || !devtoolsIframe || !devtoolsMessage) return; // Don't reload or run if elements missing

        devtoolsIframe.src = ''; // Clear previous src
        devtoolsMessage.textContent = 'Loading DevTools URL...';
        devtoolsMessage.style.color = ''; // Reset color

        const url = await fetchDevToolsUrl();

        if (url) {
            devtoolsIframe.src = url;
            devtoolsLoaded = true;
            devtoolsMessage.textContent = 'Note: Only use this if you really know what you are doing!';
            console.log('[DevTools] Set iframe src:', url);
        } else {
            // Error handled within fetchDevToolsUrl, message shown via showStatus
            devtoolsMessage.textContent = 'Failed to load DevTools URL.';
            devtoolsMessage.style.color = 'red';
        }
    }


    // REVISED: Helper function to gather config data from the UI
    async function gatherConfigFromUI() {
        const latestConfig = await fetchConfig(); // Get the latest structure
        if (!latestConfig) {
            showStatus('Error: Could not fetch current config to gather data.', true);
            return null;
        }

        // IMPORTANT: Create a deep copy to modify
        // Ensure latestConfig is an object before stringifying
        if (typeof latestConfig !== 'object' || latestConfig === null) {
            console.error('[Config] Cannot gather UI data: Invalid latestConfig structure.', latestConfig);
            showStatus('Error: Could not gather config data due to invalid base config.', true);
            return null;
        }
        const updatedFullConfig = JSON.parse(JSON.stringify(latestConfig));

        // Helper to set nested values
        function setNestedValue(obj, pathArray, value) {
            if (!obj || typeof obj !== 'object') {
                console.error(`[SetNested] Invalid base object provided for path: ${pathArray.join('.')}`);
                return; // Cannot set value on non-object
            }
            let current = obj;
            for (let i = 0; i < pathArray.length - 1; i++) {
                const key = pathArray[i];
                if (!current[key] || typeof current[key] !== 'object') {
                    console.warn(`Path ${pathArray.slice(0, i + 1).join('.')} does not exist or is not an object. Cannot set value for ${pathArray.join('.')}`);
                    return; // Stop if path doesn't exist
                }
                current = current[key];
            }
            if (current && typeof current === 'object') {
                current[pathArray[pathArray.length - 1]] = value;
            } else {
                console.error(`Cannot set value for ${pathArray.join('.')}: parent path does not exist or is not an object.`);
            }
        }

        // --- Gather Startup Cheats ---
        if (startupCheatsOptionsDiv && updatedFullConfig.hasOwnProperty('startupCheats')) {
            const cheatEditor = startupCheatsOptionsDiv.querySelector('.startup-cheats-editor'); // Should be only one
            if (cheatEditor) {
                const cheatInputs = cheatEditor.querySelectorAll('.startup-cheats-list .startup-cheat-input');
                const newStartupCheats = [];
                cheatInputs.forEach(input => {
                    if (input.value.trim()) {
                        newStartupCheats.push(input.value.trim());
                    }
                });
                updatedFullConfig.startupCheats = newStartupCheats; // Update the array
            } else {
                console.warn('[Config Gather] Startup cheats editor not found in its pane.');
                // Decide if we should default to empty array or keep original
                // updatedFullConfig.startupCheats = []; // Uncomment to default to empty if editor missing
            }
        } else {
            console.warn('[Config Gather] Startup cheats pane or startupCheats key missing in config.');
        }


        // --- Gather CheatConfig Options ---
        if (cheatConfigOptionsDiv && updatedFullConfig.hasOwnProperty('cheatConfig')) { // Use camelCase
            // Ensure cheatConfig is an object before proceeding
            if (typeof updatedFullConfig.cheatConfig !== 'object' || updatedFullConfig.cheatConfig === null) { // Use camelCase
                console.error('[Config Gather] cheatConfig is not an object in the base config. Cannot gather data.'); // Use camelCase
                updatedFullConfig.cheatConfig = {}; // Or handle as appropriate // Use camelCase
            } else {
                const configInputs = cheatConfigOptionsDiv.querySelectorAll('input[data-key], textarea[data-key]');
                configInputs.forEach(input => {
                    const fullKeyPath = input.dataset.key.split('.');
                    // Expecting keys like "cheatConfig.someKey.nestedKey" // Use camelCase
                    if (fullKeyPath.length < 2 || fullKeyPath[0] !== 'cheatConfig') { // Use camelCase
                        console.warn(`[Config Gather] Skipping input with unexpected key format: ${input.dataset.key}`);
                        return;
                    }
                    const relativeKeyPath = fullKeyPath.slice(1); // Path relative to cheatConfig // Use camelCase

                    let value;
                    if (input.type === 'checkbox') value = input.checked;
                    else if (input.type === 'number') value = parseFloat(input.value) || input.value; // Keep original if parse fails
                    else if (input.tagName === 'TEXTAREA') {
                        try { value = JSON.parse(input.value); } catch { value = input.value; } // Attempt parse for JSON textareas
                    }
                    else value = input.value; // Default is string

                    // Set the value within the cheatConfig object of the copied config // Use camelCase
                    setNestedValue(updatedFullConfig.cheatConfig, relativeKeyPath, value); // Use camelCase
                });
            }
        } else {
            console.warn('[Config Gather] Cheat config pane or cheatConfig key missing in config.'); // Use camelCase
        }


        console.log('[Config] Gathered data from UI:', updatedFullConfig);
        return updatedFullConfig;
    }


    // --- Event Listeners ---

    // Navigation switching logic is handled at the top of the file now
    
    // Add navigation functionality for tab switching AND content loading
    navItems.forEach(navItem => {
        navItem.addEventListener('click', () => {
            const targetTabId = navItem.getAttribute('data-tab');
            
            // FIRST: Handle the actual tab switching
            // Remove active class from all nav items and panels
            navItems.forEach(n => n.classList.remove('active'));
            contentPanels.forEach(p => p.classList.remove('active'));

            // Add active class to clicked nav item and corresponding panel
            navItem.classList.add('active');
            const targetPanel = document.getElementById(targetTabId);
            if (targetPanel) {
                targetPanel.classList.add('active');
                updatePageTitle(targetTabId);
            }

            console.log(`Switched to panel: ${targetTabId}`);
            
            // Update cheat stats when switching to cheats tab
            if (targetTabId === 'cheats-tab') {
                setTimeout(() => {
                    if (typeof window.updateCheatStats === 'function') {
                        window.updateCheatStats();
                    }
                }, 100);
            }
            
            // SECOND: Handle content loading for specific tabs
                if (targetTabId === 'config-tab' && !configTabInitialized) {
                    loadAndRenderConfig(); // Load config content on first view
                } else if (targetTabId === 'devtools-tab' && !devtoolsLoaded) {
                    loadDevTools(); // Load devtools on first view
            } else if (targetTabId === 'terminal-tab') {
                // Initialize terminal when tab is first opened
                const currentTerminalOutput = document.getElementById('terminal-output');
                
                // Initialize terminal with fresh welcome message
                if (currentTerminalOutput) {
                    console.log('[WebUI Terminal] Initializing terminal interface');
                    
                    // Clear any existing content and start fresh
                    currentTerminalOutput.innerHTML = '';
                    
                    // Add welcome message at the top
                    addTerminalLine('Welcome to IdleCI Terminal', 'info');
                    addTerminalLine('Type "help" for available commands', 'info');
                    addTerminalLine('Use ↑/↓ arrows to navigate command history', 'info');
                    addTerminalLine('─'.repeat(45), 'info');
                    
                    loadTerminalSuggestions();
                }
            }
        });
    });

    // --- Page Title Update Function ---
    function updatePageTitle(tabId) {
        const pageTitle = document.getElementById('page-title');
        const pageSubtitle = document.getElementById('page-subtitle');
        
        const titles = {
            'cheats-tab': {
                title: 'Cheat Management',
                subtitle: 'Execute and manage game modifications'
            },
            'config-tab': {
                title: 'Configuration',
                subtitle: 'Customize cheat settings and startup behavior'
            },
            'terminal-tab': {
                title: 'Terminal Interface',
                subtitle: 'Advanced command-line cheat execution'
            },
            'devtools-tab': {
                title: 'Developer Tools',
                subtitle: 'Debug and inspect game internals'
            }
        };
        
        if (titles[tabId]) {
            pageTitle.textContent = titles[tabId].title;
            pageSubtitle.textContent = titles[tabId].subtitle;
        }
    }

    // Config navigation switching logic
    configNavItems.forEach(navItem => {
        navItem.addEventListener('click', () => {
            // Remove active class from all config nav items and panes
            configNavItems.forEach(n => n.classList.remove('active'));
            configPanes.forEach(p => p.classList.remove('active'));

            // Add active class to clicked nav item and corresponding pane
            navItem.classList.add('active');
            const targetSubTab = navItem.getAttribute('data-sub-tab');
            const targetPane = document.getElementById(targetSubTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            console.log(`Switched to config pane: ${targetSubTab}`);
        });
    });




    // Update cheat stats function (define globally)
    window.updateCheatStats = function() {
        const totalCheatsElement = document.getElementById('total-cheats');
        
        if (totalCheatsElement) {
            // Only count if cheats are actually loaded (check if cheat grid has content)
            const cheatGrid = document.getElementById('cheat-buttons');
            if (!cheatGrid || cheatGrid.querySelector('.loading-state')) {
                // Still loading, show 0
                totalCheatsElement.textContent = '0';
                return;
            }
            
            // Count cards in each category properly
            let totalCount = 0;
            const categories = cheatGrid.querySelectorAll('.cheat-category');
            
            categories.forEach(category => {
                const cardsInCategory = category.querySelectorAll('.cheat-item-container');
                totalCount += cardsInCategory.length;
                
                // Debug log for each category
                const categoryName = category.querySelector('summary')?.textContent || 'Unknown';
                console.log(`[Stats] ${categoryName}: ${cardsInCategory.length} cheats`);
            });
            
            totalCheatsElement.textContent = totalCount;
            console.log(`[Stats] Total cheats across all categories: ${totalCount}`);
        }
    };

    // --- Initial Load ---
    loadAndRenderCheats(); // Load cheats immediately (default tab)
    // Config tab content will load when the tab is clicked.
    
    // Terminal initialization is now handled in the navigation click events above

    // Load version dynamically
    loadVersion();
    


    // ===== CONFIG SAVE FUNCTIONALITY (GLOBAL SCOPE) =====
    
    window.configChanges = {};
    window.hasUnsavedChanges = false;

    // ===== GLOBAL CONFIG FUNCTIONS =====
    
    window.markConfigChanged = function(key, value) {
        window.configChanges[key] = value;
        window.hasUnsavedChanges = true;
        console.log(`[Config] Changed: ${key} =`, value);
    };
    
         window.getInputType = function(value) {
         if (typeof value === 'boolean') return 'boolean';
         if (typeof value === 'number') return 'number';
         if (typeof value === 'string' && value.length > 50) return 'textarea';
         if (Array.isArray(value) || (typeof value === 'object' && value !== null)) return 'object';
         return 'text';
     };
     
     window.formatConfigValue = function(value) {
         if (typeof value === 'object' && value !== null) {
             if (Array.isArray(value)) {
                 return JSON.stringify(value, null, 2);
             }
             return JSON.stringify(value, null, 2);
         }
         return value;
     };
    
    window.setNestedValue = function(obj, pathArray, value) {
        let current = obj;
        for (let i = 0; i < pathArray.length - 1; i++) {
            const key = pathArray[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        current[pathArray[pathArray.length - 1]] = value;
    };

    window.autoSaveConfigChanges = async function() {
        if (!window.hasUnsavedChanges || Object.keys(window.configChanges).length === 0) {
            return;
        }
        
        try {
            const latestConfig = await window.fetchConfig();
            if (!latestConfig) {
                showToast('❌ Error', 'Could not fetch current config', 'error', 3000);
                return;
            }
            
            const updatedConfig = JSON.parse(JSON.stringify(latestConfig));
            
            // Apply all pending changes
            console.log('[Config] All pending changes:', window.configChanges);
            console.log('[Config] Original config structure:', JSON.stringify(updatedConfig, null, 2));
            
            Object.entries(window.configChanges).forEach(([key, value]) => {
                console.log(`[Config] Applying change: ${key} =`, value);
                const pathArray = key.split('.');
                console.log(`[Config] Path array:`, pathArray);
                window.setNestedValue(updatedConfig, pathArray, value);
                
                // Verify the change was applied
                const verifyValue = window.getCurrentConfigValue(updatedConfig, key);
                console.log(`[Config] Verification - ${key} is now:`, verifyValue);
            });
            
            console.log('[Config] Final config being sent:', JSON.stringify(updatedConfig, null, 2));
            
            // Apply to current session first (immediate effect)
            const sessionResponse = await fetch('/api/config/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConfig)
            });
            
            const sessionData = await sessionResponse.json();
            if (!sessionResponse.ok) throw new Error(sessionData.details || sessionData.error || `HTTP error! Status: ${sessionResponse.status}`);
            
            // Then save to file for persistence
            const saveResponse = await fetch('/api/config/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedConfig)
            });
            
            const saveData = await saveResponse.json();
            if (!saveResponse.ok) throw new Error(saveData.details || saveData.error || `HTTP error! Status: ${saveResponse.status}`);
            
            showToast('✅ Auto-saved', 'Configuration applied to session and saved to file', 'success', 2500);
            console.log('[Config] Auto-save successful - Session:', sessionData, 'File:', saveData);
            window.configChanges = {};
            window.hasUnsavedChanges = false;
            
            // Update cached config like the existing code does
            currentFullConfig = updatedConfig;
            
                         // Force refresh the config display to show updated values
             setTimeout(() => {
                 if (typeof loadAndRenderConfig === 'function') {
                     // Clear cached config to force fresh fetch
                     currentFullConfig = null;
                     console.log('[Config] Refreshing config display after auto-save');
                     loadAndRenderConfig();
                 }
             }, 300);
        } catch (error) {
            console.error('[Config] Auto-save error:', error);
            showToast('❌ Error', 'Failed to auto-save configuration', 'error', 3000);
        }
    };

    window.getCurrentConfigValue = function(config, path) {
        if (!config || !path) return null;
        
        const pathArray = path.split('.');
        let current = config;
        
        for (const key of pathArray) {
            if (current && typeof current === 'object' && current[key] !== undefined) {
                current = current[key];
            } else {
                return null;
            }
        }
        
        return current;
    };

    window.clearConfigCache = function() {
        currentFullConfig = null;
        console.log('[Config] Cache cleared - next fetch will be fresh');
    };
});

// Function to load version from API
async function loadVersion() {
    try {
        const response = await fetch('/api/version');
        if (response.ok) {
            const data = await response.json();
            const versionBadge = document.getElementById('version-badge');
            if (versionBadge) {
                versionBadge.textContent = `v${data.version}`;
            }
        } else {
            console.error('Failed to load version:', response.status);
            const versionBadge = document.getElementById('version-badge');
            if (versionBadge) {
                versionBadge.textContent = 'v?';
            }
        }
    } catch (error) {
        console.error('Error loading version:', error);
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) {
            versionBadge.textContent = 'v?';
        }
    }
}

    // ===== CONFIG MODAL FUNCTIONALITY =====
    
    let currentConfigModal = null;
    
    function createConfigModal() {
        const modal = document.createElement('div');
        modal.className = 'config-modal';
        modal.innerHTML = `
            <div class="config-modal-content">
                <div class="config-modal-header">
                    <h3 class="config-modal-title">Edit Configuration</h3>
                    <button class="config-modal-close" aria-label="Close modal">&times;</button>
                </div>
                <div class="config-modal-body">
                    <!-- Content will be dynamically populated -->
                </div>
                                 <div class="config-modal-footer">
                     <button class="config-modal-btn secondary" id="modal-close">Close</button>
                 </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
                 // Close modal handlers
         const closeBtn = modal.querySelector('.config-modal-close');
         const closeFooterBtn = modal.querySelector('#modal-close');
         const overlay = modal;
         
         [closeBtn, closeFooterBtn].forEach(btn => {
             btn.addEventListener('click', () => closeConfigModal());
         });
        
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeConfigModal();
        });
        
        // ESC key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeConfigModal();
            }
        });
        
        return modal;
    }
    
         async function openConfigModal(categoryName, fullKey, value, parentKey) {
        // Remove existing modal if any
        if (currentConfigModal) {
            closeConfigModal();
        }
        
                 currentConfigModal = createConfigModal();
         const modalTitle = currentConfigModal.querySelector('.config-modal-title');
         const modalBody = currentConfigModal.querySelector('.config-modal-body');
         
         modalTitle.textContent = `Configure ${categoryName}`;
         
         // Clear cache and get absolutely fresh config values
         currentFullConfig = null; // Force fresh fetch
         const freshConfig = await window.fetchConfig();
         let currentValue = value;
         
         console.log(`[Config Modal] Fresh config for ${fullKey}:`, freshConfig);
         console.log(`[Config Modal] Looking for path:`, fullKey);
         
         // Extract current value from fresh config
         if (freshConfig && fullKey !== 'startupCheats') {
             const pathArray = fullKey.split('.');
             let current = freshConfig;
             let pathSoFar = [];
             
             for (const key of pathArray) {
                 pathSoFar.push(key);
                 console.log(`[Config Modal] Checking path ${pathSoFar.join('.')} - current:`, current, 'looking for key:', key);
                 
                 if (current && typeof current === 'object' && current[key] !== undefined) {
                     current = current[key];
                 } else {
                     console.log(`[Config Modal] Path ${pathSoFar.join('.')} not found, using fallback`);
                     current = value; // fallback to original
                     break;
                 }
             }
             currentValue = current;
             console.log(`[Config Modal] Final extracted value for ${fullKey}:`, currentValue);
         } else if (freshConfig && fullKey === 'startupCheats') {
             currentValue = freshConfig.startupCheats || [];
         }
         
         // Handle different value types with fresh data
         if (fullKey === 'startupCheats' && Array.isArray(currentValue)) {
             renderStartupCheatsModal(modalBody, currentValue, fullKey);
         } else if (typeof currentValue === 'object' && currentValue !== null) {
             renderObjectModal(modalBody, currentValue, fullKey);
         } else {
             renderSimpleValueModal(modalBody, categoryName, currentValue, fullKey);
         }
         
         // Show modal
         currentConfigModal.classList.add('active');
    }
    
         async function closeConfigModal() {
         if (currentConfigModal) {
             // Auto-save if there are unsaved changes
             if (window.hasUnsavedChanges && Object.keys(window.configChanges).length > 0) {
                 await autoSaveConfigChanges();
             }
             
             currentConfigModal.classList.remove('active');
             setTimeout(() => {
                 if (currentConfigModal && currentConfigModal.parentNode) {
                     currentConfigModal.parentNode.removeChild(currentConfigModal);
                 }
                 currentConfigModal = null;
             }, 300); // Wait for animation
         }
     }
    
    function renderStartupCheatsModal(container, cheats, fullKey) {
        container.innerHTML = `
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Manage startup cheats that will be executed when the injector starts.
            </p>
            <div class="modal-startup-cheats-editor">
                                 <ul class="startup-cheats-list"></ul>
                 <div class="add-cheat-area">
                     <input type="text" class="cheat-search-input" placeholder="Search cheats to add...">
                     <button class="add-cheat-button">Add</button>
                 </div>
            </div>
        `;
        
                 // Use existing elements from the original modal template
         const listElement = container.querySelector('.startup-cheats-list');
         const searchInput = container.querySelector('.cheat-search-input');
         const addBtn = container.querySelector('.add-cheat-button');
        
        // Render existing cheats
        function renderCheatsList() {
            listElement.innerHTML = '';
            cheats.forEach((cheat, index) => {
                const listItem = document.createElement('li');
                listItem.innerHTML = `
                    <input type="text" class="startup-cheat-input" value="${cheat}" data-index="${index}">
                    <button class="remove-cheat-button" data-index="${index}">×</button>
                `;
                listElement.appendChild(listItem);
            });
            
                         // Add remove handlers
             listElement.querySelectorAll('.remove-cheat-button').forEach(btn => {
                 btn.addEventListener('click', () => {
                     const index = parseInt(btn.dataset.index);
                     cheats.splice(index, 1);
                     renderCheatsList();
                     window.markConfigChanged('startupCheats', cheats);
                 });
             });
             
             // Add change handlers for existing inputs
             listElement.querySelectorAll('.startup-cheat-input').forEach(input => {
                 input.addEventListener('input', () => {
                     const index = parseInt(input.dataset.index);
                     cheats[index] = input.value;
                     window.markConfigChanged('startupCheats', cheats);
                 });
             });
        }
        
                 renderCheatsList();
         
         // Add autocomplete functionality to the search input
         let autocompleteResults = [];
         const resultsContainer = document.createElement('div');
         resultsContainer.className = 'cheat-search-results';
         resultsContainer.style.display = 'none';
         searchInput.parentNode.appendChild(resultsContainer);
         
         // Search input handler with autocomplete
         searchInput.addEventListener('input', async () => {
             const query = searchInput.value.trim().toLowerCase();
             if (query.length < 2) {
                 resultsContainer.style.display = 'none';
                 return;
             }
             
             // Fetch available cheats if needed
             const availableCheats = await fetchAvailableCheats();
             autocompleteResults = availableCheats
                 .filter(cheat => cheat.toLowerCase().includes(query))
                 .slice(0, 8); // Limit to 8 results
             
             if (autocompleteResults.length > 0) {
                 resultsContainer.innerHTML = '';
                 autocompleteResults.forEach(cheat => {
                     const resultItem = document.createElement('div');
                     resultItem.className = 'autocomplete-item';
                     resultItem.textContent = cheat;
                     resultItem.addEventListener('click', () => {
                         if (!cheats.includes(cheat)) {
                             cheats.push(cheat);
                             searchInput.value = '';
                             renderCheatsList();
                             window.markConfigChanged('startupCheats', cheats);
                         }
                         resultsContainer.style.display = 'none';
                     });
                     resultsContainer.appendChild(resultItem);
                 });
                 resultsContainer.style.display = 'block';
             } else {
                 resultsContainer.style.display = 'none';
             }
         });
         
         // Add button handler
         addBtn.addEventListener('click', () => {
             const searchValue = searchInput.value.trim();
             if (searchValue && !cheats.includes(searchValue)) {
                 cheats.push(searchValue);
                 searchInput.value = '';
                 renderCheatsList();
                 window.markConfigChanged('startupCheats', cheats);
                 resultsContainer.style.display = 'none';
             }
         });
         
         // Enter key handler for search
         searchInput.addEventListener('keydown', (e) => {
             if (e.key === 'Enter') {
                 e.preventDefault();
                 if (autocompleteResults.length > 0) {
                     // Use first autocomplete result
                     const firstResult = autocompleteResults[0];
                     if (!cheats.includes(firstResult)) {
                         cheats.push(firstResult);
                         searchInput.value = '';
                         renderCheatsList();
                         window.markConfigChanged('startupCheats', cheats);
                     }
                 } else {
                     // Use manual input
                     addBtn.click();
                 }
                 resultsContainer.style.display = 'none';
             } else if (e.key === 'Escape') {
                 resultsContainer.style.display = 'none';
             }
         });
         
         // Hide autocomplete when clicking outside
         document.addEventListener('click', (e) => {
             if (!searchInput.parentNode.contains(e.target)) {
                 resultsContainer.style.display = 'none';
             }
         });
         
    }
    
    function renderObjectModal(container, obj, fullKey) {
        container.innerHTML = `
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Configure the settings for this category.
            </p>
        `;
        
        // Render each property
        Object.entries(obj).forEach(([key, value]) => {
            const fieldDiv = document.createElement('div');
            const inputType = window.getInputType(value);
            const displayName = key.charAt(0).toUpperCase() + key.slice(1);
            
            fieldDiv.className = inputType === 'boolean' ? 'config-field checkbox' : 'config-field';
            
                         if (inputType === 'boolean') {
                 fieldDiv.innerHTML = `
                     <input type="checkbox" id="modal-${key}" name="${fullKey}.${key}" ${value ? 'checked' : ''} />
                     <label for="modal-${key}">${displayName}</label>
                 `;
             } else if (inputType === 'object') {
                 const formattedValue = window.formatConfigValue(value);
                 fieldDiv.innerHTML = `
                     <label for="modal-${key}">${displayName} (JSON Object)</label>
                     <textarea id="modal-${key}" name="${fullKey}.${key}" placeholder="Enter JSON..." rows="4">${formattedValue}</textarea>
                     <small style="color: var(--text-muted); font-size: 12px;">Edit as JSON format</small>
                 `;
             } else if (inputType === 'textarea') {
                 fieldDiv.innerHTML = `
                     <label for="modal-${key}">${displayName}</label>
                     <textarea id="modal-${key}" name="${fullKey}.${key}" placeholder="Enter ${displayName}...">${value || ''}</textarea>
                 `;
             } else if (inputType === 'number') {
                 fieldDiv.innerHTML = `
                     <label for="modal-${key}">${displayName}</label>
                     <input type="number" id="modal-${key}" name="${fullKey}.${key}" value="${value || ''}" placeholder="Enter ${displayName}..." />
                 `;
             } else {
                 fieldDiv.innerHTML = `
                     <label for="modal-${key}">${displayName}</label>
                     <input type="text" id="modal-${key}" name="${fullKey}.${key}" value="${value || ''}" placeholder="Enter ${displayName}..." />
                 `;
             }
             
             // Add change listeners
             const input = fieldDiv.querySelector('input, textarea');
             if (input) {
                 if (input.type === 'checkbox') {
                     input.addEventListener('change', () => {
                         window.markConfigChanged(`${fullKey}.${key}`, input.checked);
                     });
                 } else if (inputType === 'object') {
                     input.addEventListener('input', () => {
                         try {
                             const parsedValue = JSON.parse(input.value);
                             window.markConfigChanged(`${fullKey}.${key}`, parsedValue);
                         } catch (error) {
                             // Invalid JSON, store as string for now
                             window.markConfigChanged(`${fullKey}.${key}`, input.value);
                         }
                     });
                 } else {
                     input.addEventListener('input', () => {
                         let value = input.value;
                         if (input.type === 'number') {
                             value = parseFloat(value) || 0;
                         }
                         window.markConfigChanged(`${fullKey}.${key}`, value);
                     });
                 }
             }
             
             container.appendChild(fieldDiv);
        });
    }
    
         function renderSimpleValueModal(container, categoryName, value, fullKey) {
         const inputType = window.getInputType(value);
        
        container.innerHTML = `
            <p style="color: var(--text-secondary); margin-bottom: 20px;">
                Edit the value for ${categoryName}.
            </p>
        `;
        
        const fieldDiv = document.createElement('div');
        fieldDiv.className = inputType === 'boolean' ? 'config-field checkbox' : 'config-field';
        
                 if (inputType === 'boolean') {
             fieldDiv.innerHTML = `
                 <input type="checkbox" id="modal-value" name="${fullKey}" ${value ? 'checked' : ''} />
                 <label for="modal-value">${categoryName}</label>
             `;
         } else if (inputType === 'object') {
             const formattedValue = window.formatConfigValue(value);
             fieldDiv.innerHTML = `
                 <label for="modal-value">${categoryName} (JSON Object)</label>
                 <textarea id="modal-value" name="${fullKey}" placeholder="Enter JSON..." rows="6">${formattedValue}</textarea>
                 <small style="color: var(--text-muted); font-size: 12px;">Edit as JSON format</small>
             `;
         } else if (inputType === 'textarea') {
             fieldDiv.innerHTML = `
                 <label for="modal-value">${categoryName}</label>
                 <textarea id="modal-value" name="${fullKey}" placeholder="Enter value...">${value || ''}</textarea>
             `;
         } else if (inputType === 'number') {
             fieldDiv.innerHTML = `
                 <label for="modal-value">${categoryName}</label>
                 <input type="number" id="modal-value" name="${fullKey}" value="${value || ''}" placeholder="Enter value..." />
             `;
         } else {
             fieldDiv.innerHTML = `
                 <label for="modal-value">${categoryName}</label>
                 <input type="text" id="modal-value" name="${fullKey}" value="${value || ''}" placeholder="Enter value..." />
             `;
         }
         
         // Add change listener
         const input = fieldDiv.querySelector('input, textarea');
         if (input) {
             if (input.type === 'checkbox') {
                 input.addEventListener('change', () => {
                     window.markConfigChanged(fullKey, input.checked);
                 });
             } else if (inputType === 'object') {
                 input.addEventListener('input', () => {
                     try {
                         const parsedValue = JSON.parse(input.value);
                         window.markConfigChanged(fullKey, parsedValue);
                     } catch (error) {
                         // Invalid JSON, store as string for now
                         window.markConfigChanged(fullKey, input.value);
                     }
                 });
             } else {
                 input.addEventListener('input', () => {
                     let value = input.value;
                     if (input.type === 'number') {
                         value = parseFloat(value) || 0;
                     }
                     window.markConfigChanged(fullKey, value);
                 });
             }
         }
         
         container.appendChild(fieldDiv);
    }
    
    
    
    
