<script lang="ts">
  import { BOARD_SIZES, type BoardSize } from '@local/block-game';
  import type { NewGameOptionsFormProps } from '../browser-game.js';
  import { boardSizeLabel } from './board-size-labels.js';

  const { onSubmit }: NewGameOptionsFormProps = $props();

  let size: BoardSize = $state(BOARD_SIZES[0]);

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    onSubmit({ size });
  }
</script>

<!-- BG-01 -->
<form class="stack" onsubmit={handleSubmit}>
  <fieldset class="choice-group">
    <legend>Board size</legend>
    {#each BOARD_SIZES as sizeOption (sizeOption)}
      <label class="choice">
        <input type="radio" name="size" value={sizeOption} bind:group={size} />
        <span class="choice-label">{boardSizeLabel(sizeOption)}</span>
      </label>
    {/each}
  </fieldset>

  <button type="submit" class="button primary">Start game</button>
</form>
