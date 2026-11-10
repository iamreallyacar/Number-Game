<script lang="ts">
  import {
    applyPlacement,
    columnOf,
    getShape,
    isGameOver,
    parseGameState,
    rowOf,
    shapeFitsAnywhere,
    type BlockGameMove,
    type CellIndex,
    type GameState,
    type ShapeId,
  } from '@local/block-game';
  import { onDestroy } from 'svelte';
  import { getSoundPlayer } from '../../audio/sound-player.js';
  import type { PlayScreenProps } from '../browser-game.js';
  import { BLOCK_GAME_SOUNDS, lineClearSound } from './block-game-sounds.js';
  import BlockGameBoard from './BlockGameBoard.svelte';
  import BlockGameOverPanel from './BlockGameOverPanel.svelte';
  import BlockGameShape from './BlockGameShape.svelte';
  import BlockGameSlots from './BlockGameSlots.svelte';
  import BlockGameStatusBar from './BlockGameStatusBar.svelte';
  import type { BoardPosition, ClearEffect } from './clear-effect.js';
  import {
    cellPitchOf,
    findDropTarget,
    grabOffsetFor,
    type BoardMetrics,
    type DropTarget,
    type ScreenPoint,
  } from './drop-target.js';
  import { buildPlacementPreview, type PlacementPreview } from './placement-preview.js';
  import { PLACEMENT_REFUSAL_MESSAGES } from './placement-refusal-messages.js';

  // Must match the gap between cells in BlockGameBoard.svelte.
  const BOARD_GRID_LINE_PX = 1;
  const RETURNED_SLOT_SHOW_MS = 400;
  const FEEDBACK_SHOW_MS = 2500;
  // Matches the longest animation in BlockGameClearEffect.svelte.
  const CLEAR_EFFECT_SHOW_MS = 900;

  /** A shape on its way from a slot to the board. */
  interface ActiveDrag {
    readonly slotIndex: number;
    readonly shapeId: ShapeId;
    readonly pointerId: number;
    /** Where the pointer holds the shape, from the shape's top-left corner. */
    readonly grabOffset: ScreenPoint;
    /** The board cell pitch when the shape was picked up, so it is drawn at board size. */
    readonly cellPitchPx: number;
    readonly shapeTopLeft: ScreenPoint;
    /** Where the shape would land if dropped now, or null when it is not over the board. */
    readonly target: DropTarget | null;
  }

  const { storedState, saveMove, newGamePath, dashboardPath }: PlayScreenProps = $props();

  // The shared play page builds a new screen for every load, so only the first state is read.
  function readStoredState(): GameState {
    return parseGameState(storedState);
  }

  let gameState: GameState = $state.raw(readStoredState());
  let drag: ActiveDrag | null = $state.raw(null);
  let returnedSlotIndex: number | null = $state(null);
  let feedback: string | null = $state(null);
  let clearEffects: readonly ClearEffect[] = $state.raw([]);
  let boardElement: HTMLElement | undefined = $state();
  let nextClearEffectId = 0;

  const soundPlayer = getSoundPlayer();

  const gameOver = $derived(isGameOver(gameState));
  const slotFits = $derived(
    gameState.slots.map((shapeId) => shapeFitsAnywhere(gameState, shapeId)),
  );
  const preview: PlacementPreview | null = $derived(previewOf(drag));

  function previewOf(activeDrag: ActiveDrag | null): PlacementPreview | null {
    if (activeDrag?.target == null) {
      return null;
    }
    return buildPlacementPreview(gameState, activeDrag.shapeId, activeDrag.target);
  }

  let returnedSlotTimer: ReturnType<typeof setTimeout> | undefined;
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;
  let clearEffectTimers: readonly ReturnType<typeof setTimeout>[] = [];

  onDestroy(() => {
    clearTimeout(returnedSlotTimer);
    clearTimeout(feedbackTimer);
    for (const timer of clearEffectTimers) {
      clearTimeout(timer);
    }
  });

  function showFeedback(text: string): void {
    feedback = text;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      feedback = null;
    }, FEEDBACK_SHOW_MS);
  }

  function showReturnedSlot(slotIndex: number): void {
    returnedSlotIndex = slotIndex;
    clearTimeout(returnedSlotTimer);
    returnedSlotTimer = setTimeout(() => {
      returnedSlotIndex = null;
    }, RETURNED_SLOT_SHOW_MS);
  }

  function positionOf(index: CellIndex): BoardPosition {
    return { row: rowOf(gameState.size, index), column: columnOf(gameState.size, index) };
  }

  function middleOf(indexes: readonly CellIndex[]): BoardPosition {
    const positions = indexes.map(positionOf);
    const average = (values: readonly number[]): number =>
      Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
    return {
      row: average(positions.map((position) => position.row)),
      column: average(positions.map((position) => position.column)),
    };
  }

  /** Must be called before the placement is shown, while the board size and cells still match. */
  function showClearEffect(
    clearedCellIndexes: readonly CellIndex[],
    placedCellIndexes: readonly CellIndex[],
    pointsEarned: number,
  ): void {
    const effect: ClearEffect = {
      id: nextClearEffectId,
      clearedCells: clearedCellIndexes.map(positionOf),
      pointsAt: middleOf(placedCellIndexes),
      pointsEarned,
    };
    nextClearEffectId += 1;
    clearEffects = [...clearEffects, effect];
    const timer = setTimeout(() => {
      clearEffectTimers = clearEffectTimers.filter((shownTimer) => shownTimer !== timer);
      clearEffects = clearEffects.filter((shownEffect) => shownEffect.id !== effect.id);
    }, CLEAR_EFFECT_SHOW_MS);
    clearEffectTimers = [...clearEffectTimers, timer];
  }

  /** Where the board cells are on the screen right now. Measured again on every move, since the
   *  page may have scrolled since the shape was picked up. */
  function measureBoard(): BoardMetrics {
    if (boardElement === undefined) {
      throw new Error('The board must be on screen before a shape can be dragged');
    }
    const rectangle = boardElement.getBoundingClientRect();
    return {
      left: rectangle.left + boardElement.clientLeft,
      top: rectangle.top + boardElement.clientTop,
      innerWidth: boardElement.clientWidth,
      size: gameState.size,
      gridLinePx: BOARD_GRID_LINE_PX,
    };
  }

  function dragTo(activeDrag: ActiveDrag, pointer: ScreenPoint): ActiveDrag {
    const shapeTopLeft = {
      x: pointer.x - activeDrag.grabOffset.x,
      y: pointer.y - activeDrag.grabOffset.y,
    };
    const target = findDropTarget(measureBoard(), getShape(activeDrag.shapeId), shapeTopLeft);
    return { ...activeDrag, shapeTopLeft, target };
  }

  function pointerOf(event: PointerEvent): ScreenPoint {
    return { x: event.clientX, y: event.clientY };
  }

  function handlePickUp(slotIndex: number, event: PointerEvent): void {
    const shapeId = gameState.slots[slotIndex];
    if (shapeId === undefined) {
      throw new RangeError(`There is no slot ${String(slotIndex)}`);
    }
    const cellPitchPx = cellPitchOf(measureBoard());
    const pickedUp: ActiveDrag = {
      slotIndex,
      shapeId,
      pointerId: event.pointerId,
      grabOffset: grabOffsetFor(getShape(shapeId), cellPitchPx, event.pointerType),
      cellPitchPx,
      shapeTopLeft: { x: 0, y: 0 },
      target: null,
    };
    drag = dragTo(pickedUp, pointerOf(event));
    soundPlayer.play(BLOCK_GAME_SOUNDS.pickUp);
  }

  function handlePointerMove(event: PointerEvent): void {
    if (drag?.pointerId !== event.pointerId) {
      return;
    }
    drag = dragTo(drag, pointerOf(event));
  }

  function handlePointerUp(event: PointerEvent): void {
    if (drag?.pointerId !== event.pointerId) {
      return;
    }
    const droppedDrag = dragTo(drag, pointerOf(event));
    drag = null;
    if (droppedDrag.target !== null) {
      placeShape(droppedDrag.slotIndex, droppedDrag.target);
    }
  }

  /** A cancelled pointer, or the window losing focus, puts the shape back in its slot. */
  function cancelDrag(): void {
    drag = null;
  }

  function handlePointerCancel(event: PointerEvent): void {
    if (drag?.pointerId === event.pointerId) {
      cancelDrag();
    }
  }

  function playPlacementSound(clearedLineCount: number, nextState: GameState): void {
    if (clearedLineCount > 0) {
      soundPlayer.play(lineClearSound(clearedLineCount, nextState.streak));
    } else {
      soundPlayer.play(BLOCK_GAME_SOUNDS.place);
    }
    if (isGameOver(nextState)) {
      soundPlayer.play(BLOCK_GAME_SOUNDS.gameOver);
    }
  }

  /** Shows a placement right away, then sends it to the server to be saved (PS-07). */
  function placeShape(slotIndex: number, target: DropTarget): void {
    const result = applyPlacement(gameState, slotIndex, target.topRow, target.leftColumn);
    if (!result.accepted) {
      // The shape goes back to its slot (BG-06).
      showReturnedSlot(slotIndex);
      showFeedback(PLACEMENT_REFUSAL_MESSAGES[result.reason]);
      soundPlayer.play(BLOCK_GAME_SOUNDS.invalidDrop);
      return;
    }
    const clearedLineCount = result.clearedRows.length + result.clearedColumns.length;
    if (clearedLineCount > 0) {
      showClearEffect(result.clearedCellIndexes, result.placedCellIndexes, result.pointsEarned);
    }
    playPlacementSound(clearedLineCount, result.state);
    gameState = result.state;
    const move: BlockGameMove = {
      type: 'place-shape',
      slotIndex,
      topRow: target.topRow,
      leftColumn: target.leftColumn,
    };
    saveMove(move);
  }
</script>

<svelte:window
  onpointermove={handlePointerMove}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerCancel}
  onblur={cancelDrag}
/>

<div class="play-screen">
  <BlockGameStatusBar
    score={gameState.score}
    streak={gameState.streak}
    linesCleared={gameState.linesCleared}
  />
  <!-- Always takes up its line, so a message coming and going does not move the board mid-drag. -->
  <p class="feedback" class:shown={feedback !== null} role="status">{feedback ?? ''}</p>

  <BlockGameBoard
    cells={gameState.cells}
    size={gameState.size}
    {preview}
    previewColour={drag === null ? null : getShape(drag.shapeId).colour}
    {clearEffects}
    bind:boardElement
  />

  {#if gameOver}
    <BlockGameOverPanel
      score={gameState.score}
      linesCleared={gameState.linesCleared}
      {newGamePath}
      {dashboardPath}
    />
  {:else}
    <BlockGameSlots
      slots={gameState.slots}
      {slotFits}
      draggedSlotIndex={drag?.slotIndex ?? null}
      {returnedSlotIndex}
      onPickUp={handlePickUp}
    />
  {/if}
</div>

{#if drag !== null}
  <!-- The shape follows the pointer at board size. It ignores the pointer, so it never gets in the
       way of the drop. -->
  <div
    class="dragged-shape"
    style:left={`${String(drag.shapeTopLeft.x)}px`}
    style:top={`${String(drag.shapeTopLeft.y)}px`}
  >
    <BlockGameShape
      shapeId={drag.shapeId}
      cellSize={`${String(drag.cellPitchPx - BOARD_GRID_LINE_PX)}px`}
      gap={`${String(BOARD_GRID_LINE_PX)}px`}
    />
  </div>
{/if}

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
    background: var(--color-error-surface);
    color: var(--color-error);
  }

  .dragged-shape {
    position: fixed;
    z-index: 10;
    pointer-events: none;
    opacity: 0.9;
    filter: drop-shadow(0 6px 8px rgb(0 0 0 / 25%));
  }
</style>
