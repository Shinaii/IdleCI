import CDP from 'chrome-remote-interface';

/**
 * Connects to the Chrome DevTools Protocol at the given WebSocket URL.
 * @param wsUrl WebSocket debugger URL
 * @returns The CDP client
 */
export async function connectToCDP(wsUrl: string): Promise<any> {
  // The 'target' option can be a WebSocket URL
  const client = await CDP({ target: wsUrl });
  return client;
} 