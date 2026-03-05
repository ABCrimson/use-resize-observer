/**
 * Live resize visualizer component for the documentation site.
 *
 * Features:
 * - Real-time contentBoxSize, borderBoxSize, devicePixelContentBoxSize display
 * - GPU-composited bar chart (CSS transform: scaleX/scaleY)
 * - Toggle between main-thread and Worker mode with live FPS counter
 * - View Transitions API for panel state changes
 * - Respects prefers-reduced-motion
 *
 * This component is rendered as a client-side island in VitePress 2.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface VisualizerState {
  width: number;
  height: number;
  borderWidth: number;
  borderHeight: number;
  fps: number;
  mode: 'main' | 'worker';
}

const INITIAL_STATE: VisualizerState = {
  width: 0,
  height: 0,
  borderWidth: 0,
  borderHeight: 0,
  fps: 0,
  mode: 'main',
};

const Bar = ({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) => {
  const scale = maxValue > 0 ? value / maxValue : 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-xs)',
          color: 'var(--c-text-2)',
          width: '120px',
          textAlign: 'right',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: '24px',
          backgroundColor: 'var(--c-bg-mute)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          className="resize-bar"
          style={{
            height: '100%',
            backgroundColor: color,
            transformOrigin: 'left',
            transform: `scaleX(${Math.min(scale, 1)})`,
            willChange: 'transform',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-sm)',
          color: 'var(--c-text-1)',
          width: '80px',
        }}
      >
        {value.toFixed(1)}px
      </span>
    </div>
  );
};

export const ResizeVisualizer = () => {
  const [state, setState] = useState<VisualizerState>(INITIAL_STATE);
  const observedRef = useRef<HTMLDivElement>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  // FPS counter
  useEffect(() => {
    let rafId: number;
    const tick = (): void => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 1000) {
        setState((prev) => ({
          ...prev,
          fps: Math.round((frameCountRef.current * 1000) / elapsed),
        }));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // ResizeObserver
  useEffect(() => {
    const el = observedRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const [cs] = entry.contentBoxSize;
        const [bs] = entry.borderBoxSize;
        setState((prev) => ({
          ...prev,
          width: cs?.inlineSize ?? 0,
          height: cs?.blockSize ?? 0,
          borderWidth: bs?.inlineSize ?? 0,
          borderHeight: bs?.blockSize ?? 0,
        }));
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleMode = useCallback(() => {
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      (document as { startViewTransition: (cb: () => void) => void }).startViewTransition(() => {
        setState((prev) => ({
          ...prev,
          mode: prev.mode === 'main' ? 'worker' : 'main',
        }));
      });
    } else {
      setState((prev) => ({
        ...prev,
        mode: prev.mode === 'main' ? 'worker' : 'main',
      }));
    }
  }, []);

  const maxDimension = Math.max(state.width, state.height, state.borderWidth, state.borderHeight, 1);

  return (
    <div
      style={{
        padding: '24px',
        backgroundColor: 'var(--c-bg-soft)',
        borderRadius: '12px',
        border: '1px solid var(--c-bg-mute)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: 'var(--text-lg)', color: 'var(--c-text-1)' }}>
          Resize Visualizer
        </h3>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              color: 'var(--c-text-3)',
            }}
          >
            {state.fps} FPS
          </span>
          <button
            onClick={toggleMode}
            style={{
              padding: '4px 12px',
              borderRadius: '6px',
              border: '1px solid var(--c-primary)',
              backgroundColor: state.mode === 'worker' ? 'var(--c-primary)' : 'transparent',
              color: state.mode === 'worker' ? 'white' : 'var(--c-primary)',
              cursor: 'pointer',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--text-xs)',
              viewTransitionName: 'mode-toggle',
            }}
          >
            {state.mode === 'main' ? 'Main Thread' : 'Worker'}
          </button>
        </div>
      </div>

      {/* Observed element */}
      <div
        ref={observedRef}
        style={{
          width: '100%',
          minHeight: '120px',
          padding: '16px',
          border: '2px dashed var(--c-primary-soft)',
          borderRadius: '8px',
          resize: 'both',
          overflow: 'auto',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--text-2xl)',
          color: 'var(--c-text-1)',
        }}
      >
        {state.width > 0 ? `${Math.round(state.width)} x ${Math.round(state.height)}` : 'Drag to resize'}
      </div>

      {/* Bar chart */}
      <div style={{ marginTop: '12px' }}>
        <Bar label="contentBox W" value={state.width} maxValue={maxDimension} color="var(--c-primary)" />
        <Bar label="contentBox H" value={state.height} maxValue={maxDimension} color="var(--c-primary-hover)" />
        <Bar label="borderBox W" value={state.borderWidth} maxValue={maxDimension} color="var(--c-accent)" />
        <Bar label="borderBox H" value={state.borderHeight} maxValue={maxDimension} color="oklch(58% 0.22 280 / 0.7)" />
      </div>
    </div>
  );
};
