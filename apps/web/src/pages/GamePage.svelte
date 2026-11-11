<script lang="ts">
  import GameLeaderboard from '../components/GameLeaderboard.svelte';
  import NewGameSetup from '../components/NewGameSetup.svelte';
  import SaveSlotList from '../components/SaveSlotList.svelte';
  import type { BrowserGame } from '../games/browser-game.js';
  import { navigate } from '../routing/router.js';
  import { routePath } from '../routing/routes.js';

  interface Props {
    readonly game: BrowserGame;
  }

  const { game }: Props = $props();

  let newGameSlotNumber: number | null = $state(null);

  function openSave(slotNumber: number, saveId: string): void {
    navigate(routePath({ page: 'play', gameId: game.id, slotNumber, saveId }));
  }
</script>

<h1>{game.name}</h1>

{#if newGameSlotNumber === null}
  <p>{game.description}</p>
  <section class="stack">
    <h2>Leaderboard</h2>
    <GameLeaderboard {game} />
  </section>
  <section class="stack">
    <h2>Save slots</h2>
    <p class="muted">Continue a saved game, or start a new one in an empty slot.</p>
    <SaveSlotList
      {game}
      onPickEmptySlot={(slotNumber: number) => {
        newGameSlotNumber = slotNumber;
      }}
      onPickSave={openSave}
    />
  </section>
{:else}
  <NewGameSetup
    {game}
    slotNumber={newGameSlotNumber}
    onStarted={(saveId: string) => {
      if (newGameSlotNumber !== null) {
        openSave(newGameSlotNumber, saveId);
      }
    }}
    onCancel={() => {
      newGameSlotNumber = null;
    }}
  />
{/if}
