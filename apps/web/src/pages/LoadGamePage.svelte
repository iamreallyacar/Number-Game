<script lang="ts">
  import SaveSlotList from '../components/SaveSlotList.svelte';
  import type { BrowserGame } from '../games/browser-game.js';
  import { navigate } from '../routing/router.js';
  import { routePath } from '../routing/routes.js';

  interface Props {
    readonly game: BrowserGame;
  }

  const { game }: Props = $props();
</script>

<h1>Load Game</h1>
<p><a href={routePath({ page: 'game-menu', gameId: game.id })}>Back to {game.name}</a></p>
<SaveSlotList
  {game}
  mode="load"
  onPickSave={(slotNumber: number, saveId: string) => {
    navigate(routePath({ page: 'play', gameId: game.id, slotNumber, saveId }));
  }}
/>
