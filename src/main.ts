import { loadConfig } from './config';
import { initializeCheatContext, printHeader } from './util/helper';
import { WebServerService } from './web/server';
import { runInjector } from './injector';
import { injectCheats } from './injector/inject';
import { getLogger } from './lib/logger';
import { Command } from 'commander';
import { UpdateChecker } from './util/updateChecker';


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
    logger.debug(`Process argv: ${JSON.stringify(process.argv)}`);
    logger.debug(`Log level: ${logLevel}`);
    logger.debug(`Custom config path: ${customConfigPath}`);

    const version = require('../package.json').version;
    printHeader(version);

    // Check for updates
    logger.info('Checking for updates...');
    const updateChecker = new UpdateChecker(logLevel);
    const shouldUpdate = await updateChecker.checkForUpdates(version);
    updateChecker.close();
    
    if (shouldUpdate) {
      logger.info('Update requested. Exiting program...');
      process.exit(0);
    }

    logger.info('Loading config...');
    logger.debug(`Loading config from path: ${customConfigPath}`);
    const config = await loadConfig(customConfigPath);
    logger.info('Config loaded.');
    logger.debug(`Loaded config: ${JSON.stringify(config)}`);

    // CLI interface is now integrated into the WebUI Terminal
    const enableCli = config.injectorConfig.enableCli !== false; // Default to true
    
    logger.debug(`CLI interface enabled: ${enableCli}`);

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

      // Start web UI if enabled
      if (config.injectorConfig.enableUI) {
        logger.debug('Starting web UI server...');
        const webServer = new WebServerService(
          config.injectorConfig,
          contextVar,
          client,
          config.cheatConfig,
          config.startupCheats,
          version
        );
        webServer.start();
        logger.debug('Web UI server started successfully');
      }

      // CLI interface is integrated into the WebUI Terminal
      if (enableCli) {
        logger.info('CLI Terminal integrated into WebUI');
      } else {
        logger.debug('CLI Terminal disabled');
      }
    });
    
    logger.debug('Main application setup completed');
  } catch (err) {
    logger.error(`Fatal error: ${err}`);
    process.exit(1);
  }
}

main(); 