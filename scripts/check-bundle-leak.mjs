// Guards the "browser-safe core / server split" invariant (see CLAUDE.md "Entry points").
//
// Server-only code (the receiver + the app-only tool descriptor) must never end up in a bundle
// that ships inside a widget: the browser IIFE (`dist/mcp-signal.global.js`) and the two inline
// entry builds (`dist/inline.{js,cjs}`), which embed that same IIFE. If any server symbol leaks in,
// widgets would carry dead Node-only code — and, worse, the split we rely on would be silently broken.
//
// This automates the manual `grep -c createSignalReceiver dist/…` check the docs used to describe.
// Run after `npm run build`.
import { readFileSync } from 'node:fs';

// Symbols that only exist on the server entry (`mcp-signal/server`). Their presence in a widget
// bundle means server code was pulled across the split.
const SERVER_ONLY_SYMBOLS = ['createSignalReceiver', 'signalToolDefinition'];

// Bundles that are loaded inside a widget and therefore must stay server-code-free.
const WIDGET_BUNDLES = ['dist/mcp-signal.global.js', 'dist/inline.js', 'dist/inline.cjs'];

let failed = false;

for (const relPath of WIDGET_BUNDLES) {
  let source;
  try {
    source = readFileSync(new URL(`../${relPath}`, import.meta.url), 'utf8');
  } catch {
    console.error(`check-bundle-leak: cannot read ${relPath} — run \`npm run build\` first`);
    failed = true;
    continue;
  }

  for (const symbol of SERVER_ONLY_SYMBOLS) {
    if (source.includes(symbol)) {
      console.error(`check-bundle-leak: server symbol "${symbol}" leaked into ${relPath}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(
  `check-bundle-leak: OK — ${WIDGET_BUNDLES.length} widget bundles are free of ${SERVER_ONLY_SYMBOLS.length} server symbols`,
);
