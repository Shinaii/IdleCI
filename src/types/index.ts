 // Cheat category types
export type CheatCategory = 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6';

// Cheat definition
export interface Cheat {
  id: string;
  name: string;
  description: string;
  category: CheatCategory;
  fn: (...args: any[]) => any;
  needsConfirmation?: boolean;
  configurable?: any;
}

// Config types
export interface InjectorConfig {
  enableUI: boolean;
  injreg: string;
  showConsoleLog: boolean;
  chrome: string;
  onTimeout: number;
  interceptPattern: string;
  gameExePath?: string;
  customUIPort: number;
}

/**
 * Represents any value that can be used in the cheat config, including nested objects, arrays, and functions.
 */
export type CheatConfigValue = boolean | number | string | CheatConfigValue[] | { [key: string]: CheatConfigValue } | ((...args: any[]) => any);

/**
 * Represents the structure of the cheat configuration object.
 */
export interface CheatConfig {
  [key: string]: CheatConfigValue;
}

export interface FullConfig {
  startupCheats: string[];
  cheatConfig: CheatConfig;
  injectorConfig: InjectorConfig;
}

/**
 * The result of loading the config, including the merged config and a reload method.
 */
export interface ConfigLoaderResult {
  config: FullConfig;
  reload: () => Promise<FullConfig>;
}

// API response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
