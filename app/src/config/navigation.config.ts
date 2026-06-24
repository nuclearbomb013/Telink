// ============================================================
// Navigation
// ============================================================

export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  brandName: string;
  links: NavLink[];
  searchPlaceholder: string;
  searchHint: string;
  searchAriaLabel: string;
  closeSearchAriaLabel: string;
}

export const navigationConfig: NavigationConfig = {
  brandName: 'TechInk',
  links: [
    { label: '首页', href: '/' },
    { label: '文章', href: '/articles' },
    { label: '投稿', href: '/submit-article' },
    { label: '论坛', href: '/forum' },
    { label: '动态', href: '/moments' },
    { label: '热点', href: '/news-timeline' },
    { label: '设计', href: '#design' },
    { label: '开发者', href: '/developers' },
  ],
  searchPlaceholder: '搜索文章、话题、开发者...',
  searchHint: '按 Enter 搜索，按 ESC 关闭',
  searchAriaLabel: '搜索',
  closeSearchAriaLabel: '关闭搜索',
};
