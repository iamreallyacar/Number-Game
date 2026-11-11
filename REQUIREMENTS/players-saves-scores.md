# Players, Saves, and High Scores

These requirements cover player IDs, save slots stored on the server, and high scores. Player IDs are shared by every game on the dashboard. Each game has its own save slots and high scores.

## Player IDs

- PS-01: A player creates their own player ID by typing a name. Player IDs must be unique.
- PS-02: Player IDs have no password, because the site is meant for a trusted local network.
- PS-03: Player IDs are stored on the server, so they are available on every device.

## The Game Page

- PS-22: Selecting a game on the dashboard opens its game page. The page shows the leaderboard and the list of save slots together, so a game is started or continued without passing through a menu.

## Starting a New Game

- PS-04: Picking an empty slot in the save slot list starts a new game in it.
- PS-05: The player then picks their player ID from a list, or creates a new one, and chooses the game's options, such as the width and difficulty in the Number Game.
- PS-06: The game begins in that slot, and the slot is linked to that player ID.

## Saving

- PS-07: Saving is automatic. The game is saved on the server after every change, such as a match, Add Numbers, or a new stage. There is no manual save button.
- PS-08: If a save fails, the game tells the player clearly and keeps retrying. It never fails silently.

## Loading

- PS-09: Picking a used slot in the save slot list continues its game. Each used slot shows the player ID, the score, the game's own details, such as the stage, width, and difficulty in the Number Game, and when it was last played.
- PS-10: Any player can load any save slot.
- PS-11: Loading a slot continues the game exactly where it was left.

## Game Over and Slots

- PS-12: When a game ends, the result is added to the high scores and the slot becomes empty again. A lost game cannot be loaded.

## High Scores

- PS-13: Each game result records the player ID, final score, date, and the game's own details and category. Each game's rules file says what these are.
- PS-14: The leaderboard on the game page shows the top results for the game, with a way to filter by the game's category, such as the difficulty in the Number Game.
- PS-15: Each player ID has a personal best score per category, shown on the leaderboard for a picked player.

## Configuration

- PS-16: The number of save slots per game is a setting, with a default of 10.

## Deleting and Locking

- PS-17: A save slot can be deleted from the save slot list, which makes it empty. Player IDs cannot be deleted in the first version.
- PS-18: A save is locked to the device that opened it most recently. If another device had it open, that device is told the game was opened elsewhere and stops saving to it.

## Links to Saved Games

- PS-19: Every new game gets its own save id, and the link to its play page names that save as well as the slot. A link or an open page for a game that has ended, was deleted, or whose slot now holds a different game opens nothing and changes nothing, not even the device lock. The player is told the game is over and is offered the save slots of the game and the dashboard, but not a reload, because a reload would open the other game.
- PS-20: A play link from before save ids, which names only the slot, opens no game. It shows the same choices, so the player can pick their game from the save slots.
- PS-21: Deleting a save from the save slot list names the save, so a list that is out of date cannot delete a newer game in the same slot.
