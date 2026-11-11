# Open Questions

This file tracks decisions about the project. New questions go in the Open section with the assumption used until they are answered.

## Open

| Id | Question | Current assumption |
| --- | --- | --- |
| OQ-17 | `npm audit` reports low and moderate warnings from `minimatch` inside ESLint 10 and from `deepmerge` inside the Svelte build plugin. The only offered fix moves ESLint back to version 9. Should the tools be downgraded? | No. The warnings only affect lint and build tooling. The Docker image installs run time dependencies only, and `npm audit --omit=dev` reports nothing. Update the tools when fixed versions are released |
| OQ-20 | In the Disk Game, a player who always plays a shortest path never runs out of moves, so a game can last as long as they want. Should the move budget tighten in later stages? | No. Stages of 10 disks take hundreds of moves, so games end in practice. The playtest that would check this (T-61) was not carried out before the project closed |

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
| OQ-01 | What widths can the player choose? | 10, 11, or 12 |
| OQ-02 | Are added numbers random or copies? | Random numbers from 1 to 9 |
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
| OQ-16 | Should high scores be split by width as well as difficulty? | No, width is shown next to each score but not used to filter |
| OQ-18 | What may a player ID contain? | 1 to 24 letters, digits, or the characters _ . -, in any language, with single spaces between words. Letter case does not make an ID different, so Sam and sam cannot both exist |
| OQ-19 | What happens to saves in slots above `SAVE_SLOTS_PER_GAME` if the setting is lowered? | They stay in the database but are not listed or reachable until the setting is raised again |
