<script lang="ts">
  import { HINT_COST, UNDO_COST } from '@local/disk-game';

  interface Props {
    readonly undoDisabled: boolean;
    readonly hintDisabled: boolean;
    readonly onUndo: () => void;
    readonly onHint: () => void;
  }

  const { undoDisabled, hintDisabled, onUndo, onHint }: Props = $props();

  function costText(cost: number): string {
    return cost === 1 ? '1 move' : `${String(cost)} moves`;
  }
</script>

<!-- Undo and hint show what they cost (DK-12, DK-13) and are turned off by the screen (DK-14). -->
<div class="action-bar">
  <button type="button" class="button" disabled={undoDisabled} onclick={onUndo}>
    Undo (costs {costText(UNDO_COST)})
  </button>
  <button type="button" class="button" disabled={hintDisabled} onclick={onHint}>
    Hint (costs {costText(HINT_COST)})
  </button>
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
