import { useEffect, useRef, useState, useCallback } from 'react';
import { CURSOR_CONFIG } from '@/constants/animation.constants';
import { useAnimationPreferences } from './useReduceMotion';

/**
 * Return type for useCustomCursor hook
 */
interface CursorReturn {
  /** Reference for the dot element */
  dotRef: React.RefObject<HTMLDivElement | null>;
  /** Reference for the ring element */
  ringRef: React.RefObject<HTMLDivElement | null>;
  /** Whether the cursor is visible */
  isVisible: boolean;
  /** Whether the cursor is hovering over an interactive element */
  isHovering: boolean;
}

/**
 * Custom Cursor Hook
 *
 * Provides a smooth custom cursor with a dot and ring that follows mouse movement.
 * The ring has a slight delay (lerp) creating a fluid trailing effect.
 *
 * Features:
 * - Disabled on touch devices automatically
 * - Respects prefers-reduced-motion setting
 * - Hover state detection for interactive elements
 * - Smooth interpolation for natural movement
 *
 * @example
 * ```tsx
 * const { dotRef, ringRef, isVisible, isHovering } = useCustomCursor();
 *
 * return (
 *   <>
 *     <div ref={dotRef} className="cursor-dot" />
 *     <div ref={ringRef} className="cursor-ring" />
 *   </>
 * );
 * ```
 *
 * @returns {CursorReturn} Cursor control object
 */
export const useCustomCursor = (): CursorReturn => {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Mouse position tracking
  const mousePos = useRef({ x: 0, y: 0 });
  const dotPos = useRef({ x: 0, y: 0 });
  const ringPos = useRef({ x: 0, y: 0 });
  const rafId = useRef<number | null>(null);
  const isHoveringRef = useRef(isHovering);

  // Keep ref in sync with state
  useEffect(() => {
    isHoveringRef.current = isHovering;
  }, [isHovering]);

  const { prefersReducedMotion, isTouchDevice } = useAnimationPreferences();

  // Memoized event handlers
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mousePos.current = { x: e.clientX, y: e.clientY };
    if (!isVisible) setIsVisible(true);
  }, [isVisible]);

  const handleMouseEnter = useCallback(() => setIsVisible(true), []);
  const handleMouseLeave = useCallback(() => setIsVisible(false), []);

  const handleHoverStart = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'A' ||
      target.tagName === 'BUTTON' ||
      target.closest('a') ||
      target.closest('button') ||
      target.classList.contains('magnetic') ||
      target.classList.contains('cursor-hover')
    ) {
      setIsHovering(true);
    }
  }, []);

  const handleHoverEnd = useCallback(() => setIsHovering(false), []);

  useEffect(() => {
    // Disable cursor on touch devices or if reduced motion is preferred
    if (isTouchDevice || prefersReducedMotion) {
      return;
    }

    /**
     * Animation loop for smooth cursor movement
     * Uses linear interpolation (lerp) for fluid motion
     */
    const animate = () => {
      // Smooth interpolation for dot (faster)
      dotPos.current.x += (mousePos.current.x - dotPos.current.x) * CURSOR_CONFIG.dotSpeed;
      dotPos.current.y += (mousePos.current.y - dotPos.current.y) * CURSOR_CONFIG.dotSpeed;

      // Slower interpolation for ring (creates trailing effect)
      ringPos.current.x += (mousePos.current.x - ringPos.current.x) * CURSOR_CONFIG.ringSpeed;
      ringPos.current.y += (mousePos.current.y - ringPos.current.y) * CURSOR_CONFIG.ringSpeed;

      // Apply transforms
      if (dotRef.current) {
        const offset = CURSOR_CONFIG.dotSize / 2;
        dotRef.current.style.transform = `translate(${dotPos.current.x - offset}px, ${dotPos.current.y - offset}px)`;
      }

      if (ringRef.current) {
        const size = isHoveringRef.current ? CURSOR_CONFIG.hoverSize : CURSOR_CONFIG.defaultSize;
        const offset = size / 2;
        ringRef.current.style.transform = `translate(${ringPos.current.x - offset}px, ${ringPos.current.y - offset}px)`;
        ringRef.current.style.width = `${size}px`;
        ringRef.current.style.height = `${size}px`;
      }

      rafId.current = requestAnimationFrame(animate);
    };

    // Attach event listeners with passive option for better performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseover', handleHoverStart, { passive: true });
    document.addEventListener('mouseout', handleHoverEnd, { passive: true });

    // Start animation loop
    rafId.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseover', handleHoverStart);
      document.removeEventListener('mouseout', handleHoverEnd);
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [isTouchDevice, prefersReducedMotion, handleMouseMove, handleMouseEnter, handleMouseLeave, handleHoverStart, handleHoverEnd]);

  return { dotRef, ringRef, isVisible, isHovering };
};

export default useCustomCursor;
