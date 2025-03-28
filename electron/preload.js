const { contextBridge, ipcRenderer } = require('electron');

// 暴露安全的 API 到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 工作流相关的 API
  workflow: {
    getAll: () => ipcRenderer.invoke('workflow:getAll'),
    save: (workflow) => ipcRenderer.invoke('workflow:save', workflow),
    delete: (id) => ipcRenderer.invoke('workflow:delete', id)
  }
});