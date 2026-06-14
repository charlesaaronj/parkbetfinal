// ui-setup.js
// Handles player entry, settings, and advanced options panel.

import { setPlayersFromNames, updateSettings, ensureGhostPlayer, setStep } from './state.js';
import { saveState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';

/**
 * Initialize Setup screen UI and events.
 */
export function initSetupUI(state) {
  const playerListEl = document.getElementById('player-list');
  const addPlayerBtn = document.getElementById('add-player-btn');
  const startPointsInput = document.getElementById('start-points-input');
  const toggleBonuses = document.getElementById('toggle-bonuses');
  const bonusNoOneInput = document.getElementById('bonus-no-one-guessed');
  const advancedToggle = document.getElementById('advanced-toggle');
  const advancedPanel = document.getElementById('advanced-panel');

  const tableStakesCheckbox = document.getElementById('toggle-table-stakes');
  const leaderRedisCheckbox = document.getElementById('toggle-leader-redistribution');
  const leaderThresholdInput = document.getElementById('leader-threshold');
  const catchupCheckbox = document.getElementById('toggle-catchup');
  const catchupThresholdInput = document.getElementById('catchup-threshold');
  const jackpotCheckbox = document.getElementById('toggle-jackpot');
  const maxRoundsInput = document.getElementById('max-rounds-input');

  const setupStartBtn = document.getElementById('setup-start-btn');
  const setupTutorialBtn = document.getElementById('setup-tutorial-btn');

  // Basic player list: start with 3 empty slots as a default
  if (!state.players || state.players.length === 0) {
    const names = ['Player 1', 'Player 2', 'Player 3'];
    setPlayersFromNames(state, names, state.settings.startPoints);
    saveState(state);
  }

  function renderPlayers() {
    playerListEl.innerHTML = '';
    state.players
      .filter(p => !p.isGhost)
      .forEach(p => {
        const row = document.createElement('div');
        row.className = 'player-row';

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.value = p.name;
        nameInput.className = 'player-name-input';
        nameInput.addEventListener('input', () => {
          p.name = nameInput.value;
          saveState(state);
        });

        const label = document.createElement('span');
        label.className = 'player-name';
        label.textContent = '';

        const scoreHint = document.createElement('span');
        scoreHint.className = 'player-score';
        scoreHint.textContent = `${state.settings.startPoints} pts start`;

        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.flexDirection = 'column';
        left.appendChild(nameInput);

        row.appendChild(left);
        row.appendChild(scoreHint);
        playerListEl.appendChild(row);
      });
  }

  renderPlayers();

  addPlayerBtn.addEventListener('click', () => {
    const newName = `Player ${state.players.length + 1}`;
    state.players.push({
      id: 'p' + (state.players.length + 1),
      name: newName,
      isGhost: false,
      score: state.settings.startPoints,
      stats: { correctGuesses: 0 }
    });
    ensureGhostPlayer(state);
    saveState(state);
    renderPlayers();
  });

  startPointsInput.value = state.settings.startPoints;
  startPointsInput.addEventListener('change', () => {
    const val = parseInt(startPointsInput.value || '10', 10);
    updateSettings(state, { startPoints: val });
    // reset scores to new start value in setup
    state.players.forEach(p => {
      p.score = val;
    });
    saveState(state);
    renderPlayers();
  });

  toggleBonuses.checked = state.settings.bonusesEnabled;
  toggleBonuses.addEventListener('change', () => {
    updateSettings(state, { bonusesEnabled: toggleBonuses.checked });
    saveState(state);
  });

  bonusNoOneInput.value = state.settings.bonusNoOneGuessed;
  bonusNoOneInput.addEventListener('change', () => {
    const val = parseInt(bonusNoOneInput.value || '2', 10);
    updateSettings(state, { bonusNoOneGuessed: val });
    saveState(state);
  });

  advancedToggle.addEventListener('click', () => {
    const isHidden = advancedPanel.classList.contains('hidden');
    advancedPanel.classList.toggle('hidden', !isHidden);
    advancedToggle.textContent = isHidden ? 'Hide Advanced' : 'Show Advanced';
  });

  tableStakesCheckbox.checked = state.settings.useTableStakes;
  tableStakesCheckbox.addEventListener('change', () => {
    updateSettings(state, { useTableStakes: tableStakesCheckbox.checked });
    saveState(state);
  });

  leaderRedisCheckbox.checked = state.settings.leaderRedistribution;
  leaderRedisCheckbox.addEventListener('change', () => {
    updateSettings(state, { leaderRedistribution: leaderRedisCheckbox.checked });
    saveState(state);
  });

  leaderThresholdInput.value = state.settings.leaderThreshold;
  leaderThresholdInput.addEventListener('change', () => {
    const val = parseInt(leaderThresholdInput.value || '20', 10);
    updateSettings(state, { leaderThreshold: val });
    saveState(state);
  });

  catchupCheckbox.checked = state.settings.useCatchup;
  catchupCheckbox.addEventListener('change', () => {
    updateSettings(state, { useCatchup: catchupCheckbox.checked });
    saveState(state);
  });

  catchupThresholdInput.value = state.settings.catchupThreshold;
  catchupThresholdInput.addEventListener('change', () => {
    const val = parseInt(catchupThresholdInput.value || '15', 10);
    updateSettings(state, { catchupThreshold: val });
    saveState(state);
  });

  jackpotCheckbox.checked = state.settings.useJackpotRounds;
  jackpotCheckbox.addEventListener('change', () => {
    updateSettings(state, { useJackpotRounds: jackpotCheckbox.checked });
    saveState(state);
  });

  maxRoundsInput.value = state.settings.maxRounds || '';
  maxRoundsInput.addEventListener('change', () => {
    const val = maxRoundsInput.value ? parseInt(maxRoundsInput.value, 10) : null;
    updateSettings(state, { maxRounds: val });
    saveState(state);
  });

  setupStartBtn.addEventListener('click', () => {
    // Ensure ghost if only 2 humans
    ensureGhostPlayer(state);
    setStep(state, 'question');
    saveState(state);
    renderStepIndicator('question');
    showScreen('question');
  });

  setupTutorialBtn.addEventListener('click', () => {
    const overlay = document.getElementById('tutorial-overlay');
    overlay.classList.remove('hidden');
  });
}
