<script lang="ts">
  import type { DetailField } from '../games/browser-game.js';

  interface Props {
    readonly fields: readonly DetailField[];
  }

  const { fields }: Props = $props();
</script>

<!-- The values a game keeps on screen during play, such as the score, side by side. -->
<dl class="status-bar" style:--field-count={fields.length}>
  {#each fields as field (field.label)}
    <div>
      <dt>{field.label}</dt>
      <dd>{field.value}</dd>
    </div>
  {/each}
</dl>

<style>
  .status-bar {
    display: grid;
    grid-template-columns: repeat(var(--field-count), 1fr);
    gap: 0.5rem;
    margin: 0;
    text-align: center;
  }

  dt {
    font-size: 0.75rem;
    color: var(--color-muted);
  }

  dd {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
</style>
