<script lang="ts">
  import {
    columnOf,
    rowOf,
    type Cell,
    type CellIndex,
    type CellPair,
    type Digit,
  } from '@local/number-game';
  import type { MatchEffect } from './match-effect.js';
  import NumberGameMatchEffect from './NumberGameMatchEffect.svelte';

  interface Props {
    readonly cells: readonly Cell[];
    readonly width: number;
    readonly selectedIndex: CellIndex | null;
    readonly hintPair: CellPair | null;
    /** The two cells of a wrong match, which shake briefly (NG-07). */
    readonly rejectedPair: CellPair | null;
    readonly matchEffects: readonly MatchEffect[];
    readonly disabled: boolean;
    readonly onTap: (index: CellIndex) => void;
  }

  const {
    cells,
    width,
    selectedIndex,
    hintPair,
    rejectedPair,
    matchEffects,
    disabled,
    onTap,
  }: Props = $props();

  function isInPair(pair: CellPair | null, index: CellIndex): boolean {
    return pair !== null && (pair.firstIndex === index || pair.secondIndex === index);
  }

  function describeCell(index: CellIndex, digit: Digit): string {
    const row = String(rowOf(index, width) + 1);
    const column = String(columnOf(index, width) + 1);
    return `Row ${row}, column ${column}: ${String(digit)}`;
  }
</script>

<!-- The board grows downwards without a limit and the page scrolls with it (NG-03).
     The lines between cells are the board background showing through the gaps (NG-29). -->
<div class="board" style:--board-width={width}>
  {#each cells as cell, index (index)}
    {#if cell === null}
      <span class="cell empty" aria-hidden="true"></span>
    {:else}
      <button
        type="button"
        class="cell"
        class:selected={selectedIndex === index}
        class:hinted={isInPair(hintPair, index)}
        class:rejected={isInPair(rejectedPair, index)}
        aria-pressed={selectedIndex === index}
        aria-label={describeCell(index, cell)}
        {disabled}
        onclick={() => {
          onTap(index);
        }}>{cell}</button
      >
    {/if}
  {/each}
  {#each matchEffects as effect (effect.id)}
    <NumberGameMatchEffect {effect} />
  {/each}
</div>

<style>
  .board {
    position: relative;
    container-type: inline-size;
    display: grid;
    grid-template-columns: repeat(var(--board-width), minmax(0, 1fr));
    gap: 1px;
    width: 100%;
    max-width: calc(var(--board-width) * 3.5rem);
    margin: 0 auto;
    border: 1px solid var(--color-border);
    background: var(--color-border);
  }

  .cell {
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    padding: 0;
    border: none;
    border-radius: 0;
    background: var(--color-surface);
    color: var(--color-text);
    /* The font follows the cell size, which follows the board width on any screen. */
    font-size: calc(100cqi / var(--board-width) * 0.55);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
  }

  .cell.empty {
    background: var(--color-background);
    cursor: default;
  }

  /* Inset outlines mark a cell without changing its size or covering the grid lines. */
  .cell.hinted {
    background: var(--color-hint);
    box-shadow: inset 0 0 0 2px var(--color-hint-border);
  }

  .cell.selected {
    background: var(--color-accent);
    color: var(--color-on-accent);
  }

  .cell.rejected {
    animation: shake 0.4s ease-in-out;
    background: var(--color-error-surface);
    box-shadow: inset 0 0 0 2px var(--color-error);
  }

  .cell:disabled {
    cursor: default;
  }

  @keyframes shake {
    0%,
    100% {
      translate: 0;
    }
    25% {
      translate: -4px;
    }
    75% {
      translate: 4px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cell.rejected {
      animation: none;
    }
  }
</style>
