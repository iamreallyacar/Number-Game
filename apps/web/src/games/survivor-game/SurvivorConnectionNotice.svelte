<script lang="ts">
  import type { ConnectionStatus } from '../../rooms/reconnecting-socket.js';

  interface Props {
    readonly status: ConnectionStatus;
    readonly gamePagePath: string;
    readonly dashboardPath: string;
  }

  const { status, gamePagePath, dashboardPath }: Props = $props();

  function describeWait(retryInMs: number): string {
    return `${String(Math.max(1, Math.round(retryInMs / 1000)))} s`;
  }
</script>

<!-- SG-57: the player is told clearly when the connection is lost, and what happens next. -->
{#if status.kind === 'connecting'}
  <p class="notice" role="status">Connecting…</p>
{:else if status.kind === 'reconnecting'}
  <p class="notice warning" role="alert">
    Connection lost. Your character stands still. Trying again in {describeWait(status.retryInMs)}
    (attempt {status.attempt}).
  </p>
{:else if status.kind === 'stopped'}
  <div class="notice error" role="alert">
    <p>{status.reason}</p>
    <p class="links">
      <a href={gamePagePath}>Game page</a>
      <a href={dashboardPath}>Dashboard</a>
    </p>
  </div>
{/if}

<style>
  .notice {
    position: absolute;
    right: 0.5rem;
    bottom: 5rem;
    left: 0.5rem;
    margin: 0 auto;
    padding: 0.5rem 0.75rem;
    max-width: 26rem;
    border-radius: 8px;
    background: rgb(17 22 28 / 0.92);
    text-align: center;
    /* A notice that only informs never takes touches from the arena below it. */
    pointer-events: none;
  }

  .notice p {
    margin: 0;
  }

  .warning {
    border: 2px solid #f0a53a;
  }

  .error {
    border: 2px solid #e0524d;
    pointer-events: auto;
  }

  .links {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 0.4rem;
  }

  a {
    color: #7fe0bd;
  }
</style>
