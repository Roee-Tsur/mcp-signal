import { describe, expect, it } from 'vitest';
import { createTelemetryReceiver } from '../src/receiver';
import { fakeAdapter } from './helpers';
import type { TelemetryEvent } from '../src/types';

function event(name: string): TelemetryEvent {
  return {
    event: name,
    properties: {},
    timestamp: '2026-07-15T00:00:00.000Z',
    messageId: 'id-1',
    context: {
      sessionId: 's',
      host: 'browser',
      sdk: { name: 'mcp-widget-telemetry', version: '0' },
    },
  };
}

describe('createTelemetryReceiver', () => {
  it('throws when no adapters are provided', () => {
    expect(() => createTelemetryReceiver({ adapters: [] })).toThrow(/at least one adapter/);
  });

  it('ingests a { events } payload and fans out to adapters (in-session)', async () => {
    const adapter = fakeAdapter();
    const receiver = createTelemetryReceiver({ adapters: [adapter] });
    const result = await receiver.ingest({ events: [event('a'), event('b')] });
    expect(result).toEqual({ accepted: 2 });
    expect(adapter.batches).toHaveLength(1);
    expect(adapter.batches[0].map((e) => e.event)).toEqual(['a', 'b']);
    expect(adapter.beaconBatches).toHaveLength(0);
  });

  it('also accepts a raw event array', async () => {
    const adapter = fakeAdapter();
    const receiver = createTelemetryReceiver({ adapters: [adapter] });
    const result = await receiver.ingest([event('a')]);
    expect(result.accepted).toBe(1);
  });

  it('returns a valid MCP tool result from handleToolCall', async () => {
    const adapter = fakeAdapter();
    const receiver = createTelemetryReceiver({ adapters: [adapter] });
    const res = await receiver.handleToolCall({ events: [event('a')] });
    expect(res.content[0].type).toBe('text');
    expect(res.structuredContent).toEqual({ accepted: 1 });
  });

  it('applies a server-side beforeSend', async () => {
    const adapter = fakeAdapter();
    const receiver = createTelemetryReceiver({
      adapters: [adapter],
      beforeSend: (e) => (e.event === 'drop' ? null : e),
    });
    await receiver.ingest({ events: [event('drop'), event('keep')] });
    expect(adapter.sent.map((e) => e.event)).toEqual(['keep']);
  });

  it('isolates a failing adapter', async () => {
    const bad = fakeAdapter({ name: 'bad', failTimes: 1 });
    const good = fakeAdapter({ name: 'good' });
    const receiver = createTelemetryReceiver({ adapters: [bad, good] });
    const result = await receiver.ingest({ events: [event('a')] });
    expect(result.accepted).toBe(1);
    expect(good.sent).toHaveLength(1);
  });

  it('ignores an empty or malformed payload', async () => {
    const adapter = fakeAdapter();
    const receiver = createTelemetryReceiver({ adapters: [adapter] });
    expect(await receiver.ingest({})).toEqual({ accepted: 0 });
    expect(await receiver.ingest(null)).toEqual({ accepted: 0 });
    expect(adapter.calls).toBe(0);
  });
});
