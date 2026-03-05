# React Compiler Compatibility

`@crimson_dev/use-resize-observer` is verified compatible with the React Compiler (formerly React Forget). You can enable the compiler without any changes to code that uses this hook.

## Why It Matters

The React Compiler automatically memoizes component renders, eliminating the need for manual `useMemo`, `useCallback`, and `React.memo`. However, hooks that violate React's rules or create unstable references can break under compilation, producing stale closures or infinite re-renders.

This library is designed from the ground up to work correctly with the compiler.

## How We Ensure Compatibility

### 1. Stable Callback Identity

The `onResize` callback uses a ref-based pattern equivalent to `useEffectEvent`:

```typescript
// Internal implementation (simplified)
const onResizeRef = useRef(onResize);
onResizeRef.current = onResize; // Always latest closure

// Used inside useEffect — stable identity, always-current closure
const stableCallback = (entry: ResizeObserverEntry) => {
  onResizeRef.current?.(entry);
};
```

The compiler correctly identifies `onResizeRef` as a ref and exempts it from memoization analysis. The callback identity never changes, so the effect never re-runs due to callback changes.

### 2. No Conditional Hooks

All hooks are called unconditionally at the top level of the custom hook. The pool and scheduler are initialized lazily inside `useEffect`, not behind conditionals:

```typescript
// Correct: unconditional hook calls
export function useResizeObserver<E extends Element>(options?: Options<E>) {
  const [size, setSize] = useState<Size>({ width: undefined, height: undefined });
  const internalRef = useRef<E>(null);
  const ref = options?.ref ?? internalRef;

  useEffect(() => {
    // Lazy initialization happens here, not at the hook level
    const element = ref.current;
    if (!element) return;
    // ...
  }, [options?.box]);

  return { ref, ...size };
}
```

### 3. No Mutable State Leaks

All internal state uses `useState` (not external mutable stores, module-level variables, or `useRef` for render-visible state). The compiler can safely track all state transitions.

### 4. Pure Return Values

The hook's return value (`{ ref, width, height }`) is derived entirely from React state and refs. No external mutable data is exposed through the return value.

## Verification

The full test suite runs under React Compiler transformation on every CI build:

```bash
# Run tests with React Compiler enabled
npm run test -- --env-setup compiler

# Run specific compiler compatibility tests
npm run test -- --grep "compiler" --env-setup compiler
```

### Verified Scenarios

| Scenario | Status |
|----------|--------|
| Basic `useResizeObserver` with default options | Verified |
| External ref forwarding | Verified |
| `onResize` callback with changing closures | Verified |
| `onResize` callback that captures component state | Verified |
| `useResizeObserverEntries` with dynamic ref arrays | Verified |
| `createResizeObserver` factory (non-hook, no compiler impact) | Verified |
| Hot module replacement during development | Verified |
| Component wrapped in `React.memo` (redundant but safe) | Verified |
| Component with sibling `useMemo`/`useCallback` calls | Verified |

## What NOT to Do

::: danger Do not wrap onResize in useCallback
The hook already stabilizes the callback identity internally. Adding `useCallback` creates unnecessary memoization overhead that the compiler will also try to optimize, potentially leading to confusion:

```tsx
// BAD — unnecessary double-memoization
const onResize = useCallback((entry: ResizeObserverEntry) => {
  setSize(entry.contentRect);
}, []);

const { ref } = useResizeObserver({ onResize });

// GOOD — just pass the function directly
const { ref } = useResizeObserver({
  onResize: (entry) => {
    setSize(entry.contentRect);
  },
});
```
:::

::: warning Do not destructure in the dependency array
If you are manually writing `useEffect` that depends on the hook's return values, do not try to be clever with destructuring in the dependency array. Just use the values directly:

```tsx
const { width, height } = useResizeObserver<HTMLDivElement>();

// GOOD — straightforward
useEffect(() => {
  if (width !== undefined) {
    updateLayout(width, height!);
  }
}, [width, height]);

// The compiler handles this automatically — you don't need the manual useEffect at all
```
:::

## Compiler Escape Hatches

If you need to opt a specific component out of compiler optimization (rare), use the `'use no memo'` directive:

```tsx
function SpecialComponent() {
  'use no memo';

  const { ref, width } = useResizeObserver<HTMLDivElement>();
  // This component will not be auto-memoized
  return <div ref={ref}>{width}</div>;
}
```

This should almost never be necessary with this library.

## Testing Compiler Compatibility in Your App

To verify that the compiler works correctly with your usage of `useResizeObserver`:

1. Enable the React Compiler in your build:

```typescript
// babel.config.ts
module.exports = {
  plugins: [
    ['babel-plugin-react-compiler', { target: '19' }],
  ],
};
```

2. Run your test suite and watch for:
   - Stale dimension values after resize
   - Callbacks not firing after resize
   - Infinite re-render loops
   - Missing ref assignments

3. If any issues appear, they are likely in your component code, not in the hook. Check for violations of the [Rules of React](https://react.dev/reference/rules).

## Next Steps

- [Signals](/guide/signals) -- Signal integration patterns (also compiler-safe)
- [Performance](/guide/performance) -- How compiler optimization affects resize performance
- [Troubleshooting](/guide/troubleshooting) -- Common issues with compiler + resize observer
