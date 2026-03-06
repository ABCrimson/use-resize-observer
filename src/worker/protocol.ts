/**
 * SharedArrayBuffer protocol for resize observations with cross-thread sharing.
 *
 * Memory layout (3072 bytes total):
 * - Bytes 0–1023: Int32 dirty flags (256 × 4B), one per slot
 * - Bytes 1024–3071: Float16 data (256 × 8B), 4 values per slot
 *
 * The dirty flag region and data region are fully separated to prevent
 * Int32Array/Float16Array view collisions.
 *
 * @internal
 */

/** Bytes per observation slot: 4 x Float16 (2 bytes each) = 8 bytes. */
export const SLOT_BYTES = 8 as const;

/** Maximum number of simultaneously observable elements. */
export const MAX_ELEMENTS = 256 as const;

/** Bytes reserved for Int32 dirty flags: MAX_ELEMENTS × 4 bytes. */
export const DIRTY_REGION_BYTES = 1024;

/** Byte offset where Float16 data slots begin (after dirty flag region). */
export const DATA_OFFSET: number = DIRTY_REGION_BYTES;

/**
 * Total SharedArrayBuffer size in bytes.
 * Layout: [dirty flags: 1024B] [float data: 2048B] = 3072B
 */
export const SAB_SIZE = 3072;

/** Offsets within a single Float16Array slot. */
export const SlotOffset: {
  readonly InlineSize: 0;
  readonly BlockSize: 1;
  readonly BorderInline: 2;
  readonly BorderBlock: 3;
} = {
  InlineSize: 0,
  BlockSize: 1,
  BorderInline: 2,
  BorderBlock: 3,
} as const satisfies Record<string, number>;

export type SlotOffsetKey = keyof typeof SlotOffset;

/** Discriminated union of all Worker protocol messages. */
export type WorkerMessage =
  | { readonly op: 'init'; readonly sab: SharedArrayBuffer }
  | { readonly op: 'observe'; readonly slotId: number }
  | { readonly op: 'unobserve'; readonly slotId: number }
  | { readonly op: 'terminate' }
  | { readonly op: 'ready' }
  | { readonly op: 'error'; readonly message: string };

/**
 * Write resize measurements into a SharedArrayBuffer slot.
 * Uses `Float16Array` (ES2026) for compact 2-byte storage and
 * `Atomics.notify()` for cross-thread signaling.
 *
 * Direct indexed writes avoid intermediate object allocation.
 *
 * @internal
 */
export const writeSlot = (
  sab: SharedArrayBuffer,
  slotId: number,
  entry: ResizeObserverEntry,
): void => {
  const view = new Float16Array(sab, DATA_OFFSET + slotId * SLOT_BYTES, 4);
  const cs = entry.contentBoxSize[0];
  const bs = entry.borderBoxSize[0];

  view[0] = cs?.inlineSize ?? 0;
  view[1] = cs?.blockSize ?? 0;
  view[2] = bs?.inlineSize ?? 0;
  view[3] = bs?.blockSize ?? 0;

  // Signal main thread with Atomics for guaranteed cross-thread visibility
  const int32 = new Int32Array(sab);
  Atomics.store(int32, slotId, 1);
  Atomics.notify(int32, slotId, 1);
};

/**
 * Read resize measurements from a SharedArrayBuffer slot.
 * Returns a frozen object for immutability guarantees.
 *
 * @internal
 */
export const readSlot = (
  sab: SharedArrayBuffer,
  slotId: number,
): {
  readonly width: number;
  readonly height: number;
  readonly borderWidth: number;
  readonly borderHeight: number;
} => {
  const view = new Float16Array(sab, DATA_OFFSET + slotId * SLOT_BYTES, 4);

  // Clear the dirty flag after reading
  Atomics.store(new Int32Array(sab), slotId, 0);

  return {
    width: view[0] ?? 0,
    height: view[1] ?? 0,
    borderWidth: view[2] ?? 0,
    borderHeight: view[3] ?? 0,
  };
};

/**
 * Allocate a slot from the bitmap tracker.
 * Uses `Int32Array.prototype.indexOf()` for V8-native optimized scan.
 *
 * @internal
 */
export const allocateSlot = (bitmap: Int32Array): number => {
  const i = bitmap.indexOf(0);
  if (i !== -1) bitmap[i] = 1;
  return i;
};

/**
 * Release a slot back to the bitmap tracker.
 *
 * @internal
 */
export const releaseSlot = (bitmap: Int32Array, slotId: number): void => {
  if (slotId >= 0 && slotId < MAX_ELEMENTS) {
    bitmap[slotId] = 0;
  }
};
