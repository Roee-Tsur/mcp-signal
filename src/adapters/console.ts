import type { Adapter, TelemetryEvent } from '../types';

export interface ConsoleAdapterConfig {
  /** Console-like sink. Defaults to the global `console`. */
  logger?: Partial<Console>;
  /** Use `console.group` + `console.table` formatting. Default true. */
  pretty?: boolean;
  /** Prefix label. Default `"[mcp-telemetry]"`. */
  label?: string;
}

/**
 * Logs events to the console. Never makes a network request, so it always works — even
 * under the strictest widget CSP. Ideal for local development and as a fallback
 * destination. Usable client-side or server-side (inside a receiver).
 */
export function consoleAdapter(config: ConsoleAdapterConfig = {}): Adapter {
  const logger = (config.logger ?? (typeof console !== 'undefined' ? console : undefined)) as
    | Console
    | undefined;
  const pretty = config.pretty ?? true;
  const label = config.label ?? '[mcp-telemetry]';

  return {
    name: 'console',
    connectDomains: [],
    init(context) {
      logger?.log?.(label, 'ready', { host: context.host, session: context.sessionId });
    },
    send(events: TelemetryEvent[], { beacon }) {
      if (!logger) return;
      const tag = beacon ? `${label} (beacon)` : label;
      if (pretty && typeof logger.group === 'function' && typeof logger.table === 'function') {
        logger.group(tag);
        logger.table(events.map((e) => ({ event: e.event, ...e.properties })));
        logger.groupEnd?.();
      } else {
        logger.log?.(tag, events);
      }
    },
  };
}
