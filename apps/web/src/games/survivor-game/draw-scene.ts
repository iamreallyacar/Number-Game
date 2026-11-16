import { balance } from '@local/survivor-game';
import { JOYSTICK_RADIUS_PX, type JoystickDrawing } from './joystick.js';
import type { Scene } from './scene.js';
import {
  gridLinePositions,
  visibleWorldBounds,
  worldToScreen,
  type ScreenSize,
  type ViewTransform,
  type WorldPoint,
} from './view-transform.js';

// Version 1 draws plain shapes (SG-53). Each kind of thing has its own colour.
const COLOURS = {
  bars: '#0b0d10',
  arena: '#1b2128',
  grid: '#262e37',
  enemy: '#e0524d',
  bullet: '#f5cf4a',
  otherPlayer: '#5ab0ee',
  ownPlayer: '#ffffff',
  ownPlayerRing: '#43d6a0',
  rope: '255, 168, 54',
  joystick: '255, 255, 255',
  name: '#c9d3dc',
} as const;

/** The space between the lines of the background grid, which scrolls with the world so movement shows. */
const GRID_SPACING_WORLD_UNITS = 80;

function drawCircle(
  context: CanvasRenderingContext2D,
  centre: WorldPoint,
  radiusPixels: number,
  fill: string,
): void {
  context.beginPath();
  context.arc(centre.x, centre.y, radiusPixels, 0, 2 * Math.PI);
  context.fillStyle = fill;
  context.fill();
}

function drawGrid(context: CanvasRenderingContext2D, view: ViewTransform): void {
  const bounds = visibleWorldBounds(view);
  context.strokeStyle = COLOURS.grid;
  context.lineWidth = 1;
  context.beginPath();
  for (const worldX of gridLinePositions(bounds.minX, bounds.maxX, GRID_SPACING_WORLD_UNITS)) {
    const { x } = worldToScreen(view, { x: worldX, y: 0 });
    context.moveTo(x, view.viewTop);
    context.lineTo(x, view.viewTop + view.viewHeight);
  }
  for (const worldY of gridLinePositions(bounds.minY, bounds.maxY, GRID_SPACING_WORLD_UNITS)) {
    const { y } = worldToScreen(view, { x: 0, y: worldY });
    context.moveTo(view.viewLeft, y);
    context.lineTo(view.viewLeft + view.viewWidth, y);
  }
  context.stroke();
}

function drawRopes(context: CanvasRenderingContext2D, view: ViewTransform, scene: Scene): void {
  for (const rope of scene.ropes) {
    const from = worldToScreen(view, rope.from);
    const to = worldToScreen(view, rope.to);
    context.strokeStyle = `rgba(${COLOURS.rope}, ${String(0.35 + 0.65 * rope.strain)})`;
    context.lineWidth = (2 + 3 * rope.strain) * view.scale;
    context.beginPath();
    context.moveTo(from.x, from.y);
    context.lineTo(to.x, to.y);
    context.stroke();
  }
}

function drawPlayers(
  context: CanvasRenderingContext2D,
  view: ViewTransform,
  scene: Scene,
  ownPlayerId: string,
): void {
  const radius = balance.PLAYER_RADIUS * view.scale;
  context.font = `${String(Math.max(10, 12 * view.scale))}px system-ui, sans-serif`;
  context.textAlign = 'center';
  for (const player of scene.players) {
    const centre = worldToScreen(view, player);
    if (player.playerId === ownPlayerId) {
      drawCircle(context, centre, radius + 3 * view.scale, COLOURS.ownPlayerRing);
      drawCircle(context, centre, radius, COLOURS.ownPlayer);
    } else {
      drawCircle(context, centre, radius, COLOURS.otherPlayer);
      context.fillStyle = COLOURS.name;
      context.fillText(player.playerId, centre.x, centre.y - radius - 6 * view.scale);
    }
  }
}

function drawJoystick(context: CanvasRenderingContext2D, joystick: JoystickDrawing): void {
  context.lineWidth = 2;
  context.strokeStyle = `rgba(${COLOURS.joystick}, 0.45)`;
  context.beginPath();
  context.arc(joystick.origin.x, joystick.origin.y, JOYSTICK_RADIUS_PX, 0, 2 * Math.PI);
  context.stroke();
  drawCircle(context, joystick.knob, 22, `rgba(${COLOURS.joystick}, 0.4)`);
}

/**
 * Draws one frame in screen pixels (the caller sets the pixel ratio). The arena is clipped to the
 * view, so a very long screen shows bars instead of more arena (SB-09).
 */
export function drawScene(
  context: CanvasRenderingContext2D,
  screen: ScreenSize,
  view: ViewTransform,
  scene: Scene,
  ownPlayerId: string,
  joystick: JoystickDrawing | null,
): void {
  context.fillStyle = COLOURS.bars;
  context.fillRect(0, 0, screen.width, screen.height);

  context.save();
  context.beginPath();
  context.rect(view.viewLeft, view.viewTop, view.viewWidth, view.viewHeight);
  context.clip();
  context.fillStyle = COLOURS.arena;
  context.fillRect(view.viewLeft, view.viewTop, view.viewWidth, view.viewHeight);
  drawGrid(context, view);
  drawRopes(context, view, scene);
  for (const enemy of scene.enemies) {
    drawCircle(
      context,
      worldToScreen(view, enemy),
      balance.ENEMY_RADIUS * view.scale,
      COLOURS.enemy,
    );
  }
  for (const bullet of scene.bullets) {
    drawCircle(context, worldToScreen(view, bullet), bullet.radius * view.scale, COLOURS.bullet);
  }
  drawPlayers(context, view, scene, ownPlayerId);
  context.restore();

  if (joystick !== null) {
    drawJoystick(context, joystick);
  }
}
