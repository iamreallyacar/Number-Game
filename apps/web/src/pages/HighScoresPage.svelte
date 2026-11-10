<script lang="ts">
  import { describeError } from '../api/api-request.js';
  import { listPlayerIds } from '../api/game-server-api.js';
  import PersonalBestsList from '../components/PersonalBestsList.svelte';
  import TopResultsTable from '../components/TopResultsTable.svelte';
  import type { BrowserGame } from '../games/browser-game.js';
  import { routePath } from '../routing/routes.js';

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

<h1>{game.name} High Scores</h1>
<p><a href={routePath({ page: 'game-menu', gameId: game.id })}>Back to {game.name}</a></p>

<section class="stack">
  <label class="field">
    <span>Show</span>
    <select bind:value={selectedCategory}>
      <option value={ALL_CATEGORIES}>All</option>
      {#each game.categories as category (category.id)}
        <option value={category.id}>{category.label}</option>
      {/each}
    </select>
  </label>
  <TopResultsTable
    {game}
    category={selectedCategory === ALL_CATEGORIES ? null : selectedCategory}
  />
</section>

<section class="stack">
  <h2>Personal bests</h2>
  {#await playersRequest}
    <p>Loading player IDs…</p>
  {:then playerIds}
    <label class="field">
      <span>Player</span>
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
</section>
