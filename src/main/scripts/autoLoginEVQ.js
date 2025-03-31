const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

/**
 * 自动登录EVQ系统的脚本
 * @param {Object} params - 参数对象
 * @param {string} params.url - 目标URL
 * @param {string} [params.username] - 可选用户名
 * @param {string} [params.password] - 可选密码
 * @param {boolean} [params.screenshotEnabled=true] - 是否启用截图
 * @param {string} [params.screenshotPath] - 截图保存路径
 * @param {Function} callback - 完成回调
 */
module.exports = async function(params, callback) {
  console.log('=== 自动登录EVQ脚本开始执行 ===');
  console.log('参数:');
  console.log(JSON.stringify(params, null, 2));
  
  // 验证必需参数
  if (!params.url) {
    const error = new Error('Missing required parameter: url');
    console.error('错误: 缺少必需参数 url');
    return callback(error);
  }
  
  // 设置默认值
  const username = params.username || '';
  const password = params.password || '';
  const screenshotEnabled = params.screenshotEnabled !== false; // 默认为true
  const screenshotPath = params.screenshotPath || path.join(process.cwd(), 'evq-screenshots');
  
  // 确保截图目录存在
  if (screenshotEnabled && !fs.existsSync(screenshotPath)) {
    try {
      fs.mkdirSync(screenshotPath, { recursive: true });
      console.log(`创建截图目录: ${screenshotPath}`);
    } catch (error) {
      console.error('创建截图目录失败:', error.message);
      // 继续执行，可能会在截图时再次尝试
    }
  }
  
  // 保存屏幕截图的函数
  const saveScreenshot = async (page, name) => {
    if (!screenshotEnabled) return;
    
    try {
      const filename = path.join(screenshotPath, `${name}-${new Date().toISOString().replace(/:/g, '-')}.png`);
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`截图已保存到: ${filename}`);
    } catch (error) {
      console.error(`截图失败 ${name}:`, error.message);
    }
  };
  
  // 启动浏览器
  let browser;
  try {
    console.log('启动浏览器...');
    browser = await puppeteer.launch({
      headless: false, // 使用新的无头模式
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1280, height: 800 }
    });
    
    const page = await browser.newPage();
    
    // 设置页面超时和错误处理
    page.setDefaultNavigationTimeout(60000); // 60秒导航超时
    
    page.on('console', msg => console.log('浏览器控制台:', msg.text()));
    page.on('pageerror', error => console.error('页面错误:', error.message));
    
    // 导航到目标URL
    console.log(`导航到: ${params.url}`);
    await page.goto(params.url, { waitUntil: 'networkidle2' });
    
    await saveScreenshot(page, 'initial-page');
    
    // 检测是否有登录表单
    const hasLoginForm = await page.evaluate(() => {
      return !!document.querySelector('form') && 
        (!!document.querySelector('input[type="password"]') || 
         !!document.querySelector('input[name="password"]') ||
         !!document.querySelector('input[name="pwd"]'));
    });
    
    if (hasLoginForm && username && password) {
      console.log('检测到登录表单，尝试登录...');
      
      // 尝试填写用户名和密码字段
      await page.evaluate((user, pass) => {
        // 查找用户名输入框
        const userInputs = Array.from(document.querySelectorAll('input'))
          .filter(el => {
            const type = el.getAttribute('type');
            const name = el.getAttribute('name');
            return (type === 'text' || type === 'email') ||
                   (name && (name.includes('user') || name.includes('email') || name.includes('account')));
          });
        
        // 查找密码输入框
        const passInputs = Array.from(document.querySelectorAll('input'))
          .filter(el => {
            const type = el.getAttribute('type');
            const name = el.getAttribute('name');
            return type === 'password' || (name && name.includes('pass'));
          });
        
        // 填写用户名
        if (userInputs.length > 0) {
          userInputs[0].value = user;
        }
        
        // 填写密码
        if (passInputs.length > 0) {
          passInputs[0].value = pass;
        }
        
        return { 
          foundUserInput: userInputs.length > 0,
          foundPassInput: passInputs.length > 0
        };
      }, username, password);
      
      // 查找并点击登录按钮
      await page.evaluate(() => {
        // 查找所有按钮和表单提交元素
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]'))
          .filter(el => {
            const text = el.textContent || el.value || '';
            return text.toLowerCase().includes('login') || 
                   text.toLowerCase().includes('sign in') ||
                   text.toLowerCase().includes('log in');
          });
        
        // 点击找到的登录按钮
        if (buttons.length > 0) {
          buttons[0].click();
          return true;
        }
        
        // 如果没有找到明确的登录按钮，尝试提交表单
        const form = document.querySelector('form');
        if (form) {
          form.submit();
          return true;
        }
        
        return false;
      });
      
      // 等待导航完成
      await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(e => {
        console.log('导航等待超时，继续执行:', e.message);
      });
      
      await saveScreenshot(page, 'after-login');
      
      console.log('登录后的URL:', page.url());
    } else {
      if (hasLoginForm) {
        console.log('检测到登录表单，但未提供凭据');
      } else {
        console.log('未检测到登录表单');
      }
    }
    
    // 最后的截图
    await saveScreenshot(page, 'final-page');
    
    // 获取页面信息
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        url: window.location.href,
        content: document.body.textContent.substring(0, 500) + '...' // 获取部分页面内容
      };
    });
    
    // 关闭浏览器
    await browser.close();
    
    // 返回成功结果
    const result = {
      success: true,
      message: '自动化流程已完成',
      loginAttempted: hasLoginForm && username && password,
      pageInfo,
      timestamp: new Date().toISOString()
    };
    
    console.log('执行结果:');
    console.log(JSON.stringify(result, null, 2));
    console.log('=== 自动登录EVQ脚本执行完毕 ===');
    
    callback(null, result);
    
  } catch (error) {
    console.error('执行过程中出错:', error);
    
    // 确保浏览器关闭
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('关闭浏览器时出错:', closeError.message);
      }
    }
    
    console.log('=== 自动登录EVQ脚本执行失败 ===');
    callback(error);
  }
};
