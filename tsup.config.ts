import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const version = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
).version as string;

const define = { __SDK_VERSION__: JSON.stringify(version) };

export default defineConfig([
  // Browser + Node library builds (ESM + CJS + types).
  {
    entry: { index: 'src/index.ts', server: 'src/server.ts' },
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
    entry: { 'mcp-widget-telemetry': 'src/index.ts' },
    format: ['iife'],
    globalName: 'McpTelemetry',
    minify: true,
    sourcemap: true,
    target: 'es2020',
    define,
    dts: false,
  },
]);
