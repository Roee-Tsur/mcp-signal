/**
 * Post-build step: embed the standalone IIFE (`dist/mcp-signal.global.js`) into the
 * `mcp-signal/inline` entry's output so `import { source } from 'mcp-signal/inline'`
 * returns the real bundle as a string.
 *
 * `src/inline.ts` ships `source` as the placeholder `__MCP_SIGNAL_IIFE_PLACEHOLDER__`
 * (which keeps typecheck/tests green without a build). Here we swap that placeholder in
 * the *built* `dist/inline.{js,cjs}` for a JSON string literal of the IIFE. The result
 * lives only in `dist/` (gitignored), so nothing generated is ever committed.
 *
 * Runs automatically via the `postbuild` npm script (so `prepublishOnly` covers it too).
 * `tsup --watch` does NOT run postbuild — run `npm run build` when iterating on `inline`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SENTINEL = '__MCP_SIGNAL_IIFE_PLACEHOLDER__';
const dist = (file) => new URL(`../dist/${file}`, import.meta.url);

const iife = readFileSync(dist('mcp-signal.global.js'), 'utf8');
// A valid double-quoted JS string literal of the whole bundle (handles quotes, newlines,
// backslashes). We match either quote style tsup emitted around the placeholder.
const literal = JSON.stringify(iife);
const pattern = new RegExp(`(['"])${SENTINEL}\\1`, 'g');

let total = 0;
for (const file of ['inline.js', 'inline.cjs']) {
  const url = dist(file);
  const src = readFileSync(url, 'utf8');
  const hits = src.match(pattern);
  if (!hits || hits.length === 0) {
    throw new Error(
      `embed-inline-source: placeholder ${SENTINEL} not found in dist/${file}. ` +
        `The inline entry's build output changed — check src/inline.ts and this script.`,
    );
  }
  // Function-form replacement: a string replacement would let `$` sequences in the
  // minified IIFE corrupt the output.
  writeFileSync(
    url,
    src.replace(pattern, () => literal),
    'utf8',
  );
  total += hits.length;
}

console.log(
  `embed-inline-source: inlined mcp-signal.global.js (${iife.length} bytes) into ` +
    `dist/inline.{js,cjs} (${total} site${total === 1 ? '' : 's'}).`,
);
