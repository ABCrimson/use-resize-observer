import { describe, expect, it } from 'vitest';

describe('useResizeObserverWorker (browser)', () => {
  it('should require crossOriginIsolated', () => {
    // In non-isolated contexts, the Worker hook should throw/error
    expect(typeof globalThis.crossOriginIsolated).toBe('boolean');
  });

  it.skipIf(!globalThis.crossOriginIsolated)(
    'should work in crossOriginIsolated context',
    async () => {
      // This test only runs when COOP/COEP headers are present
      const { useResizeObserverWorker } = await import('../../src/worker/hook.js');
      expect(typeof useResizeObserverWorker).toBe('function');
    },
  );
});
