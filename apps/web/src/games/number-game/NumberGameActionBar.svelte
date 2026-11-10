<script lang="ts">
  import type { HintAllowance } from '@local/number-game';

  interface Props {
    readonly addNumbersLeft: number;
    readonly hintsLeft: HintAllowance;
    /** False when the difficulty gives no hints at all, which hides the hint button (DF-03). */
    readonly hintsAllowed: boolean;
    /** True while a hint is on screen, so a second press does not use up another hint. */
    readonly hintShown: boolean;
    readonly disabled: boolean;
    readonly onAddNumbers: () => void;
    readonly onHint: () => void;
  }

  const {
    addNumbersLeft,
    hintsLeft,
    hintsAllowed,
    hintShown,
    disabled,
    onAddNumbers,
    onHint,
  }: Props = $props();

  const hintsLeftText = $derived(
    hintsLeft === 'unlimited' ? 'unlimited' : `${String(hintsLeft)} left`,
  );
</script>

<!-- Add Numbers sits below the board and shows its uses left (NG-16, NG-19). -->
<div class="action-bar">
  <button
    type="button"
    class="button primary"
    disabled={disabled || addNumbersLeft <= 0}
    onclick={onAddNumbers}
  >
    Add Numbers ({addNumbersLeft} left)
  </button>
  {#if hintsAllowed}
    <button
      type="button"
      class="button"
      disabled={disabled || hintShown || hintsLeft === 0}
      onclick={onHint}
    >
      Hint ({hintsLeftText})
    </button>
  {/if}
</div>

<style>
  .action-bar {
    display: flex;
    gap: 0.5rem;
  }

  .action-bar :global(.button) {
    flex: 1;
  }
</style>
