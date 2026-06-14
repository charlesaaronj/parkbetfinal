// ui-adjustments.js
// Handles bonuses, catch-up, leader redistribution, jackpot flag, and finalizing round.

import { applyAdjustments, finalizeCurrentRound, setStep } from './state.js';
import { saveState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';

/**
 * Initialize Adjustments screen.
 */
export function initAdjustmentsUI(state) {
  const listEl = document.getElementById('adjustments-list');
  const honeyPotTextEl = document.getElementById('adjustments-honey-pot');
  const useJackpotCheckbox = document.getElementById('adjustments-use-jackpot');
  const applyBtn = document.getElementById('adjustments-apply-btn');
  const backBtn = document.getElementById('adjustments-back');

  applyBtn.addEventListener('click', () => {
    const adjustmentsLog = applyAdjustments(state);
    finalizeCurrentRound(state, adjustmentsLog);
    saveState(state);
    setStep(state, 'summary');
    renderStepIndicator('summary');
    showScreen('summary');
  });

  backBtn.addEventListener('click', () => {
    setStep(state, 'reveal');
    saveState(state);
    renderStepIndicator('reveal');
    showScreen('reveal');
  });

  useJackpotCheckbox.addEventListener('change', () => {
    state.currentRound.useJackpotThisRound = useJackpotCheckbox.checked;
    saveState(state);
  });

  function onEnterAdjustments() {
    const adjustmentsPreview = []; // For v1, we show simple text

    honeyPotTextEl.textContent = `Honey pot: ${state.honeyPot}`;
    useJackpotCheckbox.checked = state.currentRound.useJackpotThisRound;

    listEl.innerHTML = '';
    if (!state.settings.bonusesEnabled && !state.settings.useCatchup && !state.settings.leaderRedistribution) {
      const p = document.createElement('p');
      p.className = 'sub-text';
      p.textContent = 'No bonuses or adjustments enabled.';
      listEl.appendChild(p);
    } else {
      const p = document.createElement('p');
      p.className = 'sub-text';
      p.textContent = 'Bonuses and adjustments will be applied automatically when you continue.';
      listEl.appendChild(p);
    }
  }

  state.__onEnterAdjustments = onEnterAdjustments;
}
