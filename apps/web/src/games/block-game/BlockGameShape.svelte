<script lang="ts">
  import { getShape, type ShapeId } from '@local/block-game';
  import { BLOCK_COLOURS } from './block-colours.js';

  interface Props {
    readonly shapeId: ShapeId;
    /** Any CSS length, so the slots and the dragged shape can draw it at different sizes. */
    readonly cellSize: string;
    readonly gap: string;
  }

  const { shapeId, cellSize, gap }: Props = $props();

  const shape = $derived(getShape(shapeId));
</script>

<!-- Only draws the shape. Labels are given by whatever holds it. -->
<span
  class="shape"
  style:--shape-width={shape.width}
  style:--shape-height={shape.height}
  style:--shape-cell-size={cellSize}
  style:gap
  aria-hidden="true"
>
  {#each shape.cells as cell (`${String(cell.rowOffset)}-${String(cell.columnOffset)}`)}
    <span
      class="block"
      style:grid-row={cell.rowOffset + 1}
      style:grid-column={cell.columnOffset + 1}
      style:background={BLOCK_COLOURS[shape.colour]}
    ></span>
  {/each}
</span>

<style>
  .shape {
    display: grid;
    grid-template-columns: repeat(var(--shape-width), var(--shape-cell-size));
    grid-template-rows: repeat(var(--shape-height), var(--shape-cell-size));
  }

  /* The same raised look as the filled board cells. */
  .block {
    border-radius: 3px;
    box-shadow:
      inset 0 -3px 0 rgb(0 0 0 / 22%),
      inset 0 2px 0 rgb(255 255 255 / 30%);
  }
</style>
