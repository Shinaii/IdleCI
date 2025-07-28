import express from 'express';
import { getLogger } from '../lib/logger';
import { InjectorConfig } from '../types';
import path from 'path';
import fs from 'fs';
import { setupApiRoutes } from './apiRoutes';

export class WebServerService {
  private app = express();
  private logger = getLogger('WebUI');
  private port: number;

  constructor(
    private config: InjectorConfig,
    private context?: string,
    private client?: any,
    private cheatConfig?: any,
    private startupCheats?: string[],
    private version?: string
  ) {
    this.port = config.customUIPort || 8080;
    this.app.use(express.json());

    // Determine UI path for both development and packaged environments
    let uiPath: string;
    
    // Check if we're in a packaged environment (pkg)
    if ((process as any).pkg) {
      // In packaged environment, assets are in the executable
      uiPath = path.join(process.execPath, '../ui');
    } else {
      // In development, use __dirname
      uiPath = path.join(__dirname, 'ui');
    }
    
    // Fallback: try to find UI files in common locations
    if (!fs.existsSync(uiPath)) {
      const possiblePaths = [
        path.join(__dirname, 'ui'),
        path.join(process.cwd(), 'dist', 'web', 'ui'),
        path.join(process.cwd(), 'src', 'web', 'ui'),
        path.join(process.execPath, '../ui'),
        path.join(process.execPath, '../../ui')
      ];
      
      for (const testPath of possiblePaths) {
        if (fs.existsSync(testPath)) {
          uiPath = testPath;
          break;
        }
      }
    }
    
    this.logger.info(`Using UI path: ${uiPath}`);
    
    if (!fs.existsSync(uiPath)) {
      this.logger.error(`UI directory not found at: ${uiPath}`);
      throw new Error(`UI directory not found. Tried: ${uiPath}`);
    }

    this.app.use(express.static(uiPath));
    
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Setup API routes if context and client are provided
    if (this.context && this.client && this.cheatConfig && this.startupCheats) {
      setupApiRoutes(this.app, this.context, this.client, {
        cheatConfig: this.cheatConfig,
        startupCheats: this.startupCheats,
        injectorConfig: this.config,
        cdpPort: 32123,
        version: this.version
      });
    }

    // Serve index.html for the root route
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(uiPath, 'index.html'));
    });
  }

  start() {
    this.app.listen(this.port, () => {
      this.logger.info(`WebUI running at http://localhost:${this.port}`);
    });
  }
}

export function startWebServer(config: InjectorConfig) {
  const service = new WebServerService(config);
  service.start();
  return service;
}
