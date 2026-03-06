import { describe, expect, it, vi } from 'vitest';
import { createScheduler, RafScheduler } from '../../src/scheduler.js';

const flushRaf = (globalThis as Record<string, unknown>).flushRaf as () => void;
const MockRO = (globalThis as Record<string, unknown>).MockResizeObserver as {
  createEntry: (target: Element, width: number, height: number) => ResizeObserverEntry;
};

describe('RafScheduler', () => {
  it('should create a scheduler instance', () => {
    using scheduler = createScheduler();
    expect(scheduler).toBeInstanceOf(RafScheduler);
  });

  it('should schedule callbacks for rAF flush', () => {
    using scheduler = createScheduler();
    const el = document.createElement('div');
    const cb = vi.fn();
    const entry = MockRO.createEntry(el, 100, 50);

    scheduler.schedule(el, entry, new Set([cb]));
    expect(cb).not.toHaveBeenCalled();

    flushRaf();
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(entry);
  });

  it('should deduplicate entries for the same element (last-write-wins)', () => {
    using scheduler = createScheduler();
    const el = document.createElement('div');
    const cb = vi.fn();
    const entry1 = MockRO.createEntry(el, 100, 50);
    const entry2 = MockRO.createEntry(el, 200, 100);

    scheduler.schedule(el, entry1, new Set([cb]));
    scheduler.schedule(el, entry2, new Set([cb]));

    flushRaf();
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith(entry2);
  });

  it('should flush all elements in one rAF', () => {
    using scheduler = createScheduler();
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    const cb1 = vi.fn();
    const cb2 = vi.fn();

    scheduler.schedule(el1, MockRO.createEntry(el1, 100, 50), new Set([cb1]));
    scheduler.schedule(el2, MockRO.createEntry(el2, 200, 100), new Set([cb2]));

    flushRaf();
    expect(cb1).toHaveBeenCalledOnce();
    expect(cb2).toHaveBeenCalledOnce();
  });

  it('should cancel pending rAF on cancel()', () => {
    using scheduler = createScheduler();
    const el = document.createElement('div');
    const cb = vi.fn();

    scheduler.schedule(el, MockRO.createEntry(el, 100, 50), new Set([cb]));
    scheduler.cancel();

    flushRaf();
    expect(cb).not.toHaveBeenCalled();
  });

  it('should implement Symbol.dispose and cancel pending work', () => {
    const scheduler = createScheduler();
    const el = document.createElement('div');
    const cb = vi.fn();

    expect(typeof scheduler[Symbol.dispose]).toBe('function');
    scheduler.schedule(el, MockRO.createEntry(el, 100, 50), new Set([cb]));
    scheduler[Symbol.dispose]();

    flushRaf();
    expect(cb).not.toHaveBeenCalled();
  });

  it('should support ES2026 using declaration pattern', () => {
    const el = document.createElement('div');
    const cb = vi.fn();

    {
      using scheduler = createScheduler();
      scheduler.schedule(el, MockRO.createEntry(el, 50, 25), new Set([cb]));
    }

    flushRaf();
    expect(cb).not.toHaveBeenCalled();
  });
});
