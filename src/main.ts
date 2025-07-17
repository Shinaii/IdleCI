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
    // Print header
    const version = require('../package.json').version;
    printHeader(version);

    logger.info('Loading config...');
    const config = await loadConfig(customConfigPath);
    logger.info('Config loaded.');

    
    logger.info('Attaching to game...');
    const client = await runInjector(config, logLevel);


    // Create web server instance
    // let webServer: WebServerService | null = null;
    // if (config.injectorConfig.enableUI) {
    //   webServer = new WebServerService(config.injectorConfig);
    // }

    // Listen for page load event
    client.Page.loadEventFired(async () => {
      logger.info('Page load event fired.');
      // Wait for cheat context to be available and setup
      const contextVar = "window.document.querySelector('iframe').contentWindow.__idleon_cheats__";
      const cheatInitialized = await initializeCheatContext(client.Runtime, contextVar, logger);
      if (!cheatInitialized) return;

      // if (config.injectorConfig.enableUI) {
      //   webServer!.start();
      // }
    });
  } catch (err) {
    logger.error(`Fatal error: ${err}`);
    process.exit(1);
  }
}

main(); 