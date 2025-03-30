const { ipcMain } = require('electron');
const workflowStore = require('../store/workflow.store');
const scriptRegistry = require('./script-registry.service');
function setupIpcHandlers() {
  // 工作流操作
  ipcMain.handle('workflow:getAll', () => {
    return workflowStore.getAllWorkflows();
  });

  ipcMain.handle('workflow:getById', (_, id) => {
    return workflowStore.getWorkflowById(id);
  });

  ipcMain.handle('workflow:add', (_, workflow) => {
    return workflowStore.addWorkflow(workflow);
  });

  ipcMain.handle('workflow:update', (_, { id, workflowData }) => {
    return workflowStore.updateWorkflow(id, workflowData);
  });

  ipcMain.handle('workflow:delete', (_, id) => {
    return workflowStore.deleteWorkflow(id);
  });

  // 任务操作
  ipcMain.handle('task:add', (_, { workflowId, task }) => {
    return workflowStore.addTask(workflowId, task);
  });

  ipcMain.handle('task:update', (_, { workflowId, taskId, taskData }) => {
    return workflowStore.updateTask(workflowId, taskId, taskData);
  });

  ipcMain.handle('task:delete', (_, { workflowId, taskId }) => {
    return workflowStore.deleteTask(workflowId, taskId);
  });
  
  // 添加运行任务命令的处理函数
  ipcMain.handle('task:run', (_, { workflowId, taskId }) => {
    // 获取工作流和任务
    const workflow = workflowStore.getWorkflowById(workflowId);
    if (!workflow) return { success: false, error: 'Workflow not found' };
    
    const task = workflow.tasks.find(t => t.id === taskId);
    if (!task) return { success: false, error: 'Task not found' };
    
    // 使用任务运行服务来执行任务
    return taskRunnerService.runTask(task);
  });

  // 命令操作
  ipcMain.handle('command:add', (_, { workflowId, taskId, command }) => {
    return workflowStore.addCommand(workflowId, taskId, command);
  });

  ipcMain.handle('command:update', (_, { workflowId, taskId, commandIndex, newCommand }) => {
    return workflowStore.updateCommand(workflowId, taskId, commandIndex, newCommand);
  });

  ipcMain.handle('command:delete', (_, { workflowId, taskId, commandIndex }) => {
    return workflowStore.deleteCommand(workflowId, taskId, commandIndex);
  });

  // 添加获取脚本列表的处理程序
  ipcMain.handle('script:getAll', () => {
    return scriptRegistry.getAllScripts();
  });

  // 获取单个脚本信息
  ipcMain.handle('script:getById', (_, scriptId) => {
    return scriptRegistry.getScriptById(scriptId);
  });
}

module.exports = {
  setupIpcHandlers
};