<script lang="ts">
  import { describeError } from '../api/api-request.js';
  import { createPlayer, listPlayerIds } from '../api/game-server-api.js';

  interface Props {
    readonly onPick: (playerId: string) => void;
  }

  const { onPick }: Props = $props();

  let playersRequest = $state(listPlayerIds());
  let newPlayerId = $state('');
  let createError: string | null = $state(null);
  let isCreating = $state(false);

  async function handleCreate(event: SubmitEvent): Promise<void> {
    event.preventDefault();
    createError = null;
    isCreating = true;
    try {
      onPick(await createPlayer(newPlayerId.trim()));
    } catch (error) {
      // The server explains what is wrong, such as a taken ID or a character that is not allowed.
      createError = describeError(error);
    } finally {
      isCreating = false;
    }
  }
</script>

<!-- PS-01, PS-05: pick an existing player ID or create a new one. -->
<section class="stack">
  <h3>Pick your player ID</h3>
  {#await playersRequest}
    <p>Loading player IDs…</p>
  {:then playerIds}
    {#if playerIds.length === 0}
      <p class="muted">No player IDs yet. Create the first one below.</p>
    {:else}
      <ul class="player-list">
        {#each playerIds as playerId (playerId)}
          <li>
            <button
              type="button"
              class="button"
              onclick={() => {
                onPick(playerId);
              }}>{playerId}</button
            >
          </li>
        {/each}
      </ul>
    {/if}
  {:catch error}
    <p class="error-text" role="alert">Could not load the player IDs: {describeError(error)}</p>
    <button type="button" class="button" onclick={() => (playersRequest = listPlayerIds())}>
      Try again
    </button>
  {/await}

  <form class="stack" onsubmit={handleCreate}>
    <label class="field">
      <span>New player ID</span>
      <input type="text" bind:value={newPlayerId} autocomplete="nickname" required />
    </label>
    {#if createError !== null}
      <p class="error-text" role="alert">{createError}</p>
    {/if}
    <button type="submit" class="button primary" disabled={isCreating}>Create and use</button>
  </form>
</section>

<style>
  .player-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
