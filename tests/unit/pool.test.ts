import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSharedPool, ObserverPool } from '../../src/pool.js';

describe('ObserverPool', () => {
  let pool: ObserverPool;

  beforeEach(() => {
    pool = new ObserverPool();
  });

  it('should initialize with zero observed count', () => {
    expect(pool.observedCount).toBe(0);
  });

  it('should observe an element and increment count', () => {
    const el = document.createElement('div');
    const cb = vi.fn();
    pool.observe(el, {}, cb);
    expect(pool.observedCount).toBe(1);
  });

  it('should allow multiple callbacks per element', () => {
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    pool.observe(el, {}, cb1);
    pool.observe(el, {}, cb2);
    expect(pool.observedCount).toBe(1); // Same element, still 1
  });

  it('should unobserve and decrement count when last callback removed', () => {
    const el = document.createElement('div');
    const cb = vi.fn();
    pool.observe(el, {}, cb);
    pool.unobserve(el, cb);
    expect(pool.observedCount).toBe(0);
  });

  it('should not decrement below zero on double unobserve', () => {
    const el = document.createElement('div');
    const cb = vi.fn();
    pool.observe(el, {}, cb);
    pool.unobserve(el, cb);
    pool.unobserve(el, cb);
    expect(pool.observedCount).toBe(0);
  });

  it('should keep element observed while callbacks remain', () => {
    const el = document.createElement('div');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    pool.observe(el, {}, cb1);
    pool.observe(el, {}, cb2);
    pool.unobserve(el, cb1);
    expect(pool.observedCount).toBe(1);
  });

  it('should track multiple elements independently', () => {
    const el1 = document.createElement('div');
    const el2 = document.createElement('span');
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    pool.observe(el1, {}, cb1);
    pool.observe(el2, {}, cb2);
    expect(pool.observedCount).toBe(2);
    pool.unobserve(el1, cb1);
    expect(pool.observedCount).toBe(1);
  });

  it('should implement Symbol.dispose and reset count', () => {
    const el = document.createElement('div');
    pool.observe(el, {}, vi.fn());
    pool[Symbol.dispose]();
    // After dispose, pool is disconnected and count is reset
    expect(pool.observedCount).toBe(0);
  });

  it('should support ES2026 using declaration pattern', () => {
    using disposablePool = new ObserverPool();
    const el = document.createElement('div');
    disposablePool.observe(el, {}, vi.fn());
    expect(disposablePool.observedCount).toBe(1);
    // Pool is disposed when block exits
  });
});

describe('getSharedPool', () => {
  it('should return same pool for same document', () => {
    const pool1 = getSharedPool(document);
    const pool2 = getSharedPool(document);
    expect(pool1).toBe(pool2);
  });

  it('should return different pools for different roots', () => {
    const shadow = document.createElement('div').attachShadow({ mode: 'open' });
    const pool1 = getSharedPool(document);
    const pool2 = getSharedPool(shadow);
    expect(pool1).not.toBe(pool2);
  });
});
