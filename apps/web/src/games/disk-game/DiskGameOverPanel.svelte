<script lang="ts">
  interface Props {
    readonly score: number;
    readonly stage: number;
    readonly newGamePath: string;
    readonly dashboardPath: string;
  }

  const { score, stage, newGamePath, dashboardPath }: Props = $props();
</script>

<!-- Shown when the moves left can no longer clear the stage (DK-19, DK-20). -->
<section class="panel stack" aria-live="polite">
  <h2>Game over</h2>
  <p>You do not have enough moves left to finish this stage.</p>
  <p class="final-result">Final score {score}, reached stage {stage}</p>
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
