# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2026-07-15

### Added

- **`mcp-signal/inline` entry** — first-class helpers for MCP servers that inline the SDK into
  server-rendered widget HTML. `injectSignal(html, config)` splices the standalone IIFE plus a
  `createSignal(...)` bootstrap into a widget document in one call (index-based insert before
  `</head>`/`</body>`, `</script>` defused); `renderInlineScript(config)` returns just the `<script>`
  tag; and `source` exposes the built IIFE as a bundler-safe string. Adapters are described
  declaratively (`bridge` / `webhook` / `posthog` / `console`) and constructed inside the widget, since
  live adapter objects can't cross into an HTML string. Removes the need for consumers to vendor the
  IIFE themselves. The embedded `source` is spliced into `dist/` at build time (`postbuild`), so nothing
  generated is committed.

## [0.1.1] - 2026-07-15

Documentation and repository polish. **No code changes** — the published SDK is identical to
0.1.0.

### Changed

- README rebuilt on the layout used by leading OSS packages: a centered hero (logo mark, one-line
  value prop, curated + verified badges, nav links, animated demo), a scannable **Features**
  section, a dedicated **How the bridge works** diagram section, and a collapsible
  **Configuration** table.

### Added

- Animated demo (`assets/demo.gif`) at the top of the README and a project logo mark
  (`assets/logo.png`).

## [0.1.0] - 2026-07-15

Initial release.

### Added

- **Core** — `createSignal()` client with batching (size + interval), exponential-backoff retries
  for in-session sends, best-effort teardown flushing (`visibilitychange` + `pagehide`, never
  `unload`), a `beforeSend` redaction hook, and an `enabled: false` hard opt-out.
- **Pluggable adapter contract** (`{ name, connectDomains?, init?, send }`) — the single integration
  surface, reused client-side and server-side.
- **Adapters** — `consoleAdapter` (always works), `webhookAdapter` (CORS-simple POST to any URL), and
  `posthogAdapter` (PostHog Cloud US/EU + self-hosted, batch capture).
- **Bridge transport** — `bridgeAdapter` routes events through a model-invisible, app-only MCP tool
  call (auto-detects `window.openai.callTool` / a `tools/call` postMessage; accepts a `callTool`
  override), plus the server-side `createSignalReceiver` and a ready-made `signalToolDefinition`
  descriptor (`mcp-signal/server`).
- **Auto-capture** — lifecycle (`mcp_signal_loaded`/`visible`/`hidden`/`closed`), uncaught errors and
  unhandled rejections, and opt-in `[data-mcp-signal]` click capture.
- **Best-effort context** — anonymous per-load session id, host detection, `window.openai`
  enrichment, theme/locale/display-mode/timezone/viewport; refreshed on `openai:set_globals`.
- **CSP helpers** — `requiredConnectDomains()` and `cspMeta()` to declare the widget `connect-src`
  for direct adapters, plus a `debug` `securitypolicyviolation` diagnostic.
- **Builds** — ESM + CJS + type declarations, and a standalone minified IIFE
  (`window.McpSignal`) for `<script>` use inside a widget. **Zero runtime dependencies.**
- **Docs & example** — README, setup/adapters/bridge/writing-an-adapter/privacy/limitations guides,
  and a runnable demo (`npm run example`) that shows events flowing through both transports.

[0.1.1]: https://github.com/Roee-Tsur/mcp-signal/releases/tag/v0.1.1
[0.1.0]: https://github.com/Roee-Tsur/mcp-signal/releases/tag/v0.1.0
