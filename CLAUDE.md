# CLAUDE.md

Guidance for Claude Code (and other AI agents) working in this repo. Terse and directive by
design; see `README.md` + `docs/` for the human narrative.

## What this is

`mcp-signal` — a tiny, **zero-runtime-dependency** TypeScript telemetry SDK that runs inside MCP
widgets (Claude MCP Apps, ChatGPT Apps SDK, mcp-ui) and forwards usage events to any destination via
a pluggable adapter. Published on npm as [`mcp-signal`](https://www.npmjs.com/package/mcp-signal).

## Commands

```bash
npm test              # vitest (jsdom) — 122 tests
npm run test:coverage # v8 coverage (~97%)
npm run typecheck     # tsc --noEmit
npm run build         # tsup -> dist/ : ESM + CJS + IIFE + .d.ts
npm run format        # prettier --write  (format:check to verify)
npm run check:bundle  # assert no server code leaked into the widget bundles (needs a build)
npm run check:package # publint --strict && attw --pack . (exports map resolves for every mode)
npm run example       # build, then serve the demo at http://localhost:8787
```

**Before committing, run:** `npm run typecheck && npm test && npm run format:check`. There is no
pre-commit hook — this gate is manual, but **GitHub Actions CI** (`.github/workflows/ci.yml`) runs it
on every push/PR (tests on Node 18/20/22, plus `typecheck` + `format:check` + `build` +
`check:bundle` + `check:package`). `prepublishOnly` enforces the same gate on publish.

## Architecture — destinations × transports, one contract

Two orthogonal ideas joined by a single interface:

- **Destination adapters** (_where_ events land): `consoleAdapter`, `webhookAdapter`,
  `posthogAdapter`. The same contract runs **client-side or server-side**.
- **Transports** (_how_ a batch leaves the widget):
  1. **Bridge (recommended)** — `bridgeAdapter` hands each batch to an app-only MCP tool via the host
     (`window.openai.callTool` / a `tools/call` postMessage); your server runs `createSignalReceiver`.
     Bypasses CSP, model-invisible.
  2. **Direct HTTP** — `posthogAdapter`/`webhookAdapter` POST from the widget (needs a CSP allowlist).
  3. **Console** — local dev.

The core (`createSignal`) is transport-agnostic: it owns batching, retry, flush, context, and dedup,
and just feeds batches to whatever adapters are configured.

### The adapter contract (the central interface — keep it small)

```ts
interface Adapter {
  readonly name: string;
  readonly connectDomains?: string[]; // origins you POST to directly (feeds cspMeta)
  init?(context: SignalContext): void | Promise<void>;
  send(
    events: SignalEvent[],
    options: { beacon: boolean; signal?: AbortSignal },
  ): void | Promise<void>;
}
```

- `beacon: false` (in-session) → return a Promise; **reject to have the core retry**.
- `beacon: true` (teardown) → fire-and-forget, no await/retry, keep payload < ~60 KiB.
- The core catches every adapter error (a throw/reject never reaches the widget).
- **New adapters MUST pass `test/contract.test.ts`** (errors isolated, `init` gets context, respects
  the `beacon` flag) and stay dependency-free.

## Entry points — keep them separate

- **`src/index.ts`** → browser entry (`mcp-signal`): `createSignal`, the four adapters, `cspMeta`/
  `requiredConnectDomains`, `detectBridge`. Also the source of the IIFE (`window.McpSignal`). Must be
  **browser-safe** — guard every `window`/`document`/`navigator` access so it imports anywhere.
- **`src/server.ts`** → node entry (`mcp-signal/server`): `createSignalReceiver`,
  `signalToolDefinition`, and the destination adapters for server-side use. **Never import this into
  the widget**; it must not touch `window`.
- **`src/inline.ts`** → server/build-time entry (`mcp-signal/inline`): `source` (the IIFE as a
  string), `renderInlineScript`, `injectSignal` — for MCP servers that inline the SDK into
  server-rendered widget HTML. Pure string work; no `window`/`fs`/`Buffer`. `source` is a placeholder
  (`__MCP_SIGNAL_IIFE_PLACEHOLDER__`) in `src`; `scripts/embed-inline-source.mjs` splices the built
  IIFE into `dist/inline.{js,cjs}` via the `postbuild` npm step (nothing generated is committed — `dist`
  is gitignored).
- Keep server code out of the widget bundle: `src/index.ts` must not import `receiver`/`tool-def`.
  `npm run check:bundle` (`scripts/check-bundle-leak.mjs`, run in CI) asserts the server symbols
  `createSignalReceiver`/`signalToolDefinition` are absent from `dist/mcp-signal.global.js` and
  `dist/inline.{js,cjs}` (the inline builds embed only the browser IIFE). Run it after a build.

## Invariants (do not break)

1. **Zero runtime dependencies.** It ships inside widgets. Dev deps only.
2. **Browser-safe core / server split** (see Entry points).
3. **CORS-simple transport** (`src/transport.ts`): in-session sends are `POST` `text/plain`, no custom
   headers, `mode: 'no-cors'`. Widgets have an opaque origin, so the response is unreadable — `no-cors`
   resolves when the request leaves the tab instead of a false-negative reject that would cause
   **duplicate delivery**. Teardown → `navigator.sendBeacon` → keepalive `fetch`, < 60 KiB. Custom
   webhook headers force `cors` + a preflight (documented footgun). Read the header comment in
   `src/transport.ts` before changing it.
4. **Idempotency:** every event carries `messageId` (→ PostHog `uuid`), so retry/beacon duplicates are
   deduped downstream. Don't remove it.
5. **Naming is a public contract:** events are `mcp_signal_*` (`src/constants.ts` `EVENTS`), the global
   is `window.McpSignal`, the click attribute is `data-mcp-signal`, the default tool is `record_signal`.
6. **Version injection:** `__SDK_VERSION__` is a build-time `define` (tsup + vitest). Never `import`
   `package.json` at runtime; `src/constants.ts` `SDK_VERSION` guards it.
7. **Teardown** uses `visibilitychange`→hidden + `pagehide` only — never `unload`/`beforeunload`
   (breaks bfcache, unreliable on mobile).
8. **Privacy posture:** no phone-home, no user identity, no fingerprinting. `beforeSend` can
   redact/drop; `enabled: false` is a hard opt-out (attaches no listeners). Keep it neutral plumbing.

## Where things live

| Path                                                         | Responsibility                                                                                                      |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `src/client.ts`                                              | pipeline: batching, timer, flush/shutdown, `beforeSend`, disabled no-op                                             |
| `src/queue.ts` · `src/retry.ts` · `src/transport.ts`         | queue/backpressure · backoff · CORS-simple POST                                                                     |
| `src/context.ts`                                             | host detection, `window.openai` enrichment, session id, refresh                                                     |
| `src/host-bridge.ts`                                         | `detectBridge()`: `window.openai.callTool` / `tools/call` postMessage                                               |
| `src/lifecycle.ts` · `src/errors.ts` · `src/interactions.ts` | auto-capture                                                                                                        |
| `src/diagnostics.ts`                                         | debug logger + `securitypolicyviolation` CSP watch                                                                  |
| `src/adapters/{console,webhook,posthog,bridge}.ts`           | destinations + bridge transport                                                                                     |
| `src/receiver.ts` · `src/tool-def.ts`                        | server receiver + app-only tool descriptor                                                                          |
| `src/csp.ts`                                                 | `cspMeta` / `requiredConnectDomains`                                                                                |
| `test/`                                                      | vitest; `helpers.ts` = `fakeAdapter`/`mockFetch`/beacon+visibility stubs; `contract.test.ts` = the adapter contract |
| `docs/` · `example/`                                         | setup/adapters/bridge/writing-an-adapter/privacy/limitations · zero-dep demo (both transports)                      |

## Testing notes (jsdom)

- jsdom lacks `sendBeacon`/`visibilityState`/`window.openai`/CSP-violation events — stub them via
  `test/helpers.ts` (and `test/setup.ts` polyfills `crypto`).
- Use fake timers for batch-size/interval/backoff; call `flush()` directly for content assertions.
- The uncovered ~3% is pure environment guards (`typeof window === 'undefined'`, etc.). Don't write
  contrived global-deletion tests to chase 100%.

## The CSP-egress reality (why the bridge exists — read before "fixing" direct HTTP)

Widget network egress is **default-deny** via the host's CSP `connect-src`. A direct `fetch` only
leaves the iframe if the _integrating app_ allowlisted the host (`cspMeta` generates the fragment).
The bridge sidesteps this by routing events through an app-only MCP tool
(`_meta.ui.visibility: ["app"]` → stripped from the model's tool list) to the server, which forwards
them where there's no CSP/CORS. You **cannot** make direct HTTP bypass CSP from inside the widget —
that's the whole reason the bridge is the recommended transport. See `docs/bridge.md` +
`docs/limitations.md`.

## Release

Publishing is automated by `.github/workflows/release.yml` (publish-on-Release, with npm
**provenance**). One-time setup: add an npm **granular/automation access token** as the repo secret
`NPM_TOKEN` (Settings → Secrets and variables → Actions), and make sure the npm package's publish
policy permits automation tokens (not interactive-2FA-only).

1. Bump `version` in `package.json`; add a `CHANGELOG.md` entry (+ a `[X.Y.Z]:` link ref).
2. Commit, then `gh release create vX.Y.Z --generate-notes` (the tag must equal `v<package.json
version>` — the workflow asserts this).
3. The workflow runs `npm publish --provenance --access public`, which triggers `prepublishOnly`
   (`typecheck && test && build && check:bundle && check:package`) so the artifact is validated in the
   same run that signs its provenance. The `files` whitelist ships only `dist` + `README.md` +
   `LICENSE` + `CHANGELOG.md`.

Manual fallback (no CI): `npm publish` still works locally and runs the same `prepublishOnly` gate,
but produces **no provenance** and needs your interactive 2FA OTP. Prefer the Release flow.

Note: the **npm README is snapshotted per version** — README/asset changes appear on npm only after
the next publish, not on push.
