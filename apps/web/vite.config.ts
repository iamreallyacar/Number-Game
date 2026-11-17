import { fileURLToPath } from 'node:url';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig, loadEnv } from 'vite';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
// Same default as the server's PORT setting in GUIDE.md.
const DEFAULT_SERVER_PORT = '3000';

export default defineConfig(({ mode }) => {
  // The dev server sends API calls to the local game server, using the port from the root .env.
  const env = loadEnv(mode, REPO_ROOT, '');
  const serverPort = env['PORT'] ?? DEFAULT_SERVER_PORT;
  return {
    plugins: [svelte()],
    // Sound clips stay separate files, so the player can fetch and decode them like any other.
    build: { assetsInlineLimit: 0 },
    // Room games keep a WebSocket open under /api, so the proxy must pass upgrades as well.
    server: { proxy: { '/api': { target: `http://localhost:${serverPort}`, ws: true } } },
  };
});
