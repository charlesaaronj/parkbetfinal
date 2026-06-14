// ui-reveal.js
// Handles countdown and showing base scoring results.

import { applyRoundBaseScoring, setStep } from './state.js';
import { saveState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';

/**
 * Initialize Reveal screen.
 */
export function initRevealUI(state) {
  const questionTextEl = document.getElementById('reveal-question-text');
  const answerTextEl = document.getElementById('reveal-answer-text');
  const totalPotEl = document.getElementById('reveal-total-pot');
  const countdownEl = document.getElementById('reveal-countdown');
  const authorLineEl = document.getElementById('reveal-author-line');
  const resultsListEl = document.getElementById('reveal-results-list');
  const nextBtn = document.getElementById('reveal-next-btn');
  const backBtn = document.getElementById('reveal-back');

  let countdownTimer = null;

  function renderBaseInfo() {
    const round = state.currentRound;
    questionTextEl.textContent = round.questionText || '';

    const answers = round.answers || [];
    const authorId = round.selectedAnswerPlayerId;
    const authorAnswer = answers.find(a => a.playerId === authorId);
    answerTextEl.textContent = authorAnswer ? `"${authorAnswer.text}"` : '';

    totalPotEl.textContent = `Total pot (before bonuses): ${round.basePot}`;
  }

  function startCountdown() {
    let value = 3;
    countdownEl.textContent = String(value);
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      value -= 1;
      if (value <= 0) {
        clearInterval(countdownTimer);
        countdownEl.textContent = '';
        revealAuthorAndResults();
      } else {
        countdownEl.textContent = String(value);
      }
    }, 600);
  }

  function revealAuthorAndResults() {
    const round = state.currentRound;
    const author = state.players.find(p => p.id === round.selectedAnswerPlayerId);
    if (author) {
      authorLineEl.textContent = `${author.name} said diz.`;
    } else {
      authorLineEl.textContent = 'Author not found.';
    }

    resultsListEl.innerHTML = '';
    state.players.forEach(p => {
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
      resultsListEl.appendChild(row);
    });
  }

  nextBtn.addEventListener('click', () => {
    setStep(state, 'adjustments');
    saveState(state);
    renderStepIndicator('adjustments');
    showScreen('adjustments');
  });

  backBtn.addEventListener('click', () => {
    setStep(state, 'wager');
    saveState(state);
    renderStepIndicator('wager');
    showScreen('wager');
  });

  function onEnterReveal() {
    // Apply base scoring once upon entering this screen
    applyRoundBaseScoring(state);
    saveState(state);
    renderBaseInfo();
    authorLineEl.textContent = '';
    resultsListEl.innerHTML = '';
    startCountdown();
  }

  state.__onEnterReveal = onEnterReveal;
}
