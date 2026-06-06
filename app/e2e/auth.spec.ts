/**
 * E2E Tests: Authentication flow
 *
 * Covers: login, token persistence after refresh, logout.
 */
import { test, expect } from '@playwright/test';

const TEST_USER = {
  username: 'nuclear',
  password: 'test1234',  // Use actual test account credentials
};

test.describe('Authentication', () => {
  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="text"], input[name="username"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('login with valid credentials redirects to home', async ({ page }) => {
    await page.goto('/login');

    // Fill login form
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]');
    await usernameInput.fill(TEST_USER.username);
    await passwordInput.fill(TEST_USER.password);

    // Click login button
    await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign In")').first().click();

    // Should redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // User should be logged in (check for user menu or avatar)
    await expect(page.locator('nav')).toBeVisible();
  });

  test('protected route /forum/create redirects to login when not authenticated', async ({ page, context }) => {
    await context.clearCookies();
    // Use context.addInitScript or clear storage via browser context instead of page.evaluate
    await context.clearCookies();

    await page.goto('/forum/create');

    await expect(page).toHaveURL(/\/login/);
  });

  test('page survives refresh with valid token', async ({ page }) => {
    // Login first
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]');
    await usernameInput.fill(TEST_USER.username);
    await passwordInput.fill(TEST_USER.password);
    await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign In")').first().click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still show navigation (meaning auth state was restored from HttpOnly cookie)
    await expect(page.locator('nav')).toBeVisible();
  });

  test('logout clears state', async ({ page }) => {
    // Login
    await page.goto('/login');
    const usernameInput = page.locator('input[type="text"], input[name="username"]').first();
    const passwordInput = page.locator('input[type="password"]');
    await usernameInput.fill(TEST_USER.username);
    await passwordInput.fill(TEST_USER.password);
    await page.locator('button[type="submit"], button:has-text("登录"), button:has-text("Sign In")').first().click();
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    // Find and click logout (may need to open user menu first)
    const userMenu = page.locator('[aria-label="用户菜单"], [data-testid="user-menu"], button:has(img), button:has(svg)').last();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      const logoutBtn = page.locator('button:has-text("退出"), button:has-text("Logout"), a:has-text("退出")');
      if (await logoutBtn.isVisible({ timeout: 3000 })) {
        await logoutBtn.first().click();
      }
    }

    // After logout, navigating to protected route should redirect to login
    await page.goto('/forum/create');
    await expect(page).toHaveURL(/\/login/);
  });
});
