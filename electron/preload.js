const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 工作流相关的 API
  workflow: {
    getAll: () => ipcRenderer.invoke('workflow:getAll'),
    getById: (id) => ipcRenderer.invoke('workflow:getById', id),
    add: (workflow) => ipcRenderer.invoke('workflow:add', workflow),
    update: (id, workflowData) => ipcRenderer.invoke('workflow:update', { id, workflowData }),
    delete: (id) => ipcRenderer.invoke('workflow:delete', id)
  },
  // 任务相关的 API
  task: {
    add: (workflowId, task) => ipcRenderer.invoke('task:add', { workflowId, task }),
    update: (workflowId, taskId, taskData) => ipcRenderer.invoke('task:update', { workflowId, taskId, taskData }),
    delete: (workflowId, taskId) => ipcRenderer.invoke('task:delete', { workflowId, taskId })
  },
  // 命令相关的 API
  command: {
    add: (workflowId, taskId, command) => ipcRenderer.invoke('command:add', { workflowId, taskId, command }),
    update: (workflowId, taskId, commandIndex, newCommand) => ipcRenderer.invoke('command:update', { workflowId, taskId, commandIndex, newCommand }),
    delete: (workflowId, taskId, commandIndex) => ipcRenderer.invoke('command:delete', { workflowId, taskId, commandIndex })
  }
});