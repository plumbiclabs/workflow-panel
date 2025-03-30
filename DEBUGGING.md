# Electron 应用调试指南

本文档提供了如何调试 Electron 应用主进程的几种方法。

## 准备工作

确保你已经安装了以下工具：
- VS Code
- Node.js 和 npm
- Electron 应用依赖项 (`npm install`)

## 方法一：使用 VS Code 调试（推荐）

1. **启动调试会话**：
   - 打开 VS Code 的"运行和调试"面板（Ctrl+Shift+D 或 Cmd+Shift+D）
   - 从下拉菜单中选择 "Debug Electron Main Process"
   - 点击绿色的播放按钮启动调试

2. **设置断点**：
   - 在代码编辑器中，点击行号旁边添加断点
   - 或在代码中直接添加 `debugger;` 语句

3. **调试控制**：
   - 使用 VS Code 的调试控制面板（继续、步进、步出等）
   - 在"变量"面板中查看当前变量值
   - 在"调试控制台"中执行表达式

## 方法二：使用 Chrome DevTools

1. **启动应用并附加调试器**：
   ```bash
   # 在 package.json 中添加以下脚本
   # "electron:debug": "concurrently \"cross-env NODE_ENV=development vite\" \"wait-on tcp:5173 && cross-env NODE_ENV=development electron --inspect=5858 .\""
   
   npm run electron:debug
   ```

2. **连接 Chrome DevTools**：
   - 打开 Chrome 浏览器
   - 导航到 `chrome://inspect`
   - 在 "Remote Target" 下找到 Electron 进程并点击 "inspect"

## 方法三：使用日志文件

项目中已添加了一个日志工具 (`src/main/utils/logger.js`)，可以将主进程日志同时输出到控制台和文件：

```javascript
// 在主进程代码中使用
const logger = require('./utils/logger');

logger.debug('调试信息');
logger.info('一般信息');
logger.warn('警告信息');
logger.error('错误信息', { details: '详细错误数据' });
```

日志文件默认位置：
- 开发模式：项目根目录下的 `main-process.log`
- 生产模式：用户数据目录下的 `main-process.log`

## 常见调试场景

### 1. 调试 IPC 通信

在 IPC 处理程序中添加日志或断点：

```javascript
ipcMain.handle('task:run', async (event, args) => {
  logger.debug('收到 task:run 请求，参数：', args);
  // 设置断点
  debugger;
  
  // 处理逻辑...
  
  return result;
});
```

### 2. 调试脚本执行

在脚本执行前后添加日志：

```javascript
// 在执行脚本之前
logger.debug('准备执行脚本：', scriptPath);
logger.debug('脚本参数：', parameters);

// 在执行脚本之后
logger.debug('脚本执行结果：', result);
```

### 3. 调试问题排查

- 检查文件路径是否正确（使用 `path.resolve` 输出完整路径）
- 检查参数是否正确传递（使用 `logger.debug` 输出参数）
- 使用 try-catch 捕获并记录错误

## 提示和技巧

1. **添加清晰的日志标记**，帮助在混合日志中快速定位：
   ```javascript
   logger.debug('==== SCRIPT EXECUTION START ====');
   // 执行代码
   logger.debug('==== SCRIPT EXECUTION END ====');
   ```

2. **使用条件断点**：在 VS Code 中右键点击断点，添加条件，只有在满足特定条件时才会停止。

3. **监视表达式**：在 VS Code 调试视图中添加表达式到"监视"面板，持续观察其值的变化。

4. **在测试前简化参数**，使用最小化的参数集开始调试，然后逐步增加复杂性。 