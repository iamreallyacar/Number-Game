<script lang="ts">
  import type { BrowserGame } from '../games/browser-game.js';
  import { routePath } from '../routing/routes.js';

  interface Props {
    readonly games: readonly BrowserGame[];
  }

  const { games }: Props = $props();
</script>

<!-- PL-01, PL-02: every registered game with its name and description. -->
<h1>Games</h1>
<ul class="game-list">
  {#each games as game (game.id)}
    <li>
      <a class="panel game-card" href={routePath({ page: 'game-menu', gameId: game.id })}>
        <h2>{game.name}</h2>
        <p>{game.description}</p>
      </a>
    </li>
  {/each}
</ul>

<style>
  .game-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 1rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .game-card {
    display: block;
    height: 100%;
    color: inherit;
    text-decoration: none;
  }

  .game-card:hover,
  .game-card:focus-visible {
    border-color: var(--color-accent);
  }

  .game-card h2 {
    margin: 0 0 0.5rem;
  }
</style>
