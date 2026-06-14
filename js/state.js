// state.js
// Holds game state structure and pure state update functions.
// No DOM access here.

/**
 * Create the initial empty game state.
 */
export function createInitialState() {
  return {
    players: [],          // { id, name, isGhost, score, stats }
    settings: {
      startPoints: 10,
      bonusesEnabled: true,
      bonusNoOneGuessed: 2,
      useTableStakes: false,
      leaderRedistribution: false,
      leaderThreshold: 20,
      useCatchup: false,
      catchupThreshold: 15,
      useJackpotRounds: false,
      maxRounds: null
    },
    meta: {
      hasSeenTutorial: false,
      currentStep: 'setup' // 'setup' | 'question' | 'answers' | 'wager' | 'reveal' | 'adjustments' | 'summary' | 'end'
    },
    currentRound: {
      roundNumber: 1,
      parkId: null,
      landId: null,
      attractionId: null,
      questionText: '',
      questionSource: null, // 'attraction' | 'generic' | 'custom'
      answers: [],          // { playerId, text }
      selectedAnswerPlayerId: null,
      wagers: [],           // { playerId, guessedPlayerId, amount }
      useJackpotThisRound: false,
      basePot: 0,
      honeyPotUsed: 0,
      results: []           // { playerId, delta, prevScore, newScore }
    },
    honeyPot: 0,
    roundsHistory: [] // array of finalized round snapshots
  };
}

/**
 * Ensure a Ghost player exists if needed (e.g., only 2 human players).
 */
export function ensureGhostPlayer(state) {
  const humans = state.players.filter(p => !p.isGhost);
  let ghost = state.players.find(p => p.isGhost);
  if (humans.length === 2 && !ghost) {
    const id = generateId();
    ghost = {
      id,
      name: 'Ghost',
      isGhost: true,
      score: state.settings.startPoints,
      stats: { correctGuesses: 0 }
    };
    state.players.push(ghost);
  }
  if (humans.length > 2 && ghost) {
    // Keep ghost but it won't be required; not removing for version 1.
  }
}

/**
 * Initialize players based on names and start points.
 */
export function setPlayersFromNames(state, names, startPoints) {
  state.players = names
    .filter(n => n.trim().length > 0)
    .map((name, index) => ({
      id: 'p' + (index + 1),
      name: name.trim(),
      isGhost: false,
      score: startPoints,
      stats: { correctGuesses: 0 }
    }));
  state.settings.startPoints = startPoints;
  ensureGhostPlayer(state);
}

/**
 * Update settings from UI options.
 */
export function updateSettings(state, settingsPatch) {
  state.settings = { ...state.settings, ...settingsPatch };
}

/**
 * Set the current step name.
 */
export function setStep(state, stepName) {
  state.meta.currentStep = stepName;
}

/**
 * Set question info for the current round.
 */
export function setCurrentQuestion(state, { parkId, landId, attractionId, text, source }) {
  state.currentRound.parkId = parkId;
  state.currentRound.landId = landId;
  state.currentRound.attractionId = attractionId;
  state.currentRound.questionText = text;
  state.currentRound.questionSource = source;
}

/**
 * Reset current round answers and wagers when starting entry.
 */
export function resetCurrentRoundForAnswers(state) {
  state.currentRound.answers = [];
  state.currentRound.selectedAnswerPlayerId = null;
  state.currentRound.wagers = [];
  state.currentRound.useJackpotThisRound = false;
  state.currentRound.basePot = 0;
  state.currentRound.honeyPotUsed = 0;
  state.currentRound.results = [];
}

/**
 * Add a player's answer for this round.
 */
export function addAnswer(state, playerId, text) {
  const existing = state.currentRound.answers.find(a => a.playerId === playerId);
  if (existing) {
    existing.text = text;
  } else {
    state.currentRound.answers.push({ playerId, text });
  }
}

/**
 * Select an answer to use (by player id).
 */
export function selectAnswerPlayer(state, playerId) {
  state.currentRound.selectedAnswerPlayerId = playerId;
}

/**
 * Set wagers for this round.
 * wagersInput is array of { playerId, guessedPlayerId, amount }
 */
export function setWagers(state, wagersInput) {
  state.currentRound.wagers = wagersInput;
}

/**
 * Apply jackpot usage toggle for this round.
 */
export function setUseJackpotForRound(state, useJackpot) {
  state.currentRound.useJackpotThisRound = useJackpot;
}

/**
 * Core scoring logic for a round.
 * This:
 * - builds pot,
 * - applies even split to correct guessers,
 * - updates scores,
 * - manages honey pot from missed rounds,
 * - records per-player deltas,
 * - increments stats,
 * - does NOT yet apply bonuses or catch-up (that’s done in a separate function).
 */
export function applyRoundBaseScoring(state) {
  const round = state.currentRound;
  const authorId = round.selectedAnswerPlayerId;
  if (!authorId) return;

  const playersById = Object.fromEntries(
    state.players.map(p => [p.id, p])
  );

  // Base pot comes from wagers, ignoring the author’s own wager in their author round
  let pot = 0;
  const author = playersById[authorId];

  // Determine participants (for table stakes if enabled)
  const wagers = round.wagers || [];
  const settings = state.settings;
  let maxWager = 0;

  // First pass: determine max wager among non-author players
  wagers.forEach(w => {
    const player = playersById[w.playerId];
    if (!player) return;
    if (w.playerId === authorId) return; // ignore author for pot and table stakes
    const amount = Math.max(0, w.amount || 0);
    if (amount > maxWager) maxWager = amount;
  });

  const effectiveWagers = [];
  wagers.forEach(w => {
    const player = playersById[w.playerId];
    if (!player) return;
    let amount = Math.max(0, w.amount || 0);

    if (player.isGhost) {
      // Ghost bets minimum or table-stake max depending on settings
      if (settings.useTableStakes && maxWager > 0) {
        amount = maxWager;
      } else {
        amount = 1;
      }
    }

    // Table stakes: if enabled and player wants in, they must match max
    if (settings.useTableStakes && maxWager > 0 && !player.isGhost) {
      if (amount === 0) {
        // player sits out
        amount = 0;
      } else {
        amount = maxWager;
      }
    }

    effectiveWagers.push({
      playerId: w.playerId,
      guessedPlayerId: w.guessedPlayerId,
      amount
    });
  });

  // Build pot and track correct guessers (even split)
  const correctGuessers = [];
  effectiveWagers.forEach(w => {
    const player = playersById[w.playerId];
    if (!player) return;

    // skip author’s wager on their own-author round
    if (w.playerId === authorId) {
      return;
    }

    const amount = Math.max(0, w.amount || 0);
    // Ensure they can't bet more than they have
    const effectiveAmount = Math.min(amount, player.score);
    pot += effectiveAmount;

    // Temporarily subtract bet (we’ll add back winnings later)
    player.score -= effectiveAmount;

    if (w.guessedPlayerId === authorId && effectiveAmount > 0) {
      correctGuessers.push({ playerId: w.playerId, amount: effectiveAmount });
      // Track correct guesses for tiebreak
      player.stats.correctGuesses += 1;
    }
  });

  round.basePot = pot;

  let honeyPotAdded = 0;

  if (correctGuessers.length === 0) {
    // No one was correct: pot goes to honey pot
    state.honeyPot += pot;
    honeyPotAdded = pot;
  } else {
    // Someone was correct: distribute pot evenly among correct guessers
    const share = pot / correctGuessers.length;
    correctGuessers.forEach(g => {
      const p = playersById[g.playerId];
      p.score += share;
    });
  }

  // Jackpot usage: add honey pot into pot for correct guessers if enabled
  let jackpotUsedAmount = 0;
  if (state.settings.useJackpotRounds && round.useJackpotThisRound && state.honeyPot > 0) {
    const jackpot = state.honeyPot;
    state.honeyPot = 0;
    jackpotUsedAmount = jackpot;

    if (correctGuessers.length > 0) {
      const share = jackpot / correctGuessers.length;
      correctGuessers.forEach(g => {
        const p = playersById[g.playerId];
        p.score += share;
      });
    } else {
      // If somehow no correct guessers on a jackpot, we could choose to keep it 0
      // For simplicity, do nothing: jackpot is consumed.
    }
  }

  round.honeyPotUsed = jackpotUsedAmount;

  // Record per-player deltas for this base scoring step
  round.results = state.players.map(p => ({
    playerId: p.id,
    // We'll calculate deltas by comparing to a snapshot we pass in
    delta: 0,
    prevScore: 0,
    newScore: p.score
  }));

  return { honeyPotAdded, jackpotUsedAmount };
}

/**
 * Apply bonuses, catch-up, and leader redistribution based on current state,
 * mutating player scores and updating adjustmentsLog.
 */
export function applyAdjustments(state) {
  const settings = state.settings;
  const round = state.currentRound;
  const players = state.players;

  const adjustmentsLog = [];

  // Compute prev/new for deltas first
  round.results.forEach(r => {
    const p = players.find(pl => pl.id === r.playerId);
    if (!p) return;
    // prevScore was 0 in base scoring; we can’t reconstruct exactly without snapshot.
    // For v1, we just correct delta now:
    r.prevScore = r.prevScore || p.score; // keep or set
    r.newScore = p.score;
    r.delta = r.newScore - r.prevScore;
  });

  if (settings.bonusesEnabled) {
    // "No one guessed you" bonus
    const authorId = round.selectedAnswerPlayerId;
    if (authorId) {
      const guesses = round.wagers || [];
      const anyGuessedAuthor = guesses.some(g => g.guessedPlayerId === authorId);
      if (!anyGuessedAuthor) {
        const author = players.find(p => p.id === authorId);
        if (author) {
          author.score += settings.bonusNoOneGuessed;
          adjustmentsLog.push({
            type: 'bonus-no-one-guessed',
            playerId: authorId,
            amount: settings.bonusNoOneGuessed,
            description: 'No one guessed you as the author'
          });
        }
      }
    }
    // In v1, we are not fully implementing land/streak bonuses to keep code shorter.
    // They can be added later if desired.
  }

  // Catch-up for last place
  if (settings.useCatchup) {
    let leaderScore = -Infinity;
    let lastScore = Infinity;
    players.forEach(p => {
      if (p.score > leaderScore) leaderScore = p.score;
      if (p.score < lastScore) lastScore = p.score;
    });

    const gap = leaderScore - lastScore;
    if (gap >= settings.catchupThreshold) {
      // Give +2 to whoever is last
      players.forEach(p => {
        if (p.score === lastScore) {
          p.score += 2;
          adjustmentsLog.push({
            type: 'catchup',
            playerId: p.id,
            amount: 2,
            description: 'Catch-up bonus for last place'
          });
        }
      });
    }
  }

  // Leader redistribution
  if (settings.leaderRedistribution) {
    let leaderScore = -Infinity;
    let leaderIds = [];
    players.forEach(p => {
      if (p.score > leaderScore) {
        leaderScore = p.score;
        leaderIds = [p.id];
      } else if (p.score === leaderScore) {
        leaderIds.push(p.id);
      }
    });

    let minScore = Infinity;
    players.forEach(p => {
      if (p.score < minScore) minScore = p.score;
    });

    const leadOverMin = leaderScore - minScore;
    if (leadOverMin >= settings.leaderThreshold && leaderIds.length === 1) {
      const leader = players.find(p => p.id === leaderIds[0]);
      if (leader) {
        const redistribution = 2;
        leader.score -= redistribution;
        const eachGain = redistribution / (players.length - 1);
        players.forEach(p => {
          if (p.id !== leader.id) {
            p.score += eachGain;
          }
        });
        adjustmentsLog.push({
          type: 'leader-redistribution',
          playerId: leader.id,
          amount: -redistribution,
          description: 'Leader redistribution applied'
        });
      }
    }
  }

  return adjustmentsLog;
}

/**
 * Finalize current round: push into history and increment round number.
 */
export function finalizeCurrentRound(state, adjustmentsLog) {
  const snapshot = JSON.parse(JSON.stringify({
    ...state.currentRound,
    adjustmentsLog,
    playerScores: state.players.map(p => ({
      playerId: p.id,
      score: p.score
    }))
  }));
  state.roundsHistory.push(snapshot);
  state.currentRound.roundNumber = state.roundsHistory.length + 1;
}

/**
 * Determine winner at end of game: returns { mainWinners, tieBreakerUsed }
 */
export function computeWinners(state) {
  const humans = state.players.filter(p => !p.isGhost);
  if (humans.length === 0) return { mainWinners: [], tieBreakerUsed: false };

  let maxScore = -Infinity;
  humans.forEach(p => {
    if (p.score > maxScore) maxScore = p.score;
  });
  const top = humans.filter(p => p.score === maxScore);

  if (top.length === 1) {
    return { mainWinners: top, tieBreakerUsed: false };
  }

  // Tiebreak: most correct guesses
  let maxGuesses = -Infinity;
  top.forEach(p => {
    const cg = p.stats.correctGuesses || 0;
    if (cg > maxGuesses) maxGuesses = cg;
  });

  const tieBreakWinners = top.filter(p => (p.stats.correctGuesses || 0) === maxGuesses);

  return {
    mainWinners: tieBreakWinners,
    tieBreakerUsed: true
  };
}

/**
 * Simple id generator.
 */
function generateId() {
  return 'id-' + Math.random().toString(36).slice(2, 9);
}
