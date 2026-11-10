<script lang="ts">
  import type { SaveStatus } from '../saving/move-sync.js';
  import SaveGoneNotice from './SaveGoneNotice.svelte';

  interface Props {
    readonly status: SaveStatus;
    readonly gameId: string;
    /** Loads the save from the server again, which also takes the lock back to this device. */
    readonly onReload: () => void;
    readonly dashboardPath: string;
  }

  const { status, gameId, onReload, dashboardPath }: Props = $props();
</script>

<!-- Saving problems are always shown and never hidden away (PS-08, PS-18). -->
{#if status.kind === 'retrying'}
  <div class="banner warning" role="alert">
    <p>Your last move could not be saved: {status.message}</p>
    <p>Trying again. Keep this page open so no moves are lost.</p>
  </div>
{:else if status.kind === 'opened-elsewhere'}
  <div class="banner error" role="alert">
    <p>This game was opened on another device, so this device stopped saving it.</p>
    <div class="button-row">
      <button type="button" class="button primary" onclick={onReload}>Continue here</button>
      <a class="button" href={dashboardPath}>Dashboard</a>
    </div>
  </div>
{:else if status.kind === 'save-gone'}
  <div class="banner error" role="alert">
    <SaveGoneNotice
      {gameId}
      message="This game has ended or was replaced by a new game in the same slot, so this device stopped saving it."
    />
  </div>
{:else if status.kind === 'out-of-sync'}
  <div class="banner error" role="alert">
    <p>The server did not accept the last move: {status.message}</p>
    <p>Reload the game to continue from the last saved move.</p>
    <div class="button-row">
      <button type="button" class="button primary" onclick={onReload}>Reload game</button>
      <a class="button" href={dashboardPath}>Dashboard</a>
    </div>
  </div>
{/if}

<style>
  .banner {
    padding: 0.75rem;
    border: 1px solid;
    border-radius: 8px;
  }

  .banner p {
    margin: 0 0 0.5rem;
  }

  .warning {
    border-color: var(--color-warning);
    background: var(--color-warning-surface);
  }

  .error {
    border-color: var(--color-error);
    background: var(--color-error-surface);
  }
</style>
