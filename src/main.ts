import { loadConfig } from './config';
import { initializeCheatContext, printHeader } from './util/helper';
import { WebServerService } from './web/server';
import { runInjector } from './injector';
import { injectCheats } from './injector/inject';
import { getLogger } from './lib/logger';
import { startCliInterface } from './cli';
import { Command } from 'commander';

const program = new Command();
program
  .option('-d, --debug', 'Enable debug logging', false)
  .option('-c, --config <path>', 'Path to custom config file')
  .option('--cli', 'Enable CLI interface (default)', true)
  .option('--no-cli', 'Disable CLI interface', false)
  .allowUnknownOption(false)
  .helpOption(false)
  .version('');
program.parse(process.argv);
const options = program.opts();
const logLevel = options.debug ? 'debug' : 'info';
const customConfigPath = options.config;

// CLI logic - check command line first, then config
const cliDisabledByCommandLine = process.argv.includes('--no-cli');

const logger = getLogger('Idle CI', logLevel);

async function main() {
  try {
    logger.debug('Starting IdleCI application...');
    logger.debug(`Command line options: ${JSON.stringify(options)}`);
    logger.debug(`Raw options.cli value: ${options.cli}`);
    logger.debug(`Process argv: ${JSON.stringify(process.argv)}`);
    logger.debug(`CLI disabled by command line: ${cliDisabledByCommandLine}`);
    logger.debug(`Log level: ${logLevel}`);
    logger.debug(`Custom config path: ${customConfigPath}`);

    const version = require('../package.json').version;
    printHeader(version);

    logger.info('Loading config...');
    logger.debug(`Loading config from path: ${customConfigPath}`);
    const config = await loadConfig(customConfigPath);
    logger.info('Config loaded.');
    logger.debug(`Loaded config: ${JSON.stringify(config)}`);

    // Determine if CLI should be enabled
    const configCliEnabled = config.injectorConfig.enableCli !== false; // Default to true
    const enableCli = !cliDisabledByCommandLine && configCliEnabled;
    
    logger.debug(`Config CLI enabled: ${configCliEnabled}`);
    logger.debug(`Final CLI enabled: ${enableCli}`);

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

      // Start CLI interface if enabled (after web UI)
      if (enableCli) {
        logger.debug('Starting CLI interface...');
        try {
          // Add a small delay to ensure web UI is ready before CLI starts
          setTimeout(async () => {
            await startCliInterface(
              contextVar,
              client,
              {
                injectorConfig: config.injectorConfig,
                cdpPort: 32123
              }
            );
          }, 1500); // 1.5 seconds delay to ensure web UI is ready
        } catch (cliError) {
          logger.error(`CLI interface error: ${cliError}`);
          console.error('CLI interface failed:', cliError);
        }
      } else {
        logger.debug('CLI interface disabled, keeping application running...');
        // Keep the application running even without CLI
        console.log('Injection completed successfully. CLI interface is disabled.');
        console.log('The application will continue running in the background.');
      }
    });
    
    logger.debug('Main application setup completed');
  } catch (err) {
    logger.error(`Fatal error: ${err}`);
    process.exit(1);
  }
}

main(); 