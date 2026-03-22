import { useSyncExternalStore, useCallback } from 'react';

/**
 * Subscribe function for matchMedia
 */
const subscribe = (callback: () => void, query: string) => {
  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener('change', callback);
  return () => mediaQuery.removeEventListener('change', callback);
};

/**
 * Get snapshot for matchMedia
 */
const getSnapshot = (query: string) => {
  return window.matchMedia(query).matches;
};

/**
 * Get server snapshot (always false for SSR)
 */
const getServerSnapshot = () => false;

/**
 * Hook to detect user's reduced motion preference
 *
 * Respects the `prefers-reduced-motion` media query and provides
 * a boolean value that can be used to conditionally disable animations.
 *
 * Uses useSyncExternalStore for proper external store synchronization
 * without cascading renders.
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = useReduceMotion();
 *
 * if (!prefersReducedMotion) {
 *   // Run animations
 * }
 * ```
 *
 * @returns {boolean} true if user prefers reduced motion
 */
export const useReduceMotion = (): boolean => {
  const subscribeMotion = useCallback(
    (callback: () => void) => subscribe(callback, '(prefers-reduced-motion: reduce)'),
    []
  );
  
  const getMotionSnapshot = useCallback(
    () => getSnapshot('(prefers-reduced-motion: reduce)'),
    []
  );

  return useSyncExternalStore(
    subscribeMotion,
    getMotionSnapshot,
    getServerSnapshot
  );
};

/**
 * Hook to detect if device is touch-enabled
 *
 * Uses useSyncExternalStore for proper external store synchronization.
 *
 * @example
 * ```tsx
 * const isTouchDevice = useTouchDevice();
 *
 * if (!isTouchDevice) {
 *   // Show custom cursor
 * }
 * ```
 *
 * @returns {boolean} true if device has touch input
 */
export const useTouchDevice = (): boolean => {
  const subscribeTouch = useCallback(
    (callback: () => void) => subscribe(callback, '(pointer: coarse)'),
    []
  );
  
  const getTouchSnapshot = useCallback(
    () => getSnapshot('(pointer: coarse)'),
    []
  );

  return useSyncExternalStore(
    subscribeTouch,
    getTouchSnapshot,
    getServerSnapshot
  );
};

/**
 * Combined hook for animation preferences
 *
 * @example
 * ```tsx
 * const { prefersReducedMotion, isTouchDevice, shouldAnimate } = useAnimationPreferences();
 *
 * if (shouldAnimate) {
 *   // Run full animations
 * } else if (!prefersReducedMotion) {
 *   // Run simplified animations
 * }
 * ```
 *
 * @returns Animation preference flags
 */
export const useAnimationPreferences = () => {
  const prefersReducedMotion = useReduceMotion();
  const isTouchDevice = useTouchDevice();

  /**
   * Whether full animations should be enabled
   * Disabled if user prefers reduced motion OR device is touch-only
   */
  const shouldAnimate = !prefersReducedMotion && !isTouchDevice;

  return {
    prefersReducedMotion,
    isTouchDevice,
    shouldAnimate,
  };
};

export default useReduceMotion;
