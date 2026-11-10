<script lang="ts">
  import {
    applyAddNumbers,
    applyHint,
    DIFFICULTY_PRESETS,
    isGameOver,
    isStuck,
    parseGameState,
    type CellIndex,
    type CellPair,
    type GameState,
    type NumberGameMove,
  } from '@local/number-game';
  import { onDestroy } from 'svelte';
  import type { PlayScreenProps } from '../browser-game.js';
  import { MATCH_REFUSAL_MESSAGES } from './match-refusal-messages.js';
  import NumberGameActionBar from './NumberGameActionBar.svelte';
  import NumberGameBoard from './NumberGameBoard.svelte';
  import NumberGameOverPanel from './NumberGameOverPanel.svelte';
  import NumberGameStatusBar from './NumberGameStatusBar.svelte';
  import { tapCell } from './tap-cell.js';

  const REJECTED_PAIR_SHOW_MS = 400;
  const FEEDBACK_SHOW_MS = 2500;

  interface Feedback {
    readonly text: string;
    readonly tone: 'info' | 'error';
  }

  const { storedState, saveMove, newGamePath, dashboardPath }: PlayScreenProps = $props();

  // The shared play page builds a new screen for every load, so only the first state is read.
  function readStoredState(): GameState {
    return parseGameState(storedState);
  }

  let gameState: GameState = $state.raw(readStoredState());
  let selectedIndex: CellIndex | null = $state(null);
  let hintPair: CellPair | null = $state(null);
  let rejectedPair: CellPair | null = $state(null);
  let feedback: Feedback | null = $state(null);

  const gameOver = $derived(isGameOver(gameState));
  const stuck = $derived(isStuck(gameState));
  const hintsAllowed = $derived(DIFFICULTY_PRESETS[gameState.difficulty].hintsPerStage !== 0);

  let rejectedPairTimer: ReturnType<typeof setTimeout> | undefined;
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => {
    clearTimeout(rejectedPairTimer);
    clearTimeout(feedbackTimer);
  });

  function showFeedback(text: string, tone: Feedback['tone']): void {
    feedback = { text, tone };
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedback = null;
    }, FEEDBACK_SHOW_MS);
  }

  function showRejectedPair(pair: CellPair): void {
    rejectedPair = pair;
    clearTimeout(rejectedPairTimer);
    rejectedPairTimer = setTimeout(() => {
      rejectedPair = null;
    }, REJECTED_PAIR_SHOW_MS);
  }

  /** Shows a move right away, then sends it to the server to be saved (PS-07). */
  function playMove(nextState: GameState, move: NumberGameMove): void {
    gameState = nextState;
    selectedIndex = null;
    hintPair = null;
    saveMove(move);
  }

  function handleTap(index: CellIndex): void {
    const outcome = tapCell(gameState, selectedIndex, index);
    switch (outcome.kind) {
      case 'ignored':
        return;
      case 'selected':
        selectedIndex = outcome.selectedIndex;
        return;
      case 'deselected':
        selectedIndex = null;
        return;
      case 'refused':
        selectedIndex = null;
        showRejectedPair({ firstIndex: outcome.firstIndex, secondIndex: outcome.secondIndex });
        showFeedback(MATCH_REFUSAL_MESSAGES[outcome.reason], 'error');
        return;
      case 'matched': {
        const clearedStage = gameState.stage;
        playMove(outcome.match.state, {
          type: 'match',
          firstIndex: outcome.firstIndex,
          secondIndex: outcome.secondIndex,
        });
        if (outcome.match.stageCleared) {
          showFeedback(`Stage ${String(clearedStage)} cleared! On to the next board`, 'info');
        }
        return;
      }
    }
  }

  function handleAddNumbers(): void {
    const result = applyAddNumbers(gameState);
    if (result.accepted) {
      playMove(result.state, { type: 'add-numbers' });
    }
  }

  function handleHint(): void {
    const result = applyHint(gameState);
    if (!result.accepted) {
      return;
    }
    playMove(result.state, { type: 'hint' });
    hintPair = result.pair;
  }
</script>

<div class="play-screen">
  <div class="sticky-top">
    <NumberGameStatusBar
      score={gameState.score}
      stage={gameState.stage}
      difficulty={gameState.difficulty}
    />
    {#if feedback !== null}
      <p class="feedback" class:error={feedback.tone === 'error'} role="status">
        {feedback.text}
      </p>
    {/if}
    {#if stuck}
      <!-- NG-25 -->
      <p class="feedback" role="status">No pairs can see each other. Press Add Numbers.</p>
    {/if}
  </div>

  <NumberGameBoard
    cells={gameState.cells}
    width={gameState.width}
    {selectedIndex}
    {hintPair}
    {rejectedPair}
    disabled={gameOver}
    onTap={handleTap}
  />

  {#if gameOver}
    <NumberGameOverPanel
      score={gameState.score}
      stage={gameState.stage}
      {newGamePath}
      {dashboardPath}
    />
  {:else}
    <div class="sticky-bottom">
      <NumberGameActionBar
        addNumbersLeft={gameState.addNumbersLeft}
        hintsLeft={gameState.hintsLeft}
        {hintsAllowed}
        hintShown={hintPair !== null}
        disabled={gameOver}
        onAddNumbers={handleAddNumbers}
        onHint={handleHint}
      />
    </div>
  {/if}
</div>

<style>
  .play-screen {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .sticky-top,
  .sticky-bottom {
    position: sticky;
    z-index: 1;
    padding: 0.5rem 0;
    background: var(--color-background);
  }

  .sticky-top {
    top: 0;
  }

  .sticky-bottom {
    bottom: 0;
  }

  .feedback {
    margin: 0.5rem 0 0;
    padding: 0.5rem;
    border-radius: 6px;
    background: var(--color-hint);
    text-align: center;
  }

  .feedback.error {
    background: var(--color-error-surface);
    color: var(--color-error);
  }
</style>
