<script lang="ts">
  import { getShape, type ShapeSlots } from '@local/block-game';
  import BlockGameShape from './BlockGameShape.svelte';
  import { describeShape } from './describe-shape.js';

  interface Props {
    readonly slots: ShapeSlots;
    /** For each slot, whether its shape fits anywhere on the board right now. */
    readonly slotFits: readonly boolean[];
    /** The slot whose shape is being dragged, which is drawn empty while it is away. */
    readonly draggedSlotIndex: number | null;
    /** The slot whose shape just came back from a drop where it did not fit, which shakes briefly. */
    readonly returnedSlotIndex: number | null;
    readonly onPickUp: (slotIndex: number, event: PointerEvent) => void;
  }

  const { slots, slotFits, draggedSlotIndex, returnedSlotIndex, onPickUp }: Props = $props();

  function describeSlot(slotIndex: number): string {
    const shapeId = slots[slotIndex];
    if (shapeId === undefined) {
      throw new RangeError(`There is no slot ${String(slotIndex)}`);
    }
    const fitNote = slotFits[slotIndex] === true ? 'drag it onto the board' : 'fits nowhere yet';
    return `Slot ${String(slotIndex + 1)}: ${describeShape(getShape(shapeId))}, ${fitNote}`;
  }

  function handlePointerDown(slotIndex: number, event: PointerEvent): void {
    // Only the main mouse button, a finger, or a pen tip picks a shape up.
    if (draggedSlotIndex !== null || event.button !== 0) {
      return;
    }
    event.preventDefault();
    // Keeps every later event of this pointer coming here, even once it is over the board.
    if (event.currentTarget instanceof HTMLElement) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    onPickUp(slotIndex, event);
  }
</script>

<!-- The three shapes waiting to be placed sit under the board (BG-04). -->
<ul class="slots" aria-label="Shapes to place">
  {#each slots as shapeId, slotIndex (slotIndex)}
    <li
      class="slot"
      class:no-fit={slotFits[slotIndex] !== true}
      class:dragged={draggedSlotIndex === slotIndex}
      class:returned={returnedSlotIndex === slotIndex}
      aria-label={describeSlot(slotIndex)}
      onpointerdown={(event) => {
        handlePointerDown(slotIndex, event);
      }}
      oncontextmenu={(event) => {
        // A long press on touch would otherwise open a menu in the middle of a drag.
        event.preventDefault();
      }}
    >
      <span class="slot-shape">
        <BlockGameShape {shapeId} cellSize="1.3rem" gap="2px" />
      </span>
    </li>
  {/each}
</ul>

<style>
  .slots {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    width: min(100%, 30rem);
    margin: 0 auto;
    padding: 0;
    list-style: none;
  }

  .slot {
    display: grid;
    place-items: center;
    min-height: 5.5rem;
    border: 1px solid var(--color-border);
    border-radius: 10px;
    background: var(--color-surface);
    cursor: grab;
    /* Without these, a drag on touch would scroll the page or select text. */
    touch-action: none;
    user-select: none;
    -webkit-touch-callout: none;
  }

  /* A shape that fits nowhere is faded and drawn dashed, so the hint does not rely on colour. */
  .slot.no-fit {
    border-style: dashed;
  }

  .slot.no-fit .slot-shape {
    opacity: 0.35;
    filter: grayscale(0.6);
  }

  .slot.dragged .slot-shape {
    visibility: hidden;
  }

  .slot.returned {
    animation: shake 0.4s ease-in-out;
    border-color: var(--color-error);
  }

  @keyframes shake {
    0%,
    100% {
      translate: 0;
    }
    25% {
      translate: -4px;
    }
    75% {
      translate: 4px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .slot.returned {
      animation: none;
    }
  }
</style>
