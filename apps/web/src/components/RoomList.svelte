<script lang="ts">
  import type { Room } from '@local/game-server-api';
  import { onMount } from 'svelte';
  import { describeError } from '../api/api-request.js';
  import { createRoom, joinRoom, listRooms } from '../api/room-api.js';
  import type { RoomBrowserGame } from '../games/browser-game.js';
  import { Poller } from '../rooms/poller.js';
  import { chooseListedRoomAction } from '../rooms/room-entry.js';
  import { navigate } from '../routing/router.js';
  import { roomPagePath } from '../routing/routes.js';
  import PlayerPicker from './PlayerPicker.svelte';

  interface Props {
    readonly game: RoomBrowserGame;
  }

  const { game }: Props = $props();

  const ROOM_LIST_REFRESH_MS = 4000;

  /** What the player picked on this page and still needs a player ID for. */
  type Intent = { readonly kind: 'create' } | { readonly kind: 'join'; readonly room: Room };

  let rooms: readonly Room[] | null = $state.raw(null);
  let listError: string | null = $state(null);
  let intent: Intent | null = $state.raw(null);
  let actionError: string | null = $state(null);
  let isWorking = $state(false);

  onMount(() => {
    const poller = new Poller(
      () => listRooms(game.id),
      (result) => {
        if (result.kind === 'loaded') {
          rooms = result.value;
          listError = null;
        } else {
          listError = describeError(result.error);
        }
      },
      ROOM_LIST_REFRESH_MS,
    );
    poller.start();
    return () => {
      poller.stop();
    };
  });

  function describeRoom(room: Room): string {
    return `${String(room.playerIds.length)} of ${String(room.maxPlayers)} players: ${room.playerIds.join(', ')}`;
  }

  function openRoom(room: Room, playerId: string): void {
    navigate(roomPagePath(game.id, room.roomId, playerId));
  }

  async function handlePick(playerId: string): Promise<void> {
    if (intent === null) {
      return;
    }
    actionError = null;
    isWorking = true;
    try {
      if (intent.kind === 'create') {
        openRoom(await createRoom(game.id, playerId), playerId);
      } else if (chooseListedRoomAction(intent.room, playerId) === 'open') {
        openRoom(intent.room, playerId);
      } else {
        openRoom(await joinRoom(game.id, intent.room.roomId, playerId), playerId);
      }
    } catch (error) {
      // The server explains why, such as a full room, a started run, or too many runs (SG-09).
      actionError = describeError(error);
    } finally {
      isWorking = false;
    }
  }
</script>

{#if intent !== null}
  <section class="stack">
    <h3>{intent.kind === 'create' ? 'Create a room' : 'Join a room'}</h3>
    {#if actionError !== null}
      <p class="error-text" role="alert">{actionError}</p>
    {/if}
    {#if isWorking}
      <p>Working…</p>
    {:else}
      <PlayerPicker onPick={handlePick} />
    {/if}
    <div class="button-row">
      <button
        type="button"
        class="button"
        onclick={() => {
          intent = null;
          actionError = null;
        }}>Back to the room list</button
      >
    </div>
  </section>
{:else}
  <section class="stack">
    <div class="button-row">
      <button
        type="button"
        class="button primary"
        onclick={() => {
          intent = { kind: 'create' };
        }}>Create a room</button
      >
    </div>
    {#if listError !== null}
      <p class="error-text" role="alert">Could not load the rooms: {listError}</p>
    {/if}
    {#if rooms === null}
      {#if listError === null}
        <p>Loading rooms…</p>
      {/if}
    {:else if rooms.length === 0}
      <p class="muted">No open rooms. Create one to start a run.</p>
    {:else}
      <ul class="room-list">
        {#each rooms as room (room.roomId)}
          <li class="panel stack">
            {#if room.status === 'waiting'}
              <h3>Waiting room</h3>
              <p>{describeRoom(room)}</p>
              <div class="button-row">
                <button
                  type="button"
                  class="button primary"
                  onclick={() => {
                    intent = { kind: 'join', room };
                  }}>Join</button
                >
              </div>
            {:else}
              <h3>Run in progress</h3>
              <p>{describeRoom(room)}</p>
              <p class="muted">Rejoin as a player whose connection was lost:</p>
              <div class="button-row">
                {#each room.disconnectedPlayerIds as playerId (playerId)}
                  <button
                    type="button"
                    class="button"
                    onclick={() => {
                      openRoom(room, playerId);
                    }}>Rejoin as {playerId}</button
                  >
                {/each}
              </div>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
{/if}

<style>
  .room-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 0.75rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .room-list h3 {
    margin: 0;
  }

  .room-list p {
    margin: 0;
  }
</style>
