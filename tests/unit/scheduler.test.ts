import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RafScheduler, createScheduler } from '../../src/scheduler.js';

// Access flushRaf from setup
const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;

describe('RafScheduler', () => {
  let scheduler: RafScheduler;

  beforeEach(() => {
    scheduler = createScheduler();
  });

  it('should create a scheduler instance', () => {
    expect(scheduler).toBeInstanceOf(RafScheduler);
  });

  it('should schedule callbacks for rAF flush', () => {
    const el = document.createElement('div');
    const cb = vi.fn();
    const entry = (globalThis as Record<string, unknown>).MockResizeObserver
      ? (globalThis as Record<string, { createEntry: (t: Element, w: number, h: number) => ResizeObserverEntry }>).MockResizeObserver.createEntry(el, 100, 50)
      : {} as ResizeObserverEntry;

    scheduler.schedule(el, entry, new Set([cb]));
    expect(cb).not.toHaveBeenCalled();

    flushRaf();
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(entry);
  });

  it('should deduplicate entries for the same element (last-write-wins)', () => {
    const el = document.createElement('div');
    const cb = vi.fn();
    const MockRO = (globalThis as Record<string, { createEntry: (t: Element, w: number, h: number) => ResizeObserverEntry }>).MockResizeObserver;
    const entry1 = MockRO.createEntry(el, 100, 50);
    const entry2 = MockRO.createEntry(el, 200, 100);

    scheduler.schedule(el, entry1, new Set([cb]));
    scheduler.schedule(el, entry2, new Set([cb]));

    flushRaf();
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(entry2);
  });

  it('should flush all elements in one rAF', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const MockRO = (globalThis as Record<string, { createEntry: (t: Element, w: number, h: number) => ResizeObserverEntry }>).MockResizeObserver;

    scheduler.schedule(el1, MockRO.createEntry(el1, 100, 50), new Set([cb1]));
    scheduler.schedule(el2, MockRO.createEntry(el2, 200, 100), new Set([cb2]));

    flushRaf();
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it('should cancel pending rAF on cancel()', () => {
    const el = document.createElement('div');
    const cb = vi.fn();
    const MockRO = (globalThis as Record<string, { createEntry: (t: Element, w: number, h: number) => ResizeObserverEntry }>).MockResizeObserver;

    scheduler.schedule(el, MockRO.createEntry(el, 100, 50), new Set([cb]));
    scheduler.cancel();

    flushRaf();
    expect(cb).not.toHaveBeenCalled();
  });

  it('should implement Symbol.dispose', () => {
    expect(typeof scheduler[Symbol.dispose]).toBe('function');
    scheduler[Symbol.dispose]();
  });
});
