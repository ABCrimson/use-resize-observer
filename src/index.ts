'use client';

// Primary hook
export { useResizeObserver } from './hook.js';
export { useResizeObserverEntries } from './hook-multi.js';
export { createResizeObserver } from './factory.js';
export { ResizeObserverContext } from './context.js';

// Types only (tree-shakeable)
export type { UseResizeObserverOptions, UseResizeObserverResult } from './hook.js';
export type { ResizeObserverBoxOptions } from './types.js';
export type { ResizeObserverFactory, ResizeCallback, CreateResizeObserverOptions } from './types.js';
export type { ResizeEntry, UseResizeObserverEntriesOptions } from './hook-multi.js';
