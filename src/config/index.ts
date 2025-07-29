import path from 'path';
import { existsSync } from 'fs';
import _ from 'lodash';
import { FullConfig } from '../types';
import { defaultConfig } from './defaultConfig';

// Helper function to normalize functions to our serialization format
function normalizeConfig(config: any): any {
  if (typeof config === 'function') {
    // Convert actual functions to our special format
    return { __isFunction: true, __functionString: config.toString() };
  }
  if (Array.isArray(config)) {
    return config.map(normalizeConfig);
  }
  if (config && typeof config === 'object') {
    // Don't process objects that are already our special function format
    if (config.__isFunction && config.__functionString) {
      return config;
    }
    const normalized: any = {};
    for (const [key, value] of Object.entries(config)) {
      normalized[key] = normalizeConfig(value);
    }
    return normalized;
  }
  return config;
}

/**
 * Loads the default config, and merges with a custom config if provided.
 * @param customConfigPath Optional path to a custom config file
 */
export async function loadConfig(customConfigPath?: string): Promise<FullConfig> {
  let customConfig = {} as Partial<FullConfig>;
  if (customConfigPath) {
    const resolvedPath = path.isAbsolute(customConfigPath)
      ? customConfigPath
      : path.resolve(process.cwd(), customConfigPath);
    if (existsSync(resolvedPath)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      customConfig = require(resolvedPath) as Partial<FullConfig>;
    } else {
      throw new Error(`Custom config not found at: ${resolvedPath}`);
    }
  }

  // Normalize custom config to handle actual functions
  const normalizedCustomConfig = normalizeConfig(customConfig);
  
  // Deep merge logic: custom overrides default
  const merged: FullConfig = _.merge(
    {},
    defaultConfig,
    normalizedCustomConfig
  );

  validateConfig(merged);
  return merged;
}

/**
 * (Stub) Validates the config object. Throws if invalid.
 * TODO: Implement schema validation. (More like testing)
 */
function validateConfig(config: FullConfig): void {
  // Validate startupCheats
  if (!Array.isArray(config.startupCheats) || !config.startupCheats.every(s => typeof s === 'string')) {
    throw new Error('Config validation error: startupCheats must be an array of strings');
  }
  // Validate cheatConfig
  if (typeof config.cheatConfig !== 'object' || config.cheatConfig == null) {
    throw new Error('Config validation error: cheatConfig must be an object');
  }
  // Validate injectorConfig
  const inj = config.injectorConfig;
  if (typeof inj !== 'object' || inj == null) {
    throw new Error('Config validation error: injectorConfig must be an object');
  }
  const requiredFields = [
    ['enableUI', 'boolean'],
    ['injreg', 'string'],
    ['showConsoleLog', 'boolean'],
    ['chrome', 'string'],
    ['onTimeout', 'number'],
    ['interceptPattern', 'string'],
  ];
  for (const [field, type] of requiredFields) {
    if (!(field in inj)) {
      throw new Error(`Config validation error: injectorConfig missing required field '${field}'`);
    }
    // Type assertion to allow dynamic key access
    if (typeof (inj as any)[field] !== type) {
      throw new Error(`Config validation error: injectorConfig field '${field}' must be of type ${type}`);
    }
  }
  //gameExePath can be undefined or string (Steamprotocol)
  if ('gameExePath' in inj && inj.gameExePath !== undefined && typeof inj.gameExePath !== 'string') {
    throw new Error('Config validation error: injectorConfig.gameExePath must be a string if defined');
  }
} 