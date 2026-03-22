/**
 * Animation Constants
 *
 * Centralized configuration for all animation parameters throughout the application.
 * This ensures consistency and makes it easier to adjust animation behavior globally.
 */

/**
 * Cursor animation configuration
 */
export const CURSOR_CONFIG = {
  /** Speed factor for dot interpolation (0-1) */
  dotSpeed: 0.2,
  /** Speed factor for ring interpolation (0-1) */
  ringSpeed: 0.1,
  /** Size of ring when hovering over interactive elements (px) */
  hoverSize: 48,
  /** Default size of ring (px) */
  defaultSize: 32,
  /** Size of dot (px) */
  dotSize: 6,
} as const;

/**
 * Scroll animation configuration
 */
export const SCROLL_CONFIG = {
  /** Delay before refreshing scroll triggers on resize (ms) */
  refreshDelay: 200,
  /** Intensity of parallax effects (0-1) */
  parallaxIntensity: 0.5,
  /** Default scroll trigger start position */
  defaultStart: 'top 80%',
  /** Default scroll trigger end position */
  defaultEnd: 'bottom 20%',
} as const;

/**
 * Reveal animation configuration
 */
export const REVEAL_CONFIG = {
  /** Initial Y offset for reveal animations (px) */
  startY: 30,
  /** Duration of reveal animation (s) */
  duration: 0.8,
  /** Easing function for reveal */
  ease: 'power3.out' as const,
  /** Scroll trigger position for reveal */
  triggerStart: 'top 85%',
} as const;

/**
 * Hero section animation configuration
 */
export const HERO_CONFIG = {
  /** Duration of 3D unfold animation (s) */
  unfoldDuration: 1.5,
  /** Easing function for unfold */
  unfoldEase: 'expo.out' as const,
  /** Maximum tilt angle on mouse move (deg) */
  tiltIntensity: 5,
  /** Duration of tilt animation (s) */
  tiltDuration: 0.5,
  /** Easing for tilt animation */
  tiltEase: 'power2.out' as const,
  /** Parallax scroll distance (px) */
  parallaxDistance: -150,
  /** Title horizontal drift on scroll (px) */
  titleDrift: 50,
} as const;

/**
 * Horizontal scroll animation configuration
 */
export const HORIZONTAL_SCROLL_CONFIG = {
  /** Maximum skew angle during scroll (deg) */
  maxSkew: 3,
  /** Skew recovery speed (0-1) */
  skewRecovery: 0.1,
  /** Velocity multiplier for skew effect */
  velocityMultiplier: 0.5,
} as const;

/**
 * Magnetic effect configuration
 */
export const MAGNETIC_CONFIG = {
  /** Maximum distance for magnetic effect (px) */
  magnetRadius: 80,
  /** Strength of magnetic pull (0-1) */
  magnetStrength: 0.3,
  /** Recovery animation duration (s) */
  recoveryDuration: 0.5,
  /** Recovery easing function */
  recoveryEase: 'elastic.out(1, 0.5)' as const,
} as const;

/**
 * Orbital animation configuration
 */
export const ORBITAL_CONFIG = {
  /** Base rotation speed (deg/s) */
  baseRotationSpeed: 0.5,
  /** Acceleration when dragging (multiplier) */
  dragAcceleration: 2,
  /** Deceleration factor (0-1) */
  deceleration: 0.98,
  /** Minimum velocity before stopping */
  minVelocity: 0.01,
} as const;

/**
 * Transition easing functions
 */
export const EASING = {
  /** Exponential easing - smooth, natural deceleration */
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
  /** Smooth symmetric easing */
  smooth: 'cubic-bezier(0.65, 0, 0.35, 1)',
  /** Dramatic easing - slow start, fast middle, slow end */
  dramatic: 'cubic-bezier(0.85, 0, 0.15, 1)',
  /** Power easing - strong finish */
  power3Out: 'power3.out',
  /** Power4 easing - very strong finish */
  power4Out: 'power4.out',
  /** Power2 easing - moderate finish */
  power2Out: 'power2.out',
} as const;

/**
 * Duration presets
 */
export const DURATION = {
  /** Very fast transition */
  fast: 0.2,
  /** Fast transition */
  normal: 0.4,
  /** Medium transition */
  medium: 0.6,
  /** Slow transition */
  slow: 0.8,
  /** Very slow transition */
  verySlow: 1.2,
} as const;

/**
 * Stagger delays for sequential animations
 */
export const STAGGER = {
  /** Fast stagger for small elements */
  fast: 0.05,
  /** Normal stagger */
  normal: 0.1,
  /** Slow stagger for large elements */
  slow: 0.15,
} as const;
