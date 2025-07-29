/**
 * API Routes Module
 * 
 * Defines all REST API endpoints for the web UI interface of the Idleon Cheat Injector.
 * Handles cheat execution, configuration management, DevTools integration, and file operations.
 * Provides the bridge between the web interface and the game's cheat system.
 */

import _ from 'lodash';
import fs from 'fs/promises';
import path from 'path';
import { Express } from 'express';
import { getLogger } from '../lib/logger';

// Create dedicated logger for terminal operations
const terminalLogger = getLogger('WebUI Terminal');

// Helper functions for config handling
function objToString(obj: any, indent: number = 0): string {
  const indentStr = '  '.repeat(indent);
  const nextIndent = '  '.repeat(indent + 1);
  
  const serializeValue = (value: any, currentIndent: number = 0): string => {
    if (typeof value === 'function') {
      return value.toString();
    }
    if (typeof value === 'string' && (value.startsWith('(t) =>') || value.startsWith('(t, args) =>'))) {
      // This is a function string, don't quote it
      return value;
    }
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';
      const items = value.map(item => serializeValue(item, currentIndent + 1));
      return '[\n' + nextIndent + items.join(',\n' + nextIndent) + '\n' + indentStr + ']';
    }
    if (value && typeof value === 'object') {
      const pairs = Object.entries(value).map(([key, val]) => {
        const serializedValue = serializeValue(val, currentIndent + 1);
        // Check if key is a valid JavaScript identifier
        const isValidIdentifier = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
        const keyStr = isValidIdentifier ? key : `"${key}"`;
        return `${keyStr}: ${serializedValue}`;
      });
      if (pairs.length === 0) return '{}';
      return '{\n' + nextIndent + pairs.join(',\n' + nextIndent) + '\n' + indentStr + '}';
    }
    return JSON.stringify(value);
  };
  
  return serializeValue(obj, indent);
}

function prepareConfigForJson(config: any): any {
  const cleanConfig = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(cleanConfig);
    }
    if (obj && typeof obj === 'object') {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (value && typeof value === 'object' && 
            '__isFunction' in value && '__functionString' in value &&
            (value as any).__isFunction && (value as any).__functionString) {
          cleaned[key] = (value as any).__functionString;
        } else {
          cleaned[key] = cleanConfig(value);
        }
      }
      return cleaned;
    }
    return obj;
  };
  
  return cleanConfig(config);
}

function parseConfigFromJson(config: any): any {
  const parsed = JSON.parse(JSON.stringify(config, (key, value) => {
    if (typeof value === 'string' && value.includes('function')) {
      try {
        return new Function(`return ${value}`)();
      } catch {
        return value;
      }
    }
    return value;
  }));
  return parsed;
}

interface ApiConfig {
  cheatConfig: any;
  startupCheats: string[];
  injectorConfig: any;
  cdpPort: number;
  version?: string;
}

/**
 * Sets up all API routes for the web UI
 * @param app - Express application instance
 * @param context - JavaScript expression for game context
 * @param client - Chrome DevTools Protocol client
 * @param config - Configuration objects
 */
export function setupApiRoutes(
  app: Express, 
  context: string, 
  client: any, 
  config: ApiConfig
): void {
  const logger = getLogger('WebUI');
  const terminalLogger = getLogger('WebUI Terminal');
  const { Runtime } = client;
  const { cheatConfig, startupCheats, injectorConfig, cdpPort, version } = config;

  // --- API Endpoint: Get version ---
  app.get('/api/version', (req, res) => {
    res.json({ version: version || 'unknown' });
  });

  // --- API Endpoint: Get available cheats ---
  app.get('/api/cheats', async (req, res) => {
    try {
      const suggestionsResult = await Runtime.evaluate({
        expression: `getAutoCompleteSuggestions.call(${context})`,
        awaitPromise: true,
        returnByValue: true
      });

      if (suggestionsResult.exceptionDetails) {
        logger.error("API Error getting autocomplete suggestions:", suggestionsResult.exceptionDetails.text);
        res.status(500).json({ 
          error: 'Failed to get cheats from game', 
          details: suggestionsResult.exceptionDetails.text 
        });
      } else {
        res.json(suggestionsResult.result.value || []);
      }
    } catch (apiError) {
      logger.error("API Error in /api/cheats:", apiError);
      res.status(500).json({ error: 'Internal server error while fetching cheats' });
    }
  });

  // --- API Endpoint: Execute cheat command ---
  app.post('/api/toggle', async (req, res) => {
    const { action } = req.body;
    if (!action) {
      return res.status(400).json({ error: 'Missing action parameter' });
    }

    try {
      // Execute the selected cheat command within the game's context.
      const cheatResponse = await Runtime.evaluate({
        expression: `cheat.call(${context}, '${action}')`,
        awaitPromise: true,
        allowUnsafeEvalBlockedByCSP: true
      });

      if (cheatResponse.exceptionDetails) {
        logger.error(`API Error executing cheat '${action}':`, cheatResponse.exceptionDetails.text);
        res.status(500).json({ 
          error: `Failed to execute cheat '${action}'`, 
          details: cheatResponse.exceptionDetails.text 
        });
      } else {
        logger.info(`Executed: ${action} -> ${cheatResponse.result.value}`);
        res.json({ result: cheatResponse.result.value });
      }
    } catch (apiError) {
      logger.error(`API Error executing cheat '${action}':`, apiError);
      res.status(500).json({ 
        error: `Internal server error while executing cheat '${action}'` 
      });
    }
  });

  // --- API Endpoint: Get cheats needing confirmation ---
  app.get('/api/needs-confirmation', async (req, res) => {
    try {
      const confirmationResult = await Runtime.evaluate({
        expression: `getChoicesNeedingConfirmation.call(${context})`,
        awaitPromise: true,
        returnByValue: true
      });

      if (confirmationResult.exceptionDetails) {
        logger.error("API Error getting confirmation choices:", confirmationResult.exceptionDetails.text);
        res.status(500).json({ 
          error: 'Failed to get confirmation list from game', 
          details: confirmationResult.exceptionDetails.text 
        });
      } else {
        res.json(confirmationResult.result.value || []);
      }
    } catch (apiError) {
      logger.error("API Error in /api/needs-confirmation:", apiError);
      res.status(500).json({ error: 'Internal server error while fetching confirmation list' });
    }
  });

  // --- API Endpoint: Get DevTools URL ---
  app.get('/api/devtools-url', async (req, res) => {
    try {
      // Use the existing CDP client to get target info
      const response = await client.Target.getTargetInfo();
      if (response && response.targetInfo && response.targetInfo.targetId) {
        const targetId = response.targetInfo.targetId;
        // Construct the DevTools URL
        // Note: Using http, not ws, for the main URL. The ws part is a parameter.
        const devtoolsUrl = `http://localhost:${cdpPort}/devtools/inspector.html?ws=localhost:${cdpPort}/devtools/page/${targetId}`;
        logger.info(`Generated DevTools URL: ${devtoolsUrl}`);
        res.json({ url: devtoolsUrl });
      } else {
        logger.error("API Error: Could not get target info to generate DevTools URL.");
        res.status(500).json({ error: 'Failed to get target information from CDP client.' });
      }
    } catch (apiError) {
      logger.error("API Error getting DevTools URL:", apiError);
      res.status(500).json({ 
        error: 'Internal server error while fetching DevTools URL', 
        details: (apiError as Error).message 
      });
    }
  });

  // --- API Endpoint: Get current configuration ---
  app.get('/api/config', (req, res) => {
    try {
      const serializableCheatConfig = prepareConfigForJson(cheatConfig);
      const fullConfigResponse = {
        startupCheats: startupCheats, // Send the raw startupCheats array
        cheatConfig: serializableCheatConfig // Send the processed cheatConfig
      };
      res.json(fullConfigResponse);
    } catch (error) {
      logger.error("API Error preparing full config for JSON:", error);
      res.status(500).json({ error: 'Internal server error while preparing configuration' });
    }
  });

  // --- API Endpoint: Update configuration in memory and game ---
  app.post('/api/config/update', async (req, res) => {
    const receivedFullConfig = req.body;
    
    if (!receivedFullConfig || typeof receivedFullConfig !== 'object' || !receivedFullConfig.cheatConfig) {
      return res.status(400).json({ 
        error: 'Invalid configuration data received. Expected { startupCheats: [...], cheatConfig: {...} }.' 
      });
    }

    try {
      // 1. Extract and parse the cheatConfig part
      const receivedCheatConfig = receivedFullConfig.cheatConfig;
      const parsedCheatConfig = parseConfigFromJson(receivedCheatConfig);

      // 2. Update the server-side cheatConfig object (merge)
      _.merge(cheatConfig, parsedCheatConfig);

      // 3. Update server-side startupCheats (replace)
      if (Array.isArray(receivedFullConfig.startupCheats)) {
        // Overwrite the existing array content while keeping the reference
        startupCheats.length = 0; // Clear existing items
        startupCheats.push(...receivedFullConfig.startupCheats); // Add new items
        logger.info('Updated server-side startupCheats.');
      } else {
        logger.warn('Received startupCheats is not an array. Skipping update.');
      }

      // 4. Inject the updated *cheatConfig* into the game context
      const contextExistsResult = await Runtime.evaluate({
        expression: `!!(${context})`
      }); // Re-check context

      if (!contextExistsResult || !contextExistsResult.result || !contextExistsResult.result.value) {
        logger.error("API Error: Cheat context not found in iframe. Cannot update config in game.");
        return res.status(200).json({ 
          message: 'Configuration updated on server, but failed to apply in game (context lost).' 
        });
      }

      // Only inject cheatConfig changes
      const configStringForInjection = objToString(parsedCheatConfig);
      const updateExpression = `
        if (typeof updateCheatConfig === 'function') {
          updateCheatConfig(${configStringForInjection});
          'Config updated in game.';
        } else {
          'Error: updateCheatConfig function not found in game context.';
        }
      `;

      const updateResult = await Runtime.evaluate({
        expression: updateExpression,
        awaitPromise: true,
        allowUnsafeEvalBlockedByCSP: true
      });

      let gameUpdateDetails = 'N/A';
      if (updateResult.exceptionDetails) {
        logger.error(`API Error updating config in game:`, updateResult.exceptionDetails.text);
        gameUpdateDetails = `Failed to apply in game: ${updateResult.exceptionDetails.text}`;
        return res.status(200).json({ 
          message: 'Configuration updated on server, but failed to apply in game.', 
          details: gameUpdateDetails 
        });
      } else {
        gameUpdateDetails = updateResult.result.value;
        logger.info(`In-game config update result: ${gameUpdateDetails}`);
        if (gameUpdateDetails.startsWith('Error:')) {
          return res.status(200).json({ 
            message: 'Configuration updated on server, but failed to apply in game.', 
            details: gameUpdateDetails 
          });
        }
      }

      res.json({ message: 'Configuration updated successfully.', details: gameUpdateDetails });
    } catch (apiError) {
      logger.error("API Error in /api/config/update:", apiError);
      res.status(500).json({ 
        error: 'Internal server error while updating configuration', 
        details: (apiError as Error).message 
      });
    }
  });

  // --- API Endpoint: Save configuration to file ---
  app.post('/api/config/save', async (req, res) => {
    const receivedFullConfig = req.body;
    
    if (!receivedFullConfig || typeof receivedFullConfig !== 'object' || !receivedFullConfig.cheatConfig || !Array.isArray(receivedFullConfig.startupCheats)) {
      return res.status(400).json({ 
        error: 'Invalid configuration data received for saving. Expected { startupCheats: [...], cheatConfig: {...} }.' 
      });
    }

    try {
      // 1. Extract parts from UI payload
      const uiCheatConfigRaw = receivedFullConfig.cheatConfig;
      const uiStartupCheats = receivedFullConfig.startupCheats;
      const new_injectorConfig = objToString(injectorConfig);

      // 2. Parse UI cheatConfig to handle functions for saving
      const parsedUiCheatConfig = parseConfigFromJson(uiCheatConfigRaw);

      // 3. Construct file content string
      const fileContentString = `/**
 * This file is generated by the Idleon Cheat Injector UI.
 * Manual edits might be overwritten when saving from the UI.
 */
exports.startupCheats = ${JSON.stringify(uiStartupCheats, null, '\t')}; // Use startupCheats from UI
exports.cheatConfig = ${objToString(parsedUiCheatConfig)}; // Use parsed cheatConfig from UI
exports.injectorConfig = ${new_injectorConfig}; // Use current injectorConfig
`;

      // 4. Define save path
      const savePath = path.join(process.cwd(), 'config.custom.js');

      // 5. Write to file
      await fs.writeFile(savePath, fileContentString.trim());
      logger.info(`Configuration saved to ${savePath}`);

      // 6. Update in-memory variables AFTER successful save
      startupCheats.length = 0; // Clear existing
      startupCheats.push(...uiStartupCheats); // Add new
      _.merge(cheatConfig, parsedUiCheatConfig); // Merge cheatConfig updates

      res.json({ message: 'Configuration successfully saved to config.custom.js' });
    } catch (apiError) {
      logger.error("API Error in /api/config/save:", apiError);
      res.status(500).json({ 
        error: 'Internal server error while saving configuration file', 
        details: (apiError as Error).message 
      });
    }
  });

  // Terminal command execution endpoint
  app.post('/api/terminal/execute', async (req, res) => {
    try {
      const { command } = req.body;
      
      if (!command || typeof command !== 'string') {
        terminalLogger.warn(`Invalid command request: ${JSON.stringify(req.body)}`);
        return res.status(400).json({
          success: false,
          error: 'Command is required'
        });
      }

      terminalLogger.info(`Executing command: ${command}`);

      // Handle special commands
      if (command === 'help') {
        const helpResponse = await client.Runtime.evaluate({
          expression: `cheat.call(${context}, 'cheats')`,
          awaitPromise: true,
          allowUnsafeEvalBlockedByCSP: true
        });

        if (helpResponse.exceptionDetails) {
          terminalLogger.error(`Help command failed: ${helpResponse.exceptionDetails.text}`);
          return res.json({
            success: false,
            output: `Error getting help: ${helpResponse.exceptionDetails.text}`,
            type: 'error'
          });
        }

        terminalLogger.info(`Help command executed successfully`);
        return res.json({
          success: true,
          output: helpResponse.result.value || 'Help command executed',
          type: 'info'
        });
      }

      if (command === 'clear') {
        terminalLogger.info(`Clear command executed`);
        return res.json({
          success: true,
          output: '',
          type: 'clear'
        });
      }

      // Execute the cheat command
      const response = await client.Runtime.evaluate({
        expression: `cheat.call(${context}, '${command}')`,
        awaitPromise: true,
        allowUnsafeEvalBlockedByCSP: true
      });

      if (response.exceptionDetails) {
        terminalLogger.error(`Command "${command}" failed: ${response.exceptionDetails.text}`);
        return res.json({
          success: false,
          output: `Error: ${response.exceptionDetails.text}`,
          type: 'error'
        });
      }

      terminalLogger.info(`Command "${command}" executed successfully - Result: ${response.result.value || 'No output'}`);
      return res.json({
        success: true,
        output: response.result.value || 'Command executed successfully',
        type: 'success'
      });

    } catch (error) {
      terminalLogger.error(`API error: ${error}`);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        output: `Terminal error: ${error}`,
        type: 'error'
      });
    }
  });

  // Terminal autocomplete endpoint
  app.get('/api/terminal/autocomplete', async (req, res) => {
    try {
      const response = await client.Runtime.evaluate({
        expression: `Object.keys(${context}.cheats || {}).map(key => ({ name: key, description: key }))`,
        awaitPromise: true,
        allowUnsafeEvalBlockedByCSP: true
      });

      if (response.exceptionDetails) {
        terminalLogger.error(`Autocomplete failed: ${response.exceptionDetails.text}`);
        return res.json({
          success: false,
          suggestions: []
        });
      }

      const suggestions = response.result.value || [];
      // Add built-in commands
      suggestions.push(
        { name: 'help', description: 'Show available commands' },
        { name: 'clear', description: 'Clear terminal output' },
        { name: 'cheats', description: 'List all available cheats' }
      );

      return res.json({
        success: true,
        suggestions
      });

    } catch (error) {
      terminalLogger.error(`Autocomplete error: ${error}`);
      return res.json({
        success: false,
        suggestions: []
      });
    }
  });
} 