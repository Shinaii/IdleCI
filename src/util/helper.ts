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

export async function initializeCheatContext(Runtime: any, context: string, logLevel: string = 'info'): Promise<boolean> {
  const logger = getLogger('Game', logLevel);
  logger.info('Checking Cheat Context in Game...');
  logger.warn('This might look like it\'s frozen, but it\'s just waiting for the game to load.');
  const timeout = 30000; // ms
  const interval = 200; // ms
  const start = Date.now();

  while (Date.now() - start < timeout) {
    const contextExists = await Runtime.evaluate({ expression: `!!${context}` });
    if (contextExists.result.value) {
      // Execute the setup function from cheats.js within the game's context
      const init = await Runtime.evaluate({
        expression: `setup.call(${context})`,
        awaitPromise: true,
        allowUnsafeEvalBlockedByCSP: true
      });
      logger.info(`Cheat setup result: ${init.result.value}`);
      return true;
    }
    await new Promise(res => setTimeout(res, interval));
  }

  logger.error('Cheat context not found in iframe after waiting. Injection might have failed.');
  return false;
}
