// ui-navigation.js
// Controls which screen is visible and renders the step indicator.

const STEPS = [
  { id: 'setup', label: 'Setup' },
  { id: 'question', label: 'Question' },
  { id: 'answers', label: 'Answers' },
  { id: 'wager', label: 'Guess & Wager' },
  { id: 'reveal', label: 'Reveal' },
  { id: 'adjustments', label: 'Adjust' },
  { id: 'summary', label: 'Scores' },
  { id: 'end', label: 'End' }
];

/**
 * Show one screen and hide all others, based on step id.
 */
export function showScreen(stepId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.add('hidden'));
  const targetId = 'screen-' + stepId;
  const el = document.getElementById(targetId);
  if (el) {
    el.classList.remove('hidden');
  }
}

/**
 * Render the top step indicator.
 */
export function renderStepIndicator(currentStepId) {
  const container = document.getElementById('step-indicator');
  if (!container) return;

  const parts = STEPS.map(step => {
    const isCurrent = step.id === currentStepId;
    return isCurrent ? `• ${step.label}` : step.label;
  });

  container.textContent = parts.join(' · ');
}
