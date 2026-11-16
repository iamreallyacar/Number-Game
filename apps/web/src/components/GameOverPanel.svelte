<script lang="ts">
  interface Props {
    /** Why the game ended, as one sentence. */
    readonly reason: string;
    /** The final score and what the game counts next to it, such as "Final score 120 on stage 3". */
    readonly finalResult: string;
    readonly newGamePath: string;
    readonly dashboardPath: string;
    /** The text of the link to `newGamePath`. */
    readonly newGameLabel?: string;
  }

  const {
    reason,
    finalResult,
    newGamePath,
    dashboardPath,
    newGameLabel = 'New Game',
  }: Props = $props();
</script>

<!-- Shown in place of a game's controls when the game has ended (PS-12). -->
<section class="panel stack" aria-live="polite">
  <h2>Game over</h2>
  <p>{reason}</p>
  <p class="final-result">{finalResult}</p>
  <p>The result is added to the high scores.</p>
  <div class="button-row">
    <a class="button primary" href={newGamePath}>{newGameLabel}</a>
    <a class="button" href={dashboardPath}>Dashboard</a>
  </div>
</section>

<style>
  .final-result {
    font-size: 1.25rem;
    font-weight: 700;
  }
</style>
