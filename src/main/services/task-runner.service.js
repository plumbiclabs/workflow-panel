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
  async runTask(task, terminalId) {
    if (!task) {
      logger.error('Invalid task: task object is empty');
      return { success: false, error: 'Invalid task' };
    }
    
    logger.info(`Starting task: ${task.name || 'Unnamed Task'}`, { 
      taskId: task.id, 
      type: task.type,
      terminalId 
    });
    
    try {
      // 根据任务类型执行不同的处理逻辑
      if (task.type === 'key-value') {
        logger.debug('Running key-value task');
        return await this.runKeyValueTask(task);
      } else {
        // 命令类型任务 (默认)
        logger.debug('Running command task');
        return this.runCommandTask(task, terminalId);
      }
    } catch (error) {
      logger.error('Error running task:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 运行命令类型任务
  runCommandTask(task, terminalId) {
    if (!task.commands || task.commands.length === 0) {
      logger.error('No commands to run', { taskId: task.id });
      return { success: false, error: 'No commands to run' };
    }
    
    logger.debug('Task commands:', task.commands);
    
    try {
      const result = terminalService.runCommand(terminalId, task.commands);
      logger.info('Terminal launched for command execution');
      return { success: true, message: 'Terminal launched' };
    } catch (error) {
      logger.error('Failed to launch terminal for command execution:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 运行键值对任务
  async runKeyValueTask(task) {
    if (!task.parameters || task.parameters.length === 0) {
      logger.error('No parameters defined for task', { taskId: task.id });
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
      
      logger.info(`Preparing to run script: ${scriptId}`);
      logger.debug('Script parameters:', paramObj);
      
      // 获取脚本信息和路径
      let scriptInfo;
      try {
        scriptInfo = await scriptRegistry.getScriptById(scriptId);
        logger.debug('Found script:', scriptInfo);
        
        if (!scriptInfo) {
          logger.error(`Script "${scriptId}" not found`);
          return { success: false, error: `Script ${scriptId} not found` };
        }
      } catch (error) {
        logger.error(`Failed to load script "${scriptId}":`, error);
        return { success: false, error: `Failed to load script ${scriptId}: ${error.message}` };
      }
      
      // 获取脚本的实际路径
      const scriptPath = scriptInfo.path 
        ? path.join(scriptRegistry.scriptsDir, scriptInfo.path) 
        : scriptRegistry.defaultScriptPath;
      
      logger.debug(`Script path: ${scriptPath}`);
      
      // 验证脚本文件存在
      if (!fs.existsSync(scriptPath)) {
        logger.error(`Script file not found: ${scriptPath}`);
        return { success: false, error: `Script file not found: ${scriptPath}` };
      }
      
      // 直接在主进程中执行脚本
      logger.info(`Executing script: ${scriptPath}`);
      
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
      logger.error('Error running key-value task:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TaskRunnerService();