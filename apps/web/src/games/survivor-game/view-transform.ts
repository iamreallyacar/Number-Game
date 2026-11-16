import { balance } from '@local/survivor-game';

export interface ScreenSize {
  readonly width: number;
  readonly height: number;
}

export interface WorldPoint {
  readonly x: number;
  readonly y: number;
}

/**
 * Where the arena is drawn on the screen (SB-09). Every number is in screen pixels, and the
 * view is the part of the screen that shows arena, with bars around it on a very long screen.
 */
export interface ViewTransform {
  /** Screen pixels for one world unit. */
  readonly scale: number;
  readonly viewLeft: number;
  readonly viewTop: number;
  readonly viewWidth: number;
  readonly viewHeight: number;
  /** The world point shown in the middle of the view. */
  readonly camera: WorldPoint;
}

/**
 * Every device shows 480 world units along the short side of the screen, and at most 1040 along
 * the long side (SB-09), with bars beyond that. The camera is the player's own character (SG-52).
 */
export function computeViewTransform(screen: ScreenSize, camera: WorldPoint): ViewTransform {
  const isTall = screen.width <= screen.height;
  const shortPixels = isTall ? screen.width : screen.height;
  const longPixels = isTall ? screen.height : screen.width;
  const scale = shortPixels / balance.VIEW_SHORT_SIDE;
  const longViewPixels = Math.min(longPixels, balance.VIEW_LONG_SIDE_MAX * scale);
  const viewWidth = isTall ? shortPixels : longViewPixels;
  const viewHeight = isTall ? longViewPixels : shortPixels;
  return {
    scale,
    viewLeft: (screen.width - viewWidth) / 2,
    viewTop: (screen.height - viewHeight) / 2,
    viewWidth,
    viewHeight,
    camera,
  };
}

export function worldToScreen(view: ViewTransform, point: WorldPoint): WorldPoint {
  return {
    x: view.viewLeft + view.viewWidth / 2 + (point.x - view.camera.x) * view.scale,
    y: view.viewTop + view.viewHeight / 2 + (point.y - view.camera.y) * view.scale,
  };
}

/** The world coordinates at the left and right, and at the top and bottom, edge of the view. */
export function visibleWorldBounds(view: ViewTransform): {
  readonly minX: number;
  readonly maxX: number;
  readonly minY: number;
  readonly maxY: number;
} {
  const halfWidth = view.viewWidth / 2 / view.scale;
  const halfHeight = view.viewHeight / 2 / view.scale;
  return {
    minX: view.camera.x - halfWidth,
    maxX: view.camera.x + halfWidth,
    minY: view.camera.y - halfHeight,
    maxY: view.camera.y + halfHeight,
  };
}

/** The multiples of the spacing inside the range, so a grid that scrolls with the world can be drawn. */
export function gridLinePositions(min: number, max: number, spacing: number): readonly number[] {
  const positions: number[] = [];
  for (let line = Math.ceil(min / spacing) * spacing; line <= max; line += spacing) {
    positions.push(line);
  }
  return positions;
}
