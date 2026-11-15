<script lang="ts">
  import type { NewGameOptionsFormProps } from '../browser-game.js';

  const { onSubmit }: NewGameOptionsFormProps = $props();

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    onSubmit({});
  }
</script>

<!-- BG-01: the board is always the same size, so there is nothing to choose. -->
<form class="stack" onsubmit={handleSubmit}>
  <button type="submit" class="button primary">Start game</button>
</form>
