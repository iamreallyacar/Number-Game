<script lang="ts">
  import type { OpenedSave } from '@local/game-server-api';
  import type { Component } from 'svelte';
  import { describeError } from '../api/api-request.js';
  import { startGame } from '../api/game-server-api.js';
  import type { BrowserGame, NewGameOptionsFormProps } from '../games/browser-game.js';
  import PlayerPicker from './PlayerPicker.svelte';

  interface Props {
    readonly game: BrowserGame;
    /** The empty slot the new game starts in. */
    readonly slotNumber: number;
    readonly onStarted: (saveId: string) => void;
    /** Goes back to the save slots without starting a game. */
    readonly onCancel: () => void;
  }

  const { game, slotNumber, onStarted, onCancel }: Props = $props();

  // A new game asks for a player ID, then the game's options (PS-05, PS-06).
  type Step =
    | { readonly kind: 'player' }
    | { readonly kind: 'options'; readonly playerId: string }
    | { readonly kind: 'starting'; readonly playerId: string };

  let step: Step = $state({ kind: 'player' });
  let startError: string | null = $state(null);

  function loadOptionsForm(): Promise<Component<NewGameOptionsFormProps>> {
    return game.loadNewGameOptionsForm();
  }

  // Starts the download early, so the form is usually ready by the time the options step opens.
  let optionsFormRequest = $state(loadOptionsForm());

  async function handleOptions(playerId: string, options: unknown): Promise<void> {
    step = { kind: 'starting', playerId };
    startError = null;
    let startedSave: OpenedSave;
    try {
      startedSave = await startGame({ gameId: game.id, slotNumber, playerId, options });
    } catch (error) {
      startError = describeError(error);
      step = { kind: 'options', playerId };
      return;
    }
    onStarted(startedSave.saveId);
  }
</script>

<section class="stack">
  {#if startError !== null}
    <p class="error-text" role="alert">Could not start the game: {startError}</p>
  {/if}

  {#if step.kind === 'player'}
    <h2>New game in slot {slotNumber}</h2>
    <PlayerPicker
      onPick={(playerId: string) => {
        step = { kind: 'options', playerId };
      }}
    />
  {:else if step.kind === 'options'}
    {@const playerId = step.playerId}
    <h2>New game in slot {slotNumber} for {playerId}</h2>
    {#await optionsFormRequest}
      <p>Loading the options…</p>
    {:then NewGameOptionsForm}
      <NewGameOptionsForm
        onSubmit={(options: unknown) => {
          void handleOptions(playerId, options);
        }}
      />
    {:catch error}
      <p class="error-text" role="alert">Could not load the options: {describeError(error)}</p>
      <button
        type="button"
        class="button primary"
        onclick={() => (optionsFormRequest = loadOptionsForm())}
      >
        Try again
      </button>
    {/await}
  {:else}
    <p>Starting the game in slot {slotNumber}…</p>
  {/if}

  {#if step.kind !== 'starting'}
    <div class="button-row">
      {#if step.kind === 'options'}
        <button type="button" class="button" onclick={() => (step = { kind: 'player' })}>
          Pick another player
        </button>
      {/if}
      <button type="button" class="button" onclick={onCancel}>Back to save slots</button>
    </div>
  {/if}
</section>
