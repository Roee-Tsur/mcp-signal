/**
 * mcp-widget-telemetry — browser entry.
 *
 * Drop this into your widget to capture usage and forward it to any destination.
 * The Node-side receiver + tool helpers live in `mcp-widget-telemetry/server`.
 */
export { createTelemetry } from './client';

export { consoleAdapter } from './adapters/console';
export { webhookAdapter } from './adapters/webhook';
export { posthogAdapter } from './adapters/posthog';
export { bridgeAdapter } from './adapters/bridge';

export { cspMeta, requiredConnectDomains } from './csp';
export { detectBridge } from './host-bridge';

export type {
  Adapter,
  HostEnv,
  InteractionCaptureConfig,
  RetryConfig,
  SdkInfo,
  SendOptions,
  TelemetryClient,
  TelemetryConfig,
  TelemetryContext,
  TelemetryEvent,
} from './types';
export type { ConsoleAdapterConfig } from './adapters/console';
export type { WebhookAdapterConfig } from './adapters/webhook';
export type { PostHogAdapterConfig } from './adapters/posthog';
export type { BridgeAdapterConfig } from './adapters/bridge';
export type { CallTool } from './host-bridge';
