/**
 * Passcode storage utility for server authentication
 * Stores passcodes in sessionStorage keyed by server URL
 */

/**
 * Get the storage key for a server URL
 */
function getStorageKey(serverUrl: string): string {
  return `chatgeneral_passcode_${serverUrl}`;
}

/**
 * Get the stored passcode for a server URL
 */
export function getStoredPasscode(serverUrl: string): string | null {
  try {
    return sessionStorage.getItem(getStorageKey(serverUrl));
  } catch (error) {
    console.error("Error reading passcode from sessionStorage:", error);
    return null;
  }
}

/**
 * Store a passcode for a server URL
 */
export function storePasscode(serverUrl: string, passcode: string): void {
  try {
    sessionStorage.setItem(getStorageKey(serverUrl), passcode);
  } catch (error) {
    console.error("Error storing passcode in sessionStorage:", error);
  }
}

/**
 * Clear the stored passcode for a server URL
 */
export function clearPasscode(serverUrl: string): void {
  try {
    sessionStorage.removeItem(getStorageKey(serverUrl));
  } catch (error) {
    console.error("Error clearing passcode from sessionStorage:", error);
  }
}

/**
 * Prompt the user for a passcode using window.prompt
 * Returns the passcode if entered, or null if cancelled
 */
export function promptForPasscode(serverUrl: string): string | null {
  const passcode = window.prompt(
    `Enter passcode for server:\n${serverUrl}`,
    ""
  );
  
  if (passcode !== null && passcode.trim() !== "") {
    return passcode.trim();
  }
  
  return null;
}

/**
 * Get passcode for a server, prompting if not stored
 * Stores the passcode if successfully entered
 */
export async function getOrPromptPasscode(serverUrl: string): Promise<string | null> {
  // First check if we have a stored passcode
  let passcode = getStoredPasscode(serverUrl);
  
  if (passcode) {
    return passcode;
  }
  
  // If not stored, prompt the user
  passcode = promptForPasscode(serverUrl);
  
  if (passcode) {
    storePasscode(serverUrl, passcode);
  }
  
  return passcode;
}
