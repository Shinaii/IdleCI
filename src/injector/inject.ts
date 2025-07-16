
import fs from 'fs/promises';
import path from 'path';
import atob from 'atob';
import btoa from 'btoa';
import { getLogger } from '../lib/logger';
import { CheatConfig } from '../types';
import { connectToCDP } from './cdp';

/**
 * Injects cheats into the game context using CDP.
 * @param client The CDP client
 * @param cheatConfig The cheat configuration
 * @param startupCheats Array of cheat names to run on startup
 * @param config Injector config (must include interceptPattern, injreg, showConsoleLog)
 * @param logLevel The log level to use for logging
 */
export async function injectCheats(
  client: Awaited<ReturnType<typeof connectToCDP>>,
  cheatConfig: CheatConfig,
  startupCheats: string[] = [],
  config: { interceptPattern: string; injreg: string; showConsoleLog: boolean },
  logLevel: string = 'info'
): Promise<void> {
  const logger = getLogger('Injector', logLevel);
  logger.info('Injecting cheats...');
  logger.debug('injectCheats params:', { cheatConfig, startupCheats, config, logLevel });

  let cheats = await fs.readFile(path.join(process.cwd(), 'cheats.js'), 'utf8');
  logger.debug('Read cheats.js file');
  cheats = `let startupCheats = ${JSON.stringify(startupCheats)};\nlet cheatConfig = ${JSON.stringify(cheatConfig)};\n${cheats}`;
  logger.debug('Prepared cheats script for injection');

  logger.debug('Enabling CDP domains: Runtime, Page, Network, DOM');
  await Promise.all([
    (async () => { logger.debug('Enabling Runtime'); await client.Runtime.enable(); logger.debug('Runtime enabled'); })(),
    (async () => { logger.debug('Enabling Page'); await client.Page.enable(); logger.debug('Page enabled'); })(),
    (async () => { logger.debug('Enabling Network'); await client.Network.enable(); logger.debug('Network enabled'); })(),
    (async () => { logger.debug('Enabling DOM'); await client.DOM.enable(); logger.debug('DOM enabled'); })(),
  ]);

  logger.debug('Setting up request interception', config.interceptPattern);
  await client.Network.setRequestInterception({
    patterns: [
      {
        urlPattern: config.interceptPattern,
        resourceType: 'Script',
        interceptionStage: 'HeadersReceived',
      },
    ],
  });
  //debug pattern 
  logger.debug(`Interception Pattern: ${JSON.stringify(config.interceptPattern)}`);

  logger.debug('Setting bypass CSP');
  await client.Page.setBypassCSP({ enabled: true });
  logger.debug('Bypass CSP set');

  if (config.showConsoleLog) {
    logger.debug('Setting up Runtime.consoleAPICalled listener');
    client.Runtime.consoleAPICalled((entry: any) => {
      logger.info(entry.args.map((arg: any) => arg.value).join(' '));
    });
  }

  logger.debug('Injecting cheats script into page context');
  await client.Runtime.evaluate({ expression: cheats });
  logger.info('Loaded cheats...');

  logger.debug('Registering Network.requestIntercepted handler');
  client.Network.requestIntercepted(async ({ interceptionId, request }: any) => {
    logger.debug('requestIntercepted event fired', { interceptionId, url: request.url });
    try {
      logger.info(`Intercepted: ${request.url}`);
      logger.debug('Getting response body for interception');
      const response = await client.Network.getResponseBodyForInterception({ interceptionId });
      logger.debug('Got response body', { responseLength: response.body.length });
      const originalBody = atob(response.body);
      logger.debug('Decoded original body', { originalBodySnippet: originalBody.slice(0, 200) });
      const InjRegG = new RegExp(config.injreg, 'g');
      const VarName = new RegExp('^\\w+');
      const AppMain = InjRegG.exec(originalBody);
      logger.debug('Regex exec result', { AppMain });
      if (!AppMain) {
        logger.error(`Injection regex '${config.injreg}' did not match the script content. Cannot inject.`);
        await client.Network.continueInterceptedRequest({ interceptionId });
        return;
      }
      const AppVar = Array(AppMain.length).fill('');
      for (let i = 0; i < AppMain.length; i++) {
        const match = VarName.exec(AppMain[i]);
        AppVar[i] = match ? match[0] : '';
      }
      logger.debug('Extracted AppVar', { AppVar });
      let manipulatorResult = await client.Runtime.evaluate({ expression: 'getZJSManipulator()', awaitPromise: true });
      logger.debug('Manipulator result', { manipulatorResult });
      let newBody;
      if (manipulatorResult.result && manipulatorResult.result.type === 'string') {
        let manipulator = new Function('return ' + manipulatorResult.result.value)();
        newBody = manipulator(originalBody);
        logger.debug('Manipulator applied');
      } else {
        logger.warn('getZJSManipulator() did not return a valid function string. Applying basic injection only.');
        newBody = originalBody;
      }
      const replacementRegex = new RegExp(config.injreg);
      newBody = newBody.replace(replacementRegex, `window.__idleon_cheats__=${AppVar[0]};$&`);
      logger.debug('Injected window.__idleon_cheats__', { newBodySnippet: newBody.slice(0, 200) });
      logger.info('Updated game code...');
      const newHeaders = [
        `Date: ${(new Date()).toUTCString()}`,
        `Connection: closed`,
        `Content-Length: ${newBody.length}`,
        `Content-Type: text/javascript`,
      ];
      const newResponse = btoa(
        'HTTP/1.1 200 OK\r\n' +
        newHeaders.join('\r\n') +
        '\r\n\r\n' +
        newBody
      );
      logger.debug('Built new response', { newResponseLength: newResponse.length });
      await client.Network.continueInterceptedRequest({
        interceptionId,
        rawResponse: newResponse,
      });
      logger.info('Sent to game...');
      logger.info('Cheat injected!');
    } catch (error) {
      logger.error('Error during request interception:', error);
      try {
        await client.Network.continueInterceptedRequest({ interceptionId });
      } catch (continueError) {
        logger.error('Error trying to continue request after interception error:', continueError);
      }
    }
  });
  logger.info('Interception listener setup complete.');
  logger.debug('Reloading page to ensure interception is active for all requests...');
  await client.Page.reload({ ignoreCache: true }); //THIS IS SO FUCKING IMPORTANT!!! Else we will miss the request all the time.
} 