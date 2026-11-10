<script lang="ts">
  interface Props {
    readonly score: number;
    readonly streak: number;
    readonly linesCleared: number;
  }

  const { score, streak, linesCleared }: Props = $props();
</script>

<!-- Score and streak stay on screen during play (BG-16). -->
<dl class="status-bar">
  <div>
    <dt>Score</dt>
    <dd>{score}</dd>
  </div>
  <div>
    <dt>Streak</dt>
    <dd>{streak}</dd>
  </div>
  <div>
    <dt>Lines</dt>
    <dd>{linesCleared}</dd>
  </div>
</dl>

<style>
  .status-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
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
