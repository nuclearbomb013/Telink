# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.ts >> Authentication >> logout clears state
- Location: e2e\auth.spec.ts:68:3

# Error details

```
TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
=========================== logs ===========================
waiting for navigation until "load"
============================================================
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation "主导航" [ref=e4]:
    - generic [ref=e6]:
      - link "TechInk - 返回首页" [ref=e8] [cursor=pointer]:
        - /url: /
        - text: TechInk
      - generic [ref=e9]:
        - link "首页" [ref=e10] [cursor=pointer]:
          - /url: /
        - link "文章" [ref=e11] [cursor=pointer]:
          - /url: /articles
        - link "论坛" [ref=e12] [cursor=pointer]:
          - /url: /forum
        - link "动态" [ref=e13] [cursor=pointer]:
          - /url: /moments
        - link "热点" [ref=e14] [cursor=pointer]:
          - /url: /news-timeline
        - link "设计" [ref=e15] [cursor=pointer]:
          - /url: "#design"
        - link "开发者" [ref=e16] [cursor=pointer]:
          - /url: /developers
        - button "搜索" [ref=e17] [cursor=pointer]:
          - img [ref=e18]
        - link "登录" [ref=e22] [cursor=pointer]:
          - /url: /login
          - img [ref=e23]
          - generic [ref=e26]: 登录
  - link "跳转到主要内容" [ref=e27] [cursor=pointer]:
    - /url: "#main-content"
  - main [ref=e28]:
    - generic [ref=e30]:
      - link "返回论坛" [ref=e31] [cursor=pointer]:
        - /url: /forum
        - img [ref=e32]
        - generic [ref=e34]: 返回论坛
      - generic [ref=e35]:
        - generic [ref=e36]:
          - img [ref=e39]
          - generic [ref=e42]: 登录 TechInk
          - generic [ref=e43]: 欢迎回来！请登录您的账号
        - generic [ref=e44]:
          - paragraph [ref=e46]: Invalid username or password
          - generic [ref=e47]:
            - paragraph [ref=e48]: 测试账号：
            - generic [ref=e49]:
              - button "管理员" [ref=e50] [cursor=pointer]
              - button "普通用户" [ref=e51] [cursor=pointer]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - text: 用户名
              - generic [ref=e54]:
                - img [ref=e55]
                - textbox "用户名" [ref=e58]:
                  - /placeholder: 请输入用户名
                  - text: nuclear
            - generic [ref=e59]:
              - text: 密码
              - generic [ref=e60]:
                - img [ref=e61]
                - textbox "密码" [ref=e64]:
                  - /placeholder: 请输入密码
                  - text: test1234
                - button [ref=e65] [cursor=pointer]:
                  - img [ref=e66]
            - generic [ref=e69]:
              - generic [ref=e70] [cursor=pointer]:
                - checkbox "记住我" [ref=e71]
                - generic [ref=e72]: 记住我
              - link "忘记密码？" [ref=e73] [cursor=pointer]:
                - /url: /forgot-password
            - button "登录" [ref=e74] [cursor=pointer]
          - paragraph [ref=e76]:
            - text: 还没有账号？
            - link "立即注册" [ref=e77] [cursor=pointer]:
              - /url: /register
      - paragraph [ref=e78]:
        - text: 登录即表示您同意我们的
        - link "服务条款" [ref=e79] [cursor=pointer]:
          - /url: /terms
        - text: 和
        - link "隐私政策" [ref=e80] [cursor=pointer]:
          - /url: /privacy
  - contentinfo [ref=e81]:
    - generic:
      - generic: TechInk
    - generic [ref=e82]:
      - generic [ref=e83]:
        - generic [ref=e84]:
          - heading "保持联系" [level=3] [ref=e85]
          - paragraph [ref=e86]: 订阅我们的技术周刊，获取最新文章和社区动态
          - generic [ref=e87]:
            - generic [ref=e88]:
              - generic [ref=e89]: 您的邮箱地址
              - textbox "您的邮箱地址" [ref=e90]
            - button "订阅" [disabled] [ref=e91]
          - status
        - generic [ref=e92]:
          - heading "分类" [level=4] [ref=e93]
          - list [ref=e94]:
            - listitem [ref=e95]:
              - link "前端开发" [ref=e96] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e97]:
              - link "后端架构" [ref=e98] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e99]:
              - link "人工智能" [ref=e100] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e101]:
              - link "开源项目" [ref=e102] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e103]:
              - link "职业发展" [ref=e104] [cursor=pointer]:
                - /url: "#"
        - generic [ref=e105]:
          - heading "页面" [level=4] [ref=e106]
          - list [ref=e107]:
            - listitem [ref=e108]:
              - link "首页" [ref=e109] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e110]:
              - link "文章" [ref=e111] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e112]:
              - link "话题" [ref=e113] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e114]:
              - link "热点" [ref=e115] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e116]:
              - link "关于我们" [ref=e117] [cursor=pointer]:
                - /url: "#"
        - generic [ref=e118]:
          - heading "法律" [level=4] [ref=e119]
          - list [ref=e120]:
            - listitem [ref=e121]:
              - link "隐私政策" [ref=e122] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e123]:
              - link "使用条款" [ref=e124] [cursor=pointer]:
                - /url: "#"
            - listitem [ref=e125]:
              - link "Cookie 政策" [ref=e126] [cursor=pointer]:
                - /url: "#"
        - generic [ref=e127]:
          - generic [ref=e128]:
            - heading "关注我们" [level=4] [ref=e129]
            - generic [ref=e130]:
              - link "Instagram" [ref=e131] [cursor=pointer]:
                - /url: "#"
                - img [ref=e132]
              - link "Twitter" [ref=e135] [cursor=pointer]:
                - /url: "#"
                - img [ref=e136]
              - link "YouTube" [ref=e138] [cursor=pointer]:
                - /url: "#"
                - img [ref=e139]
          - button "返回顶部" [ref=e142] [cursor=pointer]:
            - text: 返回顶部
            - img [ref=e143]
      - generic [ref=e146]:
        - paragraph [ref=e147]: © 2026 TechInk. 保留所有权利。
        - paragraph [ref=e148]: 用代码构建，为开发者服务
```

# Test source

```ts
  1  | /**
  2  |  * E2E Tests: Authentication flow
  3  |  *
  4  |  * Covers: login, token persistence after refresh, logout.
  5  |  */
  6  | import { test, expect } from '@playwright/test';
  7  | 
  8  | const TEST_USER = {
  9  |   username: 'nuclear',
  10 |   password: 'test1234',  // Use actual test account credentials
  11 | };
  12 | 
  13 | test.describe('Authentication', () => {
  14 |   test('login page loads and shows form', async ({ page }) => {
  15 |     await page.goto('/login');
  16 |     await expect(page.locator('input[type="text"], input[name="username"]').first()).toBeVisible();
  17 |     await expect(page.locator('input[type="password"]')).toBeVisible();
  18 |   });
  19 | 
  20 |   test('login with valid credentials redirects to home', async ({ page }) => {
  21 |     await page.goto('/login');
  22 | 
  23 |     // Fill login form
  24 |     const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
  25 |     const passwordInput = page.locator('input[type="password"]');
  26 |     await usernameInput.fill(TEST_USER.username);
  27 |     await passwordInput.fill(TEST_USER.password);
  28 | 
  29 |     // Click login button
  30 |     await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign In")').first().click();
  31 | 
  32 |     // Should redirect away from login page
  33 |     await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  34 | 
  35 |     // User should be logged in (check for user menu or avatar)
  36 |     await expect(page.locator('nav')).toBeVisible();
  37 |   });
  38 | 
  39 |   test('protected route /forum/create redirects to login when not authenticated', async ({ page }) => {
  40 |     // Clear any existing auth state
  41 |     await page.context().clearCookies();
  42 |     await page.evaluate(() => localStorage.clear());
  43 | 
  44 |     await page.goto('/forum/create');
  45 | 
  46 |     // Should redirect to login page
  47 |     await expect(page).toHaveURL(/\/login/);
  48 |   });
  49 | 
  50 |   test('page survives refresh with valid token', async ({ page }) => {
  51 |     // Login first
  52 |     await page.goto('/login');
  53 |     const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
  54 |     const passwordInput = page.locator('input[type="password"]');
  55 |     await usernameInput.fill(TEST_USER.username);
  56 |     await passwordInput.fill(TEST_USER.password);
  57 |     await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign In")').first().click();
  58 |     await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  59 | 
  60 |     // Refresh the page
  61 |     await page.reload();
  62 |     await page.waitForLoadState('networkidle');
  63 | 
  64 |     // Should still show navigation (meaning auth state was restored from HttpOnly cookie)
  65 |     await expect(page.locator('nav')).toBeVisible();
  66 |   });
  67 | 
  68 |   test('logout clears state', async ({ page }) => {
  69 |     // Login
  70 |     await page.goto('/login');
  71 |     const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
  72 |     const passwordInput = page.locator('input[type="password"]');
  73 |     await usernameInput.fill(TEST_USER.username);
  74 |     await passwordInput.fill(TEST_USER.password);
  75 |     await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign In")').first().click();
> 76 |     await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
     |                ^ TimeoutError: page.waitForURL: Timeout 10000ms exceeded.
  77 | 
  78 |     // Find and click logout (may need to open user menu first)
  79 |     const userMenu = page.locator('[aria-label="用户菜单"], [data-testid="user-menu"], button:has(img), button:has(svg)').last();
  80 |     if (await userMenu.isVisible()) {
  81 |       await userMenu.click();
  82 |       const logoutBtn = page.locator('button:has-text("退出"), button:has-text("Logout"), a:has-text("退出")');
  83 |       if (await logoutBtn.isVisible({ timeout: 3000 })) {
  84 |         await logoutBtn.first().click();
  85 |       }
  86 |     }
  87 | 
  88 |     // After logout, navigating to protected route should redirect to login
  89 |     await page.goto('/forum/create');
  90 |     await expect(page).toHaveURL(/\/login/);
  91 |   });
  92 | });
  93 | 
```