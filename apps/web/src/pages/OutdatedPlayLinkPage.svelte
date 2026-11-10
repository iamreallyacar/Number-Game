<script lang="ts">
  import SaveGoneNotice from '../components/SaveGoneNotice.svelte';
  import type { BrowserGame } from '../games/browser-game.js';

  interface Props {
    readonly game: BrowserGame;
  }

  const { game }: Props = $props();
</script>

<!-- A link that names only the slot could open whichever game is in it now, so it opens none. -->
<div class="stack" role="alert">
  <h1>This link no longer opens a game</h1>
  <SaveGoneNotice
    gameId={game.id}
    message="This is an older {game.name} link that does not say which game it belongs to. Pick your game on the Load Game page, or start a new one."
  />
</div>
