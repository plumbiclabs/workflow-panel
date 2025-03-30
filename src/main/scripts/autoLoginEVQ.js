const puppeteer = require('puppeteer');

/**
 * 自动登录EVQ系统的脚本
 * @param {Object} params - 参数对象
 * @param {string} params.url - 登录URL
 * @param {string} params.username - 用户名
 * @param {string} params.password - 密码
 * @param {boolean} [params.headless=false] - 是否使用无头模式
 * @param {number} [params.timeout=30000] - 超时时间(毫秒)
 * @param {Function} callback - 完成回调
 */
module.exports = async function(params, callback) {
  console.log('Starting autoLoginEVQ script...');
  console.log('Parameters:', JSON.stringify({
    ...params,
    password: params.password ? '******' : undefined // 隐藏密码
  }, null, 2));

  const { 
    url, 
    username, 
    password, 
    headless = false, 
    timeout = 30000 
  } = params;

  // 验证必填参数
  if (!url) {
    return callback(new Error('URL is required'));
  }

  let browser;
  try {
    console.log('Launching browser...');
    browser = await puppeteer.launch({
      headless: headless === 'true' || headless === true,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();
    console.log(`Navigating to ${url}...`);
    
    // 设置导航超时
    page.setDefaultNavigationTimeout(timeout);
    
    // 访问URL
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log('Page loaded successfully');

    // 如果提供了用户名和密码，尝试自动登录
    if (username && password) {
      console.log(`Attempting to login as ${username}...`);
      
      try {
        // 等待用户名输入框出现
        await page.waitForSelector('#username', { timeout });
        await page.type('#username', username);
        
        // 等待密码输入框
        await page.waitForSelector('#password', { timeout });
        await page.type('#password', password);
        
        // 点击登录按钮 (根据实际网页元素调整选择器)
        await page.waitForSelector('button[type="submit"]', { timeout });
        await page.click('button[type="submit"]');
        
        // 等待跳转或登录成功标志
        await page.waitForNavigation({ timeout });
        console.log('Login successful');
      } catch (loginError) {
        console.warn('Login attempt failed:', loginError.message);
        console.log('Browser will remain open, but login was not completed automatically');
      }
    } else {
      console.log('No login credentials provided. Browser page opened without login');
    }

    console.log('Browser will remain open for manual interaction');
    
    // 不要关闭浏览器，让用户可以继续操作
    // 注意: 此处如果脚本退出，浏览器进程可能会在某些系统上自动关闭
    // 可以根据需要修改为保持脚本运行
    
    // 为了保持脚本运行，返回浏览器引用，使其不被垃圾回收
    return callback(null, { 
      success: true, 
      message: 'Browser launched and page loaded successfully',
      // 不要返回browser引用给调用方，因为它不能被序列化
    });
  } catch (error) {
    console.error('Error in autoLoginEVQ script:', error);
    
    // 出错时尝试关闭浏览器
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return callback(error);
  }
};
