<script lang="ts">
  import type { BrowserGame } from '../games/browser-game.js';
  import { routePath } from '../routing/routes.js';

  interface Props {
    readonly game: BrowserGame;
  }

  const { game }: Props = $props();
</script>

<h1>{game.name}</h1>
<p>{game.description}</p>
<nav class="menu stack" aria-label="{game.name} menu">
  <a class="button primary" href={routePath({ page: 'new-game', gameId: game.id })}>New Game</a>
  <a class="button" href={routePath({ page: 'load-game', gameId: game.id })}>Load Game</a>
  <a class="button" href={routePath({ page: 'high-scores', gameId: game.id })}>High Scores</a>
</nav>

<style>
  .menu {
    max-width: 20rem;
  }
</style>
