/** Package name, used for the `sdk.name` field (typed as a literal). */
export const SDK_NAME = 'mcp-widget-telemetry';

/** Resolved SDK version. Replaced at build/test time; falls back safely otherwise. */
export const SDK_VERSION: string =
  typeof __SDK_VERSION__ !== 'undefined' ? __SDK_VERSION__ : '0.0.0-dev';

/** Canonical event names emitted by the auto-capture modules. */
export const EVENTS = {
  LOADED: 'mcp_widget_loaded',
  VISIBLE: 'mcp_widget_visible',
  HIDDEN: 'mcp_widget_hidden',
  CLOSED: 'mcp_widget_closed',
  ERROR: 'mcp_widget_error',
  INTERACTION: 'mcp_widget_interaction',
} as const;

/** Config defaults. */
export const DEFAULTS = {
  enabled: true,
  autoCaptureLifecycle: true,
  autoCaptureErrors: true,
  autoCaptureInteractions: false,
  batchSize: 20,
  flushIntervalMs: 5000,
  maxQueueSize: 500,
  requestTimeoutMs: 8000,
  debug: false,
} as const;

/** Retry policy defaults. */
export const RETRY_DEFAULTS = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  factor: 2,
  jitter: true,
} as const;

/** PostHog Cloud ingestion hosts. */
export const POSTHOG_HOSTS = {
  us: 'https://us.i.posthog.com',
  eu: 'https://eu.i.posthog.com',
} as const;

/** Hard limits. */
export const LIMITS = {
  /** Stay comfortably under the 64 KiB sendBeacon/keepalive ceiling. */
  beaconMaxBytes: 60_000,
  /** Truncate captured stack traces. */
  stackMaxChars: 4_000,
} as const;

/** Default tool name the bridge transport calls. */
export const BRIDGE_DEFAULT_TOOL = 'record_telemetry';

/** Default attribute the interaction capture looks for. */
export const DEFAULT_INTERACTION_ATTR = 'data-mcp-tel';
