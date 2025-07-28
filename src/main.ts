import { loadConfig } from './config';
import { initializeCheatContext, printHeader } from './util/helper';
import { WebServerService } from './web/server';
import { runInjector } from './injector';
import { injectCheats } from './injector/inject';
import { getLogger } from './lib/logger';
import { Command } from 'commander';

const program = new Command();
program
  .option('-d, --debug', 'Enable debug logging', false)
  .option('-c, --config <path>', 'Path to custom config file')
  .allowUnknownOption(false)
  .helpOption(false)
  .version('');
program.parse(process.argv);
const options = program.opts();
const logLevel = options.debug ? 'debug' : 'info';
const customConfigPath = options.config;

const logger = getLogger('Idle CI', logLevel);

async function main() {
  try {
    logger.debug('Starting IdleCI application...');
    logger.debug(`Command line options: ${JSON.stringify(options)}`);
    logger.debug(`Log level: ${logLevel}`);
    logger.debug(`Custom config path: ${customConfigPath}`);

    const version = require('../package.json').version;
    printHeader(version);

    logger.info('Loading config...');
    logger.debug(`Loading config from path: ${customConfigPath}`);
    const config = await loadConfig(customConfigPath);
    logger.info('Config loaded.');
    logger.debug(`Loaded config: ${JSON.stringify(config)}`);

    logger.info('Attaching to game...');
    logger.debug(`Starting injector with config: ${JSON.stringify(config)}`);
    const client = await runInjector(config, logLevel);
    logger.debug('Injector completed successfully');

    logger.debug('Setting up page load event listener...');
    client.Page.loadEventFired(async () => {
      logger.info('Page load event fired.');
      logger.debug('Page load event triggered, initializing cheat context...');
      
      const contextVar = "window.document.querySelector('iframe').contentWindow.__idleon_cheats__";
      logger.debug(`Cheat context variable: ${contextVar}`);
      logger.debug(`Cheat context timeout: ${config.injectorConfig.cheatContextTimeout}`);
      logger.debug(`Cheat context polling interval: ${config.injectorConfig.cheatContextPollingInterval}`);
      
      const cheatInitialized = await initializeCheatContext(
        client.Runtime, 
        contextVar, 
        logLevel,
        config.injectorConfig.cheatContextTimeout,
        config.injectorConfig.cheatContextPollingInterval
      );
      
      if (!cheatInitialized) {
        logger.error('Cheat context initialization failed');
        return;
      }
      
      logger.debug('Cheat context initialization completed successfully');
    });
    
    logger.debug('Main application setup completed');
  } catch (err) {
    logger.error(`Fatal error: ${err}`);
    process.exit(1);
  }
}

main(); 