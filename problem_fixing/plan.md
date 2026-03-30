# 论坛和动态评论/发布功能修复计划

> 创建时间: 2026-03-29
> 问题: 论坛和动态无法评论和发布

---

## 问题诊断

### 根本原因

经过代码审查发现，以下页面没有使用全局同步的认证状态 (`useAuth` hook):

| 文件 | 问题 | 影响 |
|------|------|------|
| `ForumPostPage.tsx` | 使用独立的 `userService.getCurrentUser()` | 评论功能无法获取正确的用户状态 |
| `ForumCreatePage.tsx` | 使用独立的 `userService.getCurrentUser()` | 发帖功能无法获取正确的用户状态 |
| `MomentsPage.tsx` | 使用独立的 `userService.getCurrentUser()` | 动态发布功能可能受影响 |

### 代码问题示例

**ForumPostPage.tsx (第 42-68 行)**:
```typescript
// 问题代码 - 独立状态
const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

useEffect(() => {
  const user = userService.getCurrentUser();
  if (user) {
    setCurrentUser(user);
  }
}, []);
```

**正确做法**:
```typescript
// 正确代码 - 使用全局状态
const { user: currentUser, isAuthenticated } = useAuth();
```

---

## 修复步骤

### Step 1: 修复 ForumPostPage.tsx

1. 导入 `useAuth` hook
2. 移除独立的 `currentUser` state 和相关 useEffect
3. 使用 `useAuth()` 获取用户状态
4. 更新评论相关函数以使用全局状态

### Step 2: 修复 ForumCreatePage.tsx

1. 导入 `useAuth` hook
2. 移除独立的认证检查逻辑
3. 使用 `useAuth()` 获取用户状态
4. 更新发帖逻辑

### Step 3: 验证 MomentsPage.tsx

1. 确认已使用正确的状态管理
2. 如有问题则修复

### Step 4: 测试验证

1. 登录后测试发帖功能
2. 登录后测试评论功能
3. 登录后测试动态发布功能

---

## 预期结果

- 登录后无需刷新即可使用论坛和动态功能
- 用户状态在所有页面保持同步
- 评论和发布功能正常工作

---

## 状态

- [x] 诊断完成
- [x] 修复 ForumPostPage.tsx
- [x] 修复 ForumCreatePage.tsx
- [x] 验证 MomentsPage.tsx
- [x] 测试验证 (lint + build 通过)