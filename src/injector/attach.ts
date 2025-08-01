import { spawn } from 'child_process';
import { existsSync } from 'fs';
import http from 'http';
import path from 'path';
import { getLogger } from '../lib/logger';
import { InjectorConfig } from '../types';

const logger = getLogger('Injector', 'info');

const CDP_PORT = 32123;
const APP_ID = 1476970;

function pollForCDP(timeout: number, pollingInterval?: number): Promise<string> {
  const startTime = Date.now();
  const interval = pollingInterval || 200;
  
  logger.debug(`Starting CDP polling with timeout: ${timeout} ms, interval: ${interval} ms`);
  
  return new Promise((resolve, reject) => {
    function check() {
      logger.debug(`Checking CDP endpoint at http://localhost:${CDP_PORT}/json/version`);
      const req = http.get(`http://localhost:${CDP_PORT}/json/version`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            logger.debug(`CDP endpoint response: ${JSON.stringify(json)}`);
            if (json.webSocketDebuggerUrl) {
              logger.debug(`Found WebSocket debugger URL: ${json.webSocketDebuggerUrl}`);
              return resolve(json.webSocketDebuggerUrl);
            }
            logger.debug('No WebSocket debugger URL found in response');
            retry();
          } catch (parseError) {
            logger.debug(`Failed to parse CDP response: ${parseError}`);
            retry();
          }
        });
      });
      req.on('error', (error) => {
        logger.debug(`CDP endpoint request failed: ${error}`);
        retry();
      });
      req.setTimeout(2000, () => {
        logger.debug('CDP endpoint request timed out');
        req.destroy();
        retry();
      });
    }
    function retry() {
      const elapsed = Date.now() - startTime;
      if (elapsed > timeout) {
        logger.error(`CDP polling timeout after ${elapsed} ms`);
        return reject(new Error('Timeout waiting for debugger WebSocket URL. Have you set --remote-debugging-port?'));
      }
      logger.debug(`Retrying CDP polling in ${interval} ms (elapsed: ${elapsed} ms)`);
      setTimeout(check, interval);
    }
    check();
  });
}

async function manualFallback(timeout: number, pollingInterval?: number): Promise<string> {
  logger.error('Automatic attach failed.');
  logger.info('Waiting for the game to start and expose the debugger...');
  logger.info(`  --remote-debugging-port=${CDP_PORT}`);

  return pollForCDP(timeout, pollingInterval);
}

export async function attachLinux(config: InjectorConfig): Promise<string> {
  logger.debug(`Starting Linux auto-attach with config: ${JSON.stringify(config)}`);
  
  try {
    const possibleSteamPaths = [
      '/usr/bin/steam',
      '/usr/local/bin/steam',
      `${process.env.HOME}/.steam/steam/steam.sh`,
      `${process.env.HOME}/.local/share/Steam/steam.sh`,
    ];
    let steamCmd = 'steam';
    let foundSteam = false;
    
    logger.debug(`Searching for Steam executable in paths: ${JSON.stringify(possibleSteamPaths)}`);
    
    for (const p of possibleSteamPaths) {
      if (existsSync(p)) {
        steamCmd = p;
        foundSteam = true;
        logger.debug(`Found Steam executable at: ${p}`);
        break;
      }
    }
    if (!foundSteam && existsSync('/usr/bin/steam')) {
      steamCmd = '/usr/bin/steam';
      foundSteam = true;
      logger.debug('Found Steam executable at /usr/bin/steam');
    }
    if (!foundSteam) {
      throw new Error('[Linux] Could not find Steam executable. Please ensure Steam is installed and in your PATH.');
    }
    
    const args = [
      '-applaunch',
      APP_ID.toString(),
      `--remote-debugging-port=${CDP_PORT}`
    ];
    logger.debug(`Launching Steam with args: ${JSON.stringify(args)}`);
    spawn(steamCmd, args, { detached: true, stdio: 'ignore' });
    
    const timeout = config.onTimeout || 15000;
    logger.debug(`Starting CDP polling with timeout: ${timeout} ms`);
    return await pollForCDP(timeout, config.pollingInterval);
  } catch (err) {
    logger.error(`Linux auto-attach failed: ${err}`);
    return manualFallback(config.onTimeout || 15000, config.pollingInterval);
  }
}

export async function attachWindows(config: InjectorConfig): Promise<string> {
  logger.debug(`Starting Windows auto-attach with config: ${JSON.stringify(config)}`);
  
  try {
    const defaultSteamPaths = [
      path.join(process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)', 'Steam/steamapps/common/Legends of Idleon/LegendsOfIdleon.exe'),
      path.join(process.env['ProgramFiles'] || 'C:/Program Files', 'Steam/steamapps/common/Legends of Idleon/LegendsOfIdleon.exe'),
      path.join(process.env['ProgramW6432'] || 'C:/Program Files', 'Steam/steamapps/common/Legends of Idleon/LegendsOfIdleon.exe'),
      path.join(process.cwd(), 'LegendsOfIdleon.exe'),
    ];
    
    let exePath = config.gameExePath && existsSync(config.gameExePath) ? config.gameExePath : null;
    if (!exePath) {
      logger.debug(`Searching for game executable in default paths: ${JSON.stringify(defaultSteamPaths)}`);
      for (const p of defaultSteamPaths) {
        if (existsSync(p)) {
          exePath = p;
          logger.debug(`Found game executable at: ${p}`);
          break;
        }
      }
    }
    
    if (exePath) {
      logger.debug(`Launching game executable directly: ${exePath}`);
      spawn(exePath, [`--remote-debugging-port=${CDP_PORT}`], { detached: true, stdio: 'ignore' });
    } else {
      logger.debug('Game executable not found, using Steam protocol');
      const steamUrl = `steam://run/${APP_ID}//--remote-debugging-port=${CDP_PORT}`;
      logger.debug(`Launching via Steam URL: ${steamUrl}`);
      spawn('cmd', ['/c', 'start', '', steamUrl], { detached: true, stdio: 'ignore' });
    }
    
    const timeout = config.onTimeout || 15000;
    logger.debug(`Starting CDP polling with timeout: ${timeout} ms`);
    return await pollForCDP(timeout, config.pollingInterval);
  } catch (err) {
    logger.error(`Windows auto-attach failed: ${err}`);
    return manualFallback(config.onTimeout || 15000, config.pollingInterval);
  }
}

export async function attachMacOS(config: InjectorConfig): Promise<string> {
  logger.debug(`Starting macOS auto-attach with config: ${JSON.stringify(config)}`);
  
  try {
    const possibleSteamPaths = [
      '/Applications/Steam.app/Contents/MacOS/steam_osx',
      '/Applications/Steam.app/Contents/MacOS/Steam',
      '/usr/local/bin/steam',
      `${process.env.HOME}/Applications/Steam.app/Contents/MacOS/steam_osx`,
      `${process.env.HOME}/Library/Application Support/Steam/steam.sh`,
    ];
    let steamCmd = 'steam';
    let foundSteam = false;
    
    logger.debug(`Searching for Steam executable in paths: ${JSON.stringify(possibleSteamPaths)}`);
    
    for (const p of possibleSteamPaths) {
      if (existsSync(p)) {
        steamCmd = p;
        foundSteam = true;
        logger.debug(`Found Steam executable at: ${p}`);
        break;
      }
    }
    
    if (!foundSteam) {
      // Try using Steam URL protocol as fallback (similar to Windows)
      logger.debug('Steam executable not found, using Steam protocol');
      const steamUrl = `steam://run/${APP_ID}//--remote-debugging-port=${CDP_PORT}`;
      logger.debug(`Launching via Steam URL: ${steamUrl}`);
      spawn('open', [steamUrl], { detached: true, stdio: 'ignore' });
    } else {
      // Launch Steam directly with app ID
      const args = [
        '-applaunch',
        APP_ID.toString(),
        `--remote-debugging-port=${CDP_PORT}`
      ];
      logger.debug(`Launching Steam with args: ${JSON.stringify(args)}`);
      spawn(steamCmd, args, { detached: true, stdio: 'ignore' });
    }
    
    const timeout = config.onTimeout || 15000;
    logger.debug(`Starting CDP polling with timeout: ${timeout} ms`);
    return await pollForCDP(timeout, config.pollingInterval);
  } catch (err) {
    logger.error(`macOS auto-attach failed: ${err}`);
    return manualFallback(config.onTimeout || 15000, config.pollingInterval);
  }
}

export async function autoAttach(config: InjectorConfig): Promise<string> {
  logger.debug(`Auto-attach called for platform: ${process.platform}`);
  
  if (process.platform === 'linux') {
    return attachLinux(config);
  } else if (process.platform === 'win32') {
    return attachWindows(config);
  } else if (process.platform === 'darwin') {
    return attachMacOS(config);
  } else {
    logger.error(`Unsupported platform for autoAttach: ${process.platform}`);
    throw new Error(`Unsupported platform for autoAttach: ${process.platform}. Supported platforms: Windows (win32), Linux (linux), macOS (darwin)`);
  }
} 