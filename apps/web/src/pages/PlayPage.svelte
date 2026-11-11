<script lang="ts">
  import { onDestroy, type Component } from 'svelte';
  import { ApiError, describeError } from '../api/api-request.js';
  import type { OpenedSave } from '@local/game-server-api';
  import { openSave, sendMove, type SaveAddress } from '../api/game-server-api.js';
  import SaveGoneNotice from '../components/SaveGoneNotice.svelte';
  import SaveStatusBanner from '../components/SaveStatusBanner.svelte';
  import type { BrowserGame, PlayScreenProps } from '../games/browser-game.js';
  import { routePath } from '../routing/routes.js';
  import { MoveSync, type SaveStatus } from '../saving/move-sync.js';

  interface Props {
    readonly game: BrowserGame;
    readonly slotNumber: number;
    readonly saveId: string;
  }

  const { game, slotNumber, saveId }: Props = $props();
  const saveAddress: SaveAddress = $derived({ gameId: game.id, slotNumber, saveId });

  interface OpenedGame {
    readonly save: OpenedSave;
    readonly sync: MoveSync;
    readonly PlayScreen: Component<PlayScreenProps>;
  }

  let saveStatus = $state<SaveStatus>({ kind: 'saved' });
  let currentSync: MoveSync | null = null;

  /** Loads the save from the server, which also locks it to this device (PS-18). */
  async function openGame(): Promise<OpenedGame> {
    currentSync?.stop();
    saveStatus = { kind: 'saved' };
    const sync = new MoveSync(
      (move) => sendMove(saveAddress, move),
      (status) => {
        saveStatus = status;
      },
    );
    currentSync = sync;
    const [save, PlayScreen] = await Promise.all([openSave(saveAddress), game.loadPlayScreen()]);
    return { save, sync, PlayScreen };
  }

  let openRequest = $state(openGame());
  const savingStopped = $derived(
    saveStatus.kind === 'opened-elsewhere' ||
      saveStatus.kind === 'save-gone' ||
      saveStatus.kind === 'out-of-sync',
  );

  function isSaveGone(error: unknown): boolean {
    return error instanceof ApiError && error.errorCode === 'save-gone';
  }

  // Leaving through a link inside the app does not unload the page, so there is no leave warning.
  // The moves still queued are sent anyway, so they are not lost.
  onDestroy(() => {
    currentSync?.finishPendingMoves();
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
{:then { save, sync, PlayScreen }}
  <div class="stack">
    <p class="muted">
      {game.name}, slot {save.slotNumber}, played by {save.playerId}
    </p>
    <SaveStatusBanner
      status={saveStatus}
      gameId={game.id}
      onReload={() => (openRequest = openGame())}
    />
    <div inert={savingStopped}>
      <PlayScreen
        storedState={save.state}
        saveMove={(move) => {
          sync.saveMove(move);
        }}
        newGamePath={routePath({ page: 'game', gameId: game.id })}
        dashboardPath={routePath({ page: 'dashboard' })}
      />
    </div>
  </div>
{:catch error}
  {#if isSaveGone(error)}
    <div class="stack" role="alert">
      <h1>This game is over</h1>
      <SaveGoneNotice
        gameId={game.id}
        message="The game this page was showing in slot {slotNumber} has ended or was deleted, or a new game has taken the slot."
      />
    </div>
  {:else}
    <p class="error-text" role="alert">Could not load slot {slotNumber}: {describeError(error)}</p>
    <div class="button-row">
      <button type="button" class="button primary" onclick={() => (openRequest = openGame())}>
        Try again
      </button>
      <a class="button" href={routePath({ page: 'game', gameId: game.id })}>Save Slots</a>
    </div>
  {/if}
{/await}
