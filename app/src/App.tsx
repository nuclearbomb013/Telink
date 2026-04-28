import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ScrollTrigger } from '@/lib/gsap';

import { siteConfig } from '@/config';
import { useLenis } from '@/hooks/useLenis';
import { useAnimationPreferences } from '@/hooks/useReduceMotion';
import { SCROLL_CONFIG } from '@/constants/animation.constants';
import { AuthProvider } from '@/context/AuthContext';
import ErrorBoundary from '@/components/ErrorBoundary';
import CustomCursor from '@/components/CustomCursor';
import NoiseOverlay from '@/components/NoiseOverlay';
import SkipToContent from '@/components/SkipToContent';
import ProtectedRoute from '@/components/ProtectedRoute';
import Navigation from '@/sections/Navigation';
import Footer from '@/sections/Footer';
import HomePage from '@/pages/HomePage';
import ArticlesListPage from '@/pages/ArticlesListPage';
import ArticleDetailPage from '@/pages/ArticleDetailPage';
import SubmitArticlePage from '@/pages/SubmitArticlePage';
import ForumListPage from '@/pages/ForumListPage';
import ForumPostPage from '@/pages/ForumPostPage';
import ForumCreatePage from '@/pages/ForumCreatePage';
import UserProfilePage from '@/pages/UserProfilePage';
import ProfileEditPage from '@/pages/ProfileEditPage';
import ForumEditPage from '@/pages/ForumEditPage';
import AuthLoginPage from '@/pages/AuthLoginPage';
import AuthRegisterPage from '@/pages/AuthRegisterPage';
import AuthForgotPassword from '@/pages/AuthForgotPassword';
import NewsTimeline from '@/components/News/NewsTimeline';
import DeveloperShowcaseSection from '@/sections/DeveloperShowcaseSection';
import MomentsPage from '@/pages/MomentsPage';
import MessagesPage from '@/pages/MessagesPage';
import ChatPage from '@/pages/ChatPage';
import { syncCacheWithDb } from '@/lib/cache';

/**
 * Main App Component
 *
 * Root component that initializes all services and renders
 * the page sections. Wrapped with ErrorBoundary for error handling.
 */
function App() {
  // Initialize Lenis smooth scroll with excluded selectors for nested scroll containers
  useLenis({
    excludedSelectors: [
      '[data-native-scroll]',
      '.virtual-scroll-container',
      '#news-timeline-container'
    ]
  });
  
  // Get animation preferences for cursor handling
  const { shouldAnimate } = useAnimationPreferences();

  // Set document metadata
  useEffect(() => {
    // Set document title and language from config
    if (siteConfig.title) {
      document.title = siteConfig.title;
    }
    if (siteConfig.language) {
      document.documentElement.lang = siteConfig.language;
    }
    if (siteConfig.description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', siteConfig.description);
      }
    }
  }, []);

  // Sync cache with database version on startup
  // This clears localStorage cache if backend database was reset
  useEffect(() => {
    syncCacheWithDb(true) // keepAuth = true, preserve login state
      .then((cleared) => {
        if (cleared) {
          console.warn('[App] Cache cleared due to database reset');
        }
      })
      .catch((err) => {
        console.warn('[App] Cache sync check failed:', err);
      });
  }, []);

  // Handle resize with debounced ScrollTrigger refresh
  useEffect(() => {
    const handleLoad = () => {
      ScrollTrigger.refresh();
    };

    window.addEventListener('load', handleLoad);

    let resizeTimeout: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        ScrollTrigger.refresh();
      }, SCROLL_CONFIG.refreshDelay);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('load', handleLoad);
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className={`relative min-h-screen bg-brand-linen ${shouldAnimate ? 'cursor-custom' : ''}`}>
          {/* Noise texture overlay - reduced animation for performance */}
          <NoiseOverlay />

          {/* Custom cursor - only on non-touch devices */}
          <CustomCursor />

          {/* Navigation */}
          <Navigation />

          {/* Skip link for accessibility */}
          <SkipToContent />

          {/* Main content */}
          <main id="main-content" tabIndex={-1}>
            <Routes>
              {/* 首页和文章 */}
              <Route path="/" element={<HomePage />} />
              <Route path="/articles" element={<ArticlesListPage />} />
              <Route path="/articles/:slug" element={<ArticleDetailPage />} />
              <Route path="/submit-article" element={<SubmitArticlePage />} />

              {/* 论坛 - 公开页面 */}
              <Route path="/forum" element={<ForumListPage />} />
              <Route path="/forum/:slug" element={<ForumPostPage />} />

              {/* 论坛 - 受保护页面（需要登录） */}
              <Route
                path="/forum/create"
                element={
                  <ProtectedRoute>
                    <ForumCreatePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/forum/edit/:id"
                element={
                  <ProtectedRoute>
                    <ForumEditPage />
                  </ProtectedRoute>
                }
              />

              {/* 资讯时间线 */}
              <Route path="/news-timeline" element={<NewsTimeline />} />

              {/* 开发者展示 */}
              <Route path="/developers" element={<DeveloperShowcaseSection />} />

              {/* 动态（朋友圈） */}
              <Route path="/moments" element={<MomentsPage />} />

              {/* 消息 - 受保护页面（需要登录） */}
              <Route
                path="/messages"
                element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/messages/:userId"
                element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                }
              />

              {/* 用户 */}
              <Route path="/user/:id" element={<UserProfilePage />} />
              <Route
                path="/profile/edit"
                element={
                  <ProtectedRoute>
                    <ProfileEditPage />
                  </ProtectedRoute>
                }
              />

              {/* 认证页面 */}
              <Route path="/login" element={<AuthLoginPage />} />
              <Route path="/register" element={<AuthRegisterPage />} />
              <Route path="/forgot-password" element={<AuthForgotPassword />} />
            </Routes>
          </main>

          {/* Footer - Curtain Reveal */}
          <Footer />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
