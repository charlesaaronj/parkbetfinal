// ui-question.js
// Handles park/land/attraction and question selection.

import { setCurrentQuestion, setStep, resetCurrentRoundForAnswers } from './state.js';
import { saveState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';
import { getParksData, getGenericQuestion, getRandomAttractionQuestion } from './data-questions.js';

/**
 * Initialize Question screen UI.
 */
export function initQuestionUI(state) {
  const parkSelect = document.getElementById('park-select');
  const landSelect = document.getElementById('land-select');
  const attractionSelect = document.getElementById('attraction-select');
  const randomQuestionBtn = document.getElementById('random-question-btn');
  const genericQuestionBtn = document.getElementById('generic-question-btn');
  const customQuestionInput = document.getElementById('custom-question-input');
  const questionTextEl = document.getElementById('selected-question-text');
  const questionNextBtn = document.getElementById('question-next-btn');
  const questionClearBtn = document.getElementById('question-clear-btn');
  const backBtn = document.getElementById('question-back');

  const parksData = getParksData();

  function populateParks() {
    parkSelect.innerHTML = '';
    parksData.forEach((park, idx) => {
      const opt = document.createElement('option');
      opt.value = park.id;
      opt.textContent = park.name;
      if (idx === 0) opt.selected = true;
      parkSelect.appendChild(opt);
    });
    populateLands();
  }

  function populateLands() {
    landSelect.innerHTML = '';
    const park = parksData.find(p => p.id === parkSelect.value);
    if (!park) return;
    park.lands.forEach((land, idx) => {
      const opt = document.createElement('option');
      opt.value = land.id;
      opt.textContent = land.name;
      if (idx === 0) opt.selected = true;
      landSelect.appendChild(opt);
    });
    populateAttractions();
  }

  function populateAttractions() {
    attractionSelect.innerHTML = '';
    const park = parksData.find(p => p.id === parkSelect.value);
    if (!park) return;
    const land = park.lands.find(l => l.id === landSelect.value);
    if (!land) return;
    land.attractions.forEach((att, idx) => {
      const opt = document.createElement('option');
      opt.value = att.id;
      opt.textContent = att.name;
      if (idx === 0) opt.selected = true;
      attractionSelect.appendChild(opt);
    });
  }

  parkSelect.addEventListener('change', () => {
    populateLands();
  });

  landSelect.addEventListener('change', () => {
    populateAttractions();
  });

  populateParks();

  randomQuestionBtn.addEventListener('click', () => {
    const parkId = parkSelect.value;
    const landId = landSelect.value;
    const attractionId = attractionSelect.value;
    const question = getRandomAttractionQuestion(parkId, landId, attractionId);
    if (question) {
      questionTextEl.textContent = question;
      customQuestionInput.value = '';
      setCurrentQuestion(state, {
        parkId,
        landId,
        attractionId,
        text: question,
        source: 'attraction'
      });
      saveState(state);
    }
  });

  genericQuestionBtn.addEventListener('click', () => {
    const parkId = parkSelect.value;
    const landId = landSelect.value;
    const attractionId = attractionSelect.value;
    const question = getGenericQuestion();
    questionTextEl.textContent = question;
    customQuestionInput.value = '';
    setCurrentQuestion(state, {
      parkId,
      landId,
      attractionId,
      text: question,
      source: 'generic'
    });
    saveState(state);
  });

  customQuestionInput.addEventListener('input', () => {
    const text = customQuestionInput.value.trim();
    if (text.length > 0) {
      questionTextEl.textContent = text;
      setCurrentQuestion(state, {
        parkId: parkSelect.value,
        landId: landSelect.value,
        attractionId: attractionSelect.value,
        text,
        source: 'custom'
      });
      saveState(state);
    }
  });

  questionNextBtn.addEventListener('click', () => {
    const text = state.currentRound.questionText;
    if (!text || text.trim().length === 0) {
      alert('Please choose or enter a question.');
      return;
    }
    resetCurrentRoundForAnswers(state);
    setStep(state, 'answers');
    saveState(state);
    renderStepIndicator('answers');
    showScreen('answers');
  });

  questionClearBtn.addEventListener('click', () => {
    questionTextEl.textContent = 'Tap “Random Question” to begin.';
    customQuestionInput.value = '';
    setCurrentQuestion(state, {
      parkId: parkSelect.value,
      landId: landSelect.value,
      attractionId: attractionSelect.value,
      text: '',
      source: null
    });
    saveState(state);
  });

  backBtn.addEventListener('click', () => {
    setStep(state, 'setup');
    saveState(state);
    renderStepIndicator('setup');
    showScreen('setup');
  });
}
