# Survivor Game Play Screen

This folder is the browser module of the Survivor Game. `SurvivorGamePlayScreen.svelte` keeps its Svelte parts thin: the status display, the offer cards, and the connection notice are small components, and the rest is plain TypeScript with tests next to it. The files are listed below.

## Files

| File | Job |
| --- | --- |
| `run-connection.ts` | The reconnecting socket plus the rules package checks of every server message, and the two messages a browser sends. It stops with a notice on a message it cannot read or a state without the player's character |
| `state-timeline.ts` and `scene.ts` | Keep the last two states and slide every circle between them, since the server reports 15 times per second and the screen draws more often. Each slide lasts as many steps of time as the gap between the two states, so a report every second step slides over two steps. A jump of more than 4 steps, such as after a reconnect, is drawn as it is |
| `view-transform.ts` | World to screen: the same arena on every device, with bars on a very long screen (SB-09), and the grid lines that scroll with the world |
| `visible-ropes.ts` | The pairs of players far enough apart to draw their rope (SG-19) |
| `draw-scene.ts` | Draws a frame on the canvas as simple shapes (SG-53). It is the only file that draws |
| `direction.ts`, `joystick.ts`, and `direction-sender.ts` | The direction from the keys and from the joystick, cut to 32 directions with a dead zone, and the sender that sends a `set-direction` message only when the direction changes and sends it again after a reconnect, since the server forgets it (SG-54) |
| `play-input.ts` and `lock-page-gestures.ts` | Read keyboard and pointer events, let go of everything when the page loses focus, and stop the page from scrolling or zooming |
| `offer-cards.ts` | The cards of the open offer with their effect texts, the keys 1 to 3, and the guard that stops a second tap from choosing twice, and lets go whenever the connection is not open, since a choice sent as it dropped may never have been applied (SG-55) |
| `run-status.ts` | The health bar, experience bar, level, score, and time survived (SG-56) |

## Layout

The play screen fills the whole window. It has a tall arrangement, with the status on top and the offer cards in a row at the top edge of the arena, and a wide arrangement, with the status in a column on the left and the cards in a column at the right edge (SG-51, SG-55). The cards are not inside the element that listens for touches, so a touch on a card never starts the joystick. When the run ends, the shared game over panel is shown over the last picture (SG-50).
