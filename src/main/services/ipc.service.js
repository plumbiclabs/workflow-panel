const { ipcMain } = require('electron');
const workflowStore = require('../store/workflow.store');
const scriptRegistry = require('./script-registry.service');
const taskRunnerService = require('./task-runner.service');
const fileService = require('./file.service');
const logger = require('../utils/logger');
const terminalService = require('./terminal.service');

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
  
  ipcMain.handle('workflow:updateOrder', (_, orderedWorkflows) => {
    logger.debug('IPC调用: workflow:updateOrder', { count: orderedWorkflows.length });
    return workflowStore.updateWorkflowsOrder(orderedWorkflows);
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
  
  // 添加获取可用终端的处理函数
  ipcMain.handle('terminal:getAvailable', () => {
    return terminalService.getAvailableTerminals();
  });

  // 修改任务运行处理函数以支持终端选择
  ipcMain.handle('task:run', async (_, { workflowId, taskId, terminalId }) => {
    logger.info('===== Starting task execution =====');
    logger.info(`Workflow ID: ${workflowId}, Task ID: ${taskId}, Terminal ID: ${terminalId}`);
    
    try {
      // 获取工作流和任务
      const workflow = workflowStore.getWorkflowById(workflowId);
      if (!workflow) {
        logger.error('Workflow not found', { workflowId });
        return { success: false, error: 'Workflow not found' };
      }
      
      const task = workflow.tasks.find(t => t.id === taskId);
      if (!task) {
        logger.error('Task not found', { workflowId, taskId });
        return { success: false, error: 'Task not found' };
      }
      
      logger.info('Task info:', task);
      
      // 使用任务运行服务来执行任务
      const result = await taskRunnerService.runTask(task, terminalId, workflowId);
      
      logger.info('Task execution result:', result);
      logger.info('===== Task execution completed =====');
      
      // 通知渲染进程任务已完成并传递结果
      if (mainWindow) {
        mainWindow.webContents.send('task:complete', { 
          workflowId, 
          taskId, 
          success: result.success,
          message: result.success ? 'Task executed successfully' : 'Task execution failed',
          output: result.output || null,
          error: result.error || null
        });
      }
      
      return result;
    } catch (error) {
      logger.error('Task execution error:', error);
      logger.info('===== Task execution failed =====');
      
      // 通知渲染进程任务失败
      if (mainWindow) {
        mainWindow.webContents.send('task:error', { 
          workflowId, 
          taskId, 
          error: error.message || 'Unknown error'
        });
      }
      
      return { success: false, error: error.message || 'Unknown error' };
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
  
  // 调试数据处理程序
  ipcMain.handle('debug:getStoreData', async () => {
    logger.debug('IPC调用: debug:getStoreData');
    try {
      // 收集所有主进程的状态数据
      return {
        workflows: workflowStore.getAllWorkflows(),
        taskOutputCache: taskRunnerService.taskOutputCache,
        availableScripts: await scriptRegistry.getAllScripts(),
        terminals: terminalService.getAvailableTerminals(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('获取调试数据失败:', error);
      return { error: error.message || '获取调试数据失败' };
    }
  });
  
  // 工作流导入导出功能
  ipcMain.handle('workflow:export', async (_, workflowData) => {
    logger.debug('IPC调用: workflow:export', { workflowId: workflowData.id });
    return await fileService.exportWorkflow(workflowData);
  });

  ipcMain.handle('workflow:import', async () => {
    logger.debug('IPC调用: workflow:import');
    return await fileService.importWorkflow();
  });
  
  logger.info('IPC处理程序设置完成');
}

module.exports = {
  setupIpcHandlers
};