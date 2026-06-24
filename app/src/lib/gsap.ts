/**
 * GSAP Configuration and Registration
 *
 * Centralized GSAP setup to ensure plugins are registered only once
 * and to provide consistent configuration across the application.
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugins only once
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// GSAP defaults configuration
gsap.defaults({
  ease: 'power3.out',
  duration: 0.8,
});

// ScrollTrigger defaults
if (typeof window !== 'undefined') {
  ScrollTrigger.defaults({
    markers: false,
  });
}

/**
 * Runtime reduced motion check — called by useReduceMotion hook
 * to keep GSAP in sync with user preference changes.
 */
const motionMedia = typeof window !== 'undefined'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : null;

export function applyReducedMotion(reduce: boolean): void {
  gsap.globalTimeline.timeScale(reduce ? 0 : 1);
}

// Initial check at module load
if (motionMedia?.matches) {
  gsap.globalTimeline.timeScale(0);
}

// Listen for dynamic changes to the preference
motionMedia?.addEventListener('change', (e) => {
  gsap.globalTimeline.timeScale(e.matches ? 0 : 1);
});

export { gsap, ScrollTrigger };
export default gsap;
