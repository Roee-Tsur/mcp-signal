import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const version = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  .version as string;

const define = { __SDK_VERSION__: JSON.stringify(version) };

export default defineConfig([
  // Browser + Node library builds (ESM + CJS + types).
  // `inline` is a server/build-time entry; `scripts/embed-inline-source.mjs` splices the
  // IIFE below into its `dist/inline.{js,cjs}` output after this run (npm `postbuild`).
  {
    entry: { index: 'src/index.ts', server: 'src/server.ts', inline: 'src/inline.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    target: 'es2020',
    define,
    outExtension: ({ format }) => ({ js: format === 'cjs' ? '.cjs' : '.js' }),
  },
  // Standalone minified IIFE for a single <script> include inside a widget.
  // Built from the browser entry only, so server/tool code never ships to the widget.
  {
    entry: { 'mcp-signal': 'src/index.ts' },
    format: ['iife'],
    globalName: 'McpSignal', // must match IIFE_GLOBAL in src/constants.ts
    minify: true,
    sourcemap: true,
    target: 'es2020',
    define,
    dts: false,
  },
]);
