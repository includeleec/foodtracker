import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  
  // Check that the page title contains expected text
  await expect(page).toHaveTitle(/每日食物记录/);
  
  // Check for main navigation or key elements
  await expect(page.locator('body')).toBeVisible();
});