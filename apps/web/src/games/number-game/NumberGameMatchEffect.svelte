<script lang="ts">
  import type { BoardPosition, MatchEffect } from './match-effect.js';

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
  class="over-cell points"
  style:--row={effect.secondCell.row}
  style:--column={effect.secondCell.column}
  aria-hidden="true">+{effect.pointsEarned}</span
>

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

  .points {
    color: var(--color-accent);
    font-size: calc(var(--cell-pitch) * 0.5);
    font-weight: 800;
    white-space: nowrap;
    text-shadow:
      0 0 3px var(--color-surface),
      0 0 6px var(--color-surface);
    opacity: 0;
    animation: float-up 0.9s ease-out;
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

  @keyframes float-up {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0;
    }
    15% {
      transform: translateY(0) scale(1.15);
      opacity: 1;
    }
    100% {
      transform: translateY(calc(var(--cell-pitch) * -1.5)) scale(1);
      opacity: 0;
    }
  }

  /* Without movement the points only fade in and out, and the bursts are left out (PL-20). */
  @media (prefers-reduced-motion: reduce) {
    .burst {
      display: none;
    }

    .points {
      animation-name: fade;
    }
  }

  @keyframes fade {
    15% {
      opacity: 1;
    }
  }
</style>
