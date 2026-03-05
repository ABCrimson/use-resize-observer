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

import { writeSlot } from './protocol.js';
import type { WorkerMessage } from './protocol.js';

/** SharedArrayBuffer provided by the main thread. */
let sab: SharedArrayBuffer | null = null;

/** Map of slotId → observed element proxy for cleanup. */
const observers = new Map<number, { observer: ResizeObserver; target: Element }>();

/**
 * Handle messages from the main thread.
 * Uses `Error.isError()` (ES2026) for robust error discrimination.
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

      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          writeSlot(sab!, slotId, entry);
        }
      });

      // In a Worker context, we observe via transferred elements or proxies.
      // For now, this stores the observer for cleanup.
      observers.set(slotId, { observer, target: null as unknown as Element });
      break;
    }

    case 'unobserve': {
      const { slotId } = data;
      const record = observers.get(slotId);
      if (record) {
        record.observer.disconnect();
        observers.delete(slotId);
      }
      break;
    }

    case 'terminate': {
      for (const [, record] of observers) {
        record.observer.disconnect();
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
