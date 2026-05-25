import { defineConfig } from "vite";

/**
 * Vite build for the Node-side sponsor generator.
 *
 * The project ships a CLI (src/generator.ts) that hits the GitHub Sponsors API
 * and writes SVG/PNG artifacts via Playwright. We use Vite's SSR build mode so
 * Node built-ins and runtime dependencies stay external (no bundling Playwright
 * or @octokit/graphql into the output).
 *
 * `vite preview` serves the gitignored `preview/` directory for local visual
 * inspection (see `pnpm preview`).
 */
export default defineConfig({
  build: {
    target: "node24",
    ssr: "src/generator.ts",
    outDir: "dist",
    emptyOutDir: true,
    minify: false,
    rollupOptions: {
      output: {
        format: "esm",
        entryFileNames: "generator.js",
      },
    },
  },
  ssr: {
    target: "node",
    // Leave runtime deps unbundled — Node resolves them from node_modules at runtime.
    noExternal: [],
  },
  preview: {
    port: 4173,
    open: true,
  },
});
