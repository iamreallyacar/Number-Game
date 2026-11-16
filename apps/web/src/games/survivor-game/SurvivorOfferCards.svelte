<script lang="ts">
  import type { OfferView } from './offer-cards.js';

  interface Props {
    readonly offer: OfferView;
    readonly onChoose: (cardIndex: number) => void;
  }

  const { offer, onChoose }: Props = $props();
</script>

<!-- SG-55: the cards sit at the top edge, away from where a thumb plays. They are not part of the
  canvas, so a touch on a card never starts the joystick. -->
<section class="offers" aria-label="Choose an upgrade">
  <div class="cards">
    {#each offer.cards as card, index (card.upgradeId)}
      <button
        type="button"
        class="card"
        onclick={() => {
          onChoose(index);
        }}
      >
        <span class="key" aria-hidden="true">{index + 1}</span>
        <span class="title">{card.title}</span>
        <span class="effect">{card.effect}</span>
        <span class="meta">{card.scope}{card.progress === null ? '' : `, ${card.progress}`}</span>
      </button>
    {/each}
  </div>
  {#if offer.queuedCount > 0}
    <p class="queued">
      {offer.queuedCount} more {offer.queuedCount === 1 ? 'offer' : 'offers'} waiting
    </p>
  {/if}
</section>

<style>
  .offers {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    left: 0.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    /* Only the cards take touches, so the arena below still works between them. */
    pointer-events: none;
  }

  .cards {
    display: flex;
    gap: 0.4rem;
  }

  .card {
    position: relative;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 0.1rem;
    min-width: 0;
    min-height: 4.5rem;
    padding: 0.4rem 0.5rem 0.4rem 1.4rem;
    border: 2px solid #43d6a0;
    border-radius: 8px;
    background: rgb(17 22 28 / 0.88);
    color: #f2f4f5;
    font: inherit;
    text-align: left;
    cursor: pointer;
    pointer-events: auto;
    touch-action: manipulation;
  }

  .key {
    position: absolute;
    top: 0.35rem;
    left: 0.4rem;
    font-size: 0.8rem;
    font-weight: 700;
    color: #43d6a0;
  }

  .title {
    font-size: 0.9rem;
    font-weight: 700;
  }

  .effect {
    font-size: 0.75rem;
  }

  .meta {
    font-size: 0.65rem;
    color: #9aa7b3;
  }

  .queued {
    align-self: center;
    margin: 0;
    padding: 0.1rem 0.6rem;
    border-radius: 1rem;
    background: rgb(17 22 28 / 0.88);
    font-size: 0.75rem;
  }

  /* The wide arrangement (SG-51): the cards stack down the right edge. */
  @media (min-aspect-ratio: 1 / 1) {
    .offers {
      left: auto;
      width: 12.5rem;
    }

    .cards {
      flex-direction: column;
    }

    .card {
      min-height: 3.5rem;
    }
  }
</style>
