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

// Respect reduced motion preference
const prefersReducedMotion = typeof window !== 'undefined' 
  ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
  : false;

if (prefersReducedMotion) {
  gsap.globalTimeline.timeScale(0);
}

export { gsap, ScrollTrigger };
export default gsap;
