<script lang="ts">
  import { onMount } from 'svelte';
  import { describeError } from './api/api-request.js';
  import SoundToggle from './components/SoundToggle.svelte';
  import { createBrowserGameRegistry } from './games/create-browser-game-registry.js';
  import DashboardPage from './pages/DashboardPage.svelte';
  import GamePage from './pages/GamePage.svelte';
  import NotFoundPage from './pages/NotFoundPage.svelte';
  import OutdatedPlayLinkPage from './pages/OutdatedPlayLinkPage.svelte';
  import PlayPage from './pages/PlayPage.svelte';
  import { startRouter } from './routing/router.js';
  import { parseRoute } from './routing/routes.js';

  const games = createBrowserGameRegistry();

  let path = $state(window.location.pathname);
  onMount(() =>
    startRouter((newPath) => {
      path = newPath;
    }),
  );

  const route = $derived(parseRoute(path));
  const game = $derived('gameId' in route ? games.findGame(route.gameId) : null);
</script>

<header class="site-header">
  <!-- Every page links back to the dashboard (PL-03). -->
  <a class="site-title" href="/">Game Dashboard</a>
  <SoundToggle />
</header>

<main class="page">
  {#key path}
    <svelte:boundary>
      {#if route.page === 'dashboard'}
        <DashboardPage games={games.listGames()} />
      {:else if route.page === 'not-found' || game === null}
        <NotFoundPage />
      {:else if route.page === 'game'}
        <GamePage {game} />
      {:else if route.page === 'play'}
        <PlayPage {game} slotNumber={route.slotNumber} saveId={route.saveId} />
      {:else}
        <OutdatedPlayLinkPage {game} />
      {/if}

      {#snippet failed(error, reset)}
        <div class="stack" role="alert">
          <h1>Something went wrong</h1>
          <p class="error-text">{describeError(error)}</p>
          <div class="button-row">
            <button type="button" class="button primary" onclick={reset}>Try again</button>
            <a class="button" href="/">Dashboard</a>
          </div>
        </div>
      {/snippet}
    </svelte:boundary>
  {/key}
</main>
