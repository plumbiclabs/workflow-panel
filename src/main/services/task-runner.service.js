// src/main/services/task-runner.service.js
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const terminalService = require('./terminal.service');

class TaskRunnerService {
  // 执行任务的入口方法
  runTask(task) {
    if (!task) {
      return { success: false, error: 'Invalid task' };
    }
    
    try {
      // 根据任务类型执行不同的处理逻辑
      switch (task.type) {
        case 'key-value':
          return this.runKeyValueTask(task);
        case 'command':
        default:
          return this.runCommandTask(task);
      }
    } catch (error) {
      console.error('Error running task:', error);
      return { success: false, error: error.message };
    }
  }
  
  // 运行命令类型任务
  runCommandTask(task) {
    if (!task.commands || task.commands.length === 0) {
      return { success: false, error: 'No commands to run' };
    }
    
    const result = terminalService.runTaskInTerminal(task.id, task.commands);
    return { success: true, message: 'Terminal launched' };
  }
  
  // 运行键值对任务
  runKeyValueTask(task) {
    if (!task.parameters || task.parameters.length === 0) {
      return { success: false, error: 'No parameters defined for this task' };
    }
    
    // 脚本路径 - 从任务配置中读取或使用默认脚本
    const scriptToRun = task.scriptPath || this.getDefaultScript();
    
    // 准备参数
    const paramsObj = {};
    task.parameters.forEach(param => {
      paramsObj[param.key] = param.value;
    });
    
    // 创建临时参数文件
    const paramsPath = path.join(os.tmpdir(), `task_params_${Date.now()}.json`);
    fs.writeFileSync(paramsPath, JSON.stringify(paramsObj, null, 2));
    
    // 在终端中执行脚本并传递参数文件路径
    return this.executeScript(scriptToRun, paramsPath);
  }
  
  // 默认脚本 - 如果任务没有指定脚本
  getDefaultScript() {
    const defaultScriptDir = path.join(__dirname, '../scripts');
    const defaultScriptPath = path.join(defaultScriptDir, 'default-task-handler.js');
    
    // 确保默认脚本目录存在
    if (!fs.existsSync(defaultScriptDir)) {
      fs.mkdirSync(defaultScriptDir, { recursive: true });
    }
    
    // 如果默认脚本不存在，创建一个
    if (!fs.existsSync(defaultScriptPath)) {
      const defaultScript = `
const fs = require('fs');
const path = require('path');

// 获取参数文件路径 (作为第一个命令行参数传入)
const paramsPath = process.argv[2];

if (!paramsPath || !fs.existsSync(paramsPath)) {
  console.error('Parameters file not found');
  process.exit(1);
}

// 读取参数
const params = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));

console.log('Task parameters:');
console.log(JSON.stringify(params, null, 2));

// 这里可以根据参数执行不同的操作
console.log('\\nTask completed successfully!');
      `;
      fs.writeFileSync(defaultScriptPath, defaultScript);
    }
    
    return defaultScriptPath;
  }
  
  // 在终端中执行脚本
  executeScript(scriptPath, paramsPath) {
    const platform = os.platform();
    
    if (platform === 'darwin') {
      // macOS
      const appleScript = `
        tell application "Terminal"
          activate
          do script "node '${scriptPath}' '${paramsPath}'; echo '\\nPress any key to exit...'; read -n 1"
        end tell
      `;
      exec(`osascript -e '${appleScript}'`);
    } else if (platform === 'win32') {
      // Windows
      exec(`start cmd.exe /k "node "${scriptPath}" "${paramsPath}" && pause"`);
    } else {
      // Linux
      const terminals = ['gnome-terminal', 'xterm', 'konsole', 'xfce4-terminal'];
      for (const terminal of terminals) {
        try {
          exec(`which ${terminal}`, (error, stdout) => {
            if (!error && stdout) {
              if (terminal === 'gnome-terminal') {
                exec(`gnome-terminal -- bash -c "node ${scriptPath} ${paramsPath}; echo '\\nPress Enter to exit...'; read"`);
              } else {
                exec(`${terminal} -e "node ${scriptPath} ${paramsPath} && echo '\\nPress Enter to exit...' && read"`);
              }
            }
          });
          break;
        } catch (e) {
          console.log(`Terminal ${terminal} not available`);
        }
      }
    }
    
    return { success: true, message: 'Script execution started' };
  }
}

module.exports = new TaskRunnerService();