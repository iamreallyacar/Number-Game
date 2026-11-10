<script lang="ts">
  import type { BoardCell, BoardSize, CellIndex, ShapeColour } from '@local/block-game';
  import { BLOCK_COLOURS } from './block-colours.js';
  import BlockGameClearEffect from './BlockGameClearEffect.svelte';
  import type { ClearEffect } from './clear-effect.js';
  import type { PlacementPreview } from './placement-preview.js';

  interface Props {
    readonly cells: readonly BoardCell[];
    readonly size: BoardSize;
    /** Where the dragged shape would land, or null when no shape is over the board (BG-07). */
    readonly preview: PlacementPreview | null;
    /** The colour of the dragged shape, used for its preview. */
    readonly previewColour: ShapeColour | null;
    readonly clearEffects: readonly ClearEffect[];
    /** The grid element, so the play screen can measure where the cells are on the screen. */
    boardElement?: HTMLElement | undefined;
  }

  let {
    cells,
    size,
    preview,
    previewColour,
    clearEffects,
    boardElement = $bindable(),
  }: Props = $props();

  const coveredCells: ReadonlySet<CellIndex> = $derived(new Set(preview?.coveredCellIndexes));
  const clearingCells: ReadonlySet<CellIndex> = $derived(new Set(preview?.clearingCellIndexes));
  const previewFits = $derived(preview?.fits === true);
  const filledCount = $derived(cells.filter((cell) => cell !== null).length);
</script>

<!-- A square board that is always fully on screen (BG-01, BG-02). The lines between cells are the
     board background showing through the gaps (BG-03). Cells are drawn, not tapped, so the board
     is one labelled image for screen readers. -->
<div
  class="board"
  style:--board-size={size}
  bind:this={boardElement}
  role="img"
  aria-label={`Board, ${String(size)} by ${String(size)}, ${String(filledCount)} cells filled`}
>
  {#each cells as cell, index (index)}
    <span
      class="cell"
      class:filled={cell !== null}
      class:ghost={coveredCells.has(index) && previewFits}
      class:blocked={coveredCells.has(index) && !previewFits}
      class:clearing={clearingCells.has(index)}
      style:--block-colour={cell === null ? null : BLOCK_COLOURS[cell]}
      style:--ghost-colour={previewColour === null ? null : BLOCK_COLOURS[previewColour]}
    ></span>
  {/each}
  {#each clearEffects as effect (effect.id)}
    <BlockGameClearEffect {effect} />
  {/each}
</div>

<style>
  .board {
    position: relative;
    container-type: inline-size;
    display: grid;
    grid-template-columns: repeat(var(--board-size), minmax(0, 1fr));
    gap: 1px;
    /* Wide enough to play comfortably, but never wider than the screen, and short enough on a
       phone that the slots still fit below it. */
    width: min(100%, 30rem, 58svh);
    margin: 0 auto;
    border: 1px solid var(--color-border);
    background: var(--color-border);
    user-select: none;
  }

  .cell {
    aspect-ratio: 1;
    background: var(--color-surface);
  }

  /* Filled cells are drawn raised, so they differ from empty cells by more than colour. */
  .cell.filled {
    border-radius: 3px;
    background: var(--block-colour);
    box-shadow:
      inset 0 -3px 0 rgb(0 0 0 / 22%),
      inset 0 2px 0 rgb(255 255 255 / 30%);
  }

  .cell.ghost {
    background: color-mix(in srgb, var(--ghost-colour) 45%, var(--color-surface));
    box-shadow: inset 0 0 0 2px var(--ghost-colour);
  }

  /* Stripes as well as the error colour, so a shape that does not fit is clear without colour. */
  .cell.blocked {
    background: repeating-linear-gradient(
      45deg,
      var(--color-error-surface) 0 4px,
      var(--color-error) 4px 6px
    );
  }

  /* A thick inner frame marks the cells of the lines that would clear. */
  .cell.clearing {
    box-shadow: inset 0 0 0 3px var(--color-hint-border);
  }

  .cell.clearing:not(.filled, .ghost) {
    background: var(--color-hint);
  }
</style>
