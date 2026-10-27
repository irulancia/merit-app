import { paraglideVitePlugin } from '@inlang/paraglide-js';
import adapter from '@sveltejs/adapter-node';
import { sveltekit } from '@sveltejs/kit/vite';
// vitest's defineConfig is vite's, plus the `test` options
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    sveltekit({
      compilerOptions: {
        // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      },
      adapter: adapter()
    }),

    paraglideVitePlugin({
      project: './project.inlang',
      outdir: './src/lib/paraglide',
      emitTsDeclarations: true,
      // English only for now; the strings stay in messages/en.json so another language can be added later
      strategy: ['baseLocale']
    })
  ],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
