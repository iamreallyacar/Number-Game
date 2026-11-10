# Platform Requirements

These requirements cover everything around the games: the dashboard, how games plug in, and how the project is hosted.

## Dashboard

- PL-01: The home page is a dashboard that lists every installed game with its name and a short description.
- PL-02: Selecting a game on the dashboard opens that game.
- PL-03: Every game page has a way to return to the dashboard.

## Multiple Games

- PL-04: Each game lives in its own self-contained module, so a new game can be added without changing the code of other games.
- PL-05: Games register themselves with the dashboard through one shared interface that provides at least a unique id, a display name, a description, and an entry point.
- PL-06: The dashboard code does not contain rules or logic for any specific game.

## Players, Saves, and High Scores

- PL-17: Player IDs are shared by all games. Save slots and high scores belong to each game. Details are in `players-saves-scores.md`.

## Devices

- PL-07: The site works in current mobile and desktop browsers without installing anything.
- PL-08: Layouts adapt to phone portrait screens and laptop screens.
- PL-09: Games accept both touch and mouse input.

## Sound and Motion

- PL-18: Games may play short sound effects. Sound is on by default.
- PL-19: A mute button in the site header on every page turns all game sounds off and on. The choice is remembered on that device only and is not stored on the server.
- PL-20: Moving effects are turned off or reduced when the device asks for reduced motion.

## Hosting

- PL-10: The project runs on a single Linux server, such as a Proxmox VM or LXC container, on the local network.
- PL-11: The server is reachable from other devices on the same network by IP address or hostname.
- PL-12: Settings that differ between installs, such as the port and the data storage location, are read from configuration rather than written into the code. Every setting is documented.
- PL-13: No secrets are stored in the repository.

## Self-Hosting by Others

- PL-14: Someone who clones the repository can start the project by following setup steps in the README.
- PL-15: The project provides a packaged way to run it, such as a container image with a compose file, so setup takes only a few commands.
- PL-16: The repository includes an MIT license file so others know how they may use it.
