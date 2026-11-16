# Survivor Game Design Notes

These are notes from the planning discussion, not requirements yet. They record what has been decided and what is still open, so the discussion can continue later. Survivor Game is a working title. Once the open topics are settled, this file is replaced by numbered requirements.

## Idea

The player moves a character around while it attacks on its own. Enemies swarm in. Beaten enemies give experience and score. At set experience amounts the team levels up and each player picks one of three upgrades. The first version draws everything as simple shapes: the character is a circle, attacks are circles or rectangles in other colours, and enemies are more circles.

## Decided

### Goal and Score

- The goal is the highest score. Each beaten enemy gives points, and tougher enemies give more.
- Enemies keep getting stronger over time, so every run ends in defeat.
- Time survived is shown as a second stat.

### Players and Rooms

- A run has 1 to 4 players, each on their own device, in one shared arena.
- One player creates a room, others join it from the dashboard, and the host starts the run. Nobody can join after the start.
- Solo play is a room with one player, so solo and co-op use the same code.
- A run is played in one sitting. There are no save slots.

### Team Rules

- Experience is earned as a team. Everyone levels up at the same moment, and each player picks their own upgrade.
- Level-up choices do not pause the game. If a player levels up again before choosing, the choices queue up.
- The team shares one health bar. When it runs out, the run ends for everyone.
- The team has one score.
- Enemy numbers scale with the number of players in the run.

### Rope

- The world is endless and has no walls.
- No two players can be more than a set distance apart.
- Each step, every player moves first. Then any pair that is too far apart is pulled back to the limit.
- A player who is moving holds their ground, and a player who is standing still gives way. If both are moving, both are pulled back equally.
- The rule does not care why a player is still. A dropped player and a player who let go of the joystick behave the same.

| Situation | Result |
| --- | --- |
| Two players push opposite ways | Neither makes progress |
| One moves, one is still or dropped | The still one is dragged along |
| Three push one way, one pushes the other | The group drifts slowly with the three |

### Dropped Connections

- A dropped player's character stays in the run and stands still. It keeps attacking on its own and can be dragged by the rope.
- The dropped player can rejoin their own character at any time during the run.
- Level-up choices queue up while the player is away.
- If no player is connected for 30 seconds, the run ends. The game keeps running during those 30 seconds.

### Devices and Controls

- Phones in portrait are the main target. PC is supported as well.
- On a phone, a joystick appears where the thumb touches down. On PC, WASD or the arrow keys are used. Both only produce a direction.
- Upgrade choices are shown as cards at the edge of the screen, not as a popup over the action.
- The screen layout has one arrangement for tall screens and one for wide screens.
- Enemies appear outside the largest possible view, so no player sees them pop in.

### Technical Direction

- The server runs the game. Browsers send only a movement direction and draw what the server reports. The server counts the score, so a changed browser cannot fake one.
- The rules are one step function that takes the state and the input of every player.
- The browser and the server use a WebSocket connection for a run.
- The game is drawn on a canvas.

## Open Topics

### Content

- Which attacks exist
- Which upgrades exist
- Which enemy types exist
- How fast difficulty rises
- A small first set is suggested so the networking can be proven first: about 3 attacks, 3 enemy types, and 8 upgrades

### Tuning During Play

- Rope length
- Whether dragging a player slows the one who drags
- Whether the rope is drawn only when it is nearly tight

### To Investigate Before Requirements

- `ARCHITECTURE.md` says the browser and the server talk only over HTTP, and every game uses save slots and moves. This game needs a second kind of game in the shared code: one with rooms, a WebSocket connection, and no save slots.
- High scores belong to one player today. A team score needs a way to belong to several players.
- The browser feature that keeps a phone screen awake only works over HTTPS, and a home server usually uses plain HTTP.
