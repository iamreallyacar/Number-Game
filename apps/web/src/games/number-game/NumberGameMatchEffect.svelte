<script lang="ts">
  import PointsPopUp from '../../components/PointsPopUp.svelte';
  import type { BoardPosition } from '../board-position.js';
  import type { MatchEffect } from './match-effect.js';

  interface Props {
    readonly effect: MatchEffect;
  }

  const { effect }: Props = $props();

  const burstCells: readonly BoardPosition[] = $derived([effect.firstCell, effect.secondCell]);
</script>

<!-- Placed over the board cells, which must be its nearest size container (NG-30). -->
{#each burstCells as cell, burstIndex (burstIndex)}
  <span class="over-cell burst" style:--row={cell.row} style:--column={cell.column}></span>
{/each}
<span
  class="over-cell"
  style:--row={effect.secondCell.row}
  style:--column={effect.secondCell.column}
>
  <PointsPopUp
    pointsEarned={effect.pointsEarned}
    cheerWords={effect.cheerWords}
    textCellShare={0.5}
    riseCells={1.5}
  />
</span>

<style>
  .over-cell {
    /* The distance from one cell to the next: the board width plus the 1px grid lines between
       cells, shared out between the columns. */
    --cell-pitch: calc((100cqi + 1px) / var(--board-width));
    position: absolute;
    left: calc((var(--column) + 0.5) * var(--cell-pitch));
    top: calc((var(--row) + 0.5) * var(--cell-pitch));
    translate: -50% -50%;
    pointer-events: none;
  }

  .burst {
    width: var(--cell-pitch);
    aspect-ratio: 1;
    border: 3px solid var(--color-accent);
    border-radius: 50%;
    opacity: 0;
    animation: burst 0.5s ease-out;
  }

  @keyframes burst {
    from {
      scale: 0.4;
      opacity: 1;
    }
    to {
      scale: 1.6;
      opacity: 0;
    }
  }

  /* Without movement the bursts are left out (PL-20). */
  @media (prefers-reduced-motion: reduce) {
    .burst {
      display: none;
    }
  }
</style>
