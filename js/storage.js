// storage.js
// Handles saving and loading game state from localStorage.[web:46]

const STORAGE_KEY = 'who-said-diz-state-v1';

/**
 * Load a previously saved state object from localStorage.
 * Returns null if nothing is saved.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load state', e);
    return null;
  }
}

/**
 * Save the current state object to localStorage.
 */
export function saveState(state) {
  try {
    const raw = JSON.stringify(state);
    localStorage.setItem(STORAGE_KEY, raw);
  } catch (e) {
    console.warn('Failed to save state', e);
  }
}

/**
 * Clear any saved state (used on restart).
 */
export function clearState() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear state', e);
  }
}
