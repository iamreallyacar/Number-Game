<script lang="ts">
  import { STARTING_DISK_COUNTS, type StartingDiskCount } from '@local/disk-game';
  import type { NewGameOptionsFormProps } from '../browser-game.js';
  import { startingDiskCountLabel } from './disk-count-labels.js';

  const { onSubmit }: NewGameOptionsFormProps = $props();

  let startingDiskCount: StartingDiskCount = $state(STARTING_DISK_COUNTS[0]);

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    onSubmit({ startingDiskCount });
  }
</script>

<!-- DK-04 -->
<form class="stack" onsubmit={handleSubmit}>
  <fieldset class="choice-group">
    <legend>Disks in the first stage</legend>
    {#each STARTING_DISK_COUNTS as diskCountOption (diskCountOption)}
      <label class="choice">
        <input
          type="radio"
          name="startingDiskCount"
          value={diskCountOption}
          bind:group={startingDiskCount}
        />
        <span class="choice-label">{startingDiskCountLabel(diskCountOption)}</span>
      </label>
    {/each}
  </fieldset>
  <p class="muted">Each stage after the first has one more disk, up to 10.</p>

  <button type="submit" class="button primary">Start game</button>
</form>
