import { describe, expect, it } from 'vitest';

describe('Smoke tests', () => {
  it('should import main entry without errors', async () => {
    const mod = await import('../../src/index.js');
    expect(mod.useResizeObserver).toBeDefined();
    expect(mod.useResizeObserverEntries).toBeDefined();
    expect(mod.createResizeObserver).toBeDefined();
    expect(mod.ResizeObserverContext).toBeDefined();
  });

  it('should import server entry without errors', async () => {
    const mod = await import('../../src/server.js');
    expect(mod.createServerResizeObserverMock).toBeDefined();
    expect(mod.isResizeObserverSupported).toBeDefined();
  });

  it('should import core entry without errors', async () => {
    const mod = await import('../../src/core.js');
    expect(mod.createResizeObservable).toBeDefined();
    expect(mod.ResizeEvent).toBeDefined();
  });

  it('should import worker entry without errors', async () => {
    const mod = await import('../../src/worker/index.js');
    expect(mod.useResizeObserverWorker).toBeDefined();
    expect(mod.SAB_SIZE).toBeDefined();
    expect(mod.MAX_ELEMENTS).toBe(256);
  });
});
