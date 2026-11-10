/** @type {import('@sveltejs/vite-plugin-svelte').SvelteConfig} */
export default {
  // Runes mode everywhere, so no component falls back to the older, looser Svelte 4 syntax.
  compilerOptions: { runes: true },
};
