// ui-summary.js
// Shows scores, history, and lets you start a new round or end game.

import { computeWinners, setStep } from './state.js';
import { saveState, clearState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';

/**
 * Initialize Summary UI.
 */
export function initSummaryUI(state) {
  const scoreboardEl = document.getElementById('summary-scoreboard');
  const honeyPotEl = document.getElementById('summary-honey-pot');
  const roundInfoEl = document.getElementById('summary-round-info');
  const historyEl = document.getElementById('summary-history');

  const newRoundBtn = document.getElementById('summary-new-round-btn');
  const endGameBtn = document.getElementById('summary-end-game-btn');
  const backBtn = document.getElementById('summary-back');

  newRoundBtn.addEventListener('click', () => {
    // Just go back to question selection for next round
    setStep(state, 'question');
    saveState(state);
    renderStepIndicator('question');
    showScreen('question');
  });

  endGameBtn.addEventListener('click', () => {
    setStep(state, 'end');
    saveState(state);
    renderStepIndicator('end');
    showScreen('end');
  });

  backBtn.addEventListener('click', () => {
    setStep(state, 'adjustments');
    saveState(state);
    renderStepIndicator('adjustments');
    showScreen('adjustments');
  });

  function renderSummary() {
    // Scoreboard
    const sorted = [...state.players].sort((a, b) => b.score - a.score);
    scoreboardEl.innerHTML = '';
    sorted.forEach(p => {
      const row = document.createElement('div');
      row.className = 'player-row' + (p.isGhost ? ' ghost' : '');
      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = p.name;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'player-score';
      scoreSpan.textContent = `${Math.round(p.score)} pts`;
      row.appendChild(nameSpan);
      row.appendChild(scoreSpan);
      scoreboardEl.appendChild(row);
    });

    honeyPotEl.textContent = `Honey pot: ${state.honeyPot}`;

    const roundCount = state.roundsHistory.length;
    const max = state.settings.maxRounds;
    if (max) {
      roundInfoEl.textContent = `Round ${roundCount} of ${max}`;
    } else {
      roundInfoEl.textContent = `Rounds played: ${roundCount}`;
    }

    // Simple read-only history
    historyEl.innerHTML = '';
    state.roundsHistory.forEach(r => {
      const card = document.createElement('div');
      card.className = 'player-row';
      const left = document.createElement('div');
      left.style.display = 'flex';
      left.style.flexDirection = 'column';

      const title = document.createElement('span');
      title.className = 'player-name';
      title.textContent = `${r.roundNumber}. ${r.questionText.slice(0, 40)}...`;

      const info = document.createElement('span');
      info.className = 'player-score';
      info.textContent = `Park ${r.parkId || ''} · Land ${r.landId || ''} · Attraction ${r.attractionId || ''}`;

      left.appendChild(title);
      left.appendChild(info);

      card.appendChild(left);
      historyEl.appendChild(card);
    });
  }

  function onEnterSummary() {
    renderSummary();
  }

  state.__onEnterSummary = onEnterSummary;

  // End screen behavior
  const endWinnerLine = document.getElementById('end-winner-line');
  const endFinalScores = document.getElementById('end-final-scores');
  const endRestartBtn = document.getElementById('end-restart-btn');

  endRestartBtn.addEventListener('click', () => {
    clearState();
    // Reload page to fully reset
    window.location.reload();
  });

  function onEnterEnd() {
    const { mainWinners, tieBreakerUsed } = computeWinners(state);
    endFinalScores.innerHTML = '';
    // show human scores
    const humans = state.players.filter(p => !p.isGhost);
    humans.sort((a, b) => b.score - a.score);
    humans.forEach(p => {
      const row = document.createElement('div');
      row.className = 'player-row';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = p.name;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'player-score';
      scoreSpan.textContent = `${Math.round(p.score)} pts (correct guesses: ${p.stats.correctGuesses || 0})`;
      row.appendChild(nameSpan);
      row.appendChild(scoreSpan);
      endFinalScores.appendChild(row);
    });

    if (mainWinners.length === 0) {
      endWinnerLine.textContent = 'No winner determined.';
    } else if (mainWinners.length === 1) {
      endWinnerLine.textContent = `Winner: ${mainWinners[0].name}` + (tieBreakerUsed ? ' (by tiebreak)' : '');
    } else {
      const names = mainWinners.map(p => p.name).join(', ');
      endWinnerLine.textContent = `Winners: ${names}` + (tieBreakerUsed ? ' (tied even after tiebreak)' : '');
    }
  }

  state.__onEnterEnd = onEnterEnd;
}
