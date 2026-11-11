<script lang="ts">
  import { describeError } from '../api/api-request.js';
  import { listPlayerIds } from '../api/game-server-api.js';
  import type { BrowserGame } from '../games/browser-game.js';
  import PersonalBestsList from './PersonalBestsList.svelte';
  import TopResultsTable from './TopResultsTable.svelte';

  interface Props {
    readonly game: BrowserGame;
  }

  const { game }: Props = $props();

  const ALL_CATEGORIES = '';
  const NO_PLAYER = '';

  let selectedCategory = $state(ALL_CATEGORIES);
  let selectedPlayerId = $state(NO_PLAYER);

  const playersRequest = listPlayerIds();
</script>

<label class="field">
  <span>Show</span>
  <select bind:value={selectedCategory}>
    <option value={ALL_CATEGORIES}>All</option>
    {#each game.categories as category (category.id)}
      <option value={category.id}>{category.label}</option>
    {/each}
  </select>
</label>
<TopResultsTable {game} category={selectedCategory === ALL_CATEGORIES ? null : selectedCategory} />

{#await playersRequest}
  <p>Loading player IDs…</p>
{:then playerIds}
  <label class="field">
    <span>Personal bests of</span>
    <select bind:value={selectedPlayerId}>
      <option value={NO_PLAYER}>Pick a player</option>
      {#each playerIds as playerId (playerId)}
        <option value={playerId}>{playerId}</option>
      {/each}
    </select>
  </label>
{:catch error}
  <p class="error-text" role="alert">Could not load the player IDs: {describeError(error)}</p>
{/await}
{#if selectedPlayerId !== NO_PLAYER}
  <PersonalBestsList {game} playerId={selectedPlayerId} />
{/if}
