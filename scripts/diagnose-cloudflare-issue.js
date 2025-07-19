#!/usr/bin/env node

// 诊断Cloudflare部署环境中的图片问题
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const CLOUDFLARE_APP_URL = 'https://food-tracker-app.includeleec-b6f.workers.dev';

async function testDeployedApp() {
  console.log('诊断 Cloudflare 部署应用图片问题');
  console.log('=====================================\n');

  try {
    // 1. 测试首页加载
    console.log('1. 测试首页加载...');
    const homeResponse = await fetch(CLOUDFLARE_APP_URL);
    console.log(`首页状态: ${homeResponse.status}`);
    
    if (homeResponse.ok) {
      console.log('✅ 首页加载成功');
    } else {
      console.log('❌ 首页加载失败');
      return;
    }

    // 2. 测试上传API的OPTIONS请求
    console.log('\n2. 测试上传API CORS...');
    const corsResponse = await fetch(`${CLOUDFLARE_APP_URL}/api/upload`, {
      method: 'OPTIONS',
      headers: {
        'Origin': CLOUDFLARE_APP_URL,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization, Content-Type'
      }
    });
    
    console.log(`CORS预检状态: ${corsResponse.status}`);
    
    if (corsResponse.ok) {
      const corsHeaders = {
        'Access-Control-Allow-Origin': corsResponse.headers.get('Access-Control-Allow-Origin'),
        'Access-Control-Allow-Methods': corsResponse.headers.get('Access-Control-Allow-Methods'),
        'Access-Control-Allow-Headers': corsResponse.headers.get('Access-Control-Allow-Headers')
      };
      console.log('✅ CORS配置:', corsHeaders);
    } else {
      console.log('❌ CORS预检失败');
    }

    // 3. 测试上传API的错误处理（不携带认证）
    console.log('\n3. 测试上传API错误处理...');
    const uploadResponse = await fetch(`${CLOUDFLARE_APP_URL}/api/upload`, {
      method: 'POST',
      headers: {
        'Origin': CLOUDFLARE_APP_URL,
        'Content-Type': 'multipart/form-data'
      },
      body: new FormData() // 空的FormData
    });
    
    console.log(`上传API状态: ${uploadResponse.status}`);
    
    try {
      const uploadResult = await uploadResponse.text();
      console.log('上传API响应:', uploadResult.substring(0, 200) + '...');
    } catch (e) {
      console.log('无法解析上传API响应');
    }

    // 4. 测试图片分发域名
    console.log('\n4. 测试图片分发域名...');
    const testImageUrl = `https://imagedelivery.net/${process.env.CLOUDFLARE_ACCOUNT_HASH}/test/public`;
    const imageResponse = await fetch(testImageUrl, { method: 'HEAD' });
    
    console.log(`图片分发域名状态: ${imageResponse.status}`);
    
    if (imageResponse.status === 404) {
      console.log('✅ 图片分发域名可访问（404表示域名正常但图片不存在）');
    } else if (imageResponse.status === 200) {
      console.log('✅ 图片分发域名可访问');
    } else {
      console.log('❌ 图片分发域名问题');
    }

    // 5. 测试已知图片URL（如果有的话）
    console.log('\n5. 测试现有图片访问...');
    // 这里我们可以测试一个已知存在的图片
    const existingImageUrl = `https://imagedelivery.net/${process.env.CLOUDFLARE_ACCOUNT_HASH}/4c8c1773-5a2e-4e0a-6f67-b02a8c3a5200/public`;
    const existingImageResponse = await fetch(existingImageUrl, { method: 'HEAD' });
    
    console.log(`现有图片访问状态: ${existingImageResponse.status}`);
    
    if (existingImageResponse.ok) {
      console.log('✅ 现有图片可正常访问');
    } else {
      console.log('⚠️  现有图片访问异常（可能图片ID不存在）');
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

testDeployedApp().catch(console.error);