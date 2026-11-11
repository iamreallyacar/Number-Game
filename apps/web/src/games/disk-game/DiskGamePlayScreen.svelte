<script lang="ts">
  import {
    applyHint,
    applyUndo,
    countDisks,
    findHintProblem,
    findUndoProblem,
    isGameOver,
    parseGameState,
    type DiskGameMove,
    type GameState,
    type PegIndex,
    type PegMove,
    type StageClear,
  } from '@local/disk-game';
  import { onDestroy } from 'svelte';
  import { getSoundPlayer } from '../../audio/sound-player.js';
  import type { PlayScreenProps } from '../browser-game.js';
  import { DISK_GAME_SOUNDS } from './disk-game-sounds.js';
  import DiskGameActionBar from './DiskGameActionBar.svelte';
  import DiskGameBoard from './DiskGameBoard.svelte';
  import DiskGameOverPanel from './DiskGameOverPanel.svelte';
  import DiskGameStatusBar from './DiskGameStatusBar.svelte';
  import { MOVE_REFUSAL_MESSAGES } from './move-refusal-messages.js';
  import type { StageClearEffect } from './stage-clear-effect.js';
  import { tapPeg } from './tap-peg.js';

  // Matches the shake animation in DiskGameBoard.svelte.
  const REFUSED_DROP_SHOW_MS = 400;
  const FEEDBACK_SHOW_MS = 2500;
  // Matches the longest stage clear animation in DiskGameBoard.svelte. The sorted pegs stay on
  // screen this long before the next stage's layout replaces them.
  const STAGE_CLEAR_SHOW_MS = 1200;

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
  let heldPeg: PegIndex | null = $state(null);
  let hintMove = $state.raw<PegMove | null>(null);
  let dropRefused = $state(false);
  let feedback: Feedback | null = $state(null);
  let stageClearEffect = $state.raw<StageClearEffect | null>(null);
  let nextStageClearEffectId = 0;

  const soundPlayer = getSoundPlayer();

  const gameOver = $derived(isGameOver(gameState));
  // While a stage clear is shown, the board still shows the sorted pegs of the stage before.
  const shownPegs = $derived(stageClearEffect?.stageClear.sortedPegs ?? gameState.pegs);
  const inputLocked = $derived(gameOver || stageClearEffect !== null);
  const undoDisabled = $derived(inputLocked || findUndoProblem(gameState) !== null);
  // A hint that is still on screen is not sold again.
  const hintDisabled = $derived(
    inputLocked || hintMove !== null || findHintProblem(gameState) !== null,
  );

  let refusedDropTimer: ReturnType<typeof setTimeout> | undefined;
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let stageClearTimer: ReturnType<typeof setTimeout> | undefined;

  onDestroy(() => {
    clearTimeout(refusedDropTimer);
    clearTimeout(feedbackTimer);
    clearTimeout(stageClearTimer);
  });

  function showFeedback(text: string, tone: Feedback['tone']): void {
    feedback = { text, tone };
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedback = null;
    }, FEEDBACK_SHOW_MS);
  }

  function showRefusedDrop(): void {
    dropRefused = true;
    clearTimeout(refusedDropTimer);
    refusedDropTimer = setTimeout(() => {
      dropRefused = false;
    }, REFUSED_DROP_SHOW_MS);
  }

  function showStageClear(stageClear: StageClear): void {
    stageClearEffect = { id: nextStageClearEffectId, stageClear };
    nextStageClearEffectId += 1;
    clearTimeout(stageClearTimer);
    stageClearTimer = setTimeout(() => {
      stageClearEffect = null;
    }, STAGE_CLEAR_SHOW_MS);
    const perfectNote = stageClear.perfect ? ' Perfect stage!' : '';
    showFeedback(
      `Stage cleared for ${String(stageClear.pointsEarned)} points.${perfectNote}`,
      'info',
    );
    soundPlayer.play(
      stageClear.perfect ? DISK_GAME_SOUNDS.perfectStageClear : DISK_GAME_SOUNDS.stageClear,
    );
  }

  /** Shows the new state right away, then sends the move to the server to be saved (PS-07). */
  function commitMove(nextState: GameState, move: DiskGameMove): void {
    heldPeg = null;
    gameState = nextState;
    if (isGameOver(nextState)) {
      soundPlayer.play(DISK_GAME_SOUNDS.gameOver);
    }
    saveMove(move);
  }

  function handleTapPeg(pegIndex: PegIndex): void {
    if (inputLocked) {
      return;
    }
    const outcome = tapPeg(gameState, heldPeg, pegIndex);
    switch (outcome.kind) {
      case 'ignored':
        return;
      case 'picked-up':
        heldPeg = outcome.heldPeg;
        soundPlayer.play(DISK_GAME_SOUNDS.pickUp);
        return;
      case 'put-back':
        heldPeg = null;
        soundPlayer.play(DISK_GAME_SOUNDS.drop);
        return;
      case 'refused':
        // The disk shakes and stays raised (DK-10).
        showRefusedDrop();
        showFeedback(MOVE_REFUSAL_MESSAGES[outcome.reason], 'error');
        soundPlayer.play(DISK_GAME_SOUNDS.refusedDrop);
        return;
      case 'moved':
        hintMove = null;
        if (outcome.result.stageClear === null) {
          soundPlayer.play(DISK_GAME_SOUNDS.drop);
        } else {
          showStageClear(outcome.result.stageClear);
        }
        commitMove(outcome.result.state, { type: 'move-disk', ...outcome.move });
        return;
    }
  }

  function handleUndo(): void {
    const result = applyUndo(gameState);
    if (!result.accepted) {
      showFeedback(MOVE_REFUSAL_MESSAGES[result.reason], 'error');
      return;
    }
    hintMove = null;
    soundPlayer.play(DISK_GAME_SOUNDS.undo);
    commitMove(result.state, { type: 'undo' });
  }

  function handleHint(): void {
    const result = applyHint(gameState);
    if (!result.accepted) {
      showFeedback(MOVE_REFUSAL_MESSAGES[result.reason], 'error');
      return;
    }
    hintMove = result.hintMove;
    showFeedback(
      `Move the top disk of peg ${String(result.hintMove.fromPeg + 1)} to peg ` +
        `${String(result.hintMove.toPeg + 1)}.`,
      'info',
    );
    soundPlayer.play(DISK_GAME_SOUNDS.hint);
    commitMove(result.state, { type: 'hint' });
  }
</script>

<div class="play-screen">
  <DiskGameStatusBar
    score={gameState.score}
    stage={gameState.stage}
    diskCount={countDisks(gameState.pegs)}
    movesLeft={gameState.movesLeft}
    stageMovesUsed={gameState.stageMovesUsed}
    stageFewestMoves={gameState.stageFewestMoves}
  />
  <!-- Always takes up its line, so a message coming and going does not move the pegs under a tap. -->
  <p
    class="feedback"
    class:shown={feedback !== null}
    class:error={feedback?.tone === 'error'}
    role="status"
  >
    {feedback?.text ?? ''}
  </p>

  <DiskGameBoard
    pegs={shownPegs}
    {heldPeg}
    {dropRefused}
    {hintMove}
    {stageClearEffect}
    disabled={inputLocked}
    onTapPeg={handleTapPeg}
  />

  {#if gameOver}
    <DiskGameOverPanel
      score={gameState.score}
      stage={gameState.stage}
      {newGamePath}
      {dashboardPath}
    />
  {:else}
    <DiskGameActionBar {undoDisabled} {hintDisabled} onUndo={handleUndo} onHint={handleHint} />
  {/if}
</div>

<style>
  .play-screen {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .feedback {
    min-height: 2.25rem;
    margin: 0;
    padding: 0.5rem;
    border-radius: 6px;
    text-align: center;
  }

  .feedback.shown {
    background: var(--color-hint);
  }

  .feedback.shown.error {
    background: var(--color-error-surface);
    color: var(--color-error);
  }
</style>
