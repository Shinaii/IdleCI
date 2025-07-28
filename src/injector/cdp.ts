import CDP from 'chrome-remote-interface';
import { getLogger } from '../lib/logger';

/**
 * Connects to the Chrome DevTools Protocol at the given WebSocket URL.
 * @param wsUrl WebSocket debugger URL
 * @param config Optional injector config for connection parameters
 * @returns The CDP client
 */
export async function connectToCDP(wsUrl: string, config?: { cdpConnectionTimeout?: number; cdpRetryAttempts?: number }): Promise<any> {
  const logger = getLogger('CDP', 'info');
  logger.debug(`Connecting to CDP at URL: ${wsUrl}`);
  logger.debug(`CDP connection config: ${JSON.stringify(config)}`);
  
  const cdpOptions = {
    tab: wsUrl,
    port: 32123,
    timeout: config?.cdpConnectionTimeout || 10000,
    retries: config?.cdpRetryAttempts || 3,
  };
  
  logger.debug(`CDP connection options: ${JSON.stringify(cdpOptions)}`);
  
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= cdpOptions.retries; attempt++) {
    logger.debug(`CDP connection attempt ${attempt}/${cdpOptions.retries}`);
    try {
      const client = await CDP(cdpOptions);
      logger.debug(`CDP connection successful on attempt ${attempt}`);
      return client;
    } catch (error) {
      lastError = error as Error;
      logger.debug(`CDP connection attempt ${attempt} failed: ${error}`);
      if (attempt < cdpOptions.retries) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        logger.debug(`Waiting ${backoffTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  logger.error(`All CDP connection attempts failed. Last error: ${lastError}`);
  throw lastError || new Error('Failed to connect to CDP after multiple attempts');
} 