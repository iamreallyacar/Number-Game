<script lang="ts">
  import { onDestroy } from 'svelte';
  import { describeError } from '../api/api-request.js';
  import type { OpenedSave } from '@local/game-server-api';
  import { openSlot, sendMove } from '../api/game-server-api.js';
  import SaveStatusBanner from '../components/SaveStatusBanner.svelte';
  import type { BrowserGame } from '../games/browser-game.js';
  import { routePath } from '../routing/routes.js';
  import { MoveSync, type SaveStatus } from '../saving/move-sync.js';

  interface Props {
    readonly game: BrowserGame;
    readonly slotNumber: number;
  }

  const { game, slotNumber }: Props = $props();

  interface OpenedGame {
    readonly save: OpenedSave;
    readonly sync: MoveSync;
  }

  let saveStatus = $state<SaveStatus>({ kind: 'saved' });
  let currentSync: MoveSync | null = null;

  /** Loads the save from the server, which also locks it to this device (PS-18). */
  async function openGame(): Promise<OpenedGame> {
    currentSync?.stop();
    saveStatus = { kind: 'saved' };
    const sync = new MoveSync(
      (move) => sendMove(game.id, slotNumber, move),
      (status) => {
        saveStatus = status;
      },
    );
    currentSync = sync;
    const save = await openSlot(game.id, slotNumber);
    return { save, sync };
  }

  let openRequest = $state(openGame());
  const savingStopped = $derived(
    saveStatus.kind === 'opened-elsewhere' || saveStatus.kind === 'out-of-sync',
  );

  // A move already on its way still reaches the server, but queued moves are dropped. The save
  // status banner has already told the player about any failing save before they could leave.
  onDestroy(() => {
    currentSync?.stop();
  });

  function warnAboutUnsavedMoves(event: BeforeUnloadEvent): void {
    if (currentSync?.hasUnsavedMoves === true) {
      event.preventDefault();
    }
  }
</script>

<svelte:window onbeforeunload={warnAboutUnsavedMoves} />

{#await openRequest}
  <p>Loading slot {slotNumber}…</p>
{:then { save, sync }}
  <div class="stack">
    <p class="muted">
      {game.name}, slot {save.slotNumber}, played by {save.playerId}
    </p>
    <SaveStatusBanner
      status={saveStatus}
      onReload={() => (openRequest = openGame())}
      dashboardPath={routePath({ page: 'dashboard' })}
    />
    <div inert={savingStopped}>
      <game.PlayScreen
        storedState={save.state}
        saveMove={(move) => {
          sync.saveMove(move);
        }}
        newGamePath={routePath({ page: 'new-game', gameId: game.id })}
        dashboardPath={routePath({ page: 'dashboard' })}
      />
    </div>
  </div>
{:catch error}
  <p class="error-text" role="alert">Could not load slot {slotNumber}: {describeError(error)}</p>
  <div class="button-row">
    <button type="button" class="button primary" onclick={() => (openRequest = openGame())}>
      Try again
    </button>
    <a class="button" href={routePath({ page: 'load-game', gameId: game.id })}>Load Game</a>
  </div>
{/await}
