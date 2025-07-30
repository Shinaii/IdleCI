import { InjectorConfig } from '../types';

export const defaultInjectorConfig: InjectorConfig = {
  enableUI: true,
  customUIPort: 8080,
  injreg: '\\w+\\.ApplicationMain\\s*?=',
  showConsoleLog: false,
  chrome: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  onTimeout: 30000,
  interceptPattern: '*N.js',
  gameExePath: undefined,
  fastInjectionMode: false, // Enable for faster injection with reduced timeouts
  cdpConnectionTimeout: 10000, // CDP connection timeout in ms
  cdpRetryAttempts: 3, // Number of CDP connection retry attempts
  pollingInterval: 200, // Polling interval for CDP detection in ms
  cheatContextTimeout: 30000, // Timeout for cheat context detection in ms
  cheatContextPollingInterval: 100, // Polling interval for cheat context detection in ms
  enableCli: true, // Enable CLI interface by default
  cliAutocomplete: true, // Enable autocomplete in CLI
  cliConfirmationPrompts: true, // Enable confirmation prompts for destructive actions
}; 