---
layout: home

hero:
  name: "@crimson_dev/use-resize-observer"
  text: "Zero-dependency React 19 ResizeObserver hook"
  tagline: "ESNext-first. Worker-native. < 1.1kB gzip. React Compiler-safe."
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/ABCrimson/use-resize-observer
    - theme: alt
      text: API Reference
      link: /api/

features:
  - icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    title: "< 1.1kB gzip"
    details: "Full main entry with pool, scheduler, and hook — just 1.11 kB gzip. Core entry: 330B. Zero runtime dependencies."

  - icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
    title: Worker-Native
    details: Share live measurements with compute workers via SharedArrayBuffer + Float16Array for jank-free UIs.

  - icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
    title: Shared Observer Pool
    details: 100 elements resizing simultaneously produce exactly 1 React render cycle via rAF batching + startTransition.

  - icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
    title: React 19 Compiler-Safe
    details: Built for React 19.3+ with useEffectEvent semantics. Verified compatible with the React Compiler.

  - icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
    title: ESNext-First
    details: ES2026 features throughout — using/Symbol.dispose, Float16Array, Atomics dirty-flag protocol, FinalizationRegistry.

  - icon: <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
    title: TypeScript 6 Strict
    details: isolatedDeclarations, erasableSyntaxOnly, exactOptionalPropertyTypes — the strictest possible TS config.
---

<div class="hero-gradient" style="position: absolute; inset: 0; z-index: -1; opacity: 0.4;" />
