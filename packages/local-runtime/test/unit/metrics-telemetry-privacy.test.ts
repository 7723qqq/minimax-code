import { stubEnv, stubGlobal, unstubAllEnvs, unstubAllGlobals } from '../../../../test/bun-test-setup.js';
import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';

import { buildLocalRuntimeMetricsClient } from '../../src/runtime/host-metrics.js';
import type { MetricsClient } from '../../src/common/metrics.js';

const clients: MetricsClient[] = [];
const fetchRequest = mock<typeof fetch>();
beforeEach(() => {
  stubEnv('__MAVIS_RUNTIME_MANAGED', '1');
  stubEnv('MAVIS_BUILD_ENV', 'prod');
  stubEnv('MAVIS_REGION', 'en');
  stubEnv('MCODE_DISABLE_TELEMETRY', '');
  stubEnv('DO_NOT_TRACK', '');
  fetchRequest.mockReset().mockResolvedValue(new Response('{}', { status: 200 }));
  stubGlobal('fetch', fetchRequest);
});
afterEach(async () => {
  for (const client of clients.splice(0)) await client.close();
  unstubAllGlobals();
  unstubAllEnvs();
});

function fixture(metrics?: boolean) {
  const client = buildLocalRuntimeMetricsClient({
    runtimeOwnerKind: 'tui',
    appVersion: '0.4.12',
    readTelemetryEnabled: () => metrics,
  });
  clients.push(client);
  return client;
}

describe('automatic runtime metrics consent', () => {
  it.each([undefined, false])('does not send production metrics without an explicit opt-in (%s)', async (enabled) => {
    const client = fixture(enabled);
    client.counter('started_total', 1);
    await client.flush();
    expect(fetchRequest).not.toHaveBeenCalled();
  });

  it('sends metrics only after the metrics opt-in', async () => {
    const client = fixture(true);
    client.counter('started_total', 1);
    await client.flush();
    expect(fetchRequest).toHaveBeenCalledOnce();
    expect(String(fetchRequest.mock.calls[0]![0])).toBe('https://agent.minimax.io/matrix/api/v1/metrics/batch');
  });

  it.each(['MCODE_DISABLE_TELEMETRY', 'DO_NOT_TRACK'])('%s overrides the metrics opt-in', async (key) => {
    stubEnv(key, '1');
    const client = fixture(true);
    client.counter('started_total', 1);
    await client.flush();
    expect(fetchRequest).not.toHaveBeenCalled();
  });
});
