import { getLogger } from "../lib/logger";

export function printHeader(version: string) {
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
    console.log(logo);
    console.log(`      v${version}\n`);
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
