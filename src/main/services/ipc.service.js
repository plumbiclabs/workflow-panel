const { ipcMain } = require('electron');
const workflowStore = require('../store/workflow.store');

function setupIpcHandlers() {
  // 获取所有工作流
  ipcMain.handle('workflow:getAll', () => {
    return workflowStore.getAllWorkflows();
  });

  // 保存工作流
  ipcMain.handle('workflow:save', (_, workflow) => {
    return workflowStore.saveWorkflow(workflow);
  });

  // 删除工作流
  ipcMain.handle('workflow:delete', (_, id) => {
    return workflowStore.deleteWorkflow(id);
  });
}

module.exports = {
  setupIpcHandlers
};