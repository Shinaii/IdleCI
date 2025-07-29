import { getLogger } from "../lib/logger";
import * as readline from 'readline';
import { exec } from 'child_process';

// Suppress experimental fetch API warning
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.message.includes('Fetch API')) {
    return; // Suppress fetch API warnings
  }
  console.warn(warning.name, warning.message);
});

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
}

export class UpdateChecker {
  private logger: any;
  private rl: readline.Interface;

  constructor(logLevel: string = 'info') {
    this.logger = getLogger('Updater', logLevel);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  private async fetchLatestVersion(): Promise<string | null> {
    try {
      this.logger.debug('Fetching latest version from GitHub...');
      
      // Using GitHub API to get the latest release with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('https://api.github.com/repos/Shinaii/IdleCI/releases/latest', {
        headers: {
          'User-Agent': 'IdleCI-UpdateChecker/1.0.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        this.logger.error(`Failed to fetch latest version: ${response.status} ${response.statusText}`);
        return null;
      }

      const release: GitHubRelease = await response.json();
      this.logger.debug(`Latest release: ${release.tag_name}`);
      
      // Remove 'v' prefix if present
      return release.tag_name.replace(/^v/, '');
    } catch (error) {
      this.logger.error(`Error fetching latest version: ${error}`);
      return null;
    }
  }

  private openBrowser(url: string): Promise<void> {
    return new Promise((resolve) => {
      const platform = process.platform;
      let command: string;

      switch (platform) {
        case 'win32':
          command = `cmd /c start "" "${url}"`;
          break;
        case 'darwin':
          command = `open "${url}"`;
          break;
        default:
          command = `xdg-open "${url}"`;
          break;
      }

      this.logger.debug(`[Updater] Executing command: ${command}`);
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.logger.error(`[Updater] Failed to open browser: ${error.message}`);
          this.logger.error(`[Updater] stderr: ${stderr}`);
          this.logger.info(`[Updater] Please manually visit: ${url}`);
        } else {
          this.logger.info(`[Updater] Opened browser to: ${url}`);
          if (stdout) this.logger.debug(`[Updater] stdout: ${stdout}`);
        }
        resolve();
      });
    });
  }

  private async askUserForUpdate(): Promise<boolean> {
    return new Promise(async (resolve) => {
      this.rl.question('\n[Updater] Do you want to update? (y/n): ', async (answer) => {
        const normalizedAnswer = answer.toLowerCase().trim();
        if (normalizedAnswer === 'y' || normalizedAnswer === 'yes') {
          this.logger.info('[Updater] Update requested. Opening browser to download page...');
          try {
            await this.openBrowser('https://github.com/Shinaii/IdleCI/releases');
            // Small delay to ensure browser opens before exit
            setTimeout(() => {
              resolve(true);
            }, 1000);
          } catch (error) {
            this.logger.error(`[Updater] Error opening browser: ${error}`);
            resolve(true);
          }
        } else {
          this.logger.info('[Updater] Update declined. Proceeding with current version...');
          resolve(false);
        }
      });
    });
  }

  private compareVersions(currentVersion: string, latestVersion: string): boolean {
    const currentClean = currentVersion.split('-')[0];
    const latestClean = latestVersion.split('-')[0];
    
    const current = currentClean.split('.').map(Number);
    const latest = latestClean.split('.').map(Number);
    
    for (let i = 0; i < Math.max(current.length, latest.length); i++) {
      const currentPart = current[i] || 0;
      const latestPart = latest[i] || 0;
      
      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }
  
    if (currentVersion !== latestVersion) {
      return true;
    }
    
    return false; // Versions are truly equal
  }

  public async checkForUpdates(currentVersion: string): Promise<boolean> {
    this.logger.info(`[Updater] Current Version: ${currentVersion}`);
    
    const latestVersion = await this.fetchLatestVersion();
    
    if (!latestVersion) {
      this.logger.warn('[Updater] Could not fetch latest version from GitHub. Proceeding with current version...');
      return false;
    }

    this.logger.info(`[Updater] GitHub Version: ${latestVersion}`);
    
    if (this.compareVersions(currentVersion, latestVersion)) {
      this.logger.info('[Updater] A newer version is available!');
      return await this.askUserForUpdate();
    } else {
      this.logger.info('[Updater] You are running the latest version.');
      return false;
    }
  }

  public close(): void {
    this.rl.close();
  }
} 