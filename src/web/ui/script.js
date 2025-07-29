

document.addEventListener('DOMContentLoaded', () => {
    // Tab Elements
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanes = document.querySelectorAll('.tab-pane');

    // Cheat Tab Elements
    const cheatListDiv = document.getElementById('cheat-buttons');
    const loadingCheatsP = document.getElementById('loading-cheats');
    const filterInput = document.getElementById('filter-input');

    // Config Tab Elements (Revised)
    const configSubTabButtons = document.querySelectorAll('.config-sub-tab-button');
    const configSubTabPanes = document.querySelectorAll('.config-sub-tab-pane');
    const cheatConfigOptionsDiv = document.getElementById('cheatconfig-options');
    const cheatConfigCategorySelect = document.getElementById('cheatconfig-category-select'); // Added dropdown select
    const startupCheatsOptionsDiv = document.getElementById('startupcheats-options');
    const loadingCheatConfigP = document.getElementById('loading-cheatconfig'); // Specific loading indicators
    const loadingStartupCheatsP = document.getElementById('loading-startupcheats');
    const updateConfigButton = document.getElementById('update-config-button');
    const saveConfigButton = document.getElementById('save-config-button');
    // Removed: configCategorySelect, configOptionsDiv, topLevelOptionsDiv, categorizedOptionsDiv, loadingConfigP (using specific ones now)

    // DevTools Tab Elements
    const devtoolsIframe = document.getElementById('devtools-iframe');
    const devtoolsMessage = document.getElementById('devtools-message');

    // Terminal Tab Elements
    const terminalOutput = document.getElementById('terminal-output');
    const terminalInput = document.getElementById('terminal-input');
    const clearTerminalBtn = document.getElementById('clear-terminal');
    const helpTerminalBtn = document.getElementById('help-terminal');
    
    // Debug: Check if terminal elements are found
    console.log('Terminal elements found:', {
        terminalOutput: !!terminalOutput,
        terminalInput: !!terminalInput,
        clearTerminalBtn: !!clearTerminalBtn,
        helpTerminalBtn: !!helpTerminalBtn
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
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function clearTerminal() {
        terminalOutput.innerHTML = '';
        addTerminalLine('Terminal cleared', 'info');
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

    // General Elements
    const statusMessageDiv = document.getElementById('status-message');

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

    // Function to display status messages
    function showStatus(message, isError = false) {
        statusMessageDiv.textContent = message;
        statusMessageDiv.className = isError ? 'status-error' : 'status-success';
        setTimeout(() => {
            statusMessageDiv.textContent = '';
            statusMessageDiv.className = '';
        }, 5000);
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
            showStatus(`Executed '${action}': ${data.result || 'Success'}`);
            console.log(`[Action] Executed '${action}':`, data);
        } catch (error) {
            console.error('Error executing action:', error);
            showStatus(`Error executing '${action}': ${error.message}`, true);
        }
    }

    async function fetchConfig() {
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
    }

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
                    const button = document.createElement('button');
                    button.textContent = cheat.message; // Use the message for button text
                    const container = document.createElement('div'); // Container for button and input
                    container.className = 'cheat-item-container';

                    button.className = 'cheat-button';
                    button.dataset.action = cheat.value; // Store the action value

                    // Check if this cheat (or its base command) needs confirmation/value
                    const needsValue = cheatsNeedingConfirmation.some(confirmCmd =>
                        cheat.value.startsWith(confirmCmd)
                    );

                    let inputField = null;
                    if (needsValue) {
                        inputField = document.createElement('input');
                        inputField.type = 'text';
                        inputField.className = 'cheat-input';
                        // Use a unique ID based on the action value for easy retrieval
                        inputField.id = `input-${cheat.value.replace(/\s+/g, '-')}`; // Unique ID
                        inputField.placeholder = 'Value';
                        container.appendChild(inputField);
                    }

                    container.appendChild(button);

                    button.addEventListener('click', () => {
                        let actionToSend = cheat.value;
                        if (needsValue && inputField) {
                            const inputValue = inputField.value.trim();
                            if (inputValue) {
                                actionToSend = `${cheat.value} ${inputValue}`;
                            } else {
                                showStatus(`Warning: Value required for '${cheat.message}'. Executing without value.`, true);
                                // Decide whether to proceed or return
                                // return; // Uncomment to prevent execution without value
                            }
                        }
                        executeCheatAction(actionToSend); // Use the renamed function
                    });

                    categoryContent.appendChild(container);
                });

                details.appendChild(categoryContent);
                cheatListDiv.appendChild(details); // Append to the button container
                // Store buttons for filtering
                categoryContent.querySelectorAll('.cheat-item-container').forEach(item => allCheatButtons.push(item));
            });

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
        const chevron = document.createElement('span');
        chevron.className = 'config-chevron';
        chevron.textContent = '▶';
        const label = document.createElement('label');
        label.textContent = key;
        label.htmlFor = `config-${fullKey}`;
        header.appendChild(chevron);
        header.appendChild(label);
        header.style.cursor = 'pointer';
        header.tabIndex = 0;
        itemDiv.appendChild(header);

        // Content container (collapsible)
        const contentDiv = document.createElement('div');
        contentDiv.className = 'config-item-content';
        contentDiv.style.display = 'none';

        // --- Special Handling for startupCheats ---
        if (fullKey === 'startupCheats' && Array.isArray(value)) {
            // DO NOT append label for startupCheats main entry
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
            addArea.appendChild(searchResults);
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
                addButton.style.display = 'inline-block';
                searchInput.style.display = 'none';
                searchResults.style.display = 'none';
                cancelButton.style.display = 'none';
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
                            // Reset add area
                            searchInput.value = '';
                            searchResults.innerHTML = '';
                            searchResults.style.display = 'none';
                            searchInput.style.display = 'none';
                            cancelButton.style.display = 'none';
                            addButton.style.display = 'inline-block';
                        });
                        searchResults.appendChild(li);
                    });
                    searchResults.style.display = 'block';
                } else {
                    searchResults.style.display = 'none';
                }
            });

            cheatsContainer.appendChild(addArea);
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

        // Collapsible/accordion logic
        // Only one open at a time at this nesting level
        header.addEventListener('click', () => {
            const parent = itemDiv.parentElement;
            // Collapse all siblings
            Array.from(parent.children).forEach(sibling => {
                if (sibling !== itemDiv && sibling.classList.contains('config-item')) {
                    const sibContent = sibling.querySelector('.config-item-content');
                    const sibChevron = sibling.querySelector('.config-chevron');
                    if (sibContent) sibContent.style.display = 'none';
                    if (sibChevron) sibChevron.textContent = '▶';
                }
            });
            // Toggle this one
            if (contentDiv.style.display === 'none') {
                contentDiv.style.display = '';
                chevron.textContent = '▼';
            } else {
                contentDiv.style.display = 'none';
                chevron.textContent = '▶';
            }
        });
        // Start collapsed
        contentDiv.style.display = 'none';
        chevron.textContent = '▶';

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

    // Tab switching logic
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetTabId = button.dataset.tab;

            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            const targetPane = document.getElementById(targetTabId);
            if (targetPane) {
                targetPane.classList.add('active');

                // Load content for specific tabs only when they become active the first time
                if (targetTabId === 'config-tab' && !configTabInitialized) {
                    loadAndRenderConfig(); // Load config content on first view
                } else if (targetTabId === 'devtools-tab' && !devtoolsLoaded) {
                    loadDevTools(); // Load devtools on first view
                }
            }
        });
    });

    // Config Sub-Tab switching logic
    configSubTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const targetPaneId = button.dataset.subTab;

            configSubTabButtons.forEach(btn => btn.classList.remove('active'));
            configSubTabPanes.forEach(pane => pane.classList.remove('active'));

            button.classList.add('active');
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });


    // "Use Config" button listener
    if (updateConfigButton) {
        updateConfigButton.addEventListener('click', async () => {
            const configData = await gatherConfigFromUI();
            if (configData) {
                updateSessionConfig(configData);
            }
        });
    }

    // "Save Config" button listener
    if (saveConfigButton) {
        saveConfigButton.addEventListener('click', async () => {
            const configData = await gatherConfigFromUI();
            if (configData) {
                saveConfigFile(configData);
            }
        });
    }

    // --- Initial Load ---
    loadAndRenderCheats(); // Load cheats immediately (default tab)
    // Config tab content will load when the tab is clicked.
    
    // Initialize terminal when tab is first opened
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.getAttribute('data-tab') === 'terminal-tab') {
                // Re-get elements when tab is clicked
                const currentTerminalOutput = document.getElementById('terminal-output');
                
                if (currentTerminalOutput && currentTerminalOutput.children.length === 0) {
                    console.log('[WebUI Terminal] Initializing terminal interface');
                    addTerminalLine('Welcome to IdleCI Terminal!', 'info');
                    addTerminalLine('Type "help" to see available commands, or start typing cheat names.', 'info');
                    addTerminalLine('Use ↑/↓ arrows to navigate command history.', 'info');
                    loadTerminalSuggestions();
                }
            }
        });
    });

    // Load version dynamically
    loadVersion();
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
