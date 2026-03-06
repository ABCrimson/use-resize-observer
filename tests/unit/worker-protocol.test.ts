import { describe, expect, it } from 'vitest';
import {
  allocateSlot,
  DATA_OFFSET,
  DIRTY_REGION_BYTES,
  MAX_ELEMENTS,
  readSlot,
  releaseSlot,
  SAB_SIZE,
  SLOT_BYTES,
  SlotOffset,
  writeSlot,
} from '../../src/worker/protocol.js';

/**
 * Helper: create a mock ResizeObserverEntry for writeSlot tests.
 * Uses explicit `!== undefined` checks per style rules.
 */
const createMockEntry = (
  contentInline: number,
  contentBlock: number,
  borderInline: number,
  borderBlock: number,
): ResizeObserverEntry => {
  const el = document.createElement('div');
  return {
    target: el,
    contentRect: new DOMRectReadOnly(0, 0, contentInline, contentBlock),
    contentBoxSize: [
      { inlineSize: contentInline, blockSize: contentBlock },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
    borderBoxSize: [
      { inlineSize: borderInline, blockSize: borderBlock },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
    devicePixelContentBoxSize: [
      { inlineSize: contentInline, blockSize: contentBlock },
    ] as unknown as ReadonlyArray<ResizeObserverSize>,
  } satisfies ResizeObserverEntry;
};

describe('Worker Protocol — constants', () => {
  it('should have correct SLOT_BYTES value', () => {
    expect(SLOT_BYTES).toBe(8);
  });

  it('should have correct MAX_ELEMENTS value', () => {
    expect(MAX_ELEMENTS).toBe(256);
  });

  it('should compute DIRTY_REGION_BYTES as MAX_ELEMENTS * 4', () => {
    expect(DIRTY_REGION_BYTES).toBe(MAX_ELEMENTS * 4);
    expect(DIRTY_REGION_BYTES).toBe(1024);
  });

  it('should set DATA_OFFSET equal to DIRTY_REGION_BYTES', () => {
    expect(DATA_OFFSET).toBe(DIRTY_REGION_BYTES);
    expect(DATA_OFFSET).toBe(1024);
  });

  it('should compute SAB_SIZE as DATA_OFFSET + SLOT_BYTES * MAX_ELEMENTS', () => {
    expect(SAB_SIZE).toBe(DATA_OFFSET + SLOT_BYTES * MAX_ELEMENTS);
    expect(SAB_SIZE).toBe(3072);
  });

  it('should define SlotOffset with correct values', () => {
    expect(SlotOffset.InlineSize).toBe(0);
    expect(SlotOffset.BlockSize).toBe(1);
    expect(SlotOffset.BorderInline).toBe(2);
    expect(SlotOffset.BorderBlock).toBe(3);
  });
});

describe('Worker Protocol — dirty flag and data region separation', () => {
  it('should not have dirty flag region overlap with data region', () => {
    // Dirty flags occupy bytes 0..(DIRTY_REGION_BYTES - 1) = 0..1023
    // Data region occupies bytes DATA_OFFSET..(SAB_SIZE - 1) = 1024..3071
    expect(DATA_OFFSET).toBeGreaterThanOrEqual(DIRTY_REGION_BYTES);
  });

  it('should have Int32 dirty flags fitting exactly in the dirty region', () => {
    // Each Int32 = 4 bytes, MAX_ELEMENTS flags = MAX_ELEMENTS * 4 bytes
    const dirtyFlagBytes = MAX_ELEMENTS * 4;
    expect(dirtyFlagBytes).toBe(DIRTY_REGION_BYTES);
    expect(dirtyFlagBytes).toBeLessThanOrEqual(DATA_OFFSET);
  });

  it('should have Float16 data fitting exactly in the data region', () => {
    // Each slot = SLOT_BYTES (8 bytes = 4 x Float16 @ 2 bytes each)
    // MAX_ELEMENTS slots = MAX_ELEMENTS * SLOT_BYTES = 256 * 8 = 2048
    const dataBytes = MAX_ELEMENTS * SLOT_BYTES;
    expect(dataBytes).toBe(2048);
    expect(DATA_OFFSET + dataBytes).toBe(SAB_SIZE);
  });

  it('should allow simultaneous Int32Array and Float16Array views without collision', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);

    // Int32 view covers bytes 0..1023 (256 int32 elements)
    const int32 = new Int32Array(sab, 0, MAX_ELEMENTS);
    expect(int32.byteOffset).toBe(0);
    expect(int32.byteLength).toBe(DIRTY_REGION_BYTES);

    // Float16 view for slot 0 starts at DATA_OFFSET = 1024
    const float16Slot0 = new Float16Array(sab, DATA_OFFSET, 4);
    expect(float16Slot0.byteOffset).toBe(DATA_OFFSET);

    // Float16 view for last slot
    const lastSlotOffset = DATA_OFFSET + (MAX_ELEMENTS - 1) * SLOT_BYTES;
    const float16Last = new Float16Array(sab, lastSlotOffset, 4);
    expect(float16Last.byteOffset).toBe(lastSlotOffset);
    expect(float16Last.byteOffset + float16Last.byteLength).toBe(SAB_SIZE);

    // Verify no overlap: Int32 ends at 1024, Float16 starts at 1024
    expect(int32.byteOffset + int32.byteLength).toBeLessThanOrEqual(float16Slot0.byteOffset);
  });
});

describe('Worker Protocol — writeSlot and readSlot', () => {
  it('should write and read back content-box and border-box dimensions', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);
    const entry = createMockEntry(320, 240, 340, 260);

    writeSlot(sab, 0, entry);
    const result = readSlot(sab, 0);

    // Float16 has limited precision but exact for small integers
    expect(result.width).toBe(320);
    expect(result.height).toBe(240);
    expect(result.borderWidth).toBe(340);
    expect(result.borderHeight).toBe(260);
  });

  it('should set dirty flag on write and clear it on read', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);
    const int32 = new Int32Array(sab);
    const slotId = 5;

    // Initially clean
    expect(Atomics.load(int32, slotId)).toBe(0);

    // Write sets dirty flag
    const entry = createMockEntry(100, 50, 110, 60);
    writeSlot(sab, slotId, entry);
    expect(Atomics.load(int32, slotId)).toBe(1);

    // Read clears dirty flag
    readSlot(sab, slotId);
    expect(Atomics.load(int32, slotId)).toBe(0);
  });

  it('should write to correct byte offset for different slot IDs', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);

    const entry0 = createMockEntry(100, 200, 110, 210);
    const entry1 = createMockEntry(300, 400, 310, 410);
    const entry255 = createMockEntry(500, 600, 510, 610);

    writeSlot(sab, 0, entry0);
    writeSlot(sab, 1, entry1);
    writeSlot(sab, 255, entry255);

    // Read back each slot independently
    const r0 = readSlot(sab, 0);
    expect(r0.width).toBe(100);
    expect(r0.height).toBe(200);
    expect(r0.borderWidth).toBe(110);
    expect(r0.borderHeight).toBe(210);

    const r1 = readSlot(sab, 1);
    expect(r1.width).toBe(300);
    expect(r1.height).toBe(400);
    expect(r1.borderWidth).toBe(310);
    expect(r1.borderHeight).toBe(410);

    const r255 = readSlot(sab, 255);
    expect(r255.width).toBe(500);
    expect(r255.height).toBe(600);
    expect(r255.borderWidth).toBe(510);
    expect(r255.borderHeight).toBe(610);
  });

  it('should not corrupt adjacent slots on write', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);

    // Write to slot 10
    writeSlot(sab, 10, createMockEntry(111, 222, 333, 444));

    // Read adjacent slots — they should be zeroed
    const r9 = readSlot(sab, 9);
    expect(r9.width).toBe(0);
    expect(r9.height).toBe(0);
    expect(r9.borderWidth).toBe(0);
    expect(r9.borderHeight).toBe(0);

    const r11 = readSlot(sab, 11);
    expect(r11.width).toBe(0);
    expect(r11.height).toBe(0);
    expect(r11.borderWidth).toBe(0);
    expect(r11.borderHeight).toBe(0);

    // Slot 10 should have data
    const r10 = readSlot(sab, 10);
    expect(r10.width).toBe(111);
    expect(r10.height).toBe(222);
  });

  it('should handle zero dimensions', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);
    writeSlot(sab, 0, createMockEntry(0, 0, 0, 0));

    const result = readSlot(sab, 0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
    expect(result.borderWidth).toBe(0);
    expect(result.borderHeight).toBe(0);
  });

  it('should handle entries with missing contentBoxSize gracefully', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);
    const el = document.createElement('div');
    const entry = {
      target: el,
      contentRect: new DOMRectReadOnly(0, 0, 0, 0),
      contentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      borderBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
      devicePixelContentBoxSize: [] as unknown as ReadonlyArray<ResizeObserverSize>,
    } satisfies ResizeObserverEntry;

    writeSlot(sab, 0, entry);
    const result = readSlot(sab, 0);
    expect(result.width).toBe(0);
    expect(result.height).toBe(0);
    expect(result.borderWidth).toBe(0);
    expect(result.borderHeight).toBe(0);
  });

  it('should overwrite previous slot data on re-write', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);

    writeSlot(sab, 3, createMockEntry(100, 200, 300, 400));
    readSlot(sab, 3); // clear dirty

    writeSlot(sab, 3, createMockEntry(500, 600, 700, 800));
    const result = readSlot(sab, 3);
    expect(result.width).toBe(500);
    expect(result.height).toBe(600);
    expect(result.borderWidth).toBe(700);
    expect(result.borderHeight).toBe(800);
  });
});

describe('Worker Protocol — allocateSlot and releaseSlot', () => {
  it('should allocate slot 0 from a fresh bitmap', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);
    const slot = allocateSlot(bitmap);
    expect(slot).toBe(0);
    expect(bitmap[0]).toBe(1);
  });

  it('should allocate sequential slots', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);

    const s0 = allocateSlot(bitmap);
    const s1 = allocateSlot(bitmap);
    const s2 = allocateSlot(bitmap);

    expect(s0).toBe(0);
    expect(s1).toBe(1);
    expect(s2).toBe(2);
  });

  it('should return -1 when all slots are allocated', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);
    bitmap.fill(1); // All slots taken

    const slot = allocateSlot(bitmap);
    expect(slot).toBe(-1);
  });

  it('should reuse released slots', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);

    const s0 = allocateSlot(bitmap);
    const s1 = allocateSlot(bitmap);
    expect(s0).toBe(0);
    expect(s1).toBe(1);

    // Release slot 0
    releaseSlot(bitmap, s0);
    expect(bitmap[0]).toBe(0);

    // Next allocation should reuse slot 0
    const s2 = allocateSlot(bitmap);
    expect(s2).toBe(0);
  });

  it('should handle full lifecycle: allocate, release, re-allocate', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);

    // Allocate all slots
    const slots: number[] = [];
    for (let i = 0; i < MAX_ELEMENTS; i++) {
      const s = allocateSlot(bitmap);
      expect(s).toBe(i);
      slots.push(s);
    }

    // No more slots available
    expect(allocateSlot(bitmap)).toBe(-1);

    // Release a slot in the middle
    const midSlot = 128;
    releaseSlot(bitmap, midSlot);
    expect(bitmap[midSlot]).toBe(0);

    // Allocate again — should get the released slot
    const reused = allocateSlot(bitmap);
    expect(reused).toBe(midSlot);

    // No more slots again
    expect(allocateSlot(bitmap)).toBe(-1);
  });

  it('should ignore releaseSlot for out-of-range negative slot IDs', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);
    allocateSlot(bitmap);
    // Should not throw or corrupt
    releaseSlot(bitmap, -1);
    expect(bitmap[0]).toBe(1);
  });

  it('should ignore releaseSlot for out-of-range slot IDs >= MAX_ELEMENTS', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);
    allocateSlot(bitmap);
    // Should not throw or corrupt
    releaseSlot(bitmap, MAX_ELEMENTS);
    releaseSlot(bitmap, MAX_ELEMENTS + 100);
    expect(bitmap[0]).toBe(1);
  });

  it('should handle allocate-release-allocate for multiple slots', () => {
    const bitmap = new Int32Array(MAX_ELEMENTS);

    const a = allocateSlot(bitmap);
    const b = allocateSlot(bitmap);
    const c = allocateSlot(bitmap);

    expect(a).toBe(0);
    expect(b).toBe(1);
    expect(c).toBe(2);

    // Release middle slot
    releaseSlot(bitmap, b);

    // Next allocate fills the gap
    const d = allocateSlot(bitmap);
    expect(d).toBe(1);

    // Next allocate continues from the end
    const e = allocateSlot(bitmap);
    expect(e).toBe(3);
  });
});

describe('Worker Protocol — writeSlot + readSlot with allocateSlot lifecycle', () => {
  it('should write to an allocated slot and read back correctly', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);
    const bitmap = new Int32Array(MAX_ELEMENTS);

    const slotId = allocateSlot(bitmap);
    expect(slotId).not.toBe(-1);

    const entry = createMockEntry(1024, 768, 1040, 780);
    writeSlot(sab, slotId, entry);

    const result = readSlot(sab, slotId);
    expect(result.width).toBe(1024);
    expect(result.height).toBe(768);
    expect(result.borderWidth).toBe(1040);
    expect(result.borderHeight).toBe(780);

    releaseSlot(bitmap, slotId);
    expect(bitmap[slotId]).toBe(0);
  });

  it('should isolate data between independently allocated slots', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);
    const bitmap = new Int32Array(MAX_ELEMENTS);

    const s1 = allocateSlot(bitmap);
    const s2 = allocateSlot(bitmap);
    expect(s1).not.toBe(s2);

    writeSlot(sab, s1, createMockEntry(100, 200, 110, 220));
    writeSlot(sab, s2, createMockEntry(300, 400, 330, 440));

    const r1 = readSlot(sab, s1);
    const r2 = readSlot(sab, s2);

    expect(r1.width).toBe(100);
    expect(r1.height).toBe(200);
    expect(r2.width).toBe(300);
    expect(r2.height).toBe(400);

    releaseSlot(bitmap, s1);
    releaseSlot(bitmap, s2);
  });

  it('should correctly use dirty flags across the full lifecycle', () => {
    const sab = new SharedArrayBuffer(SAB_SIZE);
    const bitmap = new Int32Array(MAX_ELEMENTS);
    const int32 = new Int32Array(sab);

    const slotId = allocateSlot(bitmap);
    expect(slotId).not.toBe(-1);

    // Initially clean
    expect(Atomics.load(int32, slotId)).toBe(0);

    // Write makes it dirty
    writeSlot(sab, slotId, createMockEntry(50, 50, 60, 60));
    expect(Atomics.load(int32, slotId)).toBe(1);

    // Read clears dirty
    readSlot(sab, slotId);
    expect(Atomics.load(int32, slotId)).toBe(0);

    // Write again
    writeSlot(sab, slotId, createMockEntry(75, 75, 85, 85));
    expect(Atomics.load(int32, slotId)).toBe(1);

    // Release
    releaseSlot(bitmap, slotId);
    expect(bitmap[slotId]).toBe(0);
  });
});
