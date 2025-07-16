import CDP from 'chrome-remote-interface';

/**
 * Connects to the Chrome DevTools Protocol at the given WebSocket URL.
 * @param wsUrl WebSocket debugger URL
 * @returns The CDP client
 */
export async function connectToCDP(wsUrl: string): Promise<any> {
  
  const cdpOptions = {
    tab: wsUrl,
    port: 32123
  }
  const client = await CDP(cdpOptions);
  return client;
} 