'use client';

export { ResizeObserverContext } from './context.js';
export { createResizeObserver } from './factory.js';
// Types (tree-shakeable — type-only re-exports)
export type { UseResizeObserverOptions, UseResizeObserverResult } from './hook.js';
// Primary hook
export { useResizeObserver } from './hook.js';
export type { ResizeEntry, UseResizeObserverEntriesOptions } from './hook-multi.js';
export { useResizeObserverEntries } from './hook-multi.js';
export type {
  CreateResizeObserverOptions,
  ResizeCallback,
  ResizeObserverBoxOptions,
  ResizeObserverFactory,
} from './types.js';
