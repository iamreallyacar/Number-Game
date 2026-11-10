<script lang="ts">
  import { describeError } from '../api/api-request.js';
  import {
    listHighScores,
    listPersonalBests,
    listPlayerIds,
    type GameResult,
  } from '../api/game-server-api.js';
  import type { BrowserGame } from '../games/browser-game.js';
  import { routePath } from '../routing/routes.js';

  interface Props {
    readonly game: BrowserGame;
  }

  const { game }: Props = $props();

  const ALL_CATEGORIES = '';

  let selectedCategory = $state(ALL_CATEGORIES);
  let selectedPlayerId = $state('');

  const highScoresRequest = $derived(
    listHighScores(game.id, selectedCategory === ALL_CATEGORIES ? null : selectedCategory),
  );
  const playersRequest = listPlayerIds();
  const personalBestsRequest = $derived(
    selectedPlayerId === '' ? null : listPersonalBests(game.id, selectedPlayerId),
  );

  function describeCategory(categoryId: string): string {
    return game.categories.find((category) => category.id === categoryId)?.label ?? categoryId;
  }

  function describeResultDetails(result: GameResult): string {
    return game
      .describeDetails(result.details)
      .map((field) => `${field.label} ${field.value}`)
      .join(', ');
  }

  function formatDate(isoDate: string): string {
    return new Date(isoDate).toLocaleDateString();
  }
</script>

<h1>{game.name} High Scores</h1>
<p><a href={routePath({ page: 'game-menu', gameId: game.id })}>Back to {game.name}</a></p>

<!-- PS-14: top results with a filter. -->
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

  {#await highScoresRequest}
    <p>Loading high scores…</p>
  {:then highScores}
    {#if highScores.length === 0}
      <p class="muted">No finished games yet.</p>
    {:else}
      <div class="table-scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Player</th>
              <th scope="col">Score</th>
              <th scope="col">Details</th>
              <th scope="col">Date</th>
            </tr>
          </thead>
          <tbody>
            {#each highScores as result, index (index)}
              <tr>
                <td>{index + 1}</td>
                <td>{result.playerId}</td>
                <td>{result.score}</td>
                <td>{describeResultDetails(result)}</td>
                <td>{formatDate(result.finishedAt)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  {:catch error}
    <p class="error-text" role="alert">Could not load the high scores: {describeError(error)}</p>
  {/await}
</section>

<!-- PS-15: each player's best result per category. -->
<section class="stack">
  <h2>Personal bests</h2>
  {#await playersRequest}
    <p>Loading player IDs…</p>
  {:then playerIds}
    <label class="field">
      <span>Player</span>
      <select bind:value={selectedPlayerId}>
        <option value="">Pick a player</option>
        {#each playerIds as playerId (playerId)}
          <option value={playerId}>{playerId}</option>
        {/each}
      </select>
    </label>
  {:catch error}
    <p class="error-text" role="alert">Could not load the player IDs: {describeError(error)}</p>
  {/await}

  {#if personalBestsRequest !== null}
    {#await personalBestsRequest}
      <p>Loading personal bests…</p>
    {:then personalBests}
      {#if personalBests.length === 0}
        <p class="muted">{selectedPlayerId} has no finished games yet.</p>
      {:else}
        <ul class="stack personal-bests">
          {#each personalBests as result (result.category)}
            <li class="panel">
              <strong>{describeCategory(result.category)}:</strong>
              {result.score} points ({describeResultDetails(result)}, {formatDate(
                result.finishedAt,
              )})
            </li>
          {/each}
        </ul>
      {/if}
    {:catch error}
      <p class="error-text" role="alert">Could not load personal bests: {describeError(error)}</p>
    {/await}
  {/if}
</section>

<style>
  .table-scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
  }

  th,
  td {
    padding: 0.5rem;
    border-bottom: 1px solid var(--color-border);
    text-align: left;
  }

  .personal-bests {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
