/**
 * SharedArrayBuffer protocol for Worker-based resize observations.
 *
 * Layout:
 * - 4 Float16 values per element slot (8 bytes each)
 * - Int32Array for Atomics.notify/waitAsync synchronization
 * - Supports up to 256 simultaneous element observations
 *
 * @internal
 */

/** Bytes per observation slot: 4 × Float16 (2 bytes each) = 8 bytes. */
export const SLOT_BYTES = 8;

/** Maximum number of simultaneously observable elements. */
export const MAX_ELEMENTS = 256;

/** Total SharedArrayBuffer size in bytes. */
export const SAB_SIZE = SLOT_BYTES * MAX_ELEMENTS;

/** Offsets within a single Float16Array slot. */
export const SlotOffset = {
  InlineSize: 0,
  BlockSize: 1,
  BorderInline: 2,
  BorderBlock: 3,
} as const;

export type SlotOffsetKey = keyof typeof SlotOffset;

/** Discriminated union of all Worker protocol messages. */
export type WorkerMessage =
  | { readonly op: 'init'; readonly sab: SharedArrayBuffer }
  | { readonly op: 'observe'; readonly slotId: number; readonly elementId: string }
  | { readonly op: 'unobserve'; readonly slotId: number }
  | { readonly op: 'terminate' }
  | { readonly op: 'ready' }
  | { readonly op: 'error'; readonly message: string };

/**
 * Write resize measurements into a SharedArrayBuffer slot.
 * Uses `Float16Array` (ES2026) for compact storage and
 * `Atomics.notify()` for cross-thread signaling.
 *
 * @param sab - SharedArrayBuffer backing the measurement protocol.
 * @param slotId - Zero-based slot index for this element.
 * @param entry - ResizeObserverEntry from the Worker's observer.
 */
export const writeSlot = (
  sab: SharedArrayBuffer,
  slotId: number,
  entry: ResizeObserverEntry,
): void => {
  const view = new Float16Array(sab, slotId * SLOT_BYTES, 4);
  const [cs] = entry.contentBoxSize;
  const [bs] = entry.borderBoxSize;
  view[SlotOffset.InlineSize] = cs?.inlineSize ?? 0;
  view[SlotOffset.BlockSize] = cs?.blockSize ?? 0;
  view[SlotOffset.BorderInline] = bs?.inlineSize ?? 0;
  view[SlotOffset.BorderBlock] = bs?.blockSize ?? 0;
  Atomics.notify(new Int32Array(sab), slotId, 1);
};

/**
 * Read resize measurements from a SharedArrayBuffer slot.
 *
 * @param sab - SharedArrayBuffer backing the measurement protocol.
 * @param slotId - Zero-based slot index for this element.
 * @returns Measurement object with width, height, and border dimensions.
 */
export const readSlot = (
  sab: SharedArrayBuffer,
  slotId: number,
): {
  width: number;
  height: number;
  borderWidth: number;
  borderHeight: number;
} => {
  const view = new Float16Array(sab, slotId * SLOT_BYTES, 4);
  return {
    width: view[SlotOffset.InlineSize]!,
    height: view[SlotOffset.BlockSize]!,
    borderWidth: view[SlotOffset.BorderInline]!,
    borderHeight: view[SlotOffset.BorderBlock]!,
  };
};

/**
 * Allocate a slot from the bitmap tracker.
 * Uses a simple Int32Array bitmap for O(1) slot management.
 *
 * @param bitmap - Int32Array tracking allocated slots (1 = in use).
 * @returns The allocated slot index, or -1 if all slots are in use.
 */
export const allocateSlot = (bitmap: Int32Array): number => {
  for (let i = 0; i < MAX_ELEMENTS; i++) {
    if (bitmap[i] === 0) {
      bitmap[i] = 1;
      return i;
    }
  }
  return -1;
};

/**
 * Release a slot back to the bitmap tracker.
 *
 * @param bitmap - Int32Array tracking allocated slots.
 * @param slotId - The slot index to release.
 */
export const releaseSlot = (bitmap: Int32Array, slotId: number): void => {
  bitmap[slotId] = 0;
};
