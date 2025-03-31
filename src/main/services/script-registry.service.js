// src/main/services/script-registry.service.js
const path = require('path');
const fs = require('fs');
const { SCRIPT_DEFINITIONS } = require('../config/script-definitions');
const logger = require('../utils/logger');

class ScriptRegistryService {
  constructor() {
    // 公开脚本目录路径，使其他服务可访问
    this.scriptsDir = path.join(__dirname, '../scripts');
    this.defaultScriptPath = path.join(this.scriptsDir, 'default-handler.js');
    this.scripts = [...SCRIPT_DEFINITIONS];
    
    // 确保脚本目录存在
    this.ensureScriptsDirectory();
    
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
  ensureScriptsDirectory() {
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

/**
 * 默认脚本处理程序
 * @param {Object} params - 参数对象
 * @param {Function} callback - 完成回调
 */
module.exports = function(params, callback) {
  console.log('Task parameters:');
  console.log(JSON.stringify(params, null, 2));
  
  // 这里处理通用逻辑
  console.log('\\nTask completed successfully!');
  
  callback(null, { success: true, message: 'Task completed' });
};
      `;
      fs.writeFileSync(this.defaultScriptPath, defaultScript);
      logger.info(`创建默认脚本: ${this.defaultScriptPath}`);
    }
    
    // 确保其他预设脚本存在
    this.createExampleScripts();
  }
