/**
 * SkipToContent Component
 *
 * Provides a skip link for keyboard users to bypass navigation
 * and jump directly to the main content. Essential for accessibility.
 *
 * @example
 * ```tsx
 * <SkipToContent contentId="main-content" />
 * ```
 */
interface SkipToContentProps {
  /** ID of the main content element to skip to */
  contentId?: string;
}

const SkipToContent = ({ contentId = 'main-content' }: SkipToContentProps) => {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const content = document.getElementById(contentId);
    if (content) {
      content.focus();
      content.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <a
      href={`#${contentId}`}
      onClick={handleClick}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
                 focus:z-[100] focus:px-4 focus:py-2 
                 focus:bg-brand-text focus:text-brand-linen 
                 focus:font-roboto focus:text-sm focus:uppercase focus:tracking-wider
                 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-text"
    >
      跳转到主要内容
    </a>
  );
};

export default SkipToContent;
