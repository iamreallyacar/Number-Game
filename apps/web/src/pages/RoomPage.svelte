<script lang="ts">
  import type { Room } from '@local/game-server-api';
  import { onDestroy, onMount, type Component } from 'svelte';
  import { ApiError, describeError } from '../api/api-request.js';
  import { getRoom, joinRoom, leaveRoom, startRoom } from '../api/room-api.js';
  import PlayerPicker from '../components/PlayerPicker.svelte';
  import type { RoomBrowserGame, RoomPlayScreenProps } from '../games/browser-game.js';
  import { Poller } from '../rooms/poller.js';
  import { describeRoomPageView, type RoomPageView } from '../rooms/room-entry.js';
  import { navigate } from '../routing/router.js';
  import { readRoomPagePlayerId, roomPagePath, routePath } from '../routing/routes.js';

  interface Props {
    readonly game: RoomBrowserGame;
    readonly roomId: string;
  }

  const { game, roomId }: Props = $props();

  const WAITING_ROOM_REFRESH_MS = 1000;

  const gamePagePath = $derived(routePath({ page: 'game', gameId: game.id }));
  const dashboardPath = routePath({ page: 'dashboard' });

  // The player ID is in the page link, so a reload returns to the same character.
  let playerId: string | null = $state(readRoomPagePlayerId(window.location.search));
  let room: Room | null = $state.raw(null);
  let hasLoadedRoom = $state(false);
  let loadError: string | null = $state(null);
  let actionError: string | null = $state(null);
  let isWorking = $state(false);

  let playScreenRequest: Promise<Component<RoomPlayScreenProps>> | null = $state.raw(null);

  const view: RoomPageView | null = $derived(
    hasLoadedRoom ? describeRoomPageView(room, playerId) : null,
  );

  /** A room that was closed or has ended is an answer, not an error, so the page can explain it. */
  async function loadRoomOrNull(): Promise<Room | null> {
    try {
      return await getRoom(game.id, roomId, playerId);
    } catch (error) {
      if (error instanceof ApiError && error.errorCode === 'room-not-found') {
        return null;
      }
      throw error;
    }
  }

  const poller = new Poller(
    loadRoomOrNull,
    (result) => {
      if (result.kind === 'loaded') {
        room = result.value;
        hasLoadedRoom = true;
        loadError = null;
      } else {
        loadError = describeError(result.error);
      }
    },
    WAITING_ROOM_REFRESH_MS,
  );

  onMount(() => {
    // Starts the download while the players wait, so the play screen is ready when the run starts.
    playScreenRequest = game.loadPlayScreen();
    poller.start();
  });

  // Once the run is on, the play screen's socket carries everything, so the page stops asking.
  $effect(() => {
    if (view?.kind === 'play') {
      poller.stop();
    }
  });

  let hasLeft = false;

  // Leaving the waiting room page through the app leaves the room. A closed tab cannot do this
  // reliably, so the player stays in the room until they open it again and leave (see Waiting room expiry in apps/server/README.md).
  onDestroy(() => {
    poller.stop();
    if (view?.kind === 'waiting' && playerId !== null && !hasLeft) {
      void leaveRoom(game.id, roomId, playerId).catch((error: unknown) => {
        console.error('Could not leave the waiting room', error);
      });
    }
  });

  async function runAction(action: () => Promise<void>): Promise<void> {
    actionError = null;
    isWorking = true;
    try {
      await action();
    } catch (error) {
      actionError = describeError(error);
    } finally {
      isWorking = false;
    }
  }

  function pickPlayer(pickedPlayerId: string): void {
    playerId = pickedPlayerId;
    window.history.replaceState(null, '', roomPagePath(game.id, roomId, pickedPlayerId));
  }

  async function handleJoin(joiningPlayerId: string): Promise<void> {
    await runAction(async () => {
      room = await joinRoom(game.id, roomId, joiningPlayerId);
    });
  }

  async function handleStart(hostPlayerId: string): Promise<void> {
    await runAction(async () => {
      room = await startRoom(game.id, roomId, hostPlayerId);
    });
  }

  async function handleLeave(leavingPlayerId: string): Promise<void> {
    await runAction(async () => {
      hasLeft = true;
      try {
        await leaveRoom(game.id, roomId, leavingPlayerId);
      } catch (error) {
        hasLeft = false;
        throw error;
      }
      navigate(gamePagePath);
    });
  }
</script>

{#if view === null}
  {#if loadError === null}
    <p>Loading the room…</p>
  {:else}
    <p class="error-text" role="alert">Could not load the room: {loadError}</p>
    <a class="button" href={gamePagePath}>Back to {game.name}</a>
  {/if}
{:else if view.kind === 'play' && playerId !== null}
  {@const ownPlayerId = playerId}
  {#if playScreenRequest === null}
    <p>Loading the game…</p>
  {:else}
    {#await playScreenRequest}
      <p>Loading the game…</p>
    {:then PlayScreen}
      <PlayScreen gameId={game.id} {roomId} playerId={ownPlayerId} {gamePagePath} {dashboardPath} />
    {:catch error}
      <p class="error-text" role="alert">Could not load the game: {describeError(error)}</p>
      <a class="button" href={gamePagePath}>Back to {game.name}</a>
    {/await}
  {/if}
{:else}
  <div class="stack">
    <h1>{game.name}: room</h1>
    {#if loadError !== null}
      <p class="error-text" role="alert">Lost contact with the server: {loadError}</p>
    {/if}
    {#if actionError !== null}
      <p class="error-text" role="alert">{actionError}</p>
    {/if}

    {#if view.kind === 'pick-player'}
      <PlayerPicker onPick={pickPlayer} />
    {:else if view.kind === 'room-gone'}
      <p role="alert">This room no longer exists. It was closed, or its run has ended.</p>
    {:else if view.kind === 'already-started'}
      <p role="alert">This run has already started, so nobody new can join.</p>
    {:else if room !== null}
      <section class="panel stack">
        <h2>Players ({room.playerIds.length} of {room.maxPlayers})</h2>
        <ul>
          {#each room.playerIds as roomPlayerId (roomPlayerId)}
            <li>
              {roomPlayerId}
              {#if roomPlayerId === room.hostPlayerId}<span class="muted">(host)</span>{/if}
              {#if roomPlayerId === playerId}<span class="muted">(you)</span>{/if}
            </li>
          {/each}
        </ul>
      </section>

      {#if view.kind === 'waiting' && playerId !== null}
        {@const ownPlayerId = playerId}
        {#if view.isHost}
          <p>You are the host. Start the run when everyone is here.</p>
        {:else}
          <p>Waiting for the host to start the run…</p>
        {/if}
        <div class="button-row">
          {#if view.isHost}
            <button
              type="button"
              class="button primary"
              disabled={isWorking}
              onclick={() => handleStart(ownPlayerId)}>Start the run</button
            >
          {/if}
          <button
            type="button"
            class="button"
            disabled={isWorking}
            onclick={() => handleLeave(ownPlayerId)}>Leave the room</button
          >
        </div>
      {:else if view.kind === 'can-join' && playerId !== null}
        {@const ownPlayerId = playerId}
        <button
          type="button"
          class="button primary"
          disabled={isWorking}
          onclick={() => handleJoin(ownPlayerId)}>Join as {ownPlayerId}</button
        >
      {:else if view.kind === 'room-full'}
        <p role="alert">This room is full.</p>
      {/if}
    {/if}

    <div class="button-row">
      <a class="button" href={gamePagePath}>Back to {game.name}</a>
      <a class="button" href={dashboardPath}>Dashboard</a>
    </div>
  </div>
{/if}
