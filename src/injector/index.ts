import { autoAttach } from './attach';
import { injectCheats } from './cheats';
import { connectToCDP } from './cdp';
import { getLogger } from '../lib/logger';
import { FullConfig } from '../types';

/**
 * Main injector runner. Loads config, attaches to the game, and injects cheats.
 * @param config The full merged config object
 * @param logLevel The log level to use for logging
 */
export async function runInjector(config: FullConfig, logLevel: string = 'info') {
  const logger = getLogger('Injector', logLevel);
  try {
    logger.debug(`Injector config: ${JSON.stringify(config.injectorConfig)}`);

    const wsUrl = await autoAttach(config.injectorConfig);
    logger.info('Attached to game. WebSocket URL:', wsUrl);

    const client = await connectToCDP(wsUrl);
    logger.info('Connected to Chrome DevTools Protocol.');

    //TODO: Inject cheats
    //await injectCheats(client, config.cheatConfig);
  } catch (err) {
    logger.error(`Injector error: ${err}`);
    throw err;
  }
} 