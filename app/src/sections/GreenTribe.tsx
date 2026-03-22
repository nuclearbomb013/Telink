import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ArrowRight } from 'lucide-react';

import { greenTribeConfig } from '@/config';

/**
 * Green Tribe Section Component
 *
 * Features a video background with community member cards and newsletter signup.
 */
const GreenTribe = () => {
  // All hooks must be called before any conditional logic
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Check if we should render
  const shouldRender = Boolean(greenTribeConfig.sectionTitle || greenTribeConfig.members.length > 0);

  useEffect(() => {
    if (!shouldRender) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Video playback rate based on scroll
      if (videoRef.current) {
        gsap.to(videoRef.current, {
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.5 + self.progress * 1.5;
              }
            },
          },
        });
      }

      // Cards stagger animation
      const cards = cardsRef.current?.querySelectorAll('.tribe-card');
      if (cards) {
        cards.forEach((card, index) => {
          gsap.fromTo(
            card,
            { y: 80, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.8,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: card,
                start: 'top 90%',
              },
              delay: index * 0.1,
            }
          );
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [shouldRender]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitMessage('');

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setSubmitMessage(greenTribeConfig.subscribeSuccessMessage || '感谢订阅！');
    setEmail('');
    setIsSubmitting(false);

    // Clear message after 3 seconds
    setTimeout(() => setSubmitMessage(''), 3000);
  }, [email, isSubmitting]);

  // Move conditional render to return statement
  if (!shouldRender) {
    return null;
  }

  return (
    <section ref={sectionRef} id="green-tribe" className="relative min-h-screen py-20 lg:py-32 overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover grayscale contrast-125"
          poster={greenTribeConfig.videoPoster}
          aria-hidden="true"
        >
          {greenTribeConfig.videoSrc && (
            <source src={greenTribeConfig.videoSrc} type="video/mp4" />
          )}
        </video>
        <div className="absolute inset-0 bg-brand-linen/70" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="mb-12 lg:mb-20">
          <h2 className="font-oswald font-light text-4xl lg:text-5xl xl:text-6xl text-brand-text">
            {greenTribeConfig.sectionTitle}
          </h2>
          <p className="font-roboto text-sm text-brand-dark-gray mt-4 max-w-md">
            {greenTribeConfig.sectionDescription}
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Main Cards - 8 columns */}
          <div ref={cardsRef} className="lg:col-span-8 space-y-6">
            {greenTribeConfig.members.map((member) => (
              <article
                key={member.id}
                className="tribe-card glass p-6 lg:p-8 group cursor-hover backdrop-blur-xl"
                style={{
                  backdropFilter: 'blur(20px)',
                }}
              >
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full overflow-hidden">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        width="80"
                        height="80"
                        onError={(e) => {
                          // Fallback for missing avatar
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=000&color=fff`;
                        }}
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-oswald font-medium text-lg text-brand-text">
                        {member.name}
                      </h4>
                      <span className="font-roboto text-xs text-brand-light-gray">
                        {member.role}
                      </span>
                    </div>

                    <h3 className="font-oswald font-light text-xl lg:text-2xl text-brand-text mb-3 group-hover:text-brand-dark-gray transition-colors">
                      {member.title}
                    </h3>

                    <p className="font-roboto text-sm text-brand-dark-gray leading-relaxed mb-4">
                      {member.excerpt}
                    </p>

                    <a
                      href="#"
                      className="inline-flex items-center gap-2 font-roboto text-xs uppercase tracking-wider text-brand-text hover:text-brand-dark-gray transition-colors"
                    >
                      {greenTribeConfig.readMoreText}
                      <ArrowRight size={12} className="transform transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Sidebar - 4 columns */}
          <div className="lg:col-span-4 lg:sticky lg:top-28 xl:top-32 h-fit">
            <div className="glass p-6 lg:p-8 backdrop-blur-xl">
              <h3 className="font-oswald text-xl text-brand-text mb-4">
                {greenTribeConfig.joinTitle}
              </h3>
              <p className="font-roboto text-sm text-brand-dark-gray mb-6">
                {greenTribeConfig.joinDescription}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="tribe-email" className="sr-only">
                    {greenTribeConfig.emailPlaceholder}
                  </label>
                  <input
                    id="tribe-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={greenTribeConfig.emailPlaceholder}
                    required
                    disabled={isSubmitting}
                    className="w-full px-4 py-3 bg-transparent border border-brand-border text-brand-text placeholder:text-brand-light-gray text-sm focus:outline-none focus:border-brand-text transition-colors disabled:opacity-50"
                    aria-describedby={submitMessage ? 'submit-message' : undefined}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className="w-full px-4 py-3 bg-brand-text text-brand-linen font-roboto text-sm uppercase tracking-wider hover:bg-brand-dark-gray transition-colors cursor-hover disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '提交中...' : greenTribeConfig.subscribeText}
                </button>
              </form>

              {submitMessage && (
                <div
                  id="submit-message"
                  className="mt-4 p-3 bg-green-50 text-green-800 text-sm font-roboto"
                  role="status"
                  aria-live="polite"
                >
                  {submitMessage}
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-brand-border">
                <p className="font-roboto text-xs text-brand-light-gray">
                  {greenTribeConfig.memberCountText}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GreenTribe;
