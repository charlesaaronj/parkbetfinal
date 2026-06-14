// data-questions.js
// Static question data for parks, lands, attractions, and generic questions.

/**
 * Example park data. Extend as needed.
 */
const PARKS = [
  {
    id: 'mk',
    name: 'Magic Kingdom',
    lands: [
      {
        id: 'fantasyland',
        name: 'Fantasyland',
        attractions: [
          {
            id: 'seven-dwarfs',
            name: 'Seven Dwarfs Mine Train',
            questions: [
              "You stumble on a glowing gem deep in the mine. Describe your favorite single moment on this ride that feels like finding treasure.",
              "You find yourself on an island during this ride. What do you do first?"
            ]
          }
        ]
      }
    ]
  }
];

// Generic questions for "Generate generic"
const GENERIC_QUESTIONS = [
  "What will be the funniest thing someone in our family does on this ride?",
  "What will be your favorite single moment on this attraction?",
  "What will surprise you the most during this ride?"
];

// Ghost answer snippets
const GHOST_ANSWERS = [
  "Scream as loud as possible.",
  "Close my eyes the entire time.",
  "Wave at the camera at the wrong moment.",
  "Pretend nothing scares me.",
  "Sing along to the music in my head."
];

export function getParksData() {
  return PARKS;
}

/**
 * Get a random question for a specific attraction.
 */
export function getRandomAttractionQuestion(parkId, landId, attractionId) {
  const park = PARKS.find(p => p.id === parkId);
  if (!park) return null;
  const land = park.lands.find(l => l.id === landId);
  if (!land) return null;
  const attraction = land.attractions.find(a => a.id === attractionId);
  if (!attraction || !attraction.questions || attraction.questions.length === 0) return null;
  const idx = Math.floor(Math.random() * attraction.questions.length);
  return attraction.questions[idx];
}

/**
 * Get a random generic question.
 */
export function getGenericQuestion() {
  if (GENERIC_QUESTIONS.length === 0) return '';
  const idx = Math.floor(Math.random() * GENERIC_QUESTIONS.length);
  return GENERIC_QUESTIONS[idx];
}

/**
 * Get a random Ghost answer snippet.
 */
export function getGhostAnswer() {
  if (GHOST_ANSWERS.length === 0) return 'Stay quiet.';
  const idx = Math.floor(Math.random() * GHOST_ANSWERS.length);
  return GHOST_ANSWERS[idx];
}
