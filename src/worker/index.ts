'use client';

export { useResizeObserverWorker } from './hook.js';
export type { UseResizeObserverWorkerOptions } from './hook.js';
export { readSlot, writeSlot, SAB_SIZE, MAX_ELEMENTS, SLOT_BYTES } from './protocol.js';
export type { WorkerMessage, SlotOffsetKey } from './protocol.js';
