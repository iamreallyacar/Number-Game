<script lang="ts">
  interface Props {
    readonly score: number;
    readonly stage: number;
    readonly diskCount: number;
    readonly movesLeft: number;
    readonly stageMovesUsed: number;
    readonly stageFewestMoves: number;
  }

  const { score, stage, diskCount, movesLeft, stageMovesUsed, stageFewestMoves }: Props = $props();
</script>

<!-- These stay on screen during play (DK-18). -->
<dl class="status-bar">
  <div>
    <dt>Score</dt>
    <dd>{score}</dd>
  </div>
  <div>
    <dt>Stage</dt>
    <dd>{stage}</dd>
  </div>
  <div>
    <dt>Disks</dt>
    <dd>{diskCount}</dd>
  </div>
  <div class="move-count">
    <dt>Moves left</dt>
    <dd>{movesLeft}</dd>
  </div>
  <div class="move-count">
    <dt>Used / fewest in this stage</dt>
    <dd>{stageMovesUsed} / {stageFewestMoves}</dd>
  </div>
</dl>

<style>
  .status-bar {
    display: grid;
    /* Three values on the first row and the two move counts on the second. */
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
    margin: 0;
    text-align: center;
  }

  .status-bar > div {
    grid-column: span 2;
  }

  .status-bar > .move-count {
    grid-column: span 3;
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
