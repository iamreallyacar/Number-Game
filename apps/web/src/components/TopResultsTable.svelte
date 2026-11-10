<script lang="ts">
  import { describeError } from '../api/api-request.js';
  import { listHighScores } from '../api/game-server-api.js';
  import type { BrowserGame } from '../games/browser-game.js';
  import { describeResultDetails, formatResultDate } from './format-game-result.js';

  interface Props {
    readonly game: BrowserGame;
    /** Null shows the results of every category. */
    readonly category: string | null;
  }

  const { game, category }: Props = $props();

  const highScoresRequest = $derived(listHighScores(game.id, category));
</script>

<!-- PS-14 -->
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
              <td>{describeResultDetails(game, result)}</td>
              <td>{formatResultDate(result.finishedAt)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
{:catch error}
  <p class="error-text" role="alert">Could not load the high scores: {describeError(error)}</p>
{/await}

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
</style>
