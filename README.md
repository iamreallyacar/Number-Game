# Number Game

## Project overview

- Title: Number Game
- Description: A small self-hosted game dashboard that runs on a home server (such as a Proxmox VM or container) and is played from a phone or laptop browser on the local network. The dashboard has three games: the Number Game, a grid puzzle where you clear pairs of numbers, the Block Game, a grid puzzle where you place shapes to fill and clear rows and columns, and the Survivor Game, a real-time team game where one to four players, each on their own device, fight off waves of enemies together.
- Stack: TypeScript (strict), Svelte with Vite, Node.js with Fastify, SQLite, Docker compose

## Purpose

- Primary: host the Number Game on a local Proxmox server and play it from a phone or laptop browser.
- Secondary: publish the project as a git repository that anyone can clone and host on their own server with minimal setup.
- Ongoing: keep the dashboard easy to grow with more games.

## Scope

In scope:

- A web dashboard that lists the available games.
- The Number Game, the Block Game, and the Survivor Game, playable with touch and mouse.
- Hosting on a single local server, packaged so others can self-host it.
- Sound clips from Wikimedia Commons under CC BY-SA, CC BY, CC0, and public domain terms, credited in `apps/web/src/audio/clips/CREDITS.md`.

Out of scope for now:

- Public internet hosting, passwords, and online leaderboards shared beyond your own server.
- Native mobile apps.

Setup steps are in `GUIDE.md`, and how the code is organised is in `ARCHITECTURE.md`.
