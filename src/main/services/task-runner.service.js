// src/main/services/task-runner.service.js
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const terminalService = require('./terminal.service');
const scriptRegistry = require('./script-registry.service');
const logger = require('../utils/logger');

class TaskRunnerService {
  // 执行任务的入口方法
  async runTask(task) {
    if (!task) {
      logger.error('无效任务: 任务对象为空');
      return { success: false, error: 'Invalid task' };
    }
    
    logger.info(`开始执行任务: ${task.name || 'Unnamed Task'}`, { taskId: task.id, type: task.type });
    
    try {
      // 根据任务类型执行不同的处理逻辑
      if (task.type === 'key-value') {
        logger.debug('执行键值对类型任务');
        return await this.runKeyValueTask(task);
      } else {
        // 命令类型任务 (默认)
        logger.debug('执行命令类型任务');
        return this.runCommandTask(task);
      }
    } catch (error) {
      logger.error('执行任务时出错:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 运行命令类型任务
  runCommandTask(task) {
    if (!task.commands || task.commands.length === 0) {
      logger.error('无命令可执行', { taskId: task.id });
      return { success: false, error: 'No commands to run' };
    }
    
    logger.debug('任务命令列表:', task.commands);
    
    try {
      const result = terminalService.runTaskInTerminal(task.id, task.commands);
      logger.info('已启动终端执行命令');
      return { success: true, message: 'Terminal launched' };
    } catch (error) {
      logger.error('启动终端执行命令失败:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 运行键值对任务
  async runKeyValueTask(task) {
    if (!task.parameters || task.parameters.length === 0) {
      logger.error('任务未定义参数', { taskId: task.id });
      return { success: false, error: 'No parameters defined for this task' };
    }
    
    try {
      // 准备参数
      const paramObj = {};
      task.parameters.forEach(param => {
        paramObj[param.key] = param.value;
      });
      
      // 使用脚本注册表运行相应的脚本
      const scriptId = task.scriptId || 'default';
      
      logger.info(`准备执行脚本: ${scriptId}`);
      logger.debug('脚本参数:', paramObj);
      
      // 获取脚本信息和路径
      let scriptInfo;
      try {
        scriptInfo = await scriptRegistry.getScriptById(scriptId);
        logger.debug('找到脚本:', scriptInfo);
        
        if (!scriptInfo) {
          logger.error(`脚本 "${scriptId}" 不存在`);
          return { success: false, error: `Script ${scriptId} not found` };
        }
      } catch (error) {
        logger.error(`脚本 "${scriptId}" 加载失败:`, error);
        return { success: false, error: `Failed to load script ${scriptId}: ${error.message}` };
      }
      
      // 获取脚本的实际路径
      const scriptPath = scriptInfo.path 
        ? path.join(scriptRegistry.scriptsDir, scriptInfo.path) 
        : scriptRegistry.defaultScriptPath;
      
      logger.debug(`脚本路径: ${scriptPath}`);
      
      // 验证脚本文件存在
      if (!fs.existsSync(scriptPath)) {
        logger.error(`脚本文件不存在: ${scriptPath}`);
        return { success: false, error: `Script file not found: ${scriptPath}` };
      }
      
      // 直接在主进程中执行脚本
      logger.info(`直接执行脚本: ${scriptPath}`);
      
      // 检查必需参数
      if (scriptInfo.requiredParams && scriptInfo.requiredParams.length > 0) {
        const missingParams = scriptInfo.requiredParams.filter(param => !paramObj || paramObj[param] === undefined);
        
        if (missingParams.length > 0) {
          const error = `缺少必需参数: ${missingParams.join(', ')}`;
          logger.error(error);
          return { success: false, error };
        }
      }
      
      try {
        // 动态加载脚本模块
        const scriptModule = require(scriptPath);
        
        // 直接运行脚本并等待结果
        const result = await new Promise((resolve, reject) => {
          try {
            logger.debug('调用脚本模块...');
            scriptModule(paramObj, (err, result) => {
              if (err) {
                logger.error('脚本执行返回错误:', err);
                reject(err);
              } else {
                logger.info('脚本执行成功');
                logger.debug('脚本返回结果:', result);
                resolve(result);
              }
            });
          } catch (error) {
            logger.error('脚本执行出现异常:', error);
            reject(error);
          }
        });
        
        // 返回最终结果
        return {
          success: true,
          message: '脚本执行成功',
          data: result,
          scriptId,
          scriptPath
        };
      } catch (error) {
        logger.error('脚本执行失败:', error);
        return { 
          success: false, 
          error: error.message || String(error),
          scriptId,
          scriptPath
        };
      }
    } catch (error) {
      logger.error('执行键值对任务失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TaskRunnerService();