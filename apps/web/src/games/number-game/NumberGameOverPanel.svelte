<script lang="ts">
  interface Props {
    readonly score: number;
    readonly stage: number;
    readonly newGamePath: string;
    readonly dashboardPath: string;
  }

  const { score, stage, newGamePath, dashboardPath }: Props = $props();
</script>

<!-- Shown when no pair is left and Add Numbers is used up (NG-26, NG-27). -->
<section class="panel stack" aria-live="polite">
  <h2>Game over</h2>
  <p>No pairs are left and Add Numbers is used up.</p>
  <p class="final-result">Final score {score} on stage {stage}</p>
  <p>The result is added to the high scores.</p>
  <div class="button-row">
    <a class="button primary" href={newGamePath}>New Game</a>
    <a class="button" href={dashboardPath}>Dashboard</a>
  </div>
</section>

<style>
  .final-result {
    font-size: 1.25rem;
    font-weight: 700;
  }
</style>
