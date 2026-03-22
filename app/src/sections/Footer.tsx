import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ArrowUp, Instagram, Twitter, Youtube } from 'lucide-react';
import { footerConfig } from '@/config';

/**
 * Footer Component
 *
 * Curtain reveal footer with newsletter signup and navigation links.
 */
const Footer = () => {
  // All hooks must be called before any conditional logic
  const footerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState('');
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  // Check if we should render
  const shouldRender = Boolean(footerConfig.copyright || footerConfig.newsletterTitle);

  useEffect(() => {
    if (!shouldRender) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      return;
    }

    const ctx = gsap.context(() => {
      // Footer reveal animation
      gsap.fromTo(
        contentRef.current,
        { scale: 0.9, opacity: 0.8 },
        {
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: footerRef.current,
            start: 'top 90%',
            end: 'top 50%',
            scrub: true,
          },
        }
      );
    }, footerRef);

    return () => ctx.revert();
  }, [shouldRender]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Simulate API call - replace with actual newsletter signup API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSubmitStatus('success');
      setEmail('');
    } catch {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }

    // Clear status after 3 seconds
    setTimeout(() => setSubmitStatus('idle'), 3000);
  }, [email, isSubmitting]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Move conditional render to return statement
  if (!shouldRender) {
    return null;
  }

  const inputId = 'footer-email-input';

  return (
    <footer
      ref={footerRef}
      id="about"
      className={`relative py-20 lg:py-32 transition-colors duration-500 ${
        isEmailFocused ? 'bg-brand-text' : 'bg-brand-linen'
      }`}
    >
      {/* Background Watermark */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div
          className={`absolute -bottom-20 -right-10 font-oswald font-extralight text-[20vw] leading-none select-none transition-colors duration-500 ${
            isEmailFocused ? 'text-brand-dark-gray/10' : 'text-brand-border'
          }`}
        >
          {footerConfig.brandWatermark}
        </div>
      </div>

      <div ref={contentRef} className="relative z-10 max-w-[1600px] mx-auto px-6 lg:px-12">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Newsletter - 4 columns */}
          <div className="lg:col-span-4">
            <h3
              className={`font-oswald font-light text-2xl lg:text-3xl mb-4 transition-colors duration-500 ${
                isEmailFocused ? 'text-brand-linen' : 'text-brand-text'
              }`}
            >
              {footerConfig.newsletterTitle}
            </h3>
            <p
              className={`font-roboto text-sm mb-6 transition-colors duration-500 ${
                isEmailFocused ? 'text-brand-light-gray' : 'text-brand-dark-gray'
              }`}
            >
              {footerConfig.newsletterDescription}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor={inputId} className="sr-only">
                  {footerConfig.emailPlaceholder}
                </label>
                <input
                  id={inputId}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                  placeholder={footerConfig.emailPlaceholder}
                  required
                  disabled={isSubmitting}
                  className={`w-full px-0 py-3 bg-transparent border-b text-sm focus:outline-none transition-colors duration-500 disabled:opacity-50 ${
                    isEmailFocused
                      ? 'border-brand-light-gray text-brand-linen placeholder:text-brand-dark-gray'
                      : 'border-brand-border text-brand-text placeholder:text-brand-light-gray focus:border-brand-text'
                  }`}
                  aria-describedby={submitStatus !== 'idle' ? 'submit-status' : undefined}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !email.trim()}
                className={`px-6 py-3 font-roboto text-sm uppercase tracking-wider transition-colors duration-300 cursor-hover disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEmailFocused
                    ? 'bg-brand-linen text-brand-text hover:bg-brand-border'
                    : 'bg-brand-text text-brand-linen hover:bg-brand-dark-gray'
                }`}
              >
                {isSubmitting ? '提交中...' : footerConfig.subscribeText}
              </button>
            </form>

            {/* Status Messages */}
            <div id="submit-status" role="status" aria-live="polite">
              {submitStatus === 'success' && (
                <p className={`mt-4 text-sm font-roboto ${isEmailFocused ? 'text-green-300' : 'text-green-600'}`}>
                  {footerConfig.subscribeSuccessMessage}
                </p>
              )}
              {submitStatus === 'error' && (
                <p className={`mt-4 text-sm font-roboto ${isEmailFocused ? 'text-red-300' : 'text-red-600'}`}>
                  订阅失败，请稍后重试
                </p>
              )}
            </div>
          </div>

          {/* Categories - 2 columns */}
          <div className="lg:col-span-2">
            <h4
              className={`font-oswald text-xs uppercase tracking-widest mb-4 transition-colors duration-500 ${
                isEmailFocused ? 'text-brand-light-gray' : 'text-brand-dark-gray'
              }`}
            >
              {footerConfig.categoriesLabel}
            </h4>
            <ul className="space-y-2">
              {footerConfig.categories.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className={`font-roboto text-sm transition-colors duration-300 cursor-hover ${
                      isEmailFocused
                        ? 'text-brand-linen hover:text-brand-light-gray'
                        : 'text-brand-text hover:text-brand-dark-gray'
                    }`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Pages - 2 columns */}
          <div className="lg:col-span-2">
            <h4
              className={`font-oswald text-xs uppercase tracking-widest mb-4 transition-colors duration-500 ${
                isEmailFocused ? 'text-brand-light-gray' : 'text-brand-dark-gray'
              }`}
            >
              {footerConfig.pagesLabel}
            </h4>
            <ul className="space-y-2">
              {footerConfig.pages.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className={`font-roboto text-sm transition-colors duration-300 cursor-hover ${
                      isEmailFocused
                        ? 'text-brand-linen hover:text-brand-light-gray'
                        : 'text-brand-text hover:text-brand-dark-gray'
                    }`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal - 2 columns */}
          <div className="lg:col-span-2">
            <h4
              className={`font-oswald text-xs uppercase tracking-widest mb-4 transition-colors duration-500 ${
                isEmailFocused ? 'text-brand-light-gray' : 'text-brand-dark-gray'
              }`}
            >
              {footerConfig.legalLabel}
            </h4>
            <ul className="space-y-2">
              {footerConfig.legalLinks.map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className={`font-roboto text-sm transition-colors duration-300 cursor-hover ${
                      isEmailFocused
                        ? 'text-brand-linen hover:text-brand-light-gray'
                        : 'text-brand-text hover:text-brand-dark-gray'
                    }`}
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Back to Top - 2 columns */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div>
              <h4
                className={`font-oswald text-xs uppercase tracking-widest mb-4 transition-colors duration-500 ${
                  isEmailFocused ? 'text-brand-light-gray' : 'text-brand-dark-gray'
                }`}
              >
                {footerConfig.socialLabel}
              </h4>
              <div className="flex items-center gap-4">
                <a
                  href={footerConfig.socialLinks.instagram}
                  className={`transition-colors duration-300 cursor-hover ${
                    isEmailFocused
                      ? 'text-brand-linen hover:text-brand-light-gray'
                      : 'text-brand-text hover:text-brand-dark-gray'
                  }`}
                  aria-label="Instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Instagram size={20} />
                </a>
                <a
                  href={footerConfig.socialLinks.twitter}
                  className={`transition-colors duration-300 cursor-hover ${
                    isEmailFocused
                      ? 'text-brand-linen hover:text-brand-light-gray'
                      : 'text-brand-text hover:text-brand-dark-gray'
                  }`}
                  aria-label="Twitter"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter size={20} />
                </a>
                <a
                  href={footerConfig.socialLinks.youtube}
                  className={`transition-colors duration-300 cursor-hover ${
                    isEmailFocused
                      ? 'text-brand-linen hover:text-brand-light-gray'
                      : 'text-brand-text hover:text-brand-dark-gray'
                  }`}
                  aria-label="YouTube"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Youtube size={20} />
                </a>
              </div>
            </div>

            <button
              onClick={scrollToTop}
              className={`mt-8 lg:mt-0 inline-flex items-center gap-2 font-roboto text-xs uppercase tracking-wider transition-colors duration-300 cursor-hover group ${
                isEmailFocused
                  ? 'text-brand-linen hover:text-brand-light-gray'
                  : 'text-brand-text hover:text-brand-dark-gray'
              }`}
              aria-label="返回顶部"
            >
              {footerConfig.backToTopText}
              <ArrowUp size={14} className="transform transition-transform duration-300 group-hover:-translate-y-1" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          className={`mt-16 pt-8 border-t transition-colors duration-500 ${
            isEmailFocused ? 'border-brand-dark-gray' : 'border-brand-border'
          }`}
        >
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p
              className={`font-roboto text-xs transition-colors duration-500 ${
                isEmailFocused ? 'text-brand-dark-gray' : 'text-brand-light-gray'
              }`}
            >
              {footerConfig.copyright}
            </p>
            <p
              className={`font-roboto text-xs transition-colors duration-500 ${
                isEmailFocused ? 'text-brand-dark-gray' : 'text-brand-light-gray'
              }`}
            >
              {footerConfig.credit}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
