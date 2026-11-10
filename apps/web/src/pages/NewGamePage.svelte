<script lang="ts">
  import type { OpenedSave } from '@local/game-server-api';
  import { describeError } from '../api/api-request.js';
  import { startGame } from '../api/game-server-api.js';
  import PlayerPicker from '../components/PlayerPicker.svelte';
  import SaveSlotList from '../components/SaveSlotList.svelte';
  import type { BrowserGame } from '../games/browser-game.js';
  import { navigate } from '../routing/router.js';
  import { routePath } from '../routing/routes.js';

  interface Props {
    readonly game: BrowserGame;
  }

  const { game }: Props = $props();

  // New Game asks for an empty slot, then a player ID, then the game's options (PS-04 to PS-06).
  type Step =
    | { readonly kind: 'slot' }
    | { readonly kind: 'player'; readonly slotNumber: number }
    | { readonly kind: 'options'; readonly slotNumber: number; readonly playerId: string }
    | { readonly kind: 'starting'; readonly slotNumber: number; readonly playerId: string };

  let step: Step = $state({ kind: 'slot' });
  let startError: string | null = $state(null);

  async function handleOptions(slotNumber: number, playerId: string, options: unknown) {
    step = { kind: 'starting', slotNumber, playerId };
    startError = null;
    let startedSave: OpenedSave;
    try {
      startedSave = await startGame({ gameId: game.id, slotNumber, playerId, options });
    } catch (error) {
      startError = describeError(error);
      step = { kind: 'slot' };
      return;
    }
    navigate(routePath({ page: 'play', gameId: game.id, slotNumber, saveId: startedSave.saveId }));
  }
</script>

<h1>New Game</h1>
<p><a href={routePath({ page: 'game-menu', gameId: game.id })}>Back to {game.name}</a></p>

{#if startError !== null}
  <p class="error-text" role="alert">Could not start the game: {startError}</p>
{/if}

{#if step.kind === 'slot'}
  <h2>Pick an empty slot</h2>
  <SaveSlotList
    {game}
    mode="new"
    onPickEmptySlot={(slotNumber: number) => {
      step = { kind: 'player', slotNumber };
    }}
  />
{:else if step.kind === 'player'}
  {@const slotNumber = step.slotNumber}
  <h2>Slot {slotNumber}</h2>
  <PlayerPicker
    onPick={(playerId: string) => {
      step = { kind: 'options', slotNumber, playerId };
    }}
  />
  <button type="button" class="button" onclick={() => (step = { kind: 'slot' })}>
    Pick another slot
  </button>
{:else if step.kind === 'options'}
  {@const { slotNumber, playerId } = step}
  <h2>Slot {slotNumber} for {playerId}</h2>
  <game.NewGameOptionsForm
    onSubmit={(options: unknown) => {
      void handleOptions(slotNumber, playerId, options);
    }}
  />
  <button type="button" class="button" onclick={() => (step = { kind: 'player', slotNumber })}>
    Pick another player
  </button>
{:else}
  <p>Starting the game in slot {step.slotNumber}…</p>
{/if}
