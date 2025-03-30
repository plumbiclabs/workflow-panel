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
      
      // 检查脚本是否存在
      try {
        const scriptInfo = await scriptRegistry.getScriptById(scriptId);
        logger.debug('找到脚本:', scriptInfo);
      } catch (error) {
        logger.error(`脚本 "${scriptId}" 不存在或无法加载`);
        return { success: false, error: `Script ${scriptId} not found` };
      }
      
      // 1. 创建一个临时参数文件
      const paramsPath = path.join(os.tmpdir(), `task_params_${Date.now()}.json`);
      fs.writeFileSync(paramsPath, JSON.stringify(paramObj, null, 2));
      logger.debug(`参数文件已创建: ${paramsPath}`);
      
      // 2. 创建一个包装脚本显示执行过程
      const wrapperPath = path.join(os.tmpdir(), `task_wrapper_${Date.now()}.js`);
      const wrapperScript = `
const scriptRegistry = require('${path.join(__dirname, 'script-registry.service.js').replace(/\\/g, '\\\\')}');
const fs = require('fs');
const logger = require('${path.join(__dirname, '../utils/logger.js').replace(/\\/g, '\\\\')}');

// 读取参数文件
const paramsPath = '${paramsPath.replace(/\\/g, '\\\\')}';
const params = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));

console.log('=== TASK START: ${task.name} ===');
console.log('Running script: ${scriptId}');
console.log('Parameters:');
console.log(JSON.stringify(params, null, 2));
console.log('-----------------------------------');

// 记录调试信息
logger.debug('包装脚本开始执行', { 
  scriptId: '${scriptId}', 
  taskName: '${task.name}',
  paramsPath: '${paramsPath.replace(/\\/g, '\\\\')}'
});

// 运行脚本
scriptRegistry.runScript('${scriptId}', params)
  .then(result => {
    console.log('-----------------------------------');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('=== TASK COMPLETE ===');
    logger.debug('脚本执行成功', { result });
  })
  .catch(error => {
    console.error('-----------------------------------');
    console.error('Error:', error.message);
    console.error('=== TASK FAILED ===');
    logger.error('脚本执行失败', { error: error.message });
  });
      `;
      
      fs.writeFileSync(wrapperPath, wrapperScript);
      logger.debug(`包装脚本已创建: ${wrapperPath}`);
      
      // 3. 在终端中运行包装脚本
      const platform = os.platform();
      logger.debug(`检测到平台: ${platform}`);
      
      if (platform === 'darwin') {
        // macOS
        logger.debug('使用macOS Terminal执行脚本');
        const appleScript = `
          tell application "Terminal"
            activate
            do script "node '${wrapperPath}'; echo '\\nPress any key to exit...'; read -n 1"
          end tell
        `;
        exec(`osascript -e '${appleScript}'`);
      } else if (platform === 'win32') {
        // Windows
        logger.debug('使用Windows命令提示符执行脚本');
        exec(`start cmd.exe /k "node "${wrapperPath}" && pause"`);
      } else {
        // Linux
        logger.debug('尝试在Linux上查找可用终端');
        const terminals = ['gnome-terminal', 'xterm', 'konsole', 'xfce4-terminal'];
        let terminalFound = false;
        
        for (const terminal of terminals) {
          try {
            exec(`which ${terminal}`, (error, stdout) => {
              if (!error && stdout) {
                logger.debug(`找到终端: ${terminal}`);
                terminalFound = true;
                
                if (terminal === 'gnome-terminal') {
                  exec(`gnome-terminal -- bash -c "node ${wrapperPath}; echo '\\nPress Enter to exit...'; read"`);
                } else {
                  exec(`${terminal} -e "node ${wrapperPath} && echo '\\nPress Enter to exit...' && read"`);
                }
              }
            });
            
            if (terminalFound) break;
          } catch (e) {
            logger.debug(`终端 ${terminal} 不可用: ${e.message}`);
          }
        }
        
        if (!terminalFound) {
          logger.warn('未找到可用的Linux终端');
        }
      }
      
      logger.info('脚本执行已启动');
      return { success: true, message: 'Script execution started' };
    } catch (error) {
      logger.error('执行键值对任务失败:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TaskRunnerService();