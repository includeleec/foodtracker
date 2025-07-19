#!/usr/bin/env node

// 测试Cloudflare Images API的脚本
const fs = require('fs');
const path = require('path');

// 加载环境变量
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

// 从环境变量读取配置
const config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID,
  accountHash: process.env.CLOUDFLARE_ACCOUNT_HASH,
  imagesToken: process.env.CLOUDFLARE_IMAGES_TOKEN,
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://food-tracker-app.includeleec-b6f.workers.dev'
};

console.log('Cloudflare Images API 测试');
console.log('==========================');
console.log('Account ID:', config.accountId);
console.log('Account Hash:', config.accountHash);
console.log('App URL:', config.appUrl);
console.log('Images Token exists:', !!config.imagesToken);
console.log('');

async function testCloudflareImagesAPI() {
  try {
    // 测试 API 连接
    console.log('1. 测试 Cloudflare Images API 连接...');
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/images/v1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.imagesToken}`,
        },
      }
    );

    if (!response.ok) {
      console.error('❌ API 连接失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('错误详情:', errorText);
      return false;
    }

    console.log('✅ Cloudflare Images API 连接成功');
    
    // 获取现有图片列表
    const data = await response.json();
    console.log('✅ 现有图片数量:', data.result?.images?.length || 0);
    
    return true;
  } catch (error) {
    console.error('❌ API 测试失败:', error.message);
    return false;
  }
}

async function testAppUploadAPI() {
  try {
    console.log('\n2. 测试应用上传 API...');
    
    // 测试上传API端点是否可访问
    const response = await fetch(`${config.appUrl}/api/upload`, {
      method: 'OPTIONS',
      headers: {
        'Origin': config.appUrl,
      }
    });

    console.log('上传API OPTIONS响应状态:', response.status);
    
    if (response.status === 200) {
      console.log('✅ 上传API OPTIONS请求成功');
      
      // 检查CORS头
      const corsOrigin = response.headers.get('Access-Control-Allow-Origin');
      const corsMethods = response.headers.get('Access-Control-Allow-Methods');
      console.log('CORS Allow-Origin:', corsOrigin);
      console.log('CORS Allow-Methods:', corsMethods);
      
      return true;
    } else {
      console.error('❌ 上传API OPTIONS请求失败');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 应用上传API测试失败:', error.message);
    return false;
  }
}

async function testImageDelivery() {
  try {
    console.log('\n3. 测试图片分发 URL...');
    
    // 构建测试URL
    const testUrl = `https://imagedelivery.net/${config.accountHash}/test/public`;
    console.log('测试URL:', testUrl);
    
    const response = await fetch(testUrl, { method: 'HEAD' });
    console.log('图片分发响应状态:', response.status);
    
    if (response.status === 200 || response.status === 404) {
      console.log('✅ 图片分发域名可访问');
      return true;
    } else {
      console.error('❌ 图片分发域名不可访问');
      return false;
    }
    
  } catch (error) {
    console.error('❌ 图片分发测试失败:', error.message);
    return false;
  }
}

async function main() {
  // 检查必要的环境变量
  if (!config.accountId || !config.accountHash || !config.imagesToken) {
    console.error('❌ 缺少必要的环境变量:');
    console.error('- CLOUDFLARE_ACCOUNT_ID:', !!config.accountId);
    console.error('- CLOUDFLARE_ACCOUNT_HASH:', !!config.accountHash);
    console.error('- CLOUDFLARE_IMAGES_TOKEN:', !!config.imagesToken);
    process.exit(1);
  }

  let allTestsPassed = true;
  
  allTestsPassed &= await testCloudflareImagesAPI();
  allTestsPassed &= await testAppUploadAPI();
  allTestsPassed &= await testImageDelivery();
  
  console.log('\n==========================');
  if (allTestsPassed) {
    console.log('✅ 所有测试通过!');
  } else {
    console.log('❌ 部分测试失败，请检查配置');
  }
}

main().catch(console.error);