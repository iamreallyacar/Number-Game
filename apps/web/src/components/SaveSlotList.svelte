<script lang="ts">
  import { describeError } from '../api/api-request.js';
  import type { SlotListing } from '@local/game-server-api';
  import { deleteSlot, listSlots } from '../api/game-server-api.js';
  import type { BrowserGame } from '../games/browser-game.js';

  interface Props {
    readonly game: BrowserGame;
    /** New Game picks an empty slot (PS-04). Load Game picks a used one (PS-09). */
    readonly mode: 'new' | 'load';
    readonly onPick: (slotNumber: number) => void;
  }

  const { game, mode, onPick }: Props = $props();

  function loadSlots(): Promise<readonly SlotListing[]> {
    return listSlots(game.id);
  }

  let slotsRequest = $state(loadSlots());
  let deleteError: string | null = $state(null);

  function formatPlayedAt(isoDate: string): string {
    return new Date(isoDate).toLocaleString();
  }

  async function handleDelete(slotNumber: number): Promise<void> {
    if (!window.confirm(`Delete the save in slot ${String(slotNumber)}? This cannot be undone.`)) {
      return;
    }
    deleteError = null;
    try {
      await deleteSlot(game.id, slotNumber);
    } catch (error) {
      deleteError = describeError(error);
    }
    slotsRequest = loadSlots();
  }
</script>

{#if deleteError !== null}
  <p class="error-text" role="alert">Could not delete the save: {deleteError}</p>
{/if}

{#await slotsRequest}
  <p>Loading save slots…</p>
{:then slots}
  <ul class="slot-list">
    {#each slots as slot (slot.slotNumber)}
      <li class="panel slot">
        <h3>Slot {slot.slotNumber}</h3>
        {#if slot.save === null}
          <p class="muted">Empty</p>
          {#if mode === 'new'}
            <button
              type="button"
              class="button primary"
              onclick={() => {
                onPick(slot.slotNumber);
              }}
            >
              Use this slot
            </button>
          {/if}
        {:else}
          <dl class="slot-details">
            <dt>Player</dt>
            <dd>{slot.save.playerId}</dd>
            <dt>Score</dt>
            <dd>{slot.save.summary.score}</dd>
            {#each game.describeDetails(slot.save.summary.details) as field (field.label)}
              <dt>{field.label}</dt>
              <dd>{field.value}</dd>
            {/each}
            <dt>Last played</dt>
            <dd>{formatPlayedAt(slot.save.lastPlayedAt)}</dd>
          </dl>
          <div class="button-row">
            {#if mode === 'load'}
              <button
                type="button"
                class="button primary"
                onclick={() => {
                  onPick(slot.slotNumber);
                }}
              >
                Continue
              </button>
            {/if}
            <button
              type="button"
              class="button danger"
              onclick={() => handleDelete(slot.slotNumber)}
            >
              Delete
            </button>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
{:catch error}
  <p class="error-text" role="alert">Could not load the save slots: {describeError(error)}</p>
  <button type="button" class="button" onclick={() => (slotsRequest = loadSlots())}
    >Try again</button
  >
{/await}

<style>
  .slot-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .slot h3 {
    margin: 0 0 0.5rem;
  }

  .slot-details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 0.25rem 0.75rem;
    margin: 0 0 0.75rem;
  }

  .slot-details dt {
    color: var(--color-muted);
  }

  .slot-details dd {
    margin: 0;
  }
</style>
