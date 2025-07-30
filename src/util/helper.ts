import { getLogger } from "../lib/logger";

// Conditional imports for pkg compatibility
let chalk: any;
let gradient: any;

try {
  chalk = require("chalk");
  gradient = require("gradient-string");
} catch (error) {
  // Packages not available, will use fallback
}

// Clean, embedded ASCII logo - no external dependencies needed!
function getIdleCILogo(): string[] {
  return [
    '    ██╗██████╗ ██╗     ███████╗ ██████╗██╗',
    '    ██║██╔══██╗██║     ██╔════╝██╔════╝██║',
    '    ██║██║  ██║██║     █████╗  ██║     ██║',
    '    ██║██║  ██║██║     ██╔══╝  ██║     ██║',
    '    ██║██████╔╝███████╗███████╗╚██████╗██║',
    '    ╚═╝╚═════╝ ╚══════╝╚══════╝ ╚═════╝╚═╝',
    ''
  ];
}

export function printHeader(version: string) {

  try {
    console.log('\n');
  
    const logoLines = getIdleCILogo();

    const mainGradient = gradient([
      { color: '#667eea', pos: 0 },
      { color: '#764ba2', pos: 0.5 },
      { color: '#f093fb', pos: 1 }
    ]);
    
    const subtitleGradient = gradient([
      { color: '#667eea', pos: 0 },
      { color: '#764ba2', pos: 0.5 },
      { color: '#f093fb', pos: 1 }
    ]);
    
    const borderGradient = gradient([
      { color: '#00c6ff', pos: 0 },
      { color: '#0072ff', pos: 1 }
    ]);
    
    logoLines.forEach((line: string) => {
      console.log(mainGradient(line));
    });
    
    console.log(subtitleGradient('   🎮 Legends of Idleon Cheat Injector 🚀'));
    
    console.log(chalk.gray('   ') + 
                chalk.bold.cyan(`v${version}`) + 
                chalk.gray(' | ') + 
                chalk.yellow.bold('Full WebUI') +
                chalk.gray(' | ') +
                chalk.magenta.bold('Reworked in TypeScript'));

    console.log('\n');

    const readyMessage = gradient.rainbow('🚀 Ready to dominate Legends of Idleon! 🚀');
    console.log(chalk.bold('   ') + readyMessage);
    
    console.log('\n');
    
    } catch (error) {
      console.log(error);
  }
}


export async function initializeCheatContext(
  Runtime: any, 
  context: string, 
  logLevel: string = 'info',
  timeout?: number,
  pollingInterval?: number
): Promise<boolean> {
  const logger = getLogger('Game', logLevel);
  logger.info('Checking Cheat Context in Game...');
  logger.warn('This might look like it\'s frozen, but it\'s just waiting for the game to load.');
  
  const finalTimeout = timeout || 30000;
  const finalInterval = pollingInterval || 100;
  const start = Date.now();
  
  logger.debug(`Cheat context initialization parameters: ${JSON.stringify({
    context,
    timeout: finalTimeout,
    pollingInterval: finalInterval,
    logLevel
  })}`);

  while (Date.now() - start < finalTimeout) {
    const elapsed = Date.now() - start;
    logger.debug(`Checking cheat context (elapsed: ${elapsed}ms)...`);
    
    try {
      logger.debug(`Evaluating context expression: ${context}`);
      const contextExists = await Runtime.evaluate({ expression: `!!${context}` });
      logger.debug(`Context evaluation result: ${JSON.stringify(contextExists)}`);
      
      if (contextExists.result.value) {
        logger.debug('Cheat context found! Setting up cheats...');
        
        logger.debug('Evaluating setup.call() in game context...');
        const init = await Runtime.evaluate({
          expression: `setup.call(${context})`,
          awaitPromise: true,
          allowUnsafeEvalBlockedByCSP: true
        });
        logger.debug(`Setup call result: ${JSON.stringify(init)}`);
        logger.info(`Cheat setup result: ${init.result.value}`);
        return true;
      } else {
        logger.debug('Cheat context not found yet, will retry...');
      }
    } catch (error) {
      logger.debug(`Context evaluation failed, retrying... (${error})`);
    }
    
    logger.debug(`Waiting ${finalInterval}ms before next check...`);
    await new Promise(res => setTimeout(res, finalInterval));
  }

  const totalElapsed = Date.now() - start;
  logger.error(`Cheat context not found in iframe after ${totalElapsed}ms. Injection might have failed.`);
  return false;
}
