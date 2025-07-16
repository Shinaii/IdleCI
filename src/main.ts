import { runInjector } from './injector';
import express from 'express';
import { getLogger } from './lib/logger';
import { loadConfig } from './config';
import { Command } from 'commander';
import { startWebServer } from './web/server';

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
const webLogger = getLogger('WebUI', logLevel);

async function main() {
  try {
    //Startup with Logo and Version
    const logo = `\x1b[36m
  _____    _ _       _____         _____ _                _     _____      _           _             
 |_   _|  | | |     |  _  |       /  __ \\ |              | |   |_   _|    (_)         | |            
   | |  __| | | ___ | | | |_ __   | /  \\/ |__   ___  __ _| |_    | | _ __  _  ___  ___| |_ ___  _ __ 
   | | / _\` | |/ _ \\| | | | '_ \\  | |   | '_ \\ / _ \\/ _\` | __|   | || '_ \\| |/ _ \\/ __| __/ _ \\| '__|
  _| || (_| | |  __/\\ \\_/ / | | | | \\__/\\ | | |  __/ (_| | |_   _| || | | | |  __/ (__| || (_) | |   
  \\___/\\__,_|_|\\___| \\___/|_| |_|  \\____/_| |_|\\___|\\__,_|\\__|  \\___/_| |_| |\\___|\\___|\\__\\___/|_|   
                                                                         _/ |                        
                                                                        |__/                         
  \x1b[0m`;
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const version = require('../package.json').version;
    console.log(logo);
    console.log(`      v${version}\n`);
    
    logger.info('Loading config...');
    const config = await loadConfig(customConfigPath);
    logger.info('Config loaded. Starting injector...');
    
    await runInjector(config, logLevel);
    logger.info('Injector succeeded.');

    if (config.injectorConfig.enableUI) {
      startWebServer(config.injectorConfig);
    }
  } catch (err) {
    logger.error(`Fatal error: ${err}`);
    process.exit(1);
  }
}

main(); 