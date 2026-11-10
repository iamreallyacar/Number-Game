<script lang="ts">
  import type { ClearEffect } from './clear-effect.js';

  interface Props {
    readonly effect: ClearEffect;
  }

  const { effect }: Props = $props();
</script>

<!-- Placed over the board cells, which must be its nearest size container (BG-17). -->
{#each effect.clearedCells as cell (`${String(cell.row)}-${String(cell.column)}`)}
  <span class="over-cell flash" style:--row={cell.row} style:--column={cell.column}></span>
{/each}
<span
  class="over-cell points"
  style:--row={effect.pointsAt.row}
  style:--column={effect.pointsAt.column}
  aria-hidden="true">+{effect.pointsEarned}</span
>

<style>
  .over-cell {
    /* The distance from one cell to the next: the board width plus the 1px grid lines between
       cells, shared out between the columns. */
    --cell-pitch: calc((100cqi + 1px) / var(--board-size));
    position: absolute;
    left: calc((var(--column) + 0.5) * var(--cell-pitch));
    top: calc((var(--row) + 0.5) * var(--cell-pitch));
    translate: -50% -50%;
    pointer-events: none;
  }

  .flash {
    width: var(--cell-pitch);
    aspect-ratio: 1;
    border-radius: 3px;
    background: var(--color-hint);
    box-shadow: 0 0 0 2px var(--color-hint-border);
    opacity: 0;
    animation: flash 0.45s ease-out;
  }

  .points {
    color: var(--color-accent);
    font-size: calc(var(--cell-pitch) * 0.7);
    font-weight: 800;
    white-space: nowrap;
    text-shadow:
      0 0 3px var(--color-surface),
      0 0 6px var(--color-surface);
    opacity: 0;
    animation: float-up 0.9s ease-out;
  }

  @keyframes flash {
    from {
      scale: 1;
      opacity: 1;
    }
    to {
      scale: 0.3;
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
      transform: translateY(calc(var(--cell-pitch) * -2)) scale(1);
      opacity: 0;
    }
  }

  /* Without movement the cells and points only fade in and out (PL-20). */
  @media (prefers-reduced-motion: reduce) {
    .flash,
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
