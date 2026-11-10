<script lang="ts">
  interface Props {
    readonly score: number;
    readonly linesCleared: number;
    readonly newGamePath: string;
    readonly dashboardPath: string;
  }

  const { score, linesCleared, newGamePath, dashboardPath }: Props = $props();
</script>

<!-- Shown when none of the three shapes fits on the board (BG-19, BG-20). -->
<section class="panel stack" aria-live="polite">
  <h2>Game over</h2>
  <p>None of your shapes fits on the board.</p>
  <p class="final-result">Final score {score} with {linesCleared} lines cleared</p>
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
