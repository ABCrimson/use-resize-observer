import { describe, expect, it } from 'vitest';
import { extractBoxSize, extractDimensions } from '../../src/extract.js';

const MockResizeObserver = (globalThis as Record<string, unknown>).MockResizeObserver as {
  createEntry: (target: Element, width: number, height: number) => ResizeObserverEntry;
};

describe('extractBoxSize', () => {
  const el = document.createElement('div');
  const entry = MockResizeObserver.createEntry(el, 320, 240);

  it('should extract content-box size', () => {
    const size = extractBoxSize(entry, 'content-box' as const);
    expect(size !== undefined).toBe(true);
    expect(size!.inlineSize).toBe(320);
    expect(size!.blockSize).toBe(240);
  });

  it('should extract border-box size', () => {
    const size = extractBoxSize(entry, 'border-box' as const);
    expect(size !== undefined).toBe(true);
    expect(size!.inlineSize).toBe(320);
    expect(size!.blockSize).toBe(240);
  });

  it('should extract device-pixel-content-box size', () => {
    const size = extractBoxSize(entry, 'device-pixel-content-box' as const);
    expect(size !== undefined).toBe(true);
    const dpr = globalThis.devicePixelRatio !== undefined ? globalThis.devicePixelRatio : 1;
    expect(size!.inlineSize).toBe(320 * dpr);
    expect(size!.blockSize).toBe(240 * dpr);
  });

  it('should fallback to contentBoxSize when devicePixelContentBoxSize is missing', () => {
    const entryNoDevice = {
      ...entry,
      devicePixelContentBoxSize: undefined as unknown as ReadonlyArray<ResizeObserverSize>,
    } satisfies ResizeObserverEntry;
    const size = extractBoxSize(entryNoDevice, 'device-pixel-content-box' as const);
    expect(size !== undefined).toBe(true);
    expect(size!.inlineSize).toBe(320);
  });
});

describe('extractDimensions', () => {
  const el = document.createElement('div');

  it('should return width and height for content-box', () => {
    const entry = MockResizeObserver.createEntry(el, 800, 600);
    const { width, height } = extractDimensions(entry, 'content-box' as const);
    expect(width).toBe(800);
    expect(height).toBe(600);
  });

  it('should return width and height for border-box', () => {
    const entry = MockResizeObserver.createEntry(el, 1024, 768);
    const { width, height } = extractDimensions(entry, 'border-box' as const);
    expect(width).toBe(1024);
    expect(height).toBe(768);
  });

  it('should return 0 for missing size entries', () => {
    const emptyEntry = {
      target: el,
      contentRect: new DOMRectReadOnly(0, 0, 0, 0),
      borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    } satisfies ResizeObserverEntry;
    const { width, height } = extractDimensions(emptyEntry, 'content-box' as const);
    expect(width).toBe(0);
    expect(height).toBe(0);
  });
});
