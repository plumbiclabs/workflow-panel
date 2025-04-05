// src/main/services/script-registry.service.js
const path = require('path');
const fs = require('fs');
const { SCRIPT_DEFINITIONS } = require('../config/script-definitions');
const logger = require('../utils/logger');

// 添加默认脚本
const defaultScripts = [
  {
    id: 'system-info',
    name: 'System Information',
    description: 'Retrieves basic system information',
    path: 'system-info.js',
    requiredParams: []
  },
  {
    id: 'user-greeting',
    name: 'User Greeting',
    description: 'Creates a personalized greeting using variables from other tasks',
    path: 'user-greeting.js',
    requiredParams: ['username', 'platform', 'memory', 'greeting']
  }
];

class ScriptRegistryService {
  constructor() {
    this.scriptsDir = path.join(__dirname, '../../../scripts');
    this.defaultScriptPath = path.join(this.scriptsDir, 'default-handler.js');
    this.scripts = [...SCRIPT_DEFINITIONS, ...defaultScripts];
    
    // 确保脚本目录存在
    this.ensureScriptsDir();
    
    // 记录脚本路径，帮助调试
    logger.info(`Scripts directory: ${this.scriptsDir}`);
    
    // 确保默认脚本存在
    this.ensureDefaultScript();
    
    // 初始化脚本处理程序
    this.initializeScriptHandlers();
    
    logger.info('脚本注册服务已初始化', { 
      scriptsDir: this.scriptsDir,
      defaultScriptPath: this.defaultScriptPath,
      scriptCount: this.scripts.length
    });
  }
  
  // 获取所有脚本
  getAllScripts() {
    return this.scripts;
  }
  
  // 根据ID获取脚本
  getScriptById(id) {
    logger.debug(`查找脚本: ${id}`);
    const script = this.scripts.find(s => s.id === id);
    
    if (!script) {
      logger.warn(`脚本未找到: ${id}`);
      return null;
    }
    
    logger.debug(`找到脚本: ${id}`, { script });
    return script;
  }
  
  // 运行脚本
  async runScript(scriptId, params) {
    logger.info(`准备运行脚本: ${scriptId}`);
    const script = this.getScriptById(scriptId);
    
    if (!script) {
      const error = new Error(`Script not found: ${scriptId}`);
      logger.error(error.message);
      throw error;
    }
    
    try {
      // 获取脚本路径
      const scriptPath = script.path 
        ? path.join(this.scriptsDir, script.path) 
        : this.defaultScriptPath;
      
      logger.debug(`脚本路径: ${scriptPath}`);
      
      // 检查脚本文件是否存在
      if (!fs.existsSync(scriptPath)) {
        const error = new Error(`Script file not found: ${scriptPath}`);
        logger.error(error.message);
        throw error;
      }
      
      // 检查必需参数
      if (script.requiredParams && script.requiredParams.length > 0) {
        const missingParams = script.requiredParams.filter(param => !params || params[param] === undefined);
        
        if (missingParams.length > 0) {
          const error = new Error(`Missing required parameters: ${missingParams.join(', ')}`);
          logger.error(error.message);
          throw error;
        }
      }
      
      // 动态加载脚本模块
      logger.debug('加载脚本模块');
      const scriptModule = require(scriptPath);
      
      // 执行脚本
      logger.debug('执行脚本', { params });
      return new Promise((resolve, reject) => {
        try {
          scriptModule(params, (err, result) => {
            if (err) {
              logger.error('脚本执行失败', { error: err });
              reject(err);
            } else {
              logger.debug('脚本执行成功', { result });
              resolve(result);
            }
          });
        } catch (error) {
          logger.error('脚本执行出错', { error });
          reject(error);
        }
      });
    } catch (error) {
      logger.error(`运行脚本 "${scriptId}" 失败:`, error);
      throw error;
    }
  }
  
  // 确保脚本目录存在
  ensureScriptsDir() {
    if (!fs.existsSync(this.scriptsDir)) {
      fs.mkdirSync(this.scriptsDir, { recursive: true });
      logger.info(`创建脚本目录: ${this.scriptsDir}`);
    }
  }
  
  // 确保默认脚本存在
  ensureDefaultScript() {
    if (!fs.existsSync(this.defaultScriptPath)) {
      const defaultScript = `
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 默认脚本处理程序
 * @param {Object} params - 参数对象
 * @param {Function} callback - 完成回调，格式为 callback(error, result)
 */
module.exports = function(params, callback) {
  console.log('=== 默认脚本处理程序开始执行 ===');
  console.log('收到的参数:');
  console.log(JSON.stringify(params, null, 2));
  
  try {
    // 输出系统信息，便于调试
    console.log('\\n系统信息:');
    console.log(\`- 平台: \${os.platform()}\`);
    console.log(\`- 架构: \${os.arch()}\`);
    console.log(\`- 主机名: \${os.hostname()}\`);
    console.log(\`- 当前目录: \${process.cwd()}\`);
    console.log(\`- Node版本: \${process.version}\`);
    
    // 处理通用逻辑
    console.log('\\n处理参数...');
    
    // 延迟一秒钟模拟处理过程
    setTimeout(() => {
      console.log('\\n任务处理完成!');
      
      // 构建结果对象
      const result = {
        success: true,
        message: '任务已成功完成',
        timestamp: new Date().toISOString(),
        params: params,
        systemInfo: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname()
        }
      };
      
      // 返回处理结果
      console.log('返回结果:');
      console.log(JSON.stringify(result, null, 2));
      console.log('=== 默认脚本处理程序执行完毕 ===');
      
      callback(null, result);
    }, 1000);
    
  } catch (error) {
    console.error('\\n执行过程中出错:');
    console.error(error);
    console.log('=== 默认脚本处理程序执行失败 ===');
    
    callback(error, null);
  }
};
      `;
      fs.writeFileSync(this.defaultScriptPath, defaultScript);
      logger.info(`创建默认脚本: ${this.defaultScriptPath}`);
    }
    
    // 确保其他预设脚本存在
    this.createExampleScripts();
  }
  
  // 初始化脚本处理程序
  initializeScriptHandlers() {
    // 此处可以添加额外的初始化逻辑，例如验证所有脚本是否有效
    logger.debug('初始化脚本处理程序');
  }
  
  // 创建示例脚本
  createExampleScripts() {
    // 不创建示例脚本，只记录日志
    logger.debug('不创建其他示例脚本，只使用已有的脚本');
  }
}

module.exports = new ScriptRegistryService();