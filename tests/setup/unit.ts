// Mock ResizeObserver for happy-dom environment
import { vi } from 'vitest';

class MockResizeObserver implements ResizeObserver {
  readonly #callback: ResizeObserverCallback;
  static readonly instances: MockResizeObserver[] = [];
  readonly observedTargets = new Map<Element, ResizeObserverOptions>();

  constructor(callback: ResizeObserverCallback) {
    this.#callback = callback;
    MockResizeObserver.instances.push(this);
  }

  observe(target: Element, options?: ResizeObserverOptions): void {
    this.observedTargets.set(target, options ?? {});
  }

  unobserve(target: Element): void {
    this.observedTargets.delete(target);
  }

  disconnect(): void {
    this.observedTargets.clear();
  }

  // Test helper: trigger a resize callback
  triggerResize(entries: ResizeObserverEntry[]): void {
    this.#callback(entries, this);
  }

  // Test helper: create a mock entry
  static createEntry(target: Element, width: number, height: number): ResizeObserverEntry {
    return {
      target,
      contentRect: new DOMRectReadOnly(0, 0, width, height),
      borderBoxSize: [{ inlineSize: width, blockSize: height }] as unknown as ReadonlyArray<ResizeObserverSize>,
      contentBoxSize: [{ inlineSize: width, blockSize: height }] as unknown as ReadonlyArray<ResizeObserverSize>,
      devicePixelContentBoxSize: [
        { inlineSize: width * (globalThis.devicePixelRatio ?? 1), blockSize: height * (globalThis.devicePixelRatio ?? 1) },
      ] as unknown as ReadonlyArray<ResizeObserverSize>,
    };
  }
}

// Install mock globally
globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

// Make MockResizeObserver available for test assertions
(globalThis as Record<string, unknown>).MockResizeObserver = MockResizeObserver;

// Reset instances between tests
beforeEach(() => {
  MockResizeObserver.instances.length = 0;
});

// Mock requestAnimationFrame for synchronous testing
let rafCallbacks: FrameRequestCallback[] = [];

globalThis.requestAnimationFrame = vi.fn((cb: FrameRequestCallback): number => {
  rafCallbacks.push(cb);
  return rafCallbacks.length;
});

globalThis.cancelAnimationFrame = vi.fn((id: number): void => {
  rafCallbacks = rafCallbacks.filter((_, i) => i + 1 !== id);
});

// Test helper: flush all pending rAF callbacks
(globalThis as Record<string, unknown>).flushRaf = (): void => {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) cb(performance.now());
};

beforeEach(() => {
  rafCallbacks = [];
});
