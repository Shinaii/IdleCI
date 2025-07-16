import express from 'express';
import { getLogger } from '../lib/logger';
import { InjectorConfig } from '../types';

export class WebServerService {
  private app = express();
  private logger = getLogger('WebUI');
  private port: number;

  constructor(private config: InjectorConfig) {
    this.port = config.customUIPort || 8080;
    this.app.use(express.json());
    // Endpoints for later
    this.app.get('/', (req, res) => res.send('IdleCI Backend Running'));
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
