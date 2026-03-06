# Architecture

This page explains how `@crimson_dev/use-resize-observer` achieves single-observer pooling, rAF batching, and startTransition integration. Understanding this architecture helps you make informed decisions about performance tuning.

## High-Level Overview

```mermaid
flowchart TB
    subgraph Components["React Components"]
        A["Component A\nuseResizeObserver()"]
        B["Component B\nuseResizeObserver()"]
        C["Component C\nuseResizeObserver()"]
    end

    subgraph Pool["Shared Observer Pool"]
        RO["Single ResizeObserver"]
        MAP["WeakMap<Element, Set<Callback>>"]
    end

    subgraph Scheduler["rAF Scheduler"]
        RAF["requestAnimationFrame"]
        ST["startTransition"]
        BATCH["Batched setState"]
    end

    A --> |observe| RO
    B --> |observe| RO
    C --> |observe| RO
    RO --> |entries| RAF
    RAF --> ST
    ST --> BATCH
    BATCH --> |single render| Components
```

## The Shared Observer Pool

Instead of creating one `ResizeObserver` per hook instance, all hook instances share a single observer through a module-level pool. This is the key architectural decision that enables scaling to hundreds of observed elements.

### How it works

1. When `useResizeObserver` mounts, it registers the target element with the pool.
2. The pool maintains a `WeakMap<Element, Set<Callback>>` to track which callbacks are interested in which elements.
3. A single `ResizeObserver` instance observes all registered elements.
4. When the observer fires, entries are dispatched to the correct callbacks via the WeakMap lookup.

```mermaid
sequenceDiagram
    participant Hook as useResizeObserver
    participant Pool as ObserverPool
    participant RO as ResizeObserver
    participant DOM as Browser Layout

    Hook->>Pool: observe(element, { box }, callback)
    Pool->>Pool: weakMap.get(element).add(callback)
    Pool->>RO: observe(element, { box })

    DOM->>RO: layout change detected
    RO->>Pool: callback(entries)
    Pool->>Pool: for each entry, lookup callbacks
    Pool->>Hook: invoke registered callback

    Hook->>Pool: unobserve(element, callback)
    Pool->>Pool: weakMap.get(element).delete(callback)
    alt No more callbacks for element
        Pool->>RO: unobserve(element)
    end
```

### WeakMap cleanup

Using a `WeakMap` keyed by the DOM element ensures that when an element is garbage collected (after unmounting), its entry in the map is automatically cleaned up. No manual memory management required.

::: tip Why not one observer per box model?
The `ResizeObserver` API lets you specify the box model per `observe()` call. Elements observed with different box models can share the same observer instance. The pool handles this by including the box model in the observation options.
:::

## rAF Batching

Raw `ResizeObserver` callbacks fire synchronously during the browser's layout step, potentially multiple times per frame. Calling `setState` directly from this callback would trigger synchronous re-renders.

Instead, we defer state updates to the next `requestAnimationFrame`:

```mermaid
flowchart LR
    RO["ResizeObserver\ncallback"] --> Q["Pending Queue\n(Map<Element, Entry>)"]
    Q --> RAF["requestAnimationFrame"]
    RAF --> ST["startTransition(() => {\n  flush all pending\n})"]
    ST --> R["Single React\nrender cycle"]
```

### The batching algorithm

1. When the observer fires, entries are written to a pending `Map<Element, ResizeObserverEntry>`.
2. If no rAF is scheduled, one is requested.
3. On the next animation frame, all pending entries are flushed inside a single `startTransition` call.
4. React batches all the resulting `setState` calls into one render.

This means that even if 100 elements resize simultaneously (e.g., during a window resize), only **one React render cycle** occurs.

## startTransition Integration

The flush is wrapped in `React.startTransition`. This marks the resize updates as non-urgent, allowing React to:

- Interrupt the resize render if a higher-priority update (like user input) arrives
- Batch the resize updates with other pending transitions
- Avoid blocking the main thread with large resize cascades

```tsx
// Internal simplified pseudocode
const flush = () => {
  const entries = drainPendingQueue();
  startTransition(() => {
    for (const [element, entry] of entries) {
      const callbacks = pool.get(element);
      callbacks?.forEach(cb => cb(entry));
    }
  });
};
```

::: warning When startTransition is not desired
If you need resize updates to be synchronous (e.g., for canvas rendering that must match exactly), use the `onResize` callback instead of the reactive `width`/`height` return values. The callback fires outside of startTransition.
:::

## Lifecycle Management

### Mount

```mermaid
flowchart TD
    MOUNT["useEffect runs"] --> REF{"ref.current\nexists?"}
    REF -->|yes| REG["pool.observe(element, { box }, callback)"]
    REF -->|no| WAIT["Wait for ref assignment"]
    WAIT --> REF
    REG --> OBS["ResizeObserver.observe(element, { box })"]
```

### Unmount

Cleanup relies on the `useEffect` cleanup function. The pool's `unobserve` method decrements the callback set and, when no callbacks remain for an element, calls `ResizeObserver.unobserve`:

```tsx
// Simplified internal implementation
useEffect(() => {
  const element = ref.current;
  if (!element) return;

  const pool = getSharedPool(root ?? element.ownerDocument);
  pool.observe(element, { box }, callback);

  return () => {
    pool.unobserve(element, callback);
  };
}, [box]);
```

The cleanup function runs when the effect re-runs or the component unmounts. Additionally, `FinalizationRegistry` acts as a safety net for GC-backed cleanup if the effect cleanup is missed.

## Memory Layout

For the standard (non-worker) mode, the memory footprint per observed element is:

| Allocation | Size | Lifetime |
|-----------|------|----------|
| WeakMap entry | ~64B | Element lifetime |
| Callback set entry | ~32B | Hook lifetime |
| Pending queue entry | ~48B | Single frame |

There is no per-element `ResizeObserver` instance, no per-element closure for the observer callback, and no retained `ResizeObserverEntry` objects after the flush.

## Worker Mode Architecture

Worker mode adds an additional layer. See the [Worker Mode](/guide/worker) page for the full architecture, but in brief:

```mermaid
flowchart LR
    subgraph Main["Main Thread"]
        RO["ResizeObserver"] --> SAB["SharedArrayBuffer\n(Float16Array view)"]
    end

    subgraph Worker["Web Worker"]
        SAB --> READ["Atomics.load()"]
        READ --> PROC["Process measurements"]
        PROC --> POST["postMessage(results)"]
    end

    POST --> ST["startTransition\nstate update"]
```

The `SharedArrayBuffer` is divided into slots, one per observed element. The main thread writes measurements via `Float16Array` view (4 bytes per dimension), and the worker reads them without any message-passing overhead for the raw data.

## Next Steps

- [Performance](/guide/performance) -- Benchmark data proving the architecture's benefits
- [Worker Mode](/guide/worker) -- Deep dive into the off-main-thread architecture
- [Bundle Size](/guide/bundle-size) -- How tree-shaking keeps the main entry at 1.04 kB
