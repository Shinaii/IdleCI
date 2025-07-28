import { autoAttach } from './attach';
import { injectCheats } from './inject';
import { connectToCDP } from './cdp';
import { getLogger } from '../lib/logger';
import { FullConfig } from '../types';

/**
 * Main injector runner. Loads config, attaches to the game, and injects cheats.
 * @param config The full merged config object
 * @param logLevel The log level to use for logging
 */
export async function runInjector(config: FullConfig, logLevel: string = 'info'): Promise<Awaited<ReturnType<typeof connectToCDP>>> {
  const logger = getLogger('Injector', logLevel);
  try {
    logger.debug(`Starting injector with config: ${JSON.stringify(config.injectorConfig)}`);
    logger.debug(`Injector config: ${JSON.stringify(config.injectorConfig)}`);

    logger.debug('Auto-attaching to game...');
    const wsUrl = await autoAttach(config.injectorConfig);
    logger.info(`Attached to game. WebSocket URL: ${wsUrl}`);

    logger.debug(`Connecting to CDP with config: ${JSON.stringify(config.injectorConfig)}`);
    const client = await connectToCDP(wsUrl, config.injectorConfig);
    logger.info('Connected to Chrome DevTools Protocol.');

    logger.debug('Starting cheat injection...');
    await injectCheats(client, config.cheatConfig, config.startupCheats, config.injectorConfig, logLevel);
    logger.debug('Cheat injection completed successfully');

    return client;

  } catch (err) {
    logger.error(`Injector error: ${err}`);
    throw err;
  }
}