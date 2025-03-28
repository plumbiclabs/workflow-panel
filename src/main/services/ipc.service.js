const { ipcMain } = require('electron');
const workflowStore = require('../store/workflow.store');

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
