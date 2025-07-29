import express from 'express';
import { getLogger } from '../lib/logger';
import { InjectorConfig } from '../types';
import path from 'path';
import fs from 'fs';
import { setupApiRoutes } from './apiRoutes';

// Helper function to read bundled files from pkg
function readBundledFile(filePath: string): string | null {
  const logger = getLogger('WebUI');
  try {
    // Try multiple possible paths for bundled files
    const possiblePaths = [
      path.join(__dirname, 'web', 'ui', filePath),
      path.join(__dirname, 'ui', filePath),
      path.join(__dirname, filePath),
      path.join(process.cwd(), 'dist', 'web', 'ui', filePath),
      path.join(process.cwd(), 'src', 'web', 'ui', filePath)
    ];
    
    for (const fullPath of possiblePaths) {
      try {
        if (fs.existsSync(fullPath)) {
          return fs.readFileSync(fullPath, 'utf8');
        }
      } catch (error) {
        // Continue to next path
      }
    }
    
    logger.error(`UI file not found: ${filePath}`);
    return null;
  } catch (error) {
    logger.error(`Error in readBundledFile: ${error}`);
    return null;
  }
}

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

    // Setup routes for bundled UI files
    this.setupUIRoutes();
    
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
  }

  private setupUIRoutes() {
    // Serve bundled UI files
    this.app.get('/', (req, res) => {
      const html = readBundledFile('index.html');
      if (html) {
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
      } else {
        this.logger.error('UI files not found - index.html');
        res.status(404).send('UI files not found');
      }
    });

    this.app.get('/script.js', (req, res) => {
      const js = readBundledFile('script.js');
      if (js) {
        res.setHeader('Content-Type', 'application/javascript');
        res.send(js);
      } else {
        this.logger.error('UI files not found - script.js');
        res.status(404).send('Script not found');
      }
    });

    this.app.get('/style.css', (req, res) => {
      const css = readBundledFile('style.css');
      if (css) {
        res.setHeader('Content-Type', 'text/css');
        res.send(css);
      } else {
        this.logger.error('UI files not found - style.css');
        res.status(404).send('Styles not found');
      }
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
