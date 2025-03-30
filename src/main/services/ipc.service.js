const { ipcMain } = require('electron');
const workflowStore = require('../store/workflow.store');
const scriptRegistry = require('./script-registry.service');
const taskRunnerService = require('./task-runner.service');
const logger = require('../utils/logger');

function setupIpcHandlers(mainWindow) {
  logger.info('设置IPC处理程序');
  
  // 工作流操作
  ipcMain.handle('workflow:getAll', () => {
    logger.debug('IPC调用: workflow:getAll');
    return workflowStore.getAllWorkflows();
  });

  ipcMain.handle('workflow:getById', (_, id) => {
    logger.debug('IPC调用: workflow:getById', { id });
    return workflowStore.getWorkflowById(id);
  });

  ipcMain.handle('workflow:add', (_, workflow) => {
    logger.debug('IPC调用: workflow:add', { workflow });
    return workflowStore.addWorkflow(workflow);
  });

  ipcMain.handle('workflow:update', (_, { id, workflowData }) => {
    logger.debug('IPC调用: workflow:update', { id, workflowData });
    return workflowStore.updateWorkflow(id, workflowData);
  });

  ipcMain.handle('workflow:delete', (_, id) => {
    logger.debug('IPC调用: workflow:delete', { id });
    return workflowStore.deleteWorkflow(id);
  });

  // 任务操作
  ipcMain.handle('task:add', (_, { workflowId, task }) => {
    logger.debug('IPC调用: task:add', { workflowId, task });
    return workflowStore.addTask(workflowId, task);
  });

  ipcMain.handle('task:update', (_, { workflowId, taskId, taskData }) => {
    logger.debug('IPC调用: task:update', { workflowId, taskId, taskData });
    return workflowStore.updateTask(workflowId, taskId, taskData);
  });

  ipcMain.handle('task:delete', (_, { workflowId, taskId }) => {
    logger.debug('IPC调用: task:delete', { workflowId, taskId });
    return workflowStore.deleteTask(workflowId, taskId);
  });
  
  // 添加运行任务命令的处理函数
  ipcMain.handle('task:run', async (_, { workflowId, taskId }) => {
    logger.info('===== 开始执行任务 =====');
    logger.info(`工作流ID: ${workflowId}, 任务ID: ${taskId}`);
    
    try {
      // 获取工作流和任务
      const workflow = workflowStore.getWorkflowById(workflowId);
      if (!workflow) {
        logger.error('工作流未找到', { workflowId });
        return { success: false, error: 'Workflow not found' };
      }
      
      const task = workflow.tasks.find(t => t.id === taskId);
      if (!task) {
        logger.error('任务未找到', { workflowId, taskId });
        return { success: false, error: 'Task not found' };
      }
      
      logger.info('任务信息:', task);
      
      // 使用任务运行服务来执行任务
      const result = await taskRunnerService.runTask(task);
      
      logger.info('任务执行结果:', result);
      logger.info('===== 任务执行完成 =====');
      
      // 通知渲染进程任务已完成
      if (mainWindow) {
        mainWindow.webContents.send('task:complete', { 
          workflowId, 
          taskId, 
          success: result.success,
          message: result.success ? '任务执行成功' : '任务执行失败'
        });
      }
      
      return result;
    } catch (error) {
      logger.error('任务执行出错:', error);
      logger.info('===== 任务执行失败 =====');
      
      // 通知渲染进程任务失败
      if (mainWindow) {
        mainWindow.webContents.send('task:error', { 
          workflowId, 
          taskId, 
          error: error.message || '未知错误'
        });
      }
      
      return { success: false, error: error.message || '未知错误' };
    }
  });

  // 命令操作
  ipcMain.handle('command:add', (_, { workflowId, taskId, command }) => {
    logger.debug('IPC调用: command:add', { workflowId, taskId, command });
    return workflowStore.addCommand(workflowId, taskId, command);
  });

  ipcMain.handle('command:update', (_, { workflowId, taskId, commandIndex, newCommand }) => {
    logger.debug('IPC调用: command:update', { workflowId, taskId, commandIndex, newCommand });
    return workflowStore.updateCommand(workflowId, taskId, commandIndex, newCommand);
  });

  ipcMain.handle('command:delete', (_, { workflowId, taskId, commandIndex }) => {
    logger.debug('IPC调用: command:delete', { workflowId, taskId, commandIndex });
    return workflowStore.deleteCommand(workflowId, taskId, commandIndex);
  });

  // 添加获取脚本列表的处理程序
  ipcMain.handle('script:getAll', () => {
    logger.debug('IPC调用: script:getAll');
    return scriptRegistry.getAllScripts();
  });

  // 获取单个脚本信息
  ipcMain.handle('script:getById', (_, scriptId) => {
    logger.debug('IPC调用: script:getById', { scriptId });
    return scriptRegistry.getScriptById(scriptId);
  });
  
  logger.info('IPC处理程序设置完成');
}

module.exports = {
  setupIpcHandlers
};