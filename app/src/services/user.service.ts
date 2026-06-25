/**
 * User Service - 用户服务
 *
 * NOW BACKED BY REAL BACKEND API (no more localStorage mock).
 * All user queries go through the backend /users endpoints.
 *
 * Current-user caching (techink_current_user) is retained as a UI convenience
 * but the authoritative source is always the backend /auth/me response.
 */

import type {
  User,
  UserStats,
  UserPostStats,
  UserServiceResponse,
  CurrentUser,
} from './user.types';
import type { DeveloperProfile, GetDevelopersParams, DevelopersResponse } from './developer.types';
import { userApi } from '@/lib/apiClient';

// ──────────────────── Helpers ────────────────────

const CURRENT_USER_KEY = 'techink_current_user';

function successResponse<T>(data: T): UserServiceResponse<T> {
  return { success: true, data, timestamp: Date.now() };
}

function errorResponse(code: string, message: string, details?: unknown): UserServiceResponse<never> {
  return { success: false, error: { code, message, details }, timestamp: Date.now() };
}

// ──────────────────── UserService ────────────────────

class UserService {
  private currentUser: CurrentUser | null = null;
  private logoutHandler: (() => void) | null = null;

  constructor() {
    this.loadCurrentUserFromCache();
    this.logoutHandler = () => {
      this.currentUser = null;
      localStorage.removeItem(CURRENT_USER_KEY);
    };
    window.addEventListener('auth:logout', this.logoutHandler);
  }

  public destroy(): void {
    if (this.logoutHandler) {
      window.removeEventListener('auth:logout', this.logoutHandler);
      this.logoutHandler = null;
    }
  }

  // ──────────── Current User Cache (UI convenience, NOT source of truth) ────────

  private loadCurrentUserFromCache(): void {
    try {
      const stored = localStorage.getItem(CURRENT_USER_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch {
      this.currentUser = null;
    }
  }

  getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  setCurrentUser(user: CurrentUser): void {
    this.currentUser = user;
    try {
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
    } catch { /* noop */ }
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(CURRENT_USER_KEY);
  }

  // ──────────── User Queries (real backend API) ────────────

  async getUserById(id: number): Promise<UserServiceResponse<User>> {
    try {
      const response = await userApi.getById(id);
      if (!response.success || !response.data) {
        return errorResponse('NOT_FOUND', '用户不存在');
      }
      return successResponse({
        id: response.data.id,
        username: response.data.username,
        avatar: response.data.avatar,
        bio: response.data.bio,
        role: response.data.role as User['role'],
        postCount: response.data.postCount,
        commentCount: response.data.commentCount,
        likeCount: response.data.likeCount,
        joinedAt: response.data.joinedAt,
        lastActiveAt: undefined,
      });
    } catch (err) {
      return errorResponse('FETCH_ERROR', '获取用户失败', err);
    }
  }

  async getUserByUsername(username: string): Promise<UserServiceResponse<User>> {
    try {
      const response = await userApi.getByUsername(username);
      if (!response.success || !response.data) {
        return errorResponse('NOT_FOUND', '用户不存在');
      }
      return successResponse({
        id: response.data.id,
        username: response.data.username,
        avatar: response.data.avatar,
        bio: response.data.bio,
        role: response.data.role as User['role'],
        postCount: response.data.postCount,
        commentCount: response.data.commentCount,
        likeCount: response.data.likeCount,
        joinedAt: response.data.joinedAt,
        lastActiveAt: undefined,
      });
    } catch (err) {
      return errorResponse('FETCH_ERROR', '获取用户失败', err);
    }
  }

  async getAllUsers(): Promise<UserServiceResponse<User[]>> {
    try {
      const response = await userApi.list({ limit: 100 });
      if (!response.success || !response.data) {
        return errorResponse('FETCH_ERROR', '获取用户列表失败');
      }
      const users: User[] = response.data.users.map(u => ({
        id: u.id,
        username: u.username,
        avatar: u.avatar,
        bio: u.bio,
        role: u.role as User['role'],
        postCount: u.postCount,
        commentCount: u.commentCount,
        likeCount: u.likeCount,
        joinedAt: u.joinedAt,
        lastActiveAt: undefined,
      }));
      return successResponse(users.sort((a, b) => b.likeCount - a.likeCount));
    } catch (err) {
      return errorResponse('FETCH_ERROR', '获取用户列表失败', err);
    }
  }

  async getStats(): Promise<UserServiceResponse<UserStats>> {
    try {
      // Use backend summary stats endpoint for accurate server-side counts
      const summaryResp = await userApi.getSummaryStats();
      if (summaryResp.success && summaryResp.data) {
        const s = summaryResp.data;
        return successResponse({
          totalUsers: s.totalUsers,
          newUsersThisWeek: s.newUsersThisWeek,
          newUsersThisMonth: s.newUsersThisMonth,
          topContributors: [],
        });
      }

      // Fallback: use paginated user list (approximate, limited to first 100)
      console.warn('[user.service] Summary stats unavailable, falling back to approximate list-based stats');
      const response = await userApi.list({ limit: 100 });
      if (!response.success || !response.data) {
        return errorResponse('STATS_ERROR', '获取统计信息失败');
      }
      const users = response.data.users;
      const now = Date.now();
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;

      const newUsersThisWeek = users.filter(u => u.joinedAt > weekAgo).length;
      const newUsers = users.filter(u => u.joinedAt > monthAgo).length;

      return successResponse({
        totalUsers: response.data.total,
        newUsersThisWeek,
        newUsersThisMonth: newUsers,
        topContributors: users
          .sort((a, b) => b.likeCount - a.likeCount)
          .slice(0, 10)
          .map(u => ({
            id: u.id,
            username: u.username,
            avatar: u.avatar,
            bio: u.bio,
            role: u.role as User['role'],
            postCount: u.postCount,
            commentCount: u.commentCount,
            likeCount: u.likeCount,
            joinedAt: u.joinedAt,
            lastActiveAt: undefined,
          })),
      });
    } catch (err) {
      return errorResponse('STATS_ERROR', '获取统计信息失败', err);
    }
  }

  async getUserStats(userId: number): Promise<UserServiceResponse<UserPostStats>> {
    try {
      const [userResp, statsResp] = await Promise.all([
        userApi.getById(userId),
        userApi.getStats(userId),
      ]);
      if (!userResp.success || !userResp.data) {
        return errorResponse('NOT_FOUND', '用户不存在');
      }
      const u = userResp.data;
      const stats = statsResp.success && statsResp.data ? statsResp.data : null;

      // Use backend aggregate stats (total_post_likes, total_post_views)
      // instead of fetching posts and summing client-side.
      // posts array kept empty for backward compatibility.
      return successResponse({
        userId,
        username: u.username,
        totalPosts: u.postCount,
        totalLikes: stats?.totalPostLikes ?? 0,
        totalViews: stats?.totalPostViews ?? 0,
        posts: [],
      });
    } catch (err) {
      return errorResponse('STATS_ERROR', '获取用户统计失败', err);
    }
  }

  async updateUser(data: { id: number; username?: string; avatar?: string; bio?: string }): Promise<UserServiceResponse<User>> {
    try {
      // Only send editable profile fields — no sentinel values for non-editable fields
      const response = await userApi.update(data.id, {
        username: data.username,
        avatar: data.avatar,
        bio: data.bio,
      });
      if (!response.success || !response.data) {
        return errorResponse('UPDATE_ERROR', response.error?.message || '更新失败');
      }
      const d = response.data;
      return successResponse({
        id: d.id,
        username: d.username,
        avatar: d.avatar,
        bio: d.bio,
        role: d.role as User['role'],
        postCount: d.postCount,
        commentCount: d.commentCount,
        likeCount: d.likeCount,
        joinedAt: d.joinedAt,
        lastActiveAt: undefined,
      });
    } catch (err) {
      return errorResponse('UPDATE_ERROR', '更新用户失败', err);
    }
  }

  async updateAvatar(userId: number, avatarDataUrl: string): Promise<UserServiceResponse<User>> {
    return this.updateUser({ id: userId, avatar: avatarDataUrl });
  }

  // ──────────── Developer methods (already real API; kept as-is) ────────────

  async getDevelopers(params: GetDevelopersParams = {}): Promise<DevelopersResponse> {
    const response = await userApi.list({ page: 1, limit: 100 });
    if (!response.success || !response.data) {
      return { developers: [], totalCount: 0, hasMore: false };
    }
    const users: User[] = response.data.users.map(u => ({
      id: u.id, username: u.username, avatar: u.avatar, bio: u.bio,
      role: u.role as User['role'], postCount: u.postCount,
      commentCount: u.commentCount, likeCount: u.likeCount,
      joinedAt: u.joinedAt, lastActiveAt: undefined,
    }));
    let developers = users.map(user => ({
      ...user,
      displayName: user.username,
      expertise: this._getDefaultExpertise(user.username),
      githubUrl: this._getDefaultSocialUrl(user.username, 'github'),
      portfolioUrl: this._getDefaultSocialUrl(user.username, 'portfolio'),
      stats: { projectsCount: user.postCount, contributions: user.commentCount },
      contributionLevel: this._getContributionLevel(user.likeCount),
      joinDate: new Date(user.joinedAt),
      lastActivity: new Date(user.joinedAt),
      reputationScore: user.likeCount,
      featured: user.role === 'admin' || user.role === 'moderator',
      skills: this._getDefaultSkills(user.username),
      socialLinks: {
        twitter: this._getDefaultSocialUrl(user.username, 'twitter'),
        linkedin: this._getDefaultSocialUrl(user.username, 'linkedin'),
        website: this._getDefaultSocialUrl(user.username, 'website'),
      },
    }));
    if (params.filters) {
      const f = params.filters;
      developers = developers.filter(d => {
        if (f.expertise?.length && !f.expertise.some(e => d.expertise.includes(e))) return false;
        if (f.skills?.length && !f.skills.some(s => d.skills.includes(s))) return false;
        if (f.minProjects !== undefined && d.stats.projectsCount < f.minProjects) return false;
        if (f.minReputation !== undefined && d.reputationScore < f.minReputation) return false;
        if (f.showFeaturedOnly && !d.featured) return false;
        if (f.roles?.length && (!d.role || !f.roles.includes(d.role))) return false;
        return true;
      });
    }
    if (params.sort) {
      const sf = params.sort.field as string;
      const dir = params.sort.direction;
      developers.sort((a, b) => {
        const av = (a as Record<string, unknown>)[sf];
        const bv = (b as Record<string, unknown>)[sf];
        return dir === 'asc' ? (av as number > (bv as number) ? 1 : -1) : ((av as number) < (bv as number) ? 1 : -1);
      });
    } else {
      developers.sort((a, b) => b.reputationScore - a.reputationScore);
    }
    const pg = params.page ?? 0;
    const lim = params.limit ?? 12;
    const start = pg * lim;
    const paginated = developers.slice(start, start + lim);
    return { developers: paginated, totalCount: developers.length, hasMore: (start + lim) < developers.length };
  }

  async getTopDevelopers(count = 10): Promise<DeveloperProfile[]> {
    const r = await this.getDevelopers({ sort: { field: 'reputationScore', direction: 'desc' }, limit: count });
    return r.developers;
  }

  async getDeveloperCategories(): Promise<string[]> {
    const response = await userApi.list({ limit: 100 });
    if (!response.success || !response.data) return [];
    const allExpertise = response.data.users.flatMap(u => this._getDefaultExpertise(u.username));
    return [...new Set(allExpertise)];
  }

  async searchDevelopers(query: string): Promise<DeveloperProfile[]> {
    const all = await this.getDevelopers();
    const q = query.toLowerCase();
    return all.developers.filter(d =>
      d.username.toLowerCase().includes(q) ||
      d.displayName.toLowerCase().includes(q) ||
      d.expertise.some(e => e.toLowerCase().includes(q)) ||
      d.skills.some(s => s.toLowerCase().includes(q)) ||
      d.bio?.toLowerCase().includes(q)
    );
  }

  async getFeaturedDevelopers(): Promise<DeveloperProfile[]> {
    const r = await this.getDevelopers({ filters: { showFeaturedOnly: true }, sort: { field: 'reputationScore', direction: 'desc' } });
    return r.developers;
  }

  // ──────────── Helpers (kept for Developer profile generation) ────────────

  private _getDefaultExpertise(username: string): string[] {
    const kw = username.toLowerCase();
    if (kw.includes('管理')) return ['Full Stack', 'DevOps', 'System Architecture'];
    if (kw.includes('react')) return ['React', 'Frontend', 'UI/UX'];
    if (kw.includes('前端')) return ['Frontend', 'JavaScript', 'React'];
    if (kw.includes('ts')) return ['TypeScript', 'Frontend', 'Backend'];
    if (kw.includes('rust')) return ['Rust', 'Systems Programming', 'Performance'];
    return ['General Development', 'Problem Solving', 'Continuous Learning'];
  }

  private _getDefaultSkills(username: string): string[] {
    const kw = username.toLowerCase();
    if (kw.includes('管理')) return ['Leadership', 'System Design', 'Troubleshooting'];
    if (kw.includes('react')) return ['React', 'Redux', 'Next.js', 'Testing'];
    if (kw.includes('前端')) return ['HTML', 'CSS', 'JavaScript', 'Responsive Design'];
    if (kw.includes('ts')) return ['TypeScript', 'ESLint', 'Jest', 'Webpack'];
    if (kw.includes('rust')) return ['Rust', 'Performance', 'Memory Safety', 'Concurrency'];
    return ['JavaScript', 'Problem Solving', 'Communication', 'Teamwork'];
  }

  private _getDefaultSocialUrl(username: string, platform: string): string | undefined {
    const clean = username.replace(/\s+/g, '').toLowerCase();
    const encoded = encodeURIComponent(clean);
    switch (platform) {
      case 'github': return `https://github.com/${encoded}`;
      case 'portfolio': return `https://${clean}.dev`;
      case 'twitter': return `https://twitter.com/${encoded}`;
      case 'linkedin': return `https://linkedin.com/in/${encoded}`;
      case 'website': return `https://${clean}.com`;
      default: return undefined;
    }
  }

  private _getContributionLevel(reputation: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master' {
    if (reputation >= 500) return 'master';
    if (reputation >= 300) return 'expert';
    if (reputation >= 150) return 'advanced';
    if (reputation >= 50) return 'intermediate';
    return 'beginner';
  }
}

export const userService = new UserService();
