import { useRef, useCallback, useEffect, useState } from 'react';
import { useReduceMotion } from './useReduceMotion';
import { MAGNETIC_CONFIG } from '@/constants/animation.constants';

/**
 * Options for magnetic effect hook
 */
interface MagneticOptions {
  /** Strength of magnetic pull (0-1), default from config */
  strength?: number;
  /** Maximum distance for effect (px), default from config */
  radius?: number;
}

/**
 * Return type for useMagneticEffect hook
 */
interface MagneticReturn<T extends HTMLElement> {
  /** Reference to attach to the target element */
  elementRef: React.RefObject<T | null>;
  /** Whether element is currently being magnetically affected */
  isHovered: boolean;
  /** Handler to reset element position */
  handleMouseLeave: () => void;
}

/**
 * Magnetic Effect Hook
 *
 * Creates a magnetic effect where elements are "pulled" towards the cursor
 * when hovering within the specified radius.
 *
 * @example
 * ```tsx
 * const { elementRef, isHovered } = useMagneticEffect({
 *   strength: 0.5,
 *   radius: 100
 * });
 *
 * return <button ref={elementRef} className="magnetic">Hover me</button>;
 * ```
 *
 * @param options - Configuration for magnetic effect
 * @returns Magnetic effect control object
 */
export const useMagneticEffect = <T extends HTMLElement>(
  options: MagneticOptions = {}
): MagneticReturn<T> => {
  const {
    strength = MAGNETIC_CONFIG.magnetStrength,
    radius = MAGNETIC_CONFIG.magnetRadius
  } = options;

  const elementRef = useRef<T>(null);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotion = useReduceMotion();

  /**
   * Handle mouse move - calculate magnetic pull
   */
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!elementRef.current) return;

      const rect = elementRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Calculate distance from element center to cursor
      const distanceX = e.clientX - centerX;
      const distanceY = e.clientY - centerY;
      const distance = Math.sqrt(distanceX * distanceX + distanceY * distanceY);

      if (distance < radius) {
        // Apply magnetic pull
        const magnetX = distanceX * strength;
        const magnetY = distanceY * strength;
        elementRef.current.style.transform = `translate(${magnetX}px, ${magnetY}px)`;
        setIsHovered(true);
      } else {
        // Reset position when outside radius
        elementRef.current.style.transform = 'translate(0, 0)';
        setIsHovered(false);
      }
    },
    [strength, radius]
  );

  /**
   * Handle mouse leave - reset element position
   */
  const handleMouseLeave = useCallback(() => {
    if (elementRef.current) {
      elementRef.current.style.transform = 'translate(0, 0)';
      setIsHovered(false);
    }
  }, []);

  useEffect(() => {
    // Skip if reduced motion is preferred
    if (prefersReducedMotion) {
      return;
    }

    // Use passive listener for better performance
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseMove, prefersReducedMotion]);

  return { elementRef, isHovered, handleMouseLeave };
};

export default useMagneticEffect;
