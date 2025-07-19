import { test, expect, Page } from '@playwright/test';

// Cloudflare 部署的应用 URL
const CLOUDFLARE_APP_URL = 'https://food-tracker-app.includeleec-b6f.workers.dev';

// 测试用户凭据
const TEST_USER = {
  email: 'includeleec@gmail.com',
  password: '123456'
};

// 等待页面完全加载的函数
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('networkidle');
  await page.waitForLoadState('domcontentloaded');
  // 等待一下确保页面完全渲染
  await page.waitForTimeout(1000);
}

// 登录辅助函数
async function loginUser(page: Page) {
  await page.goto(`${CLOUDFLARE_APP_URL}/auth/login`);
  await waitForPageLoad(page);
  
  await page.fill('input[type="email"]', TEST_USER.email);
  await page.fill('input[type="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  
  // 等待登录完成并跳转
  await page.waitForURL('**/dashboard/**', { timeout: 10000 });
  await waitForPageLoad(page);
}

test.describe('Cloudflare 部署应用页面切换测试', () => {
  
  test.beforeEach(async ({ page }) => {
    // 设置更长的超时时间
    test.setTimeout(60000);
    
    // 监听控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('Console Error:', msg.text());
      }
    });
    
    // 监听页面错误
    page.on('pageerror', error => {
      console.log('Page Error:', error.message);
    });
    
    // 监听网络请求失败
    page.on('requestfailed', request => {
      console.log('Request Failed:', request.url(), request.failure()?.errorText);
    });
  });

  test('首页加载和导航测试', async ({ page }) => {
    await page.goto(CLOUDFLARE_APP_URL);
    await waitForPageLoad(page);
    
    // 检查首页是否正常加载
    await expect(page).toHaveTitle(/食物追踪|Food Tracker/);
    
    // 检查导航到登录页面
    await page.click('text=登录');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/auth\/login/);
    
    // 检查导航到注册页面
    await page.click('text=注册');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/auth\/register/);
  });

  test('登录后页面切换测试', async ({ page }) => {
    await loginUser(page);
    
    // 测试在仪表板页面间切换
    console.log('Current URL:', page.url());
    
    // 1. 从今日页面切换到历史页面
    await page.click('text=历史记录');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/dashboard\/history/);
    console.log('Navigated to history page');
    
    // 检查历史页面是否正常加载
    await expect(page.locator('h1')).toBeVisible();
    
    // 2. 从历史页面切换到今日页面
    await page.click('text=今日记录');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/dashboard\/today/);
    console.log('Navigated to today page');
    
    // 检查今日页面是否正常加载
    await expect(page.locator('h1')).toBeVisible();
    
    // 3. 切换到主仪表板页面
    await page.click('text=仪表板');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/dashboard$/);
    console.log('Navigated to main dashboard');
  });

  test('快速页面切换压力测试', async ({ page }) => {
    await loginUser(page);
    
    // 快速在页面间切换多次，模拟用户快速操作
    for (let i = 0; i < 5; i++) {
      console.log(`Iteration ${i + 1}`);
      
      // 切换到历史页面
      await page.click('text=历史记录');
      await page.waitForURL(/\/dashboard\/history/, { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // 切换到今日页面  
      await page.click('text=今日记录');
      await page.waitForURL(/\/dashboard\/today/, { timeout: 5000 });
      await page.waitForTimeout(500);
      
      // 切换到主仪表板
      await page.click('text=仪表板');
      await page.waitForURL(/\/dashboard$/, { timeout: 5000 });
      await page.waitForTimeout(500);
    }
  });

  test('网络请求监控测试', async ({ page }) => {
    const failedRequests: Array<{url: string, error: string}> = [];
    const timeoutRequests: Array<string> = [];
    
    // 监控失败的请求
    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        error: request.failure()?.errorText || 'Unknown error'
      });
    });
    
    // 监控响应时间
    page.on('response', response => {
      const timing = response.request().timing();
      if (timing && timing.responseEnd > 10000) { // 超过10秒
        timeoutRequests.push(response.url());
      }
    });
    
    await loginUser(page);
    
    // 执行页面切换
    await page.click('text=历史记录');
    await waitForPageLoad(page);
    
    await page.click('text=今日记录');
    await waitForPageLoad(page);
    
    // 报告发现的问题
    if (failedRequests.length > 0) {
      console.log('Failed requests found:', failedRequests);
    }
    
    if (timeoutRequests.length > 0) {
      console.log('Slow requests found:', timeoutRequests);
    }
    
    // 测试断言 - 不应该有失败的关键请求
    const criticalFailures = failedRequests.filter(req => 
      req.url.includes('/api/') || req.url.includes('/_next/')
    );
    expect(criticalFailures.length).toBe(0);
  });

  test('错误边界和恢复测试', async ({ page }) => {
    await loginUser(page);
    
    // 模拟网络中断情况
    await page.route('**/api/**', route => {
      // 随机让一些API请求失败
      if (Math.random() < 0.3) {
        route.abort('failed');
      } else {
        route.continue();
      }
    });
    
    // 尝试页面切换
    try {
      await page.click('text=历史记录');
      await page.waitForTimeout(2000);
      
      // 检查是否显示错误信息或重试按钮
      const errorElements = await page.locator('text=错误,text=重试,text=失败').count();
      if (errorElements > 0) {
        console.log('Error handling detected');
        
        // 尝试重试
        const retryButton = page.locator('button:has-text("重试")');
        if (await retryButton.count() > 0) {
          await retryButton.click();
          await waitForPageLoad(page);
        }
      }
    } catch (error) {
      console.log('Navigation failed as expected:', error);
    }
    
    // 移除路由拦截，测试恢复
    await page.unroute('**/api/**');
    
    // 确保应用能够恢复正常
    await page.click('text=今日记录');
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/dashboard\/today/);
  });

  test('移动端页面切换测试', async ({ page }) => {
    // 设置移动端视口
    await page.setViewportSize({ width: 375, height: 667 });
    
    await loginUser(page);
    
    // 测试移动端导航
    const mobileNav = page.locator('[data-testid="mobile-nav"]');
    if (await mobileNav.count() > 0) {
      // 打开移动端菜单
      await page.click('button[aria-label="菜单"]');
      await page.waitForTimeout(500);
      
      // 测试移动端页面切换
      await page.click('text=历史记录');
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/\/dashboard\/history/);
      
      // 再次打开菜单并切换
      await page.click('button[aria-label="菜单"]');
      await page.waitForTimeout(500);
      await page.click('text=今日记录');
      await waitForPageLoad(page);
      await expect(page).toHaveURL(/\/dashboard\/today/);
    }
  });

  test('浏览器后退前进按钮测试', async ({ page }) => {
    await loginUser(page);
    
    // 记录初始URL
    const initialUrl = page.url();
    
    // 导航到历史页面
    await page.click('text=历史记录');
    await waitForPageLoad(page);
    
    // 导航到今日页面
    await page.click('text=今日记录');
    await waitForPageLoad(page);
    
    // 测试后退按钮
    await page.goBack();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/dashboard\/history/);
    
    // 测试前进按钮
    await page.goForward();
    await waitForPageLoad(page);
    await expect(page).toHaveURL(/\/dashboard\/today/);
    
    // 多次后退到初始页面
    await page.goBack();
    await page.goBack();
    await waitForPageLoad(page);
    expect(page.url()).toBe(initialUrl);
  });
});