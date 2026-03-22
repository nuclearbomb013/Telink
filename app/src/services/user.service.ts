/**
 * User Service - 用户服务
 *
 * 提供用户信息管理、头像上传、统计等功能
 * 当前使用 Mock 数据，预留真实 API 接口
 */

import type {
  User,
  CreateUserData,
  UpdateUserData,
  UserStats,
  UserPostStats,
  UserServiceResponse,
  CurrentUser,
} from './user.types';

import { DEFAULT_CURRENT_USER } from './user.types';
import type { DeveloperProfile, GetDevelopersParams, DevelopersResponse } from './developer.types';

import type { ForumPost } from './forum.types';
import { forumService } from './forum.service';

/**
 * localStorage 键名
 */
const STORAGE_KEYS = {
  USERS: 'techink_users_data', // 修改为独立的用户数据存储键
  CURRENT_USER: 'techink_current_user',
  USER_COUNTER: 'techink_forum_user_counter',
} as const;

/**
 * Mock 初始用户数据
 */
const INITIAL_mock_USERS: User[] = [
  {
    id: 1,
    username: '管理员',
    bio: 'TechInk 论坛管理员，致力于打造高质量的技术交流社区。',
    postCount: 15,
    commentCount: 89,
    likeCount: 234,
    joinedAt: Date.now() - 365 * 24 * 60 * 60 * 1000,
    role: 'admin',
  },
  {
    id: 2,
    username: 'React 爱好者',
    bio: '前端开发，React 重度用户。开源项目贡献者。',
    postCount: 28,
    commentCount: 156,
    likeCount: 189,
    joinedAt: Date.now() - 200 * 24 * 60 * 60 * 1000,
    role: 'user',
  },
  {
    id: 3,
    username: 'TS 新手',
    bio: '正在学习 TypeScript 的新手，欢迎大家多多指教！',
    postCount: 5,
    commentCount: 23,
    likeCount: 12,
    joinedAt: Date.now() - 90 * 24 * 60 * 60 * 1000,
    role: 'user',
  },
  {
    id: 4,
    username: 'Rustacean',
    bio: 'Rust 布道师。相信内存安全是未来的方向。',
    postCount: 12,
    commentCount: 67,
    likeCount: 156,
    joinedAt: Date.now() - 150 * 24 * 60 * 60 * 1000,
    role: 'user',
  },
  {
    id: 5,
    username: '前端老手',
    bio: '10 年前端开发经验，现任职于某大厂技术专家。',
    postCount: 45,
    commentCount: 234,
    likeCount: 567,
    joinedAt: Date.now() - 300 * 24 * 60 * 60 * 1000,
    role: 'moderator',
  },
];

/**
 * 用户服务类
 */
class UserService {
  private users: User[] = [];
  private nextId = 1;
  private currentUser: CurrentUser | null = null;
  private logoutHandler: (() => void) | null = null;

  constructor() {
    this.initialize();
    // Listen for global logout events to ensure consistent state
    this.logoutHandler = () => {
      this.currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    };
    window.addEventListener('auth:logout', this.logoutHandler);
  }

  /**
   * 销毁服务实例，清理事件监听器
   */
  public destroy(): void {
    if (this.logoutHandler) {
      window.removeEventListener('auth:logout', this.logoutHandler);
      this.logoutHandler = null;
    }
  }

  /**
   * 初始化服务
   */
  private async initialize(): Promise<void> {
    this.loadCurrentUser();
    await this.loadUsers();
    this.loadCounter();
  }

  /**
   * 加载当前用户
   */
  private loadCurrentUser(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      } else {
        // 默认用户
        this.currentUser = { ...DEFAULT_CURRENT_USER };
        this.saveCurrentUser();
      }
    } catch (error) {
      console.warn('加载当前用户失败:', error);
      this.currentUser = { ...DEFAULT_CURRENT_USER };
    }
  }

  /**
   * 保存当前用户
   */
  private saveCurrentUser(): void {
    if (this.currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(this.currentUser));
    }
  }

  /**
   * 从 localStorage 加载用户
   */
  private async loadUsers(): Promise<void> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USERS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          this.users = parsed;
          return;
        }
      }
      // 首次使用，加载初始数据
      this.users = [...INITIAL_mock_USERS];
      this.saveUsers();
    } catch (error) {
      console.warn('加载用户失败:', error);
      this.users = [...INITIAL_mock_USERS];
    }
  }

  /**
   * 保存用户到 localStorage
   */
  private saveUsers(): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(this.users));
    } catch (error) {
      console.warn('保存用户失败:', error);
    }
  }

  /**
   * 加载计数器
   */
  private loadCounter(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_COUNTER);
      if (stored) {
        this.nextId = parseInt(stored, 10);
      } else {
        this.nextId = Math.max(...this.users.map(u => u.id)) + 1;
      }
    } catch (error) {
      console.warn('加载计数器失败:', error);
      this.nextId = Math.max(...this.users.map(u => u.id)) + 1;
    }
  }

  /**
   * 获取下一个 ID
   */
  private getNextId(): number {
    const id = this.nextId++;
    localStorage.setItem(STORAGE_KEYS.USER_COUNTER, this.nextId.toString());
    return id;
  }

  /**
   * 模拟 API 延迟
   */
  private async simulateDelay(ms = 200): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 创建成功响应
   */
  private successResponse<T>(data: T): UserServiceResponse<T> {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * 创建错误响应
   */
  private errorResponse(
    code: string,
    message: string,
    details?: unknown
  ): UserServiceResponse<never> {
    return {
      success: false,
      error: { code, message, details },
      timestamp: Date.now(),
    };
  }

  // ==================== 公开 API ====================

  /**
   * 获取当前登录用户
   */
  getCurrentUser(): CurrentUser | null {
    return this.currentUser;
  }

  /**
   * 设置当前用户
   */
  setCurrentUser(user: CurrentUser): void {
    this.currentUser = user;
    this.saveCurrentUser();
  }

  /**
   * 登出
   */
  logout(): void {
    this.currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  /**
   * 根据 ID 获取用户
   */
  async getUserById(id: number): Promise<UserServiceResponse<User>> {
    try {
      await this.simulateDelay();

      const user = this.users.find(u => u.id === id);
      if (!user) {
        return this.errorResponse('NOT_FOUND', '用户不存在');
      }

      // 更新最后活跃时间
      user.lastActiveAt = Date.now();
      this.saveUsers();

      return this.successResponse({ ...user });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取用户失败',
        error
      );
    }
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<UserServiceResponse<User>> {
    try {
      await this.simulateDelay();

      const user = this.users.find(u => u.username === username);
      if (!user) {
        return this.errorResponse('NOT_FOUND', '用户不存在');
      }

      return this.successResponse({ ...user });
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取用户失败',
        error
      );
    }
  }

  /**
   * 创建用户
   */
  async createUser(
    data: CreateUserData
  ): Promise<UserServiceResponse<User>> {
    try {
      await this.simulateDelay();

      // 验证必填字段
      if (!data.username.trim()) {
        return this.errorResponse('VALIDATION_ERROR', '用户名不能为空');
      }

      // 检查用户名是否已存在
      const usernameExists = this.users.some(
        u => u.username.toLowerCase() === data.username.toLowerCase()
      );
      if (usernameExists) {
        return this.errorResponse('VALIDATION_ERROR', '用户名已存在');
      }

      const user: User = {
        id: this.getNextId(),
        username: data.username.trim(),
        avatar: data.avatar,
        bio: data.bio,
        postCount: 0,
        commentCount: 0,
        likeCount: 0,
        joinedAt: Date.now(),
        role: 'user',
      };

      this.users.push(user);
      this.saveUsers();

      // 自动设置为当前用户
      this.setCurrentUser({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
      });

      return this.successResponse(user);
    } catch (error) {
      return this.errorResponse(
        'CREATE_ERROR',
        '创建用户失败',
        error
      );
    }
  }

  /**
   * 更新用户
   */
  async updateUser(
    data: UpdateUserData
  ): Promise<UserServiceResponse<User>> {
    try {
      await this.simulateDelay();

      const index = this.users.findIndex(u => u.id === data.id);
      if (index === -1) {
        return this.errorResponse('NOT_FOUND', '用户不存在');
      }

      // 如果更新用户名，检查是否重复
      if (data.username) {
        const usernameExists = this.users.some(
          u => u.username.toLowerCase() === data.username!.toLowerCase() && u.id !== data.id
        );
        if (usernameExists) {
          return this.errorResponse('VALIDATION_ERROR', '用户名已存在');
        }
      }

      const updatedUser: User = {
        ...this.users[index],
        ...data,
      };

      this.users[index] = updatedUser;
      this.saveUsers();

      // 如果更新的是当前用户，同步更新
      if (this.currentUser && this.currentUser.id === data.id) {
        this.setCurrentUser({
          id: updatedUser.id,
          username: updatedUser.username,
          avatar: updatedUser.avatar,
        });
      }

      return this.successResponse(updatedUser);
    } catch (error) {
      return this.errorResponse(
        'UPDATE_ERROR',
        '更新用户失败',
        error
      );
    }
  }

  /**
   * 更新用户头像（模拟上传）
   */
  async updateAvatar(
    userId: number,
    avatarDataUrl: string
  ): Promise<UserServiceResponse<User>> {
    return this.updateUser({
      id: userId,
      avatar: avatarDataUrl,
    });
  }

  /**
   * 获取用户统计
   */
  async getUserStats(userId: number): Promise<UserServiceResponse<UserPostStats>> {
    try {
      await this.simulateDelay();

      const user = this.users.find(u => u.id === userId);
      if (!user) {
        return this.errorResponse('NOT_FOUND', '用户不存在');
      }

      // 获取用户的帖子
      const postsResponse = await forumService.getPostsByAuthor(userId, 50);
      const posts = postsResponse.data || [];

      const totalLikes = posts.reduce((sum: number, p: ForumPost) => sum + p.likes, 0);
      const totalViews = posts.reduce((sum: number, p: ForumPost) => sum + p.views, 0);

      return this.successResponse({
        userId,
        username: user.username,
        totalPosts: posts.length,
        totalLikes,
        totalViews,
        posts: posts.map((p: ForumPost) => ({
          id: p.id,
          title: p.title,
          category: p.category,
          likes: p.likes,
          views: p.views,
          replyCount: p.replyCount,
          createdAt: p.createdAt,
        })),
      });
    } catch (error) {
      return this.errorResponse(
        'STATS_ERROR',
        '获取用户统计失败',
        error
      );
    }
  }

  /**
   * 获取所有用户列表
   */
  async getAllUsers(): Promise<UserServiceResponse<User[]>> {
    try {
      await this.simulateDelay();

      return this.successResponse(
        [...this.users].sort((a, b) => b.likeCount - a.likeCount)
      );
    } catch (error) {
      return this.errorResponse(
        'FETCH_ERROR',
        '获取用户列表失败',
        error
      );
    }
  }

  /**
   * 获取统计信息
   */
  async getStats(): Promise<UserServiceResponse<UserStats>> {
    try {
      await this.simulateDelay();

      const now = Date.now();
      const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

      const activeUsers = this.users.filter(
        u => u.lastActiveAt && u.lastActiveAt > now - 7 * 24 * 60 * 60 * 1000
      ).length;

      const newUsers = this.users.filter(u => u.joinedAt > monthAgo).length;

      const topContributors = [...this.users]
        .sort((a, b) => b.likeCount - a.likeCount)
        .slice(0, 10);

      return this.successResponse({
        totalUsers: this.users.length,
        activeUsers,
        newUsersThisMonth: newUsers,
        topContributors: topContributors,
      });
    } catch (error) {
      return this.errorResponse(
        'STATS_ERROR',
        '获取统计信息失败',
        error
      );
    }
  }

  /**
   * 根据 ID 获取用户（同步版本，用于简单查询）
   */
  getUserByIdSync(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }

  /**
   * 更新用户帖子计数
   */
  async incrementPostCount(userId: number): Promise<void> {
    try {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.postCount++;
        this.saveUsers();
      }
    } catch (error) {
      console.warn('更新帖子计数失败:', error);
    }
  }

  /**
   * 更新用户评论计数
   */
  async incrementCommentCount(userId: number): Promise<void> {
    try {
      const user = this.users.find(u => u.id === userId);
      if (user) {
        user.commentCount++;
        this.saveUsers();
      }
    } catch (error) {
      console.warn('更新评论计数失败:', error);
    }
  }

  /**
   * 根据条件获取开发者
   */
  async getDevelopers(params: GetDevelopersParams = {}): Promise<DevelopersResponse> {
    await this.simulateDelay();

    let developers = [...this.users].map(user => {
      // Convert User to DeveloperProfile
      const developer: DeveloperProfile = {
        ...user,
        displayName: user.username, // Use username as display name
        expertise: this.getDefaultExpertise(user.username), // Generate expertise based on username
        githubUrl: this.getDefaultSocialUrl(user.username, 'github'),
        portfolioUrl: this.getDefaultSocialUrl(user.username, 'portfolio'),
        stats: {
          projectsCount: user.postCount, // Using postCount as proxy for projects
          contributions: user.commentCount, // Using commentCount as proxy for contributions
        },
        contributionLevel: this.getContributionLevel(user.likeCount),
        joinDate: new Date(user.joinedAt),
        lastActivity: user.lastActiveAt ? new Date(user.lastActiveAt) : new Date(user.joinedAt),
        reputationScore: user.likeCount, // Using likes as reputation proxy
        featured: user.role === 'admin' || user.role === 'moderator', // Admins/moderators are featured
        skills: this.getDefaultSkills(user.username),
        socialLinks: {
          twitter: this.getDefaultSocialUrl(user.username, 'twitter'),
          linkedin: this.getDefaultSocialUrl(user.username, 'linkedin'),
          website: this.getDefaultSocialUrl(user.username, 'website'),
        },
      };
      return developer;
    });

    // Apply filters if provided
    if (params.filters) {
      developers = developers.filter(developer => {
        // Expertise filter
        if (params.filters?.expertise && params.filters.expertise.length > 0) {
          if (!params.filters.expertise.some(exp => developer.expertise.includes(exp))) {
            return false;
          }
        }

        // Skills filter
        if (params.filters?.skills && params.filters.skills.length > 0) {
          if (!params.filters.skills.some(skill => developer.skills.includes(skill))) {
            return false;
          }
        }

        // Min projects filter
        if (params.filters?.minProjects !== undefined) {
          if (developer.stats.projectsCount < params.filters.minProjects) {
            return false;
          }
        }

        // Min reputation filter
        if (params.filters?.minReputation !== undefined) {
          if (developer.reputationScore < params.filters.minReputation) {
            return false;
          }
        }

        // Featured only filter
        if (params.filters?.showFeaturedOnly) {
          if (!developer.featured) {
            return false;
          }
        }

        // Roles filter
        if (params.filters?.roles && params.filters.roles.length > 0) {
          if (!developer.role || !params.filters.roles.includes(developer.role)) {
            return false;
          }
        }

        return true;
      });
    }

    // Apply sorting
    if (params.sort) {
      developers.sort((a, b) => {
        let aValue: any, bValue: any;

        // Handle nested properties for stats and other renamed fields
        switch (params.sort!.field) {
          case 'projectsCount':
            aValue = a.stats.projectsCount;
            bValue = b.stats.projectsCount;
            break;
          case 'contributions':
            aValue = a.stats.contributions;
            bValue = b.stats.contributions;
            break;
          case 'joinedDate': // Map to actual field name
            aValue = a.joinDate;
            bValue = b.joinDate;
            break;
          case 'lastActive': // Map to actual field name
            aValue = a.lastActivity;
            bValue = b.lastActivity;
            break;
          case 'displayName': // Map to actual field name
            aValue = a.displayName;
            bValue = b.displayName;
            break;
          default:
            aValue = a[params.sort!.field];
            bValue = b[params.sort!.field];
        }

        // For dates, convert to timestamps for comparison
        if (aValue instanceof Date && bValue instanceof Date) {
          aValue = aValue.getTime();
          bValue = bValue.getTime();
        }

        if (params.sort!.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    } else {
      // Default sorting by reputation (descending)
      developers.sort((a, b) => b.reputationScore - a.reputationScore);
    }

    // Apply pagination
    const page = params.page ?? 0;
    const limit = params.limit ?? 12; // Default to 12 developers per page
    const startIndex = page * limit;
    const endIndex = startIndex + limit;

    const paginatedDevelopers = developers.slice(startIndex, endIndex);
    const totalCount = developers.length;

    return {
      developers: paginatedDevelopers,
      totalCount,
      hasMore: endIndex < totalCount,
    };
  }

  /**
   * 获取顶级开发者
   */
  async getTopDevelopers(count: number = 10): Promise<DeveloperProfile[]> {
    const response = await this.getDevelopers({
      sort: { field: 'reputationScore', direction: 'desc' },
      limit: count
    });
    return response.developers;
  }

  /**
   * 获取开发者分类
   */
  async getDeveloperCategories(): Promise<string[]> {
    // Return unique expertise areas from all developers
    const allExpertise = this.users.flatMap(user => this.getDefaultExpertise(user.username));
    return [...new Set(allExpertise)];
  }

  /**
   * 搜索开发者
   */
  async searchDevelopers(query: string): Promise<DeveloperProfile[]> {
    const allDevelopersResponse = await this.getDevelopers();
    const allDevelopers = allDevelopersResponse.developers;

    const normalizedQuery = query.toLowerCase();

    return allDevelopers.filter(developer =>
      developer.username.toLowerCase().includes(normalizedQuery) ||
      developer.displayName.toLowerCase().includes(normalizedQuery) ||
      developer.expertise.some(exp => exp.toLowerCase().includes(normalizedQuery)) ||
      developer.skills.some(skill => skill.toLowerCase().includes(normalizedQuery)) ||
      developer.bio?.toLowerCase().includes(normalizedQuery)
    );
  }

  /**
   * 获取特色开发者
   */
  async getFeaturedDevelopers(): Promise<DeveloperProfile[]> {
    const response = await this.getDevelopers({
      filters: { showFeaturedOnly: true },
      sort: { field: 'reputationScore', direction: 'desc' }
    });
    return response.developers;
  }

  /**
   * 生成默认专长领域（基于用户名）
   */
  private getDefaultExpertise(username: string): string[] {
    const lowerUsername = username.toLowerCase();
    const expertiseMap: { [key: string]: string[] } = {
      '管理员': ['Full Stack', 'DevOps', 'System Architecture'],
      'react': ['React', 'Frontend', 'UI/UX'],
      '前端': ['Frontend', 'JavaScript', 'React'],
      'ts': ['TypeScript', 'Frontend', 'Backend'],
      'rust': ['Rust', 'Systems Programming', 'Performance'],
      '爱好者': ['JavaScript', 'React', 'Vue'],
      '新手': ['Learning', 'JavaScript', 'HTML/CSS'],
      '老手': ['Senior Development', 'Architecture', 'Mentoring']
    };

    // Look for matching keywords in username
    for (const [keyword, expertises] of Object.entries(expertiseMap)) {
      if (lowerUsername.includes(keyword.toLowerCase())) {
        return expertises;
      }
    }

    // Default expertise if no match found
    return ['General Development', 'Problem Solving', 'Continuous Learning'];
  }

  /**
   * 生成默认技能（基于用户名）
   */
  private getDefaultSkills(username: string): string[] {
    const lowerUsername = username.toLowerCase();
    const skillMap: { [key: string]: string[] } = {
      '管理员': ['Leadership', 'System Design', 'Troubleshooting'],
      'react': ['React', 'Redux', 'Next.js', 'Testing'],
      '前端': ['HTML', 'CSS', 'JavaScript', 'Responsive Design'],
      'ts': ['TypeScript', 'ESLint', 'Jest', 'Webpack'],
      'rust': ['Rust', 'Performance', 'Memory Safety', 'Concurrency'],
      '爱好者': ['JavaScript', 'React', 'Node.js', 'CSS'],
      '新手': ['HTML', 'CSS', 'Basic JavaScript', 'Git'],
      '老手': ['Architecture', 'Performance', 'Code Review', 'Mentoring']
    };

    // Look for matching keywords in username
    for (const [keyword, skills] of Object.entries(skillMap)) {
      if (lowerUsername.includes(keyword.toLowerCase())) {
        return skills;
      }
    }

    // Default skills if no match found
    return ['JavaScript', 'Problem Solving', 'Communication', 'Teamwork'];
  }

  /**
   * 获取默认社交链接（基于用户名和平台）
   */
  private getDefaultSocialUrl(username: string, platform: 'github' | 'portfolio' | 'twitter' | 'linkedin' | 'website'): string | undefined {
    const cleanUsername = username.replace(/\s+/g, '').toLowerCase();
    const encodedUsername = encodeURIComponent(cleanUsername);

    switch (platform) {
      case 'github':
        return `https://github.com/${encodedUsername}`;
      case 'portfolio':
        return `https://${cleanUsername}.dev`;
      case 'twitter':
        return `https://twitter.com/${encodedUsername}`;
      case 'linkedin':
        return `https://linkedin.com/in/${encodedUsername}`;
      case 'website':
        return `https://${cleanUsername}.com`;
      default:
        return undefined;
    }
  }

  /**
   * 根据声誉分数确定贡献级别
   */
  private getContributionLevel(reputation: number): 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master' {
    if (reputation >= 500) return 'master';
    if (reputation >= 300) return 'expert';
    if (reputation >= 150) return 'advanced';
    if (reputation >= 50) return 'intermediate';
    return 'beginner';
  }
}

/**
 * 导出单例
 */
export const userService = new UserService();
