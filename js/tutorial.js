// tutorial.js
// Handles the "How to Play" overlay.

import { saveState } from './storage.js';

export function initTutorial(state) {
  const overlay = document.getElementById('tutorial-overlay');
  const closeBtn = document.getElementById('tutorial-close');

  closeBtn.addEventListener('click', () => {
    overlay.classList.add('hidden');
    state.meta.hasSeenTutorial = true;
    saveState(state);
  });

  // Optionally show on first run
  if (!state.meta.hasSeenTutorial) {
    overlay.classList.remove('hidden');
  }
}
