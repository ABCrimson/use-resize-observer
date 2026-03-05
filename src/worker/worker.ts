/**
 * Worker thread script for off-main-thread ResizeObserver measurements.
 *
 * Protocol:
 * 1. Main thread sends 'init' with SharedArrayBuffer
 * 2. Worker creates ResizeObserver, writes to SAB on each observation
 * 3. Main thread reads SAB via rAF loop (non-blocking)
 * 4. Synchronization via Atomics.notify/waitAsync
 *
 * @internal
 */

import type { WorkerMessage } from './protocol.js';
import { writeSlot } from './protocol.js';

/** SharedArrayBuffer provided by the main thread. */
let sab: SharedArrayBuffer | null = null;

/** Map of slotId -> observer instance for cleanup. */
const observers = new Map<number, ResizeObserver>();

/**
 * Handle messages from the main thread.
 * Uses `Error.isError()` (ES2026) for robust error discrimination in catch blocks.
 */
const handleMessage = (event: MessageEvent<WorkerMessage>): void => {
  const { data } = event;

  switch (data.op) {
    case 'init': {
      sab = data.sab;
      self.postMessage({ op: 'ready' } satisfies WorkerMessage);
      break;
    }

    case 'observe': {
      if (!sab) {
        self.postMessage({
          op: 'error',
          message: 'SAB not initialized. Send "init" first.',
        } satisfies WorkerMessage);
        return;
      }

      const { slotId } = data;
      const localSab = sab;

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          writeSlot(localSab, slotId, entry);
        }
      });

      observers.set(slotId, observer);
      break;
    }

    case 'unobserve': {
      const observer = observers.get(data.slotId);
      if (observer) {
        observer.disconnect();
        observers.delete(data.slotId);
      }
      break;
    }

    case 'terminate': {
      for (const observer of observers.values()) {
        observer.disconnect();
      }
      observers.clear();
      self.close();
      break;
    }
  }
};

self.addEventListener('message', handleMessage);

// Signal readiness
self.postMessage({ op: 'ready' } satisfies WorkerMessage);
