# Web

This folder is the Svelte browser app, `@local/web`, built with Vite. It shows the dashboard and the games. Where it sits among the other parts is in `ARCHITECTURE.md`, and the server calls it makes are in `API.md`.

## Files

`src` is laid out by job:

| Path | Job |
| --- | --- |
| `main.ts` and `App.svelte` | Start the app, show the header with the dashboard link, and pick the page for the current URL |
| `app.css` | Shared look of every page, built for phone portrait screens first |
| `routing/` | Page paths and page routing with the browser history |
| `api/` | One function per server route, with the room routes in `room-api.ts`. Every answer is checked with the shared schemas from `@local/game-server-api` before it is used |
| `api/device-id.ts` | The random device ID kept in local storage and sent in the `x-device-id` header |
| `saving/move-sync.ts` | Sends moves to the server one at a time and in order, retries failed saves, and stops when the save was opened elsewhere or is gone |
| `games/` | The browser game registry for both kinds of game, each game's browser module in its own folder, and `board-position.ts`, the row and column type the board effects share. The module type is `SavedBrowserGame` or `RoomBrowserGame`, told apart by `kind`, and the pages narrow on it |
| `rooms/` | Shared by every room game. `poller.ts` loads the room list and the waiting room again and again, `room-entry.ts` decides what the room page shows for a room and a player ID, `room-socket-url.ts` builds the WebSocket address, and `reconnecting-socket.ts` is the socket that reconnects with growing waits and stops on a close that cannot recover (SG-57). It carries text only, so it never sees a game's messages |
| `audio/` | The shared sound player and `bell-tones.ts`, the bell that the games build their chimes from. The player plays tones made in the browser and recorded clips (bundled mp3 files with their credits in `audio/clips/CREDITS.md`, fetched once, decoded once, and preloaded by each play screen), and keeps the mute choice from the header button in local storage (PL-18, PL-19) |
| `test-support/` | Helpers for the tests, such as a local storage kept in memory. Only tests use them |
| `pages/` | One Svelte component per page: dashboard, game, play, room, outdated play link, and not found |
| `components/` | Pieces of pages: the sound mute button, the game leaderboard, the save slot list, the new game setup, the player ID picker, the save status banner, the save gone notice, the top results table, and the personal bests list, and the room list of a room game. Also the pieces every play screen shares: the status bar, the game over panel, and the points pop-up that floats up from a board cell |

## Pages

| Path | Page |
| --- | --- |
| `/` | Dashboard with every registered game |
| `/games/:gameId` | Game page with the leaderboard. For a saved game it also shows the save slots: a used slot continues or deletes its game, and an empty slot asks for a player ID and the game's options on the same page, then starts a new game (PS-22). For a room game it shows the list of rooms in place of the save slots, which refreshes every few seconds, with a way to create a room and to join one with a picked player ID, and a rejoin button for each dropped player of a running room (PS-24) |
| `/games/:gameId/rooms/:roomId` | Room game pages. While the room is waiting it shows the waiting room, with the players, a way to leave, and a start button for the host. When the run starts, or when a player rejoins a running room, it shows the game's play screen with the WebSocket (PL-22). The player ID is the query parameter `playerId` of the page link, so reloading the page rejoins the run. A link without it asks for a player ID first, and a player who is not in a waiting room sees a join button. Leaving the waiting room page through a link in the app leaves the room. Closing the tab cannot, so the page polls the room every second with its player ID, and the server removes a player who stopped polling (SG-61, see `apps/server/README.md`) |
| `/games/:gameId/new`, `/games/:gameId/load`, and `/games/:gameId/high-scores` | Paths of pages that are now part of the game page. They open the game page, so old links and bookmarks still work |
| `/games/:gameId/slots/:slotNumber/saves/:saveId` | Opens the save and shows the game's play screen |
| `/games/:gameId/slots/:slotNumber` | An older play link without a save id. It opens no game and links to the save slots and the dashboard (PS-20) |
| Any other path | Not found page with a link to the dashboard |

## Saved game play

The play page of a saved game loads the save and hands its state to the game's play screen. The play screen applies each move with the rules package, then hands the move to the move sync. Network errors and server errors are retried with growing waits, and the save status banner tells the player while that happens. A move the server refuses, or a save that was opened on another device, stops saving and offers to reload the game from the server. A save that is gone, because the game ended, was deleted, or a new game took the slot, stops saving too. Then the page offers the save slots and the dashboard, never a reload, and reloading the page shows the same message. A finished game still shows its game over panel, since the last move was saved before the slot was emptied. Leaving the page while moves are still unsaved shows the browser's leave warning. Leaving through a link inside the app shows no warning, so the move sync still sends the moves that are queued, without retrying a send that fails. (PS-07, PS-08, PS-18, PS-19)

## Room game play

The play screen of a room game is not given a state to start from. It opens its own connection, and everything it draws comes from the states the server reports (SG-58). The play screen is given the game id, the room id, the player ID, and the paths of the game page and the dashboard, which it links to when the run ends or the connection cannot come back. It opens its own WebSocket with the shared helpers that build the socket URL and reconnect, and checks every message with the check from the rules package. The game page of a room game shows the leaderboard and the room list in place of the save slots (PS-24), so the shared game page code does that and needs no loader for a new game form. The Survivor Game play screen is described in `src/games/survivor-game/README.md`.

## Number Game play screen

The Number Game play screen still calls the single rules (`applyMatch`, `applyAddNumbers`, `applyHint`) instead of `applyMove`, because it needs what only they return, such as whether a stage was cleared and which pair a hint shows. The moves it sends use the `NumberGameMove` type from the rules package.

## Sounds and effects

Sounds and effects only show what happened and never change the game state. Each play screen picks the sound for an event, including game over, from its game's sounds file (`number-game-sounds.ts` or `block-game-sounds.ts`) and plays it with the shared sound player. After a match it also hands the board a short-lived match effect: a burst on both cleared cells, and the points earned with the Chinese words of the cheer beside them, placed with the cell positions from before the move. The Block Game play screen does the same after a line clear, with a flash on the cleared cells. (NG-30, NG-31, BG-17, BG-18, PL-18)
