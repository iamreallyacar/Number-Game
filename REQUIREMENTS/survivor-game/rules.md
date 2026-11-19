# Survivor Game Rules

These requirements define how the Survivor Game plays in version 1. Survivor Game is a working title. Every number the rules use is in `balance.md`, and the rules name the value they use by its ID.

## Terms

| Term | Meaning |
| --- | --- |
| Run | One game from the start until the team is defeated |
| Room | The group of 1 to 4 players who play a run together |
| Host | The player who created the room |
| Team | Every player in the run |
| Arena | The endless flat world the run takes place in |
| Step | One small tick of game time. The whole game moves forward one step at a time |
| Basic shot | The attack every player has in version 1 |
| Rope | The rule that keeps players within a set distance of each other |
| Offer | The upgrades a player may choose from after a level up |
| Dropped player | A player whose device has lost its connection to the run |

## Goal and Score

- SG-01: The goal is the highest team score. The team has one score, and each beaten enemy adds its points to it.
- SG-02: Enemies keep getting stronger over time, so every run ends in defeat.
- SG-03: The time survived is counted from the start of the run and shown as a second stat.

## Rooms

- SG-04: A run has 1 to 4 players, each on their own device. Solo play is a room with one player.
- SG-05: The game page lists the open rooms. A player creates a room or joins an open one, and picks their player ID either way. A player ID can be in a room only once.
- SG-06: The host starts the run. Nobody new can join after the start.
- SG-07: If the host leaves before the start, the player who joined next becomes the host. A room with no players left is closed.
- SG-08: A run is played in one sitting. It has no save slots and cannot be paused.
- SG-09: The number of rooms that exist at once, counting waiting rooms and runs in progress, is a server setting (`MAX_ROOM_GAME_RUNS`) shared by every room game, with a default of 4. Creating a room beyond it is refused with a clear message.
- SG-61: A player who has not been seen in a waiting room for 30 seconds is removed from it as if they left, so a closed tab does not keep a room or a player ID taken.

## Arena and Movement

- SG-10: The arena is endless and has no walls. Players, enemies, and bullets are circles.
- SG-11: Each player sends only a direction, or no direction. A player with a direction moves that way at the player speed (SB-01).
- SG-12: Players pass through each other and through enemies. Enemies pass through each other.
- SG-13: Every player starts the run at the same spot, spread slightly apart.

## Rope

- SG-14: No two players can be farther apart than the rope length (SB-02).
- SG-15: Each step, every player moves first. Then any pair that is too far apart is pulled back to the rope length.
- SG-16: A player who is moving holds their ground, and a player who is standing still gives way. If both are moving, both are pulled back equally. If both are still, both are pulled back equally.
- SG-17: The rule does not care why a player is still. A dropped player and a player who let go of the joystick behave the same.
- SG-18: Dragging another player does not slow the player who drags.
- SG-19: The rope between two players is drawn only when they are farther apart than the rope warning share of its length (SB-02).

| Situation | Result |
| --- | --- |
| Two players push opposite ways | Neither makes progress |
| One moves, one is still or dropped | The still one is dragged along |
| Three push one way, one pushes the other | The group drifts slowly with the three |

## Basic Shot

- SG-20: Each player has one attack, the basic shot. It fires on its own at the enemy nearest to that player, with the starting values in SB-03.
- SG-21: A bullet flies in a straight line and does not follow its target. It damages each enemy it touches once.
- SG-22: A bullet disappears when it has hit as many enemies as it can, or when it has flown its range.
- SG-23: If no enemy is within range when a shot is due, the attack waits and fires as soon as one is.
- SG-24: With more than one bullet per shot, the bullets leave in a fan centred on the nearest enemy.

## Enemies

- SG-25: Version 1 has one enemy type. It walks straight at the nearest player. Its values are in SB-05.
- SG-26: An enemy whose health reaches 0 is beaten. It disappears, and the team gains its points and its experience.
- SG-27: New enemies appear at a random point whose distance to the nearest player is inside the appear distance range (SB-06). This is outside the largest view, so no player sees them pop in.
- SG-28: The number of enemies that appear per second grows with the number of players in the run and with time (SB-06).
- SG-29: Each new enemy has more health and gives more points the later it appears (SB-05). Health has no upper limit.
- SG-30: The number of enemies alive at once has a limit that grows with the number of players (SB-06). While the limit is reached, no new enemy appears.
- SG-31: An enemy farther from every player than the removal distance (SB-06) is removed and gives nothing.

## Health

- SG-32: The team shares one health bar (SB-01). It does not refill on its own.
- SG-33: An enemy that touches a player takes the touch damage (SB-05) from the team's health, at most once per touch interval for each enemy.

## Experience and Levels

- SG-34: Each beaten enemy gives its experience to the team at once. There is nothing to pick up.
- SG-35: When the experience bar is full, the team gains a level. The bar starts again with any extra experience kept, and each level needs more than the one before (SB-04).
- SG-36: On a level up, each player gets an offer of 3 different upgrades and chooses one. Each player's offer is picked at random and separately.
- SG-37: A level up does not pause the run. If the team levels up again before a player has chosen, that player's offers queue up and are shown one after another. An offer never runs out.

## Upgrades

- SG-38: The upgrades, their effects, and their limits are listed in SB-07.
- SG-39: An individual upgrade changes only the player who chose it. Its limit is counted for each player.
- SG-40: A team upgrade changes every player. Its limit is counted for the whole team.
- SG-41: An upgrade can be chosen until its limit is reached. After that it is no longer put in offers.
- SG-42: If fewer than 3 upgrades are left to offer, fewer are shown. Healing has no limit, so an offer is never empty.
- SG-43: If a team upgrade reaches its limit while it is still in another player's offer, it is swapped there for a different upgrade. If no different upgrade is left, it is removed and the offer gets shorter (SG-42).

## Dropped Connections

- SG-44: A dropped player's character stays in the run and stands still. It keeps attacking on its own and can be dragged by the rope. Leaving the page counts as dropping.
- SG-45: A dropped player can rejoin their own character at any time during the run, from any device, by picking the run on the game page and the same player ID. A player ID that is connected cannot be taken over.
- SG-46: Offers queue up while the player is away.
- SG-47: If no player is connected for the empty run time (SB-08), the run ends. The game keeps running during that time.

## End of a Run

- SG-48: The run ends for everyone when the team's health reaches 0, or as described in SG-47.
- SG-49: The result goes into the high scores for every player on the team. Its category is the number of players in the run, and its details are the time survived and the level reached.
- SG-50: Every player sees a game over panel with the score, the time survived, and the level reached, and with ways to the game page and the dashboard.

## Screen and Controls

- SG-51: Phones in portrait are the main target. PC is supported as well. The layout has one arrangement for tall screens and one for wide screens.
- SG-52: The view follows the player's own character and shows the same amount of the arena on every device (SB-09).
- SG-53: Version 1 draws everything as simple shapes on a canvas. Players, enemies, and bullets each have their own colour, and the player's own character stands out from the others.
- SG-54: On a phone, a joystick appears where the thumb touches down. On PC, WASD or the arrow keys are used. Both only produce a direction.
- SG-55: An offer is shown as cards at the edge of the screen, not as a popup over the action. A card is chosen with a tap or a click, or with the keys 1, 2, and 3. The number of queued offers is shown.
- SG-56: The screen always shows the team's health, experience bar, level, score, and time survived.
- SG-57: A player whose connection is lost is told clearly, and the game tries to reconnect on its own.

## How the Game Runs

- SG-58: The server runs the game. Browsers send only a direction and upgrade choices, and draw what the server reports. The server counts the score, so a changed browser cannot fake one.
- SG-59: The rules are one step function that takes the state and the input of every player. All randomness comes from a seeded generator kept in the state.
- SG-60: The server steps each run at the step rate (SB-08) and reports the state to every player in the run over a WebSocket connection.

## Not in Version 1

- More attacks and more enemy types
- Sound
- Keeping a phone screen awake (OQ-27)
