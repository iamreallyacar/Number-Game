<script lang="ts">
  import { routePath } from '../routing/routes.js';

  interface Props {
    readonly gameId: string;
    readonly message: string;
  }

  const { gameId, message }: Props = $props();
</script>

<!-- No reload button: the slot may now hold another player's game, which a reload would open. -->
<p>{message}</p>
<div class="button-row">
  <a class="button primary" href={routePath({ page: 'game', gameId })}>Save Slots</a>
  <a class="button" href={routePath({ page: 'dashboard' })}>Dashboard</a>
</div>
