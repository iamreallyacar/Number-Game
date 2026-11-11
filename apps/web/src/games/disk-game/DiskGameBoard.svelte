<script lang="ts">
  import {
    countDisks,
    PEG_INDEXES,
    pegAt,
    type PegIndex,
    type PegMove,
    type Pegs,
  } from '@local/disk-game';
  import { diskColourOf, diskWidthShareOf } from './disk-colours.js';
  import type { StageClearEffect } from './stage-clear-effect.js';

  interface Props {
    readonly pegs: Pegs;
    /** The peg whose top disk is picked up and shown raised, or null (DK-09). */
    readonly heldPeg: PegIndex | null;
    /** True for a moment after a refused drop, which shakes the raised disk (DK-10). */
    readonly dropRefused: boolean;
    readonly hintMove: PegMove | null;
    readonly stageClearEffect: StageClearEffect | null;
    readonly disabled: boolean;
    readonly onTapPeg: (pegIndex: PegIndex) => void;
  }

  const { pegs, heldPeg, dropRefused, hintMove, stageClearEffect, disabled, onTapPeg }: Props =
    $props();

  const diskCount = $derived(countDisks(pegs));

  function describePeg(pegIndex: PegIndex): string {
    const peg = pegAt(pegs, pegIndex);
    const disks = peg.length === 0 ? 'empty' : `disks ${peg.join(', ')} from the bottom to the top`;
    const held = heldPeg === pegIndex ? ', top disk picked up' : '';
    return `Peg ${String(pegIndex + 1)}, ${disks}${held}`;
  }
</script>

<!-- Each peg is one large button, so it is easy to tap on a phone (PL-09). -->
<div class="board" style:--disk-count={diskCount}>
  {#each PEG_INDEXES as pegIndex (pegIndex)}
    {@const peg = pegAt(pegs, pegIndex)}
    {@const sorted = stageClearEffect?.stageClear.sortedPegIndex === pegIndex}
    <button
      type="button"
      class="peg"
      class:hint-target={hintMove?.toPeg === pegIndex}
      class:sorted
      aria-label={describePeg(pegIndex)}
      aria-pressed={heldPeg === pegIndex}
      {disabled}
      onclick={() => {
        onTapPeg(pegIndex);
      }}
    >
      <span class="rod"></span>
      {#each peg as disk, height (disk)}
        {@const top = height === peg.length - 1}
        {@const raised = top && heldPeg === pegIndex}
        <span
          class="disk"
          class:raised
          class:refused={raised && dropRefused}
          class:hinted={top && hintMove?.fromPeg === pegIndex}
          style:--height={raised ? diskCount + 1 : height}
          style:--width-share={diskWidthShareOf(disk, diskCount)}
          style:--disk-colour={diskColourOf(disk)}>{disk}</span
        >
      {/each}
      {#if stageClearEffect !== null && sorted}
        {#key stageClearEffect.id}
          <span class="points" aria-hidden="true">
            +{stageClearEffect.stageClear.pointsEarned}
            {#if stageClearEffect.stageClear.perfect}
              <span class="perfect">Perfect</span>
            {/if}
          </span>
        {/key}
      {/if}
      <span class="base"></span>
    </button>
  {/each}
</div>

<style>
  .board {
    --disk-height: 1.75rem;
    --base-height: 0.5rem;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
  }

  .peg {
    position: relative;
    /* Room for every disk of the stage, the gap above the rod, and one raised disk. */
    height: calc(var(--base-height) + (var(--disk-count) + 2.5) * var(--disk-height));
    padding: 0;
    border: 1px solid transparent;
    border-radius: 8px;
    background: none;
    color: inherit;
    font: inherit;
    cursor: pointer;
    touch-action: manipulation;
  }

  .peg:disabled {
    cursor: default;
  }

  .peg:focus-visible {
    outline: 2px solid var(--color-accent);
  }

  .peg.hint-target {
    border-color: var(--color-hint-border);
    background: var(--color-hint);
  }

  .peg.sorted {
    animation: sorted-glow 1.2s ease-out;
  }

  .rod {
    position: absolute;
    left: 50%;
    bottom: var(--base-height);
    width: 0.4rem;
    height: calc((var(--disk-count) + 0.5) * var(--disk-height));
    border-radius: 0.2rem 0.2rem 0 0;
    background: var(--color-border);
    translate: -50% 0;
  }

  .base {
    position: absolute;
    left: 2%;
    right: 2%;
    bottom: 0;
    height: var(--base-height);
    border-radius: 0.25rem;
    background: var(--color-border);
  }

  .disk {
    position: absolute;
    left: 50%;
    bottom: calc(var(--base-height) + var(--height) * var(--disk-height));
    display: flex;
    align-items: center;
    justify-content: center;
    width: calc(var(--width-share) * 94%);
    height: calc(var(--disk-height) - 2px);
    border: 1px solid rgb(0 0 0 / 25%);
    border-radius: 0.6rem;
    background: var(--disk-colour);
    /* The disk colours are light, so the number is always dark. */
    color: #1d2330;
    font-size: 0.85rem;
    font-weight: 700;
    translate: -50% 0;
    transition: bottom 0.12s ease-out;
  }

  .disk.raised {
    box-shadow: 0 4px 8px rgb(0 0 0 / 30%);
  }

  .disk.hinted {
    outline: 3px solid var(--color-hint-border);
    outline-offset: 1px;
  }

  .disk.refused {
    outline: 3px solid var(--color-error);
    animation: shake 0.4s ease-in-out;
  }

  .points {
    position: absolute;
    left: 50%;
    bottom: calc(var(--base-height) + (var(--disk-count) + 0.5) * var(--disk-height));
    display: flex;
    flex-direction: column;
    align-items: center;
    color: var(--color-accent);
    font-size: 1.5rem;
    font-weight: 800;
    line-height: 1.1;
    white-space: nowrap;
    text-shadow:
      0 0 3px var(--color-surface),
      0 0 6px var(--color-surface);
    translate: -50% 0;
    opacity: 0;
    pointer-events: none;
    animation: float-up 1.2s ease-out;
  }

  .perfect {
    font-size: 0.9rem;
  }

  @keyframes shake {
    20% {
      translate: calc(-50% - 6px) 0;
    }
    40% {
      translate: calc(-50% + 6px) 0;
    }
    60% {
      translate: calc(-50% - 4px) 0;
    }
    80% {
      translate: calc(-50% + 4px) 0;
    }
  }

  @keyframes sorted-glow {
    0%,
    60% {
      border-color: var(--color-hint-border);
      background: var(--color-hint);
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
      transform: translateY(calc(var(--disk-height) * -1.5)) scale(1);
      opacity: 0;
    }
  }

  /* Without movement a refused disk only keeps its red outline, disks do not slide, and the
     points only fade in and out (PL-20). */
  @media (prefers-reduced-motion: reduce) {
    .disk {
      transition: none;
    }

    .disk.refused {
      animation: none;
    }

    .points {
      animation-name: fade;
    }
  }

  @keyframes fade {
    15%,
    70% {
      opacity: 1;
    }
  }
</style>
