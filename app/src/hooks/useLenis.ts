import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { useReduceMotion } from './useReduceMotion';

/**
 * Lenis Smooth Scroll Hook
 *
 * Initializes the Lenis smooth scroll library for buttery smooth scrolling.
 * Automatically respects user's reduced motion preferences.
 *
 * Configuration options:
 * - excludedSelectors: Array of CSS selectors for elements that should use native scrolling
 * - This is useful for virtual scrolling containers or other custom scroll implementations
 *
 * @example
 * ```tsx
 * function App() {
 *   useLenis(); // Initialize smooth scroll with default settings
 *   return <div>...</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function App() {
 *   // Exclude specific containers from smooth scrolling
 *   useLenis({
 *     excludedSelectors: ['.virtual-scroll-container', '[data-native-scroll]']
 *   });
 *   return <div>...</div>;
 * }
 * ```
 *
 * @returns The Lenis instance (useful for programmatic control)
 */
export interface LenisOptions {
  excludedSelectors?: string[];
}

export const useLenis = (options: LenisOptions = {}) => {
  const { excludedSelectors = [] } = options;
  const lenisRef = useRef<Lenis | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const prefersReducedMotion = useReduceMotion();

  useEffect(() => {
    // Skip initialization if reduced motion is preferred
    if (prefersReducedMotion) {
      return;
    }

    // Direct wheel event listener to handle native scroll containers
    const handleWheel = (e: WheelEvent) => {
      const target = e.target as Element;
      if (excludedSelectors.length > 0) {
        const nativeScrollContainer = target.closest(`${excludedSelectors.join(', ')}`);
        if (nativeScrollContainer) {
          e.stopImmediatePropagation();
        }
      }
    };

    // Initialize Lenis with configuration that supports nested scrolling
    lenisRef.current = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      // Add infinite mode for better nested scroll support
      infinite: false,
    });

    // Add global wheel event listener for excluded containers
    document.addEventListener('wheel', handleWheel, { passive: false, capture: true });

    /**
     * RequestAnimationFrame loop for Lenis
     * Updates smooth scroll on every frame
     */
    const raf = (time: number) => {
      lenisRef.current?.raf(time);
      rafIdRef.current = requestAnimationFrame(raf);
    };

    // Start animation loop
    rafIdRef.current = requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
      lenisRef.current?.destroy();
      lenisRef.current = null;
      // Remove the global event listener
      document.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, [prefersReducedMotion, excludedSelectors]);

  return lenisRef;
};

export default useLenis;
