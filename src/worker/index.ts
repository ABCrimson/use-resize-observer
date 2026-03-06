'use client';

export type { UseResizeObserverWorkerOptions } from './hook.js';
export { useResizeObserverWorker } from './hook.js';
export type { SlotOffsetKey, WorkerMessage } from './protocol.js';
export {
  DATA_OFFSET,
  DIRTY_REGION_BYTES,
  MAX_ELEMENTS,
  readSlot,
  SAB_SIZE,
  SLOT_BYTES,
  writeSlot,
} from './protocol.js';
