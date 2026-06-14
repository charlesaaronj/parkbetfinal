// main.js
// Entry point. Loads or creates state, initializes all UI modules,
// and manages step transitions.

import { createInitialState, setStep } from './state.js';
import { loadState, saveState } from './storage.js';
import { showScreen, renderStepIndicator } from './ui-navigation.js';
import { initSetupUI } from './ui-setup.js';
import { initQuestionUI } from './ui-question.js';
import { initAnswersUI } from './ui-answers.js';
import { initWagerUI } from './ui-wager.js';
import { initRevealUI } from './ui-reveal.js';
import { initAdjustmentsUI } from './ui-adjustments.js';
import { initSummaryUI } from './ui-summary.js';
import { initTutorial } from './tutorial.js';

/**
 * Bootstraps the app.
 */
function bootstrap() {
  let state = loadState();
  if (!state) {
    state = createInitialState();
    saveState(state);
  }

  // Initialize UI modules
  initSetupUI(state);
  initQuestionUI(state);
  initAnswersUI(state);
  initWagerUI(state);
  initRevealUI(state);
  initAdjustmentsUI(state);
  initSummaryUI(state);
  initTutorial(state);

  // Initial step display
  renderStepIndicator(state.meta.currentStep);
  showScreen(state.meta.currentStep);

  // When entering some steps, invoke their onEnter hooks if present
  const originalShowScreen = showScreen;

  // Simple watcher: whenever we navigate, call hook
  function navigate(stepId) {
    renderStepIndicator(stepId);
    originalShowScreen(stepId);
    if (stepId === 'answers' && typeof state.__onEnterAnswers === 'function') {
      state.__onEnterAnswers();
    } else if (stepId === 'wager' && typeof state.__onEnterWager === 'function') {
      state.__onEnterWager();
    } else if (stepId === 'reveal' && typeof state.__onEnterReveal === 'function') {
      state.__onEnterReveal();
    } else if (stepId === 'adjustments' && typeof state.__onEnterAdjustments === 'function') {
      state.__onEnterAdjustments();
    } else if (stepId === 'summary' && typeof state.__onEnterSummary === 'function') {
      state.__onEnterSummary();
    } else if (stepId === 'end' && typeof state.__onEnterEnd === 'function') {
      state.__onEnterEnd();
    }
  }

  // Override setStep globally to also navigate
  const originalSetStep = setStep;
  // Note: we can’t really override imported function; instead,
  // we rely on UI modules to call setStep + showScreen + renderStepIndicator explicitly.
  // For v1 we will keep it simple: the modules already call showScreen + renderStepIndicator.

  // To ensure hooks fire on initial load:
  navigate(state.meta.currentStep);
}

bootstrap();
