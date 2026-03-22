import { useCustomCursor } from '@/hooks/useCustomCursor';
import { useAnimationPreferences } from '@/hooks/useReduceMotion';

/**
 * Custom Cursor Component
 *
 * Renders a dual-element custom cursor (dot + ring) that smoothly follows mouse movement.
 * Automatically disabled on touch devices and when reduced motion is preferred.
 *
 * The dot follows the cursor directly while the ring has a slight delay,
 * creating a fluid trailing effect.
 */
const CustomCursor = () => {
  const { dotRef, ringRef, isVisible } = useCustomCursor();
  const { shouldAnimate } = useAnimationPreferences();

  // Don't render cursor on touch devices or when animations are disabled
  if (!shouldAnimate) {
    return null;
  }

  return (
    <>
      {/* Dot element - follows cursor directly */}
      <div
        ref={dotRef}
        className={`cursor-dot ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'transform' }}
        aria-hidden="true"
      />
      {/* Ring element - follows with delay, creates trailing effect */}
      <div
        ref={ringRef}
        className={`cursor-ring ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        style={{ willChange: 'transform, width, height' }}
        aria-hidden="true"
      />
    </>
  );
};

export default CustomCursor;
