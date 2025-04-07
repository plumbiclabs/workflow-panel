const { app, BrowserWindow } = require('electron');
const path = require('path');
const { setupIpcHandlers } = require('../src/main/services/ipc.service');
const isDev = process.env.NODE_ENV === 'development';
const scriptRegistry = require('../src/main/services/script-registry.service');
const logger = require('../src/main/utils/logger');

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logger.error('未捕获的异常:', error);
});

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  logger.error('未处理的Promise拒绝:', reason);
});

function createWindow() {
  logger.info('创建主窗口');
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: 'JARVIS',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  if (isDev) {
    logger.info('开发模式 - 加载开发服务器URL');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    logger.info('生产模式 - 加载本地HTML文件');
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
  
  return mainWindow;
}

app.whenReady().then(() => {
  logger.info('Electron应用已准备好');
  const mainWindow = createWindow();
  
  // 设置IPC处理程序
  logger.info('设置IPC处理程序');
  setupIpcHandlers(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  logger.info('所有窗口已关闭');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 在退出前记录
app.on('before-quit', () => {
  logger.info('应用即将退出');
});

// 导出logger便于测试和调试
if (isDev) {
  global.logger = logger;
}