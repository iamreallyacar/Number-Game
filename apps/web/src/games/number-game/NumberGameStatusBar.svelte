<script lang="ts">
  import type { DifficultyId } from '@local/number-game';
  import { DIFFICULTY_LABELS } from './difficulty-labels.js';

  interface Props {
    readonly score: number;
    readonly stage: number;
    readonly difficulty: DifficultyId;
  }

  const { score, stage, difficulty }: Props = $props();
</script>

<!-- Score and stage stay on screen during play (NG-22, NG-24). -->
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
    <dt>Difficulty</dt>
    <dd>{DIFFICULTY_LABELS[difficulty]}</dd>
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
