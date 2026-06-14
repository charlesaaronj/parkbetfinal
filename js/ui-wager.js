// ui-wager.js
// Handles showing selected answer, collecting guesses and wagers, and cancel/clear.

import { selectAnswerPlayer, setWagers, setStep } from './state.js';
import { saveState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';

/**
 * Initialize Wager screen.
 */
export function initWagerUI(state) {
  const questionTextEl = document.getElementById('wager-question-text');
  const selectedAnswerEl = document.getElementById('wager-selected-answer');
  const totalPotEl = document.getElementById('wager-total-pot');
  const honeyPotEl = document.getElementById('wager-honey-pot');
  const wagerPlayerListEl = document.getElementById('wager-player-list');

  const lockBtn = document.getElementById('wager-lock-btn');
  const clearBtn = document.getElementById('wager-clear-btn');
  const cancelRoundBtn = document.getElementById('wager-cancel-round-btn');
  const backBtn = document.getElementById('wager-back');

  function randomSelectAnswerPlayer() {
    const answers = state.currentRound.answers;
    if (!answers || answers.length === 0) return;
    const idx = Math.floor(Math.random() * answers.length);
    const chosen = answers[idx];
    selectAnswerPlayer(state, chosen.playerId);
    saveState(state);
  }

  function renderSelectedAnswer() {
    questionTextEl.textContent = state.currentRound.questionText || '';
    const answers = state.currentRound.answers || [];
    const playersById = Object.fromEntries(state.players.map(p => [p.id, p]));
    const authorId = state.currentRound.selectedAnswerPlayerId;
    let answerText = '';
    if (authorId) {
      const entry = answers.find(a => a.playerId === authorId);
      if (entry) {
        answerText = entry.text;
      }
    }
    selectedAnswerEl.textContent = answerText ? `Selected answer: "${answerText}"` : 'No answer selected.';
    totalPotEl.textContent = 'Total pot: not yet calculated';
    honeyPotEl.textContent = `Honey pot: ${state.honeyPot}`;
  }

  function renderWagerRows() {
    wagerPlayerListEl.innerHTML = '';
    const players = state.players;
    const authorId = state.currentRound.selectedAnswerPlayerId;

    players.forEach(p => {
      const row = document.createElement('div');
      row.className = 'player-row' + (p.isGhost ? ' ghost' : '');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = p.name;

      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'player-score';
      scoreSpan.textContent = `${Math.round(p.score)} pts`;

      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.flexDirection = 'column';
      left.appendChild(nameSpan);
      left.appendChild(scoreSpan);

      const controls = document.createElement('div');
      controls.className = 'wager-controls';

      const guessSelect = document.createElement('select');
      state.players.forEach(target => {
        const opt = document.createElement('option');
        opt.value = target.id;
        opt.textContent = target.name;
        guessSelect.appendChild(opt);
      });

      const wagerInput = document.createElement('input');
      wagerInput.type = 'number';
      wagerInput.min = '0';
      wagerInput.value = state.settings.useTableStakes ? '0' : '1';

      if (p.isGhost) {
        // Greyed-out and non-interactive
        row.classList.add('ghost');
        guessSelect.disabled = true;
        wagerInput.disabled = true;
      }

      controls.appendChild(guessSelect);
      controls.appendChild(wagerInput);

      row.appendChild(left);
      row.appendChild(controls);
      wagerPlayerListEl.appendChild(row);
    });
  }

  lockBtn.addEventListener('click', () => {
    const rows = wagerPlayerListEl.querySelectorAll('.player-row');
    const wagersInput = [];
    rows.forEach(row => {
      const nameEl = row.querySelector('.player-name');
      const player = state.players.find(p => p.name === nameEl.textContent);
      if (!player) return;
      const select = row.querySelector('select');
      const wagerInp = row.querySelector('input[type="number"]');
      const guessedId = select.value;
      const amount = parseInt(wagerInp.value || '0', 10);
      wagersInput.push({ playerId: player.id, guessedPlayerId: guessedId, amount });
    });

    setWagers(state, wagersInput);
    setStep(state, 'reveal');
    saveState(state);
    renderStepIndicator('reveal');
    showScreen('reveal');
  });

  clearBtn.addEventListener('click', () => {
    renderWagerRows();
  });

  cancelRoundBtn.addEventListener('click', () => {
    // Cancel round: no score changes, back to summary (or question if first round)
    setStep(state, 'summary');
    saveState(state);
    renderStepIndicator('summary');
    showScreen('summary');
  });

  backBtn.addEventListener('click', () => {
    setStep(state, 'answers');
    saveState(state);
    renderStepIndicator('answers');
    showScreen('answers');
  });

  function onEnterWager() {
    // If no selected answer yet, pick one
    if (!state.currentRound.selectedAnswerPlayerId) {
      randomSelectAnswerPlayer();
    }
    renderSelectedAnswer();
    renderWagerRows();
  }

  state.__onEnterWager = onEnterWager;
}
