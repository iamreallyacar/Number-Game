<script lang="ts">
  import { getSoundPlayer } from '../audio/sound-player.js';

  const soundPlayer = getSoundPlayer();
  let muted = $state(soundPlayer.muted);

  function toggleSound(): void {
    muted = !muted;
    soundPlayer.setMuted(muted);
  }
</script>

<!-- Turns every game sound off and on (PL-19). -->
<button type="button" class="button sound-toggle" onclick={toggleSound}>
  <span aria-hidden="true">{muted ? '🔇' : '🔊'}</span>
  {muted ? 'Sound off' : 'Sound on'}
</button>

<style>
  .sound-toggle {
    gap: 0.4rem;
    margin-left: auto;
  }
</style>
