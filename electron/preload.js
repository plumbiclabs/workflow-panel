const { contextBridge, ipcRenderer } = require('electron');

// 用于存储事件监听器的集合
const listeners = {
  taskComplete: new Set(),
  taskError: new Set()
};

// 设置IPC事件监听器
ipcRenderer.on('task:complete', (_, data) => {
  listeners.taskComplete.forEach(listener => listener(data));
});

ipcRenderer.on('task:error', (_, data) => {
  listeners.taskError.forEach(listener => listener(data));
});

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
    delete: (workflowId, taskId) => ipcRenderer.invoke('task:delete', { workflowId, taskId }),
    run: (workflowId, taskId) => ipcRenderer.invoke('task:run', { workflowId, taskId }),
    onComplete: (callback) => {
      listeners.taskComplete.add(callback);
      return () => listeners.taskComplete.delete(callback);
    },
    onError: (callback) => {
      listeners.taskError.add(callback);
      return () => listeners.taskError.delete(callback);
    }
  },
  // 命令相关的 API
  command: {
    add: (workflowId, taskId, command) => ipcRenderer.invoke('command:add', { workflowId, taskId, command }),
    update: (workflowId, taskId, commandIndex, newCommand) => ipcRenderer.invoke('command:update', { workflowId, taskId, commandIndex, newCommand }),
    delete: (workflowId, taskId, commandIndex) => ipcRenderer.invoke('command:delete', { workflowId, taskId, commandIndex })
  },
  // 脚本相关的 API
  script: {
    getAll: () => ipcRenderer.invoke('script:getAll'),
    getById: (scriptId) => ipcRenderer.invoke('script:getById', scriptId)
  }
});
