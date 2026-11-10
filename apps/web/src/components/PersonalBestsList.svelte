<script lang="ts">
  import { describeError } from '../api/api-request.js';
  import { listPersonalBests } from '../api/game-server-api.js';
  import type { BrowserGame } from '../games/browser-game.js';
  import { describeResultDetails, formatResultDate } from './format-game-result.js';

  interface Props {
    readonly game: BrowserGame;
    readonly playerId: string;
  }

  const { game, playerId }: Props = $props();

  const personalBestsRequest = $derived(listPersonalBests(game.id, playerId));

  function describeCategory(categoryId: string): string {
    return game.categories.find((category) => category.id === categoryId)?.label ?? categoryId;
  }
</script>

<!-- PS-15 -->
{#await personalBestsRequest}
  <p>Loading personal bests…</p>
{:then personalBests}
  {#if personalBests.length === 0}
    <p class="muted">{playerId} has no finished games yet.</p>
  {:else}
    <ul class="stack personal-bests">
      {#each personalBests as result (result.category)}
        <li class="panel">
          <strong>{describeCategory(result.category)}:</strong>
          {result.score} points ({describeResultDetails(game, result)}, {formatResultDate(
            result.finishedAt,
          )})
        </li>
      {/each}
    </ul>
  {/if}
{:catch error}
  <p class="error-text" role="alert">Could not load personal bests: {describeError(error)}</p>
{/await}

<style>
  .personal-bests {
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
