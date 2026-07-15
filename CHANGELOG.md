# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-07-15

Initial release.

### Added

- **Core** — `createTelemetry()` client with batching (size + interval), exponential-backoff retries
  for in-session sends, best-effort teardown flushing (`visibilitychange` + `pagehide`, never
  `unload`), a `beforeSend` redaction hook, and an `enabled: false` hard opt-out.
- **Pluggable adapter contract** (`{ name, connectDomains?, init?, send }`) — the single integration
  surface, reused client-side and server-side.
- **Adapters** — `consoleAdapter` (always works), `webhookAdapter` (CORS-simple POST to any URL), and
  `posthogAdapter` (PostHog Cloud US/EU + self-hosted, batch capture).
- **Bridge transport** — `bridgeAdapter` routes events through a model-invisible, app-only MCP tool
  call (auto-detects `window.openai.callTool` / a `tools/call` postMessage; accepts a `callTool`
  override), plus the server-side `createTelemetryReceiver` and a ready-made `telemetryToolDefinition`
  descriptor (`mcp-widget-telemetry/server`).
- **Auto-capture** — lifecycle (`mcp_widget_loaded`/`visible`/`hidden`/`closed`), uncaught errors and
  unhandled rejections, and opt-in `[data-mcp-tel]` click capture.
- **Best-effort context** — anonymous per-load session id, host detection, `window.openai`
  enrichment, theme/locale/display-mode/timezone/viewport; refreshed on `openai:set_globals`.
- **CSP helpers** — `requiredConnectDomains()` and `cspMeta()` to declare the widget `connect-src`
  for direct adapters, plus a `debug` `securitypolicyviolation` diagnostic.
- **Builds** — ESM + CJS + type declarations, and a standalone minified IIFE
  (`window.McpTelemetry`) for `<script>` use inside a widget. **Zero runtime dependencies.**
- **Docs & example** — README, setup/adapters/bridge/writing-an-adapter/privacy/limitations guides,
  and a runnable demo (`npm run example`) that shows events flowing through both transports.

[0.1.0]: https://github.com/Roee-Tsur/mcp-widget-telemetry/releases/tag/v0.1.0
