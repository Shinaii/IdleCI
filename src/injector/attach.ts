import { spawn } from 'child_process';
import { existsSync } from 'fs';
import http from 'http';
import path from 'path';
import { getLogger } from '../lib/logger';
import { InjectorConfig } from '../types';

const logger = getLogger('Injector', 'info');

const CDP_PORT = 32123;
const APP_ID = 1476970;

function pollForCDP(timeout: number): Promise<string> {
  const startTime = Date.now();
  return new Promise((resolve, reject) => {
    function check() {
      const req = http.get(`http://localhost:${CDP_PORT}/json/version`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (json.webSocketDebuggerUrl) {
              return resolve(json.webSocketDebuggerUrl);
            }
            retry();
          } catch {
            retry();
          }
        });
      });
      req.on('error', retry);
    }
    function retry() {
      if (Date.now() - startTime > timeout) {
        return reject(new Error('Timeout waiting for debugger WebSocket URL. Have you set --remote-debugging-port?'));
      }
      setTimeout(check, 500);
    }
    check();
  });
}

async function manualFallback(timeout: number): Promise<string> {
  logger.error(`Automatic attach failed.`);
  logger.info(`Waiting for the game to start and expose the debugger...`);
  logger.info(`  --remote-debugging-port=${CDP_PORT}`);
  logger.info(`Waiting for the game to start and expose the debugger...`);

  return pollForCDP(timeout);
}

export async function attachLinux(config: InjectorConfig): Promise<string> {
  try {
    // Find Steam
    const possibleSteamPaths = [
      '/usr/bin/steam',
      '/usr/local/bin/steam',
      `${process.env.HOME}/.steam/steam/steam.sh`,
      `${process.env.HOME}/.local/share/Steam/steam.sh`,
    ];
    let steamCmd = 'steam';
    let foundSteam = false;
    for (const p of possibleSteamPaths) {
      if (existsSync(p)) {
        steamCmd = p;
        foundSteam = true;
        break;
      }
    }
    if (!foundSteam && existsSync('/usr/bin/steam')) {
      steamCmd = '/usr/bin/steam';
      foundSteam = true;
    }
    if (!foundSteam) {
      throw new Error('[Linux] Could not find Steam executable. Please ensure Steam is installed and in your PATH.');
    }
    // Launch Idleon via Steam
    const args = [
      '-applaunch',
      APP_ID.toString(),
      `--remote-debugging-port=${CDP_PORT}`
    ];
    spawn(steamCmd, args, { detached: true, stdio: 'ignore' });
    // Poll for CDP endpoint
    return await pollForCDP(30000);
  } catch (err) {
    logger.error('Linux auto-attach failed:', err);
    return manualFallback( config.onTimeout || 30000);
  }
}

export async function attachWindows(config: InjectorConfig): Promise<string> {
  try {
    // Find Idleon EXE
    const defaultSteamPaths = [
      path.join(process.env['ProgramFiles(x86)'] || 'C:/Program Files (x86)', 'Steam/steamapps/common/Legends of Idleon/LegendsOfIdleon.exe'),
      path.join(process.env['ProgramFiles'] || 'C:/Program Files', 'Steam/steamapps/common/Legends of Idleon/LegendsOfIdleon.exe'),
      path.join(process.env['ProgramW6432'] || 'C:/Program Files', 'Steam/steamapps/common/Legends of Idleon/LegendsOfIdleon.exe'),
      path.join(process.cwd(), 'LegendsOfIdleon.exe'),
    ];
    let exePath = config.gameExePath && existsSync(config.gameExePath) ? config.gameExePath : null;
        if (!exePath) {
      for (const p of defaultSteamPaths) {
        if (existsSync(p)) {
          exePath = p;
          break;
        }
      }
    }
    if (exePath) {
      spawn(exePath, [`--remote-debugging-port=${CDP_PORT}`], { detached: true, stdio: 'ignore' });
    } else {
      // Use Steam protocol
      const steamUrl = `steam://run/${APP_ID}//--remote-debugging-port=${CDP_PORT}`;
      spawn('cmd', ['/c', 'start', '', steamUrl], { detached: true, stdio: 'ignore' });
    }
    // Poll for CDP endpoint
    return await pollForCDP(config.onTimeout || 30000);
  } catch (err) {
    logger.error('Windows auto-attach failed:', err);
    return manualFallback(config.onTimeout || 30000);
  }
}

export async function autoAttach(config: InjectorConfig): Promise<string> {
  if (process.platform === 'linux') {
    return attachLinux(config);
  } else if (process.platform === 'win32') {
    return attachWindows(config);
  } else {
    logger.error('Unsupported platform for autoAttach');
    throw new Error('Unsupported platform for autoAttach');
  }
} 