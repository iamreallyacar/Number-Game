# Open Questions

This file tracks decisions about the project. New questions go in the Open section with the assumption used until they are answered.

## Open

| Id | Question | Current assumption |
| --- | --- | --- |
| OQ-17 | `npm audit` reports low and moderate warnings from `minimatch` inside ESLint 10 and from `deepmerge` inside the Svelte build plugin. The only offered fix moves ESLint back to version 9. Should the tools be downgraded? | No. The warnings only affect lint and build tooling. The Docker image installs run time dependencies only, and `npm audit --omit=dev` reports nothing. Update the tools when fixed versions are released |
| OQ-21 | Are the number generation values in `number-game/difficulty.md` (pairs at the start, and the aim chance and sets tried that every preset shares) right? Games were played to at most 20 stages. A player who always clears the first pair in reading order cleared on average 13.7 stages on Easy (55 percent of 200 games ran out of Add Numbers before stage 20), 2.8 on Normal, and 0.9 on Hard (half of the Hard games cleared no stage). A player who always picks the match that leaves the most pairs cleared 18.0 stages on Easy (20 percent ran out), 8.8 on Normal, and 1.9 on Hard (36 percent cleared no stage), in 100 games each. Trying 4 sets of added numbers instead of 1 made every preset much easier, for example 11.9 instead of 2.8 stages on Normal for the first player | They were set from simulated play only. Tune them after playing on each preset |
| OQ-24 | Are the Block Game deal values (starting and late weights, 200 placements to reach the late weights, 30 tries for a fair hand) right? In 1000 simulated games a player who places one shape at a time by a simple board score lasted 130 placements on average (half of the games between 86 and 167, longest 416), and a player who places the first shape that fits lasted 37. In 60 games a player who plans every whole hand lasted a median of about 4000 placements, and 25 games were stopped at 5000. Between 1 hand in 20 and 1 in 10 needed a new pick, 3 single cells were dealt 6 times in about 120000 hands, and the slowest deal took 40 ms. | They were set from simulated play only. Tune them after playtesting (T-55). If careful players can still play without end, make the deal look at the board and prefer tighter hands |

## Tech Stack

| Part | Choice | Why |
| --- | --- | --- |
| Language | TypeScript in strict mode, for both the browser and the server | One language everywhere and strong type checking |
| Game rules | A shared TypeScript package with no browser or server code | The browser uses it to play, and the server can use it to check saves |
| Frontend | Svelte with Vite | Small, fast on phones, and simple for a grid of buttons |
| Backend | Node.js with Fastify, and TypeBox for request checks | Light web server with built-in input validation. TypeBox schemas also give the route handlers their types |
| Storage | SQLite file, using the SQLite support built into Node.js | No separate database server to install and no native package to compile. Easy to back up |
| Packaging | One Docker image and a docker compose file | Others can self-host with a few commands. Runs in a Proxmox VM or LXC container |

## Answered

| Id | Question | Answer |
| --- | --- | --- |
| OQ-01 | What widths can the player choose? | None. The board is always 10 wide. Widths 11 and 12 were removed because players kept to the default, and saves and high scores made on them were deleted |
| OQ-02 | Are added numbers random or copies? | New numbers from 1 to 9, chosen to help the player as described in NG-36 |
| OQ-03 | Where do added numbers go? | Right after the last number, in reading order |
| OQ-04 | How does scoring work? | See Scoring in `number-game/rules.md` |
| OQ-05 | Should a game in progress be saved? | Yes, automatically on the server, in save slots |
| OQ-06 | Can a game be continued on another device? | Yes, because saves are on the server and any player can load any save |
| OQ-07 | Should there be high scores? | Yes, stored on the server and tracked per player ID |
| OQ-08 | Which difficulty settings are used? | Easy, Normal, and Hard presets, see `number-game/difficulty.md` |
| OQ-09 | Warn the player when stuck? | Yes, suggest Add Numbers |
| OQ-10 | Is 5 and 5 a valid pair? | Yes, with normal match points |
| OQ-11 | Which tech stack should be used? | See the Tech Stack section above |
| OQ-12 | Which license? | MIT |
| OQ-13 | Can a player delete their own save slot or player ID? | Save slots can be deleted from the save slot list. Player IDs cannot be deleted in the first version |
| OQ-14 | What happens if the same save is open on two devices at once? | The save is locked to the device that opened it most recently. The other device is told the game was opened elsewhere |
| OQ-15 | Should saving be built in the first version? | Yes, saves go straight to the server. There is no browser saving step, so the save code is only written once |
| OQ-16 | Should high scores be split by width as well as difficulty? | No longer applies, because the width is always 10 (see OQ-01) |
| OQ-18 | What may a player ID contain? | 1 to 24 letters, digits, or the characters _ . -, in any language, with single spaces between words. Letter case does not make an ID different, so Sam and sam cannot both exist |
| OQ-19 | What happens to saves in slots above `SAVE_SLOTS_PER_GAME` if the setting is lowered? | They stay in the database but are not listed or reachable until the setting is raised again |
| OQ-22 | What board sizes can the Block Game player choose? | None. The board is always 10 x 10. Sizes 8 and 9 were removed because players kept to one size, and 10 x 10 leaves room for the bigger shapes |
| OQ-23 | What happens to Block Game saves and high scores made before hands of 3, the weight ramp, and fair hands? | They were all deleted when the server was updated, because the old rules were much easier and the old saves used three always-full slots |
| OQ-20 | Should the Disk Game move budget tighten in later stages? | No longer applies. The Disk Game was removed from the dashboard, and its saves and high scores were deleted when the server was updated |
