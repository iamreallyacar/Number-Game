<script lang="ts">
  interface Props {
    readonly pointsEarned: number;
    /** The Chinese words of the cheer that plays with the points, or null when no cheer plays. */
    readonly cheerWords: string | null;
    /** The height of the points text, as a share of one board cell. */
    readonly textCellShare: number;
    /** How many board cells the text floats up before it fades. */
    readonly riseCells: number;
  }

  const { pointsEarned, cheerWords, textCellShare, riseCells }: Props = $props();
</script>

<!-- Points that float up from a board cell, with the cheer words beside them (PL-18, PL-20). The
     element around it places it on the board and must set --cell-pitch, the size of one cell. -->
<span
  class="pop-up"
  style:--text-cell-share={textCellShare}
  style:--rise-cells={riseCells}
  aria-hidden="true"
>
  <span class="points">+{pointsEarned}</span>
  {#if cheerWords !== null}
    <span class="cheer-words" lang="zh">{cheerWords}</span>
  {/if}
</span>

<style>
  .pop-up {
    --rise: calc(var(--cell-pitch) * var(--rise-cells) * -1);
    display: flex;
    align-items: baseline;
    gap: 0.2em;
    color: var(--color-accent);
    font-size: calc(var(--cell-pitch) * var(--text-cell-share));
    font-weight: 800;
    white-space: nowrap;
    text-shadow:
      0 0 3px var(--color-surface),
      0 0 6px var(--color-surface);
  }

  .points {
    opacity: 0;
    animation: float-up 0.9s ease-out;
  }

  .cheer-words {
    font-size: 1.6em;
    opacity: 0;
    animation: linger-up 2s ease-out;
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
      transform: translateY(var(--rise)) scale(1);
      opacity: 0;
    }
  }

  /* The words stay up longer than the points, so there is time to read them. */
  @keyframes linger-up {
    0% {
      transform: translateY(0) scale(0.8);
      opacity: 0;
    }
    8% {
      transform: translateY(0) scale(1.15);
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    100% {
      transform: translateY(var(--rise)) scale(1);
      opacity: 0;
    }
  }

  /* Without movement the points and the words only fade in and out (PL-20). */
  @media (prefers-reduced-motion: reduce) {
    .points {
      animation-name: fade;
    }

    .cheer-words {
      animation-name: linger-fade;
    }
  }

  @keyframes fade {
    15% {
      opacity: 1;
    }
  }

  @keyframes linger-fade {
    8%,
    70% {
      opacity: 1;
    }
  }
</style>
