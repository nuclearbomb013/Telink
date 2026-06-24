# 明日接入计划

> 将已写好但未使用的组件/工具接入生产代码，消除重复，提升体验。

---

## 一、简单替换：消除 6 个重复 formatTime（~5 分钟）

> 这些文件各自定义了自己的 `formatTime` / `formatRelativeTime`，应统一用 `@/lib/dateUtils`

### 1.1 `src/components/Forum/ForumPostCard.tsx:32`

```diff
- // 删除本地 formatTime 函数定义（约 15 行）
- function formatTime(timestamp: number): string { ... }
+ import { formatDateTime } from '@/lib/dateUtils';

- {formatTime(post.createdAt)}
+ {formatDateTime(post.createdAt)}
```

### 1.2 `src/components/Forum/ForumComment.tsx:37`

```diff
- function formatTime(timestamp: number): string { ... }
+ import { formatDateTime } from '@/lib/dateUtils';

- · {formatTime(comment.createdAt)}
+ · {formatDateTime(comment.createdAt)}
```

### 1.3 `src/components/Forum/ForumStatsSidebar.tsx:245`

```diff
- function formatRelativeTime(timestamp: number): string { ... }
+ import { formatRelativeTime } from '@/lib/dateUtils';
```

### 1.4 `src/components/Notification/NotificationBell.tsx:18`

```diff
- function formatRelativeTime(timestamp: number): string { ... }
+ import { formatRelativeTime } from '@/lib/dateUtils';
```

### 1.5 `src/pages/UserProfilePage.tsx:37`

```diff
- function formatRelativeTime(timestamp: number): string { ... }
+ import { formatRelativeTime } from '@/lib/dateUtils';
```

### 1.6 `src/pages/MomentsPage.tsx:486`

```diff
- const formatTime = useCallback((timestamp: number) => { ... }, []);
+ import { formatDateTime } from '@/lib/dateUtils';

- {formatTime(comment.createdAt)}
+ {formatDateTime(comment.createdAt)}
```

---

## 二、组件接入：LoadingSkeleton + EmptyState（~10 分钟）

> 这两个组件写好了全套预设，但论坛页面全用裸 div + emoji

### 2.1 ForumListPage 使用 LoadingSkeleton

**文件**：`src/pages/ForumListPage.tsx`（约 line 207）

```diff
- {[...Array(5)].map((_, i) => (
-   <div key={i} className="h-32 bg-brand-border/10 rounded-lg animate-pulse" />
- ))}
+ import { PostListSkeleton } from '@/components/Forum/LoadingSkeleton';
+ <PostListSkeleton count={5} />
```

### 2.2 ForumListPage 使用 EmptyState

```diff
- <div className="text-6xl mb-4" aria-hidden="true">📋</div>
+ import { EmptyPosts, EmptySearch } from '@/components/Forum/EmptyState';
+ // 根据是否有搜索词显示不同空状态
+ {searchQuery ? <EmptySearch /> : <EmptyPosts />}
```

### 2.3 ForumPostPage 使用 PostDetailSkeleton

**文件**：`src/pages/ForumPostPage.tsx`（约 line 267）

```diff
- <div className="animate-pulse space-y-6">
-   <div className="h-8 bg-brand-border/20 rounded w-1/3" />
-   <div className="h-64 bg-brand-border/20 rounded" />
-   <div className="h-20 bg-brand-border/20 rounded" />
- </div>
+ import { PostDetailSkeleton } from '@/components/Forum/LoadingSkeleton';
+ <PostDetailSkeleton />
```

### 2.4 ForumSection 使用 PostListSkeleton

**文件**：`src/sections/ForumSection.tsx`（约 line 62）

```diff
- <div className="space-y-4 animate-pulse">...</div>
+ import { PostListSkeleton } from '@/components/Forum/LoadingSkeleton';
+ <PostListSkeleton count={3} />
```

---

## 三、图片优化：接入 OptimizedImage（~10 分钟）

> OptimizedImage 支持 IntersectionObserver 懒加载、CLS 防护、WebP 检测

### 3.1 接入关键位置

```typescript
import OptimizedImage from '@/components/OptimizedImage';
```

| 文件 | 行 | 替换 |
|------|-----|------|
| `ForumPostPage.tsx` | 封面图 | `<img>` → `<OptimizedImage>` |
| `ForumListPage.tsx` | 帖子卡片图 | `<img>` → `<OptimizedImage>` |
| `ForumEditPage.tsx:475` | 封面预览 | `<img>` → `<OptimizedImage>` |
| `ForumCreatePage.tsx:394` | 封面预览 | `<img>` → `<OptimizedImage>` |
| `MomentsPage.tsx:282` | 动态图片 | `<img>` → `<OptimizedImage>` |
| `UserProfilePage.tsx` | 头像 | `<img>` → `<OptimizedImage>` |

### 3.2 给缺属性的 img 补 width/height

> 以下位置直接加 `width={n}` `height={n}` 防止 CLS：

| 文件 | 行 | 操作 |
|------|-----|------|
| `CoverImageUploader.tsx:244` | 已有 loading="eager"，缺 width/height |
| `PixelAvatarConverter.tsx:145,173,191` | 3 处缺 loading + width/height |
| `UserAvatar.tsx:111` | 缺 width/height |
| `MomentCard.tsx:43,68,89,109` | 4 处缺 width/height |

---

## 四、删除死代码（~2 分钟）

> 以下文件从未被引用，可直接删除

```bash
Remove-Item "src/components/Forum/PostActions.tsx"        # 0 处引用
Remove-Item "src/components/Forum/ForumSearchPanel.tsx"   # 0 处引用
Remove-Item "src/components/OptimizedImage.tsx"           # 如果第三章接了就用，没接就删
```

### 删除 no-op 调用

**文件**：`src/pages/ForumPostPage.tsx:216`

```diff
- await forumService.incrementReplyCount(post.id);
```

### 删除 no-op 方法

**文件**：`src/services/forum.service.ts:420-422`

```diff
- async incrementReplyCount(_postId: number): Promise<void> {
-   // 后端在创建评论时自动增加回复数
- }
```

---

## 五、验证清单

```bash
cd E:\KIMI_web\app

# 1. 类型检查
npx tsc --noEmit

# 2. Lint
npm run lint

# 3. 测试
npm run test

# 4. 构建
npm run build

# 5. 浏览器验证（需先 npm run dev）
#    - 首页 forum section 骨架屏
#    - /forum 列表骨架屏 + 空状态
#    - /forum/xxx 帖子详情骨架屏
#    - 通知铃铛时间显示
#    - 动态页时间显示
```

---

## 执行顺序建议

```
1. 一、简单替换（6 个）       ← 先做，低风险
2. 四、删除死代码             ← 清理干净
3. 二、组件接入（4 个页面）    ← 主要 UX 提升
4. 三、图片优化               ← 性能提升
5. 五、验证                   ← 全部跑一遍
```

---

*生成了 2026-06-08*
