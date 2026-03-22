import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { useReduceMotion } from './useReduceMotion';
import { REVEAL_CONFIG, SCROLL_CONFIG } from '@/constants/animation.constants';

/**
 * Options for scroll animation hook
 */
interface ScrollAnimationOptions {
  /** Custom trigger element selector */
  trigger?: string;
  /** ScrollTrigger start position */
  start?: string;
  /** ScrollTrigger end position */
  end?: string;
  /** Enable scrubbing (link animation to scroll) */
  scrub?: boolean | number;
  /** Pin the element during animation */
  pin?: boolean;
  /** Show debug markers */
  markers?: boolean;
  /** Callback when element enters viewport */
  onEnter?: () => void;
  /** Callback when element leaves viewport */
  onLeave?: () => void;
  /** Callback when element re-enters from bottom */
  onEnterBack?: () => void;
  /** Callback when element leaves through top */
  onLeaveBack?: () => void;
}

/**
 * Generic scroll animation hook
 *
 * Creates a GSAP timeline linked to scroll position using ScrollTrigger.
 * Automatically respects user's reduced motion preferences.
 *
 * @example
 * ```tsx
 * const ref = useScrollAnimation((element) => {
 *   gsap.to(element, { opacity: 1, y: 0 });
 * }, { start: 'top 80%' });
 *
 * return <div ref={ref}>Animated content</div>;
 * ```
 *
 * @param animation - Animation function to execute
 * @param options - ScrollTrigger configuration options
 * @returns React ref to attach to the target element
 */
export const useScrollAnimation = <T extends HTMLElement>(
  animation: (element: T, timeline: gsap.core.Timeline) => void,
  options: ScrollAnimationOptions = {}
) => {
  const elementRef = useRef<T>(null);
  const triggersRef = useRef<ScrollTrigger[]>([]);
  const animationRef = useRef(animation);
  const optionsRef = useRef(options);
  const prefersReducedMotion = useReduceMotion();

  // Keep refs in sync
  useEffect(() => {
    animationRef.current = animation;
  }, [animation]);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (prefersReducedMotion || !elementRef.current) {
      return;
    }

    const element = elementRef.current;
    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: optionsRef.current.trigger || element,
        start: optionsRef.current.start || SCROLL_CONFIG.defaultStart,
        end: optionsRef.current.end || SCROLL_CONFIG.defaultEnd,
        scrub: optionsRef.current.scrub ?? false,
        pin: optionsRef.current.pin ?? false,
        markers: optionsRef.current.markers ?? false,
        onEnter: optionsRef.current.onEnter,
        onLeave: optionsRef.current.onLeave,
        onEnterBack: optionsRef.current.onEnterBack,
        onLeaveBack: optionsRef.current.onLeaveBack,
      },
    });

    if (timeline.scrollTrigger) {
      triggersRef.current.push(timeline.scrollTrigger);
    }

    animationRef.current(element, timeline);

    return () => {
      triggersRef.current.forEach(trigger => trigger.kill());
      triggersRef.current = [];
      timeline.kill();
    };
  }, [prefersReducedMotion]);

  return elementRef;
};

/**
 * Reveal animation hook
 *
 * Simple fade-in and slide-up animation triggered when element
 * enters the viewport. Uses centralized reveal configuration.
 *
 * @example
 * ```tsx
 * const ref = useRevealAnimation();
 * return <div ref={ref}>Reveals on scroll</div>;
 * ```
 *
 * @returns React ref to attach to the target element
 */
export const useRevealAnimation = <T extends HTMLElement>() => {
  const elementRef = useRef<T>(null);
  const prefersReducedMotion = useReduceMotion();

  useEffect(() => {
    if (!elementRef.current) return;

    const element = elementRef.current;

    // Skip animation if reduced motion is preferred
    if (prefersReducedMotion) {
      element.style.opacity = '1';
      element.style.transform = 'none';
      return;
    }

    // Set initial state
    gsap.set(element, {
      opacity: 0,
      y: REVEAL_CONFIG.startY,
    });

    // Create scroll trigger
    const trigger = ScrollTrigger.create({
      trigger: element,
      start: REVEAL_CONFIG.triggerStart,
      onEnter: () => {
        gsap.to(element, {
          opacity: 1,
          y: 0,
          duration: REVEAL_CONFIG.duration,
          ease: REVEAL_CONFIG.ease,
        });
      },
      once: true,
    });

    return () => {
      trigger.kill();
    };
  }, [prefersReducedMotion]);

  return elementRef;
};

export default useScrollAnimation;
