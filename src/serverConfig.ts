/**
 * Global server configuration state
 * This allows the server URL to be changed dynamically without
 * needing to pass it through React component props
 */

const DEFAULT_SERVER_URL = "http://localhost:3339";
const PUBLIC_SERVER_URL = "https://realtime512-example.neurosift.app";

// Current server URL - starts with default but can be changed
let currentServerUrl = DEFAULT_SERVER_URL;

// Listeners for server URL changes
type ServerUrlListener = (url: string) => void;
const listeners: Set<ServerUrlListener> = new Set();

/**
 * Get the current server URL
 */
export function getServerUrl(): string {
  return currentServerUrl;
}

/**
 * Set the server URL
 */
export function setServerUrl(url: string): void {
  currentServerUrl = url;
  // Notify all listeners
  listeners.forEach(listener => listener(url));
}

/**
 * Switch to using the public server
 */
export function usePublicServer(): void {
  setServerUrl(PUBLIC_SERVER_URL);
}

/**
 * Reset to the default local server
 */
export function useLocalServer(): void {
  setServerUrl(DEFAULT_SERVER_URL);
}

/**
 * Subscribe to server URL changes
 */
export function subscribeToServerUrl(listener: ServerUrlListener): () => void {
  listeners.add(listener);
  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Get the public server URL constant
 */
export function getPublicServerUrl(): string {
  return PUBLIC_SERVER_URL;
}

/**
 * Get the default local server URL constant
 */
export function getDefaultServerUrl(): string {
  return DEFAULT_SERVER_URL;
}
