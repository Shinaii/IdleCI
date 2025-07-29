
import fs from 'fs/promises';
import path from 'path';
import atob from 'atob';
import btoa from 'btoa';
import { getLogger } from '../lib/logger';
import { CheatConfig } from '../types';
import { connectToCDP } from './cdp';
import { initializeCheatContext } from '../util/helper';

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
  logger.info('Setting up Injector...');
  logger.debug(`injectCheats params: ${JSON.stringify({ cheatConfig, startupCheats, config, logLevel })}`);

  logger.debug('Enabling CDP domains in parallel...');
  const domainPromises = [
    client.Runtime.enable(),
    client.Page.enable(),
    client.Network.enable(),
    client.DOM.enable()
  ];
  
  await Promise.all(domainPromises);
  logger.debug('All CDP domains enabled successfully');

  logger.debug(`Setting up request interception with pattern: ${config.interceptPattern}`);
  await client.Network.setRequestInterception({
    patterns: [
      {
        urlPattern: config.interceptPattern,
        resourceType: 'Script',
        interceptionStage: 'HeadersReceived',
      },
    ],
  });
  logger.debug('Request interception configured successfully');

  logger.debug('Setting up request interception listener...');
  client.Network.requestIntercepted(async ({ interceptionId, request }: any) => {
    logger.debug(`requestIntercepted event fired: ${interceptionId}, ${request.url}`);
    try {
      logger.info(`Intercepted: ${request.url}`);
      logger.debug('Getting response body for interception');
      const response = await client.Network.getResponseBodyForInterception({ interceptionId });
      logger.debug(`Got response body: ${response.body.length} bytes`);
      const originalBody = atob(response.body);
      logger.debug(`Decoded original body: ${originalBody.slice(0, 200)}...`);
      
      const InjRegG = new RegExp(config.injreg, 'g');
      const VarName = new RegExp('^\\w+');
      const AppMain = InjRegG.exec(originalBody);
      logger.debug(`Regex exec result: ${AppMain}`);
      
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
      logger.debug(`Extracted AppVar: ${AppVar}`);
      
      logger.debug('Evaluating getZJSManipulator()...');
      let manipulatorResult = await client.Runtime.evaluate({ expression: 'getZJSManipulator()', awaitPromise: true });
      logger.debug(`Manipulator result: ${JSON.stringify(manipulatorResult)}`);
      
      let newBody;
      if (manipulatorResult.result && manipulatorResult.result.type === 'string') {
        logger.debug('Creating manipulator function...');
        let manipulator = new Function('return ' + manipulatorResult.result.value)();
        newBody = manipulator(originalBody);
        logger.debug('Manipulator applied successfully');
      } else {
        logger.warn('getZJSManipulator() did not return a valid function string. Applying basic injection only.');
        newBody = originalBody;
      }
      
      const replacementRegex = new RegExp(config.injreg);
      newBody = newBody.replace(replacementRegex, `window.__idleon_cheats__=${AppVar[0]};$&`);
      logger.debug(`Injected window.__idleon_cheats__: ${newBody.slice(0, 200)}...`);
      logger.info('Updated game code...');
      
      const newHeaders = [
        `Date: ${(new Date()).toUTCString()}`,
        `Connection: closed`,
        `Content-Length: ${newBody.length}`,
        `Content-Type: text/javascript`,
      ];
      logger.debug(`Building new response headers: ${JSON.stringify(newHeaders)}`);
      
      const newResponse = btoa(
        'HTTP/1.1 200 OK\r\n' +
        newHeaders.join('\r\n') +
        '\r\n\r\n' +
        newBody
      );
      logger.debug(`Built new response, length: ${newResponse.length}`);
      
      await client.Network.continueInterceptedRequest({
        interceptionId,
        rawResponse: newResponse,
      });
      logger.info('Sending Updated Script to Game...');
    } catch (error) {
      logger.error(`Error during request interception: ${error}`);
      try {
        await client.Network.continueInterceptedRequest({ interceptionId });
      } catch (continueError) {
        logger.error(`Error trying to continue request after interception error: ${continueError}`);
      }
    }
  });

  logger.debug('Setting bypass CSP...');
  await client.Page.setBypassCSP({ enabled: true });
  logger.debug('Bypass CSP set successfully');

  if (config.showConsoleLog) {
    logger.debug('Setting up Runtime.consoleAPICalled listener');
    client.Runtime.consoleAPICalled((entry: any) => {
      logger.info(entry.args.map((arg: any) => arg.value).join(' '));
    });
  }

  logger.debug('Preparing cheats script for injection...');
  let cheats = await fs.readFile(path.join(process.cwd(), 'cheats.js'), 'utf8');
  logger.debug(`Read cheats.js file, size: ${cheats.length} characters`);
  
  const objToString = (obj: any): string => {
    let ret = "{";
    for (let k in obj) {
      let v = obj[k];
      if (typeof v === "function") {
        v = v.toString();
      } else if (typeof v === 'boolean') {
        v = v;
      } else if (Array.isArray(v)) {
        v = JSON.stringify(v);
      } else if (typeof v === "object") {
        //Issue #2 - functions where Native code on Compiling thats why we have to declare it as a fn in default config
        if (v && v.__isFunction && v.__functionString) {
          v = v.__functionString;
        } else {
          v = objToString(v);
        }
      } else {
        v = `"${v}"`;
      }
      ret += `\n  ${k}: ${v},`;
    }
    ret += "\n}";
    return ret;
  };

  logger.debug('Serializing config...');
  const configData = `let startupCheats = ${JSON.stringify(startupCheats)};\nlet cheatConfig = ${objToString(cheatConfig)};\n`;

  cheats = configData + cheats;

  logger.debug(`Prepared cheats script with config data, total size: ${cheats.length} characters`);
  
  logger.debug('Injecting cheats script into page context...');
  await client.Runtime.evaluate({ expression: cheats });
  logger.info('Loaded cheats...');
  logger.info('Interception listener setup complete.');
} 