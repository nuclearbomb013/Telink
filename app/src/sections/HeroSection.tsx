import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';

import { heroConfig } from '@/config';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { HERO_CONFIG, EASING, DURATION } from '@/constants/animation.constants';

/**
 * Hero Section Component
 *
 * Split-screen hero with 3D perspective tilt and parallax scroll effects.
 * Features entry animations and interactive mouse-tracking tilt on the image.
 */
const HeroSection = () => {
  // All hooks must be called before any conditional logic
  const sectionRef = useRef<HTMLElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useReduceMotion();

  // Check if we have valid config
  const shouldRender = Boolean(heroConfig.titleLine1 || heroConfig.titleLine2);

  useEffect(() => {
    // Skip if reduced motion is preferred or if we shouldn't render
    if (prefersReducedMotion || !shouldRender) {
      return;
    }

    const ctx = gsap.context(() => {
      // Initial entry animation
      const entryTl = gsap.timeline({ delay: 0.5 });

      // Image 3D unfold
      entryTl.fromTo(
        imageContainerRef.current,
        { rotateX: 90, opacity: 0, transformOrigin: 'bottom center' },
        {
          rotateX: 0,
          opacity: 1,
          duration: HERO_CONFIG.unfoldDuration,
          ease: HERO_CONFIG.unfoldEase
        }
      );

      // Title mask reveal
      entryTl.fromTo(
        titleRef.current,
        { y: '100%', opacity: 0 },
        { y: '0%', opacity: 1, duration: 1, ease: 'power4.out' },
        '-=1'
      );

      // Content blur fade in
      entryTl.fromTo(
        contentRef.current,
        { filter: 'blur(10px)', opacity: 0 },
        { filter: 'blur(0px)', opacity: 1, duration: DURATION.medium, ease: 'none' },
        '-=0.6'
      );

      // Date vertical slide
      entryTl.fromTo(
        dateRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: DURATION.normal, ease: EASING.power3Out },
        '-=0.4'
      );

      // Scroll-triggered parallax
      gsap.to(imageRef.current, {
        y: HERO_CONFIG.parallaxDistance,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });

      // Title horizontal drift on scroll
      gsap.to(titleRef.current, {
        x: HERO_CONFIG.titleDrift,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [prefersReducedMotion, shouldRender]);

  /**
   * Liquid distortion effect on mouse move
   * Creates a 3D tilt effect based on cursor position relative to image center
   */
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    gsap.to(imageRef.current, {
      rotateY: x * HERO_CONFIG.tiltIntensity,
      rotateX: -y * HERO_CONFIG.tiltIntensity,
      duration: HERO_CONFIG.tiltDuration,
      ease: HERO_CONFIG.tiltEase,
    });
  };

  /**
   * Reset image rotation on mouse leave
   */
  const handleMouseLeave = () => {
    if (!imageRef.current) return;

    gsap.to(imageRef.current, {
      rotateY: 0,
      rotateX: 0,
      duration: DURATION.medium,
      ease: 'elastic.out(1, 0.5)',
    });
  };

  // Move conditional render to return statement to follow React Hooks rules
  if (!shouldRender) {
    return null;
  }

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen pt-32 lg:pt-40 pb-20 overflow-hidden"
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          {/* Left: Image with 3D perspective */}
          <div
            ref={imageContainerRef}
            className="relative perspective-2000"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Date - Vertical */}
            <div
              ref={dateRef}
              className="absolute -left-12 top-1/2 -translate-y-1/2 hidden xl:block"
            >
              <span
                className="font-roboto text-xs tracking-widest text-brand-dark-gray writing-mode-vertical rotate-180"
                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
              >
                {heroConfig.date}
              </span>
            </div>

            <div className="relative preserve-3d">
              <img
                ref={imageRef}
                src={heroConfig.image}
                alt={heroConfig.imageAlt}
                className="w-full h-auto max-w-lg mx-auto lg:max-w-none aspect-square object-cover"
                style={{ transformStyle: 'preserve-3d' }}
                loading="eager"
                width="600"
                height="600"
              />

              {/* Subtle overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-linen/20 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Right: Content */}
          <div className="lg:pl-8 flex flex-col justify-center">
            <div className="xl:hidden mb-4">
              <span className="font-roboto text-xs tracking-widest text-brand-dark-gray">
                {heroConfig.date}
              </span>
            </div>

            <div className="overflow-hidden mb-6 pb-1">
              <h1
                ref={titleRef}
                className="font-oswald font-light text-4xl sm:text-5xl lg:text-6xl xl:text-7xl text-brand-text leading-[1.15] tracking-tight"
              >
                {heroConfig.titleLine1}
                <br />
                <span className="font-medium">{heroConfig.titleLine2}</span>
              </h1>
            </div>

            <div ref={contentRef}>
              <p className="font-roboto text-sm text-brand-dark-gray mb-2">
                {heroConfig.readTime}
              </p>

              <p className="font-roboto text-base lg:text-lg text-brand-dark-gray leading-relaxed mb-8 max-w-md">
                {heroConfig.description}
              </p>

              <a
                href="#"
                className="group inline-flex items-center gap-3 font-roboto text-sm uppercase tracking-wider text-brand-text hover:text-brand-dark-gray transition-colors cursor-hover magnetic"
              >
                <span className="relative">
                  {heroConfig.ctaText}
                  <span className="absolute bottom-0 left-0 w-full h-px bg-brand-text transform origin-left transition-transform duration-500 group-hover:scale-x-0" />
                </span>
                <ArrowRight size={16} className="transform transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 w-1/3 h-px bg-gradient-to-r from-brand-border to-transparent" />
      <div className="absolute bottom-0 right-0 w-1/3 h-px bg-gradient-to-l from-brand-border to-transparent" />
    </section>
  );
};

export default HeroSection;
