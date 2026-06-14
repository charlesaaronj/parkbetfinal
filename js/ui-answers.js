// ui-answers.js
// Handles entering answers one at a time.

import { addAnswer, setStep } from './state.js';
import { saveState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';

/**
 * Initialize Answers screen.
 */
export function initAnswersUI(state) {
  const questionTextEl = document.getElementById('answers-question-text');
  const currentPlayerEl = document.getElementById('answers-current-player');
  const answerInput = document.getElementById('answer-input');
  const savePassBtn = document.getElementById('answers-save-pass-btn');
  const clearBtn = document.getElementById('answers-clear-btn');
  const backBtn = document.getElementById('answers-back');

  let answerOrder = [];
  let currentIndex = 0;

  function refreshAnswerOrder() {
    // All players except we still allow ghost to have an answer
    answerOrder = state.players.map(p => p.id);
    currentIndex = 0;
  }

  function renderCurrent() {
    questionTextEl.textContent = state.currentRound.questionText || '';
    const playerId = answerOrder[currentIndex];
    const player = state.players.find(p => p.id === playerId);
    if (!player) return;
    currentPlayerEl.textContent = `Now answering: ${player.name}`;
    const existing = state.currentRound.answers.find(a => a.playerId === playerId);
    answerInput.value = existing ? existing.text : '';
  }

  savePassBtn.addEventListener('click', () => {
    const playerId = answerOrder[currentIndex];
    const text = answerInput.value.trim();
    if (!text) {
      alert('Please enter an answer.');
      return;
    }
    addAnswer(state, playerId, text);
    saveState(state);

    currentIndex++;
    if (currentIndex >= answerOrder.length) {
      // Done with answers; go to wager screen (select answer happens there)
      setStep(state, 'wager');
      saveState(state);
      renderStepIndicator('wager');
      showScreen('wager');
    } else {
      answerInput.value = '';
      renderCurrent();
    }
  });

  clearBtn.addEventListener('click', () => {
    answerInput.value = '';
  });

  backBtn.addEventListener('click', () => {
    setStep(state, 'question');
    saveState(state);
    renderStepIndicator('question');
    showScreen('question');
  });

  // Expose a function to be called when entering the screen
  function onEnterAnswers() {
    refreshAnswerOrder();
    renderCurrent();
  }

  // We attach this to state so main.js can call it
  state.__onEnterAnswers = onEnterAnswers;
}
