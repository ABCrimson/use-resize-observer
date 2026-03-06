'use client';

import type React from 'react';
import { createContext, useContext } from 'react';

/**
 * Context for injecting a custom `ResizeObserver` constructor.
 *
 * Useful for:
 * - **Testing**: Inject a mock `ResizeObserver` for deterministic tests.
 * - **SSR**: Inject a no-op implementation to avoid `ReferenceError`.
 * - **Polyfills**: Inject a polyfill without modifying `globalThis`.
 *
 * @example
 * ```tsx
 * // In tests:
 * <ResizeObserverContext.Provider value={MockResizeObserver}>
 *   <ComponentThatUsesResize />
 * </ResizeObserverContext.Provider>
 * ```
 */
export const ResizeObserverContext: React.Context<typeof ResizeObserver | null> = createContext<
  typeof ResizeObserver | null
>(null);

ResizeObserverContext.displayName = 'ResizeObserverContext';

/**
 * Access the injected ResizeObserver constructor, falling back to the global.
 * @internal
 */
export const useResizeObserverConstructor = (): typeof ResizeObserver => {
  const contextValue = useContext(ResizeObserverContext);
  return contextValue !== null ? contextValue : globalThis.ResizeObserver;
};
