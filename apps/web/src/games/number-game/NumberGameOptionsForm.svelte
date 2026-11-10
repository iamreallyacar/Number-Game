<script lang="ts">
  import {
    BOARD_WIDTHS,
    DIFFICULTY_IDS,
    DIFFICULTY_PRESETS,
    type BoardWidth,
    type DifficultyId,
  } from '@local/number-game';
  import type { NewGameOptionsFormProps } from '../browser-game.js';
  import { DIFFICULTY_LABELS } from './difficulty-labels.js';

  const { onSubmit }: NewGameOptionsFormProps = $props();

  let width: BoardWidth = $state(BOARD_WIDTHS[0]);
  let difficulty: DifficultyId = $state('normal');

  function describeHints(difficultyId: DifficultyId): string {
    const hints = DIFFICULTY_PRESETS[difficultyId].hintsPerStage;
    if (hints === 'unlimited') {
      return 'unlimited hints';
    }
    return hints === 0 ? 'no hints' : `${String(hints)} hints`;
  }

  function describeDifficulty(difficultyId: DifficultyId): string {
    const addNumbersUses = DIFFICULTY_PRESETS[difficultyId].addNumbersUsesPerStage;
    return `${String(addNumbersUses)} Add Numbers and ${describeHints(difficultyId)} per stage`;
  }

  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    onSubmit({ width, difficulty });
  }
</script>

<form class="stack" onsubmit={handleSubmit}>
  <fieldset class="choice-group">
    <legend>Board width</legend>
    {#each BOARD_WIDTHS as widthOption (widthOption)}
      <label class="choice">
        <input type="radio" name="width" value={widthOption} bind:group={width} />
        <span class="choice-label">{widthOption} columns</span>
      </label>
    {/each}
  </fieldset>

  <fieldset class="choice-group">
    <legend>Difficulty</legend>
    {#each DIFFICULTY_IDS as difficultyOption (difficultyOption)}
      <label class="choice">
        <input type="radio" name="difficulty" value={difficultyOption} bind:group={difficulty} />
        <span class="choice-label">{DIFFICULTY_LABELS[difficultyOption]}</span>
        <span class="choice-note">{describeDifficulty(difficultyOption)}</span>
      </label>
    {/each}
  </fieldset>

  <button type="submit" class="button primary">Start game</button>
</form>
