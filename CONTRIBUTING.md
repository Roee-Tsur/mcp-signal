# Contributing

Thanks for your interest! This is a small, focused package and the goal is a v0.1 that works
flawlessly. Contributions that keep it tiny, dependency-free, and well-tested are very welcome.

## Development

```bash
npm install
npm test            # vitest (jsdom)
npm run typecheck   # tsc --noEmit
npm run build       # tsup -> dist/ (ESM + CJS + IIFE + types)
npm run example     # build + serve the demo at http://localhost:8787
npm run format      # prettier
```

## Ground rules

- **Zero runtime dependencies.** The SDK ships inside widgets; keep it tiny. Dev dependencies are
  fine.
- **Browser-safe core.** Everything reachable from `src/index.ts` must guard `window`/`document`/
  `navigator` access so it's safe to import anywhere. Server-only code lives behind
  `src/server.ts` (the `mcp-signal/server` export) and must never touch `window`.
- **Tests for behavior changes.** Add or update tests under `test/`. Keep coverage healthy.
- **Format & typecheck** before opening a PR (`npm run format && npm run typecheck && npm test`).

## Writing an adapter

New adapters are the most valuable contribution. The bar:

1. Implement the [adapter contract](./docs/writing-an-adapter.md) — `name` + `send` (+ optional
   `init`, `connectDomains`).
2. Stay dependency-free.
3. Add a test that exercises `send` (inject `fetch`/`sendBeacon`) and passes the spirit of
   `test/contract.test.ts` (errors isolated, respects the `beacon` flag).
4. Document it in [docs/adapters.md](./docs/adapters.md).

Small, self-contained adapters (Segment, Amplitude, GA4, Mixpanel, OpenTelemetry…) are on the
roadmap — PRs welcome.

## Commit & PR

- Keep commits focused and descriptive.
- Describe the behavior change and how you verified it.
- By contributing you agree your work is licensed under the project's [MIT license](./LICENSE).
