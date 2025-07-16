import express from 'express';
import { getLogger } from '../lib/logger';
import { InjectorConfig } from '../types';
import path from 'path';

export class WebServerService {
  private app = express();
  private logger = getLogger('WebUI');
  private port: number;

  constructor(private config: InjectorConfig) {
    this.port = config.customUIPort || 8080;
    this.app.use(express.json());

    // Serve static files from the UI directory
    const uiPath = path.join(__dirname, 'ui');
    this.app.use(express.static(uiPath));
    
    this.app.get('/api/health', (req, res) => {
      res.json({ status: 'ok' });
    });

    // Catch-all: serve index.html for any non-API route (SPA support)
    this.app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        res.status(404).json({ error: 'API route not found' });
      } else {
        res.sendFile(path.join(uiPath, 'index.html'));
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
