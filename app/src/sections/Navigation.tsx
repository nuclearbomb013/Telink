import { useState, useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Search, X, User, MessageCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { navigationConfig } from '@/config';
import { useReduceMotion } from '@/hooks/useReduceMotion';
import { useAuthContext } from '@/context/AuthContext'; // Import context hook directly
import NotificationBell from '@/components/Notification/NotificationBell';
import UserAvatar from '@/components/Forum/UserAvatar';

/**
 * Navigation Component
 *
 * Fixed navigation with scroll-based compact mode and search overlay.
 */
const Navigation = () => {
  // All hooks must be called before any conditional logic
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);
  const searchOverlayRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const prefersReducedMotion = useReduceMotion();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser: user, isAuthenticated, logout } = useAuthContext(); // Use context directly
  const isHomePage = location.pathname === '/';

  // Check if we should render
  const shouldRender = Boolean(navigationConfig.brandName || navigationConfig.links.length > 0);

  useEffect(() => {
    if (!shouldRender || prefersReducedMotion) return;

    // Initial animation
    const tl = gsap.timeline();

    tl.fromTo(
      logoRef.current,
      { scale: 0.8, rotation: -5, opacity: 0 },
      { scale: 1, rotation: 0, opacity: 1, duration: 1.2, ease: 'elastic.out(1, 0.5)' }
    );

    if (linksRef.current) {
      const links = linksRef.current.querySelectorAll('a');
      tl.fromTo(
        links,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, ease: 'power3.out' },
        '-=0.8'
      );
    }

    // Scroll trigger for compact mode - use position to check scroll position
    const trigger = ScrollTrigger.create({
      start: '100px top',
      onUpdate: (self) => {
        setIsScrolled(self.scroll() > 100);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [prefersReducedMotion, shouldRender]);

  // Handle search overlay animation
  useEffect(() => {
    if (isSearchOpen && searchOverlayRef.current) {
      gsap.fromTo(
        searchOverlayRef.current,
        { clipPath: 'circle(0% at calc(100% - 40px) 40px)' },
        { clipPath: 'circle(150% at calc(100% - 40px) 40px)', duration: 0.8, ease: 'power3.out' }
      );
      // Focus input after animation
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen]);

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!shouldRender) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Open search with Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
      // Close search with Escape
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
      // Close user menu with Escape
      if (e.key === 'Escape' && isUserMenuOpen) {
        setIsUserMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, isUserMenuOpen, shouldRender]);

  // Handle click outside user menu
  useEffect(() => {
    if (!isUserMenuOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Effect to close user menu when user becomes unauthenticated
  useEffect(() => {
    if (!isAuthenticated && isUserMenuOpen) {
      setIsUserMenuOpen(false);
    }
  }, [isAuthenticated, isUserMenuOpen]);

  // Listen for global logout event to ensure UI updates properly
  useEffect(() => {
    const handleGlobalLogout = () => {
      setIsUserMenuOpen(false);
    };

    window.addEventListener('auth:logout', handleGlobalLogout);
    return () => window.removeEventListener('auth:logout', handleGlobalLogout);
  }, []);

  const handleLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    
    // If it's a route link (starts with /), use React Router navigation
    if (href.startsWith('/')) {
      navigate(href);
      return;
    }
    
    // For anchor links like #hero, #topics, etc.
    // If not on home page, first navigate to home then scroll
    if (!isHomePage) {
      navigate('/' + href);
      return;
    }
    
    // Already on home page, scroll to section
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth' });
    }
  }, [prefersReducedMotion, isHomePage, navigate]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // TODO: Implement search functionality
      // For now, just close the search and clear the query
      setIsSearchOpen(false);
      setSearchQuery('');
    }
  }, [searchQuery]);

  // Move conditional render to return statement
  if (!shouldRender) {
    return null;
  }

  return (
    <>
      <nav
        ref={navRef}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-expo-out ${
          isScrolled
            ? 'py-3 glass border-b border-brand-border/30'
            : 'py-6'
        }`}
        role="navigation"
        aria-label="主导航"
      >
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className={`flex items-center transition-all duration-700 ease-expo-out ${
            isScrolled ? 'justify-between' : 'flex-col gap-6 lg:flex-row lg:justify-between'
          }`}>
            {/* Logo */}
            <div
              ref={logoRef}
              className={`font-oswald font-light tracking-widest transition-all duration-700 ease-expo-out ${
                isScrolled ? 'text-2xl' : 'text-4xl lg:text-5xl'
              }`}
            >
              <Link 
                to="/" 
                className="magnetic cursor-hover text-brand-text hover:text-brand-dark-gray transition-colors"
                aria-label={`${navigationConfig.brandName} - 返回首页`}
              >
                {navigationConfig.brandName}
              </Link>
            </div>

            {/* Navigation Links */}
            <div
              ref={linksRef}
              className={`flex items-center transition-all duration-700 ease-expo-out ${
                isScrolled ? 'gap-6 lg:gap-8' : 'gap-4 lg:gap-10 flex-wrap justify-center'
              }`}
            >
              {navigationConfig.links.map((link) => {
                // Check if the link is a route (starts with /) or an anchor link
                const isRoute = link.href.startsWith('/');

                if (isRoute) {
                  return (
                    <Link
                      key={link.label}
                      to={link.href}
                      className="magnetic cursor-hover font-roboto text-xs tracking-wider uppercase text-brand-dark-gray hover:text-brand-text transition-colors relative liquid-underline"
                    >
                      {link.label}
                    </Link>
                  );
                }

                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="magnetic cursor-hover font-roboto text-xs tracking-wider uppercase text-brand-dark-gray hover:text-brand-text transition-colors relative liquid-underline"
                  >
                    {link.label}
                  </a>
                );
              })}

              {/* Search Button */}
              <button
                onClick={() => setIsSearchOpen(true)}
                className="magnetic cursor-hover p-2 text-brand-dark-gray hover:text-brand-text transition-colors"
                aria-label={navigationConfig.searchAriaLabel}
                title="搜索 (Cmd/Ctrl + K)"
              >
                <Search size={18} />
              </button>

              {/* 通知铃铛（仅已登录用户） */}
              {isAuthenticated && <NotificationBell />}

              {/* 用户菜单 */}
              <div ref={userMenuRef} className="relative">
                {isAuthenticated ? (
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="magnetic cursor-hover flex items-center gap-2 p-1.5 rounded-lg hover:bg-brand-linen transition-colors"
                    aria-label="用户菜单"
                  >
                    <UserAvatar
                      username={user?.username || '用户'}
                      avatarUrl={user?.avatar}
                      size="sm"
                      className="flex-shrink-0"
                    />
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="magnetic cursor-hover flex items-center gap-2 p-1.5 rounded-lg text-brand-dark-gray hover:text-brand-text hover:bg-brand-linen transition-colors"
                    aria-label="登录"
                  >
                    <User size={18} />
                    <span className="font-roboto text-xs">登录</span>
                  </Link>
                )}

                {/* 用户下拉菜单 */}
                {isUserMenuOpen && user && (
                  <>
                    {/* 背景遮罩 */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsUserMenuOpen(false)}
                    />

                    {/* 下拉面板 */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-brand-border/30 z-50 overflow-hidden">
                      {/* 用户信息 */}
                      <div className="px-4 py-3 border-b border-brand-border/30">
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            username={user.username}
                            avatarUrl={user.avatar}
                            size="md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-roboto text-sm font-medium text-brand-text truncate">
                              {user.username}
                            </p>
                            {user.role && (
                              <p className="font-roboto text-xs text-brand-dark-gray/60 capitalize">
                                {user.role === 'admin' && '管理员'}
                                {user.role === 'moderator' && '版主'}
                                {user.role === 'user' && '会员'}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* 菜单项 */}
                      <div className="py-2">
                        <Link
                          to={`/user/${user.id}`}
                          className="block px-4 py-2 font-roboto text-sm text-brand-dark-gray hover:bg-brand-linen hover:text-brand-text transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          个人主页
                        </Link>
                        <Link
                          to="/moments"
                          className="block px-4 py-2 font-roboto text-sm text-brand-dark-gray hover:bg-brand-linen hover:text-brand-text transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          动态
                        </Link>
                        <Link
                          to="/messages"
                          className="flex items-center gap-2 px-4 py-2 font-roboto text-sm text-brand-dark-gray hover:bg-brand-linen hover:text-brand-text transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <MessageCircle size={14} />
                          消息
                        </Link>
                        <Link
                          to="/forum"
                          className="block px-4 py-2 font-roboto text-sm text-brand-dark-gray hover:bg-brand-linen hover:text-brand-text transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          论坛
                        </Link>
                        <Link
                          to="/forum/create"
                          className="block px-4 py-2 font-roboto text-sm text-brand-dark-gray hover:bg-brand-linen hover:text-brand-text transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          发帖
                        </Link>
                      </div>

                      {/* 登出按钮 */}
                      <div className="py-2 border-t border-brand-border/30">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserMenuOpen(false);
                            navigate('/');
                          }}
                          className="w-full px-4 py-2 text-left font-roboto text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          退出登录
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Overlay */}
      {isSearchOpen && (
        <div
          ref={searchOverlayRef}
          className="fixed inset-0 z-[100] bg-brand-linen flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="搜索"
        >
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-6 right-6 p-2 text-brand-text hover:text-brand-dark-gray transition-colors cursor-hover"
            aria-label={navigationConfig.closeSearchAriaLabel}
          >
            <X size={32} />
          </button>

          <form onSubmit={handleSearchSubmit} className="w-full max-w-2xl px-6">
            <label htmlFor="search-input" className="sr-only">
              {navigationConfig.searchPlaceholder}
            </label>
            <input
              id="search-input"
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={navigationConfig.searchPlaceholder}
              className="w-full bg-transparent border-b-2 border-brand-text py-4 text-3xl lg:text-5xl font-oswald font-light placeholder:text-brand-light-gray focus:outline-none"
              autoFocus
            />
            <div className="mt-4 flex items-center justify-between text-sm text-brand-dark-gray">
              <p>{navigationConfig.searchHint}</p>
              <kbd className="hidden sm:inline-block px-2 py-1 bg-brand-border/20 rounded text-xs">
                ESC
              </kbd>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default Navigation;
