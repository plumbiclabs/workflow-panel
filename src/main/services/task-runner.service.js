// src/main/services/task-runner.service.js
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const terminalService = require('./terminal.service');
const scriptRegistry = require('./script-registry.service');
const logger = require('../utils/logger');

class TaskRunnerService {
  constructor() {
    // 存储任务执行结果的缓存，用于变量引用解析
    this.taskOutputCache = {};
  }

  // 执行任务的入口方法
  async runTask(task, terminalId, workflowId) {
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
      if (task.type === 'script-executor') {
        logger.debug('Running script-executor task');
        return await this.runKeyValueTask(task, workflowId);
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
  
  // 解析参数中的变量引用
  resolveVariableReferences(parameters, workflowId) {
    if (!parameters || !Array.isArray(parameters)) return {};

    // 记录任务输出缓存的内容，便于调试
    logger.debug(`Resolving variables for workflow ${workflowId}. Available outputs:`, 
      Object.keys(this.taskOutputCache)
        .filter(key => key.startsWith(`${workflowId}-`))
        .reduce((acc, key) => {
          acc[key] = typeof this.taskOutputCache[key] === 'object' ? 
            Object.keys(this.taskOutputCache[key]) : 
            this.taskOutputCache[key];
          return acc;
        }, {})
    );

    // 解析后的参数
    const resolvedParams = {};

    // 正则表达式用于匹配变量引用: ${TaskX.output.xyz}
    const variablePattern = /\${([^}]+)}/g;

    // 处理每个参数
    parameters.forEach(param => {
      let value = param.value;
      
      // 检查值是否包含变量引用
      if (typeof value === 'string' && value.includes('${')) {
        logger.debug(`Resolving variable references in parameter ${param.key}: ${value}`);
        
        // 替换所有变量引用
        value = value.replace(variablePattern, (match, varPath) => {
          try {
            // 解析变量路径，例如 Task1.output.user.name
            const pathParts = varPath.split('.');
            
            // 我们现在的格式是 task-X.output.path.to.value
            if (pathParts.length >= 2 && pathParts[1] === 'output') {
              const taskRef = pathParts[0]; // 例如 "task-1"
              const actualTaskId = taskRef.replace('task-', '');
              const cacheKey = `${workflowId}-${actualTaskId}`;
              
              logger.debug(`Looking for variable ${match} in cache key ${cacheKey}`);
              
              // 在缓存中查找任务结果
              const taskOutput = this.taskOutputCache[cacheKey];
              
              if (!taskOutput) {
                logger.warn(`Variable reference not found: ${match} - Task output not in cache (key: ${cacheKey})`);
                return match; // 如果找不到，保留原始引用
              }
              
              // 递归查找嵌套属性
              let result = taskOutput;
              for (let i = 2; i < pathParts.length; i++) {
                result = result[pathParts[i]];
                
                // 如果路径不存在，返回原始引用
                if (result === undefined) {
                  logger.warn(`Variable reference not found: ${match} - Path ${pathParts.slice(2).join('.')} does not exist in output`);
                  return match;
                }
              }
              
              logger.debug(`Resolved ${match} to value: ${String(result)}`);
              return String(result); // 返回解析的值（转换为字符串）
            }
            
            logger.warn(`Invalid variable reference format: ${match}`);
            return match; // 格式不正确，保留原始引用
          } catch (error) {
            logger.error(`Error resolving variable reference ${match}:`, error);
            return match; // 出现错误，保留原始引用
          }
        });
      }
      
      resolvedParams[param.key] = value;
    });
    
    logger.debug('Resolved parameters:', resolvedParams);
    return resolvedParams;
  }

  // 运行键值对任务
  async runKeyValueTask(task, workflowId) {
    if (!task.parameters || task.parameters.length === 0) {
      logger.error('No parameters defined for task', { taskId: task.id });
      return { success: false, error: 'No parameters defined for this task' };
    }
    
    try {
      // 解析参数中的变量引用
      const resolvedParams = this.resolveVariableReferences(task.parameters, workflowId);
      logger.debug('Resolved parameters:', resolvedParams);
      
      // 使用脚本注册表运行相应的脚本
      const scriptId = task.scriptId || 'default';
      
      logger.info(`Preparing to run script: ${scriptId}`);
      logger.debug('Script parameters:', resolvedParams);
      
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
      
      // 检查必需参数
      if (scriptInfo.requiredParams && scriptInfo.requiredParams.length > 0) {
        const missingParams = scriptInfo.requiredParams.filter(param => 
          !resolvedParams || resolvedParams[param] === undefined
        );
        
        if (missingParams.length > 0) {
          logger.error(`Missing required parameters: ${missingParams.join(', ')}`);
          return { 
            success: false, 
            error: `Missing required parameters: ${missingParams.join(', ')}` 
          };
        }
      }
      
      // 从磁盘加载脚本
      let scriptModule;
      try {
        // 使用 require 加载脚本模块
        scriptModule = require(scriptPath);
        
        if (typeof scriptModule !== 'function') {
          logger.error('Script is not a function');
          return { success: false, error: 'Script is not a function' };
        }
      } catch (error) {
        logger.error('Failed to load script module:', error);
        return { success: false, error: `Failed to load script module: ${error.message}` };
      }
      
      // 执行脚本
      logger.info(`Executing script: ${scriptPath}`);
      
      return new Promise((resolve) => {
        try {
          // 调用脚本并传递参数
          scriptModule(resolvedParams, (err, result) => {
            if (err) {
              logger.error('Script execution returned error:', err);
              resolve({ success: false, error: err.message || 'Script execution failed' });
            } else {
              logger.info('Script executed successfully');
              
              // 存储结果到缓存
              if (result && result.output) {
                this.taskOutputCache[`${workflowId}-${task.id}`] = result.output;
              }
              
              resolve({ 
                success: true, 
                message: 'Script executed successfully',
                output: result && result.output ? result.output : null
              });
            }
          });
        } catch (error) {
          logger.error('Error during script execution:', error);
          resolve({ success: false, error: `Error during script execution: ${error.message}` });
        }
      });
    } catch (error) {
      logger.error('Error running key-value task:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TaskRunnerService();