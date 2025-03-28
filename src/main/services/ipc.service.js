const { ipcMain } = require('electron');
const workflowStore = require('../store/workflow.store');
const terminalService = require('./terminal.service');

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
    
    // 确保有命令可以运行
    if (!task.commands || task.commands.length === 0) {
      return { success: false, error: 'No commands to run' };
    }
    
    try {
      // 创建终端窗口并运行命令
      const window = terminalService.runTaskInTerminal(taskId, task.commands);
      return { success: true, message: 'Terminal launched' };
    } catch (error) {
      console.error('Failed to run task:', error);
      return { success: false, error: error.message };
    }
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
}

module.exports = {
  setupIpcHandlers
};