import Constants from 'expo-constants';

/** Port of the local demo server (`npm run market-data`). */
const DEMO_SERVER_PORT = 8787;

/**
 * The demo server runs on the same machine as Metro, so reuse Metro's host:
 * that's the laptop's LAN IP on a phone and "localhost" in a simulator or browser.
 */
export function demoServerUrl(): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0] || 'localhost';
  return `http://${host}:${DEMO_SERVER_PORT}`;
}
