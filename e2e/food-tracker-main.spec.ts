import { test, expect } from '@playwright/test'

const BASE_URL = 'https://food.tinycard.xyz'
const TEST_EMAIL = 'includeleec@gmail.com'
const TEST_PASSWORD = '123456'

// Helper function to login
async function loginUser(page: any) {
  await page.goto(`${BASE_URL}/auth/login`)
  await expect(page).toHaveTitle(/每日食物记录/)
  
  // Fill login form
  await page.fill('input[type="email"]', TEST_EMAIL)
  await page.fill('input[type="password"]', TEST_PASSWORD)
  await page.click('button[type="submit"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('**/dashboard**', { timeout: 10000 })
  await page.waitForLoadState('networkidle')
}

// Helper function to wait for page load
async function waitForPageLoad(page: any) {
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1000) // Additional wait for dynamic content
}

test.describe('Food Tracker App - Main Features', () => {
  test.beforeEach(async ({ page }) => {
    // Set a reasonable timeout for all operations
    test.setTimeout(60000)
  })

  test('Homepage loads and redirects to auth', async ({ page }) => {
    await page.goto(BASE_URL)
    
    // Should redirect to auth page or show homepage
    await expect(page).toHaveTitle(/每日食物记录/)
    
    // Check if we can see either dashboard content or login form
    const isLoggedIn = await page.locator('dt:has-text("今日记录")').isVisible().catch(() => false)
    if (!isLoggedIn) {
      await expect(page.locator('button[type="submit"]:has-text("登录")')).toBeVisible()
    }
  })

  test('User can login successfully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    // Fill and submit login form
    await page.fill('input[type="email"]', TEST_EMAIL)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 })
    await expect(page.locator('dt:has-text("今日记录")')).toBeVisible()
  })

  test('Dashboard shows main features', async ({ page }) => {
    await loginUser(page)
    
    // Check main dashboard elements
    await expect(page.locator('dt:has-text("今日记录")')).toBeVisible()
    await expect(page.locator('dt:has-text("历史记录")')).toBeVisible()
    
    // Check navigation
    await expect(page.locator('nav').first()).toBeVisible()
    
    // Navigate to today's records to see meal sections
    await page.click('text=开始记录')
    await page.waitForURL('**/today**', { timeout: 10000 })
    
    // Check meal sections on today page
    const mealTypes = ['早餐', '中餐', '晚餐', '加餐']
    for (const meal of mealTypes) {
      await expect(page.locator(`text=${meal}`)).toBeVisible()
    }
  })

  test('User can add a food record', async ({ page }) => {
    await loginUser(page)
    
    // Navigate to today's records page
    await page.click('text=开始记录')
    await page.waitForURL('**/today**', { timeout: 10000 })
    
    // Click add food record button
    await page.click('button:has-text("添加食物记录")')
    
    // Wait for form to appear
    await expect(page.locator('text=➕ 添加食物记录')).toBeVisible()
    
    // Fill form
    await page.selectOption('select', '早餐')
    await page.fill('input[placeholder*="请输入食物名称"]', '测试食物')
    await page.fill('input[placeholder*="请输入重量"]', '200')
    await page.fill('input[placeholder*="请输入卡路里"]', '150')
    
    // Submit form
    await page.click('button:has-text("添加记录")')
    
    // Check for success and redirect back
    await page.waitForTimeout(3000)
    
    // Verify record appears in the list
    await expect(page.locator('text=测试食物')).toBeVisible()
  })

  test('Navigation between pages works', async ({ page }) => {
    await loginUser(page)
    
    // Test navigation to history page
    await page.click('text=查看历史')
    await page.waitForURL('**/history**', { timeout: 10000 })
    await expect(page.locator('text=📅 历史记录')).toBeVisible()
    
    // Navigate back to dashboard using bottom nav
    await page.click('text=🏠 仪表板')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await expect(page.locator('dt:has-text("今日记录")')).toBeVisible()
    
    // Navigate to today's records
    await page.click('text=📝 今日记录')
    await page.waitForURL('**/today**', { timeout: 10000 })
    await expect(page.locator('text=今天')).toBeVisible()
  })

  test('Food calendar functionality', async ({ page }) => {
    await loginUser(page)
    
    // Navigate to history page
    await page.click('text=查看历史')
    await page.waitForURL('**/history**', { timeout: 10000 })
    
    // Check calendar section is visible
    await expect(page.locator('text=📆 选择日期')).toBeVisible()
    
    // Check current month is displayed
    await expect(page.locator('text=2025年7月')).toBeVisible()
    
    // Check month navigation buttons
    await expect(page.locator('text=← 上月')).toBeVisible()
    await expect(page.locator('text=下月 →')).toBeVisible()
    
    // Check today button
    await expect(page.locator('text=今天')).toBeVisible()
  })

  test('User profile and logout', async ({ page }) => {
    await loginUser(page)
    
    // Look for logout button in header
    const logoutButton = page.locator('button:has-text("👋 退出登录")')
    await expect(logoutButton).toBeVisible()
    
    // Click logout button
    await logoutButton.click()
    
    // Should redirect to login page
    await page.waitForTimeout(2000)
    
    // Verify logout - should see login form
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]:has-text("登录")')).toBeVisible()
  })

  test('Image upload functionality', async ({ page }) => {
    await loginUser(page)
    
    // Navigate to today's records and open add form
    await page.click('text=开始记录')
    await page.waitForURL('**/today**', { timeout: 10000 })
    await page.click('button:has-text("添加食物记录")')
    await expect(page.locator('text=➕ 添加食物记录')).toBeVisible()
    
    // Check if image upload section is available
    await expect(page.locator('text=食物图片')).toBeVisible()
    await expect(page.locator('text=点击或拖拽上传图片')).toBeVisible()
    
    // Check file input exists
    const imageInput = page.locator('input[type="file"]')
    await expect(imageInput).toBeVisible()
    
    // Close the form
    const cancelButton = page.locator('button:has-text("取消")')
    await cancelButton.click()
  })

  test('Mobile navigation works', async ({ page }) => {
    await loginUser(page)
    
    // Check bottom navigation elements
    await expect(page.locator('text=🏠 仪表板')).toBeVisible()
    await expect(page.locator('text=📝 今日记录')).toBeVisible()
    await expect(page.locator('text=📅 历史记录')).toBeVisible()
    
    // Test navigation items
    await page.click('text=📝 今日记录')
    await page.waitForURL('**/today**', { timeout: 10000 })
    await expect(page.locator('text=今天')).toBeVisible()
    
    await page.click('text=📅 历史记录')
    await page.waitForURL('**/history**', { timeout: 10000 })
    await expect(page.locator('text=📅 历史记录')).toBeVisible()
    
    await page.click('text=🏠 仪表板')
    await page.waitForURL('**/dashboard**', { timeout: 10000 })
    await expect(page.locator('dt:has-text("今日记录")')).toBeVisible()
  })

  test('Error handling and loading states', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    
    // Test invalid login
    await page.fill('input[type="email"]', 'invalid@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Should show error message
    await page.waitForTimeout(2000)
    
    // Check for error indicators
    const errorIndicators = [
      'text=登录失败',
      'text=错误',
      'text=无效',
      '.error',
      '[role="alert"]'
    ]
    
    let errorFound = false
    for (const selector of errorIndicators) {
      if (await page.locator(selector).isVisible().catch(() => false)) {
        errorFound = true
        break
      }
    }
    
    // If no specific error message, at least verify we're still on login page
    if (!errorFound) {
      await expect(page.locator('input[type="email"]')).toBeVisible()
    }
  })

  test('Data persistence across page reloads', async ({ page }) => {
    await loginUser(page)
    
    // Navigate to today's records and add a test record
    await page.click('text=开始记录')
    await page.waitForURL('**/today**', { timeout: 10000 })
    await page.waitForTimeout(2000) // Wait for page to fully load
    await page.click('button:has-text("添加食物记录")')
    await expect(page.locator('text=➕ 添加食物记录')).toBeVisible()
    
    await page.selectOption('select', '中餐')
    await page.fill('input[placeholder*="请输入食物名称"]', '持久化测试食物')
    await page.fill('input[placeholder*="请输入重量"]', '300')
    await page.fill('input[placeholder*="请输入卡路里"]', '200')
    
    await page.click('button:has-text("添加记录")')
    await page.waitForTimeout(3000)
    
    // Reload the page
    await page.reload()
    await waitForPageLoad(page)
    
    // Check if the record still exists
    await expect(page.locator('text=持久化测试食物')).toBeVisible()
  })

  test('Responsive design elements', async ({ page }) => {
    await loginUser(page)
    
    // Test different viewport sizes
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone size
    await page.waitForTimeout(500)
    
    // Verify mobile-specific elements (mobile nav is shown on small screens)
    await expect(page.locator('nav').nth(1)).toBeVisible() // Mobile nav is the second nav
    await expect(page.locator('dt:has-text("今日记录")')).toBeVisible()
    
    // Test tablet size
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Verify layout still works
    await expect(page.locator('dt:has-text("今日记录")')).toBeVisible()
    
    // Back to mobile
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
  })
})