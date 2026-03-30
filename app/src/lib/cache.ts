/**
 * Cache Utility - 缓存管理工具
 *
 * 提供版本检查和缓存清理功能，解决数据库重置后前端缓存不一致的问题
 */

/**
 * 所有 localStorage 键名列表
 * 当数据库重置时，这些缓存数据需要清理
 */
export const CACHE_KEYS = {
  // Auth (认证相关 - 通常保留)
  CURRENT_USER: 'techink_current_user',
  REFRESH_TOKEN: 'techink_refresh_token',
  AUTH_TOKEN: 'techink_auth_token',

  // Articles (文章)
  ARTICLES: 'techink_articles',
  ARTICLE_COUNTER: 'techink_article_counter',

  // Moments (动态)
  MOMENTS: 'techink_moments',
  MOMENT_COMMENTS: 'techink_moment_comments',
  MOMENT_LIKES: 'techink_moment_likes',
  MOMENT_COUNTER: 'techink_moment_counter',

  // Users (用户)
  USERS_DATA: 'techink_users_data',
  USER_COUNTER: 'techink_forum_user_counter',

  // Messages (消息)
  MESSAGES: 'techink_messages',
  MESSAGE_COUNTER: 'techink_message_counter',

  // Follows (关注)
  FOLLOWS: 'techink_follows',

  // Submissions (投稿)
  SUBMISSIONS: 'techink_submissions',

  // Forum likes (论坛帖子点赞)
  FORUM_POST_LIKES: 'techink_forum_post_likes',

  // System version (系统版本 - 用于缓存同步)
  DB_VERSION: 'techink_db_version',
} as const;

/**
 * 缓存版本键名
 */
const VERSION_KEY = CACHE_KEYS.DB_VERSION;

/**
 * 系统信息接口响应类型
 */
interface SystemInfo {
  version: string;
  db_version: string;
  db_timestamp: string;
  app_name: string;
}

/**
 * 清理所有缓存数据
 *
 * @param keepAuth - 是否保留认证信息（默认保留，避免用户被迫重新登录）
 * @returns 清理的键数量
 */
export function clearAllCache(keepAuth: boolean = true): number {
  const keysToRemove = Object.values(CACHE_KEYS).filter((key) => {
    if (keepAuth) {
      // 保留认证相关数据
      const authKeys = [
        CACHE_KEYS.CURRENT_USER,
        CACHE_KEYS.REFRESH_TOKEN,
        CACHE_KEYS.AUTH_TOKEN,
      ];
      return !authKeys.includes(key);
    }
    return true;
  });

  let clearedCount = 0;
  keysToRemove.forEach((key) => {
    // Handle dynamic keys like techink_moment_likes_{userId}
    if (key === CACHE_KEYS.MOMENT_LIKES) {
      // Clear all moment likes keys (they have userId suffix)
      for (let i = 0; i < localStorage.length; i++) {
        const storedKey = localStorage.key(i);
        if (storedKey && storedKey.startsWith('techink_moment_likes_')) {
          localStorage.removeItem(storedKey);
          clearedCount++;
        }
      }
    } else if (key === CACHE_KEYS.FORUM_POST_LIKES) {
      // Clear all forum post likes keys
      for (let i = 0; i < localStorage.length; i++) {
        const storedKey = localStorage.key(i);
        if (storedKey && storedKey.startsWith('techink_forum_post_likes')) {
          localStorage.removeItem(storedKey);
          clearedCount++;
        }
      }
    } else {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });

  console.log(`[Cache] Cleared ${clearedCount} cache entries`);
  return clearedCount;
}

/**
 * 获取当前缓存的数据库版本
 */
export function getStoredDbVersion(): string | null {
  return localStorage.getItem(VERSION_KEY);
}

/**
 * 保存数据库版本到缓存
 */
export function saveDbVersion(version: string): void {
  localStorage.setItem(VERSION_KEY, version);
}

/**
 * 从后端获取系统信息（包含数据库版本）
 */
export async function fetchSystemInfo(): Promise<SystemInfo | null> {
  try {
    const response = await fetch('/api/v1/system/info');
    if (!response.ok) {
      console.warn('[Cache] Failed to fetch system info:', response.status);
      return null;
    }
    return await response.json();
  } catch (error) {
    console.warn('[Cache] Error fetching system info:', error);
    return null;
  }
}

/**
 * 检查数据库版本是否更新
 *
 * @returns true 表示版本已更新，需要清理缓存
 */
export async function checkDbVersionUpdate(): Promise<boolean> {
  const systemInfo = await fetchSystemInfo();
  if (!systemInfo) {
    // 无法获取系统信息，可能后端未启动，跳过检查
    return false;
  }

  const storedVersion = getStoredDbVersion();
  const currentVersion = systemInfo.db_version;

  if (!storedVersion) {
    // 第一次启动，保存当前版本
    saveDbVersion(currentVersion);
    return false;
  }

  if (storedVersion !== currentVersion) {
    console.log(
      `[Cache] Database version changed: ${storedVersion} -> ${currentVersion}`
    );
    return true;
  }

  return false;
}

/**
 * 自动检查版本并清理缓存（如果需要）
 *
 * @param keepAuth - 是否保留认证信息
 * @returns 是否执行了缓存清理
 */
export async function syncCacheWithDb(keepAuth: boolean = true): Promise<boolean> {
  const needsUpdate = await checkDbVersionUpdate();

  if (needsUpdate) {
    console.log('[Cache] Database reset detected, clearing cache...');
    const systemInfo = await fetchSystemInfo();
    clearAllCache(keepAuth);

    // Save new version
    if (systemInfo) {
      saveDbVersion(systemInfo.db_version);
    }

    return true;
  }

  return false;
}

/**
 * 强制清理缓存并刷新页面
 *
 * @param keepAuth - 是否保留认证信息
 */
export function forceClearCacheAndReload(keepAuth: boolean = false): void {
  clearAllCache(keepAuth);
  window.location.reload();
}