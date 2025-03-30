// src/main/services/task-runner.service.js
const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');
const terminalService = require('./terminal.service');
const scriptRegistry = require('./script-registry.service');

class TaskRunnerService {
  // 执行任务的入口方法
  async runTask(task) {
    if (!task) {
      return { success: false, error: 'Invalid task' };
    }
    
    try {
      // 根据任务类型执行不同的处理逻辑
      if (task.type === 'key-value') {
        return await this.runKeyValueTask(task);
      } else {
        // 命令类型任务 (默认)
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
  async runKeyValueTask(task) {
    if (!task.parameters || task.parameters.length === 0) {
      return { success: false, error: 'No parameters defined for this task' };
    }
    
    try {
      // 准备参数
      const paramObj = {};
      task.parameters.forEach(param => {
        paramObj[param.key] = param.value;
      });
      
      // 使用脚本注册表运行相应的脚本
      // 在终端中显示执行过程
      const scriptId = task.scriptId || 'default';
      
      // 1. 创建一个临时参数文件
      const paramsPath = path.join(os.tmpdir(), `task_params_${Date.now()}.json`);
      fs.writeFileSync(paramsPath, JSON.stringify(paramObj, null, 2));
      
      // 2. 创建一个包装脚本显示执行过程
      const wrapperPath = path.join(os.tmpdir(), `task_wrapper_${Date.now()}.js`);
      const wrapperScript = `
const scriptRegistry = require('${path.join(__dirname, 'script-registry.service.js').replace(/\\/g, '\\\\')}');
const fs = require('fs');

// 读取参数文件
const paramsPath = '${paramsPath.replace(/\\/g, '\\\\')}';
const params = JSON.parse(fs.readFileSync(paramsPath, 'utf8'));

console.log('=== TASK START: ${task.name} ===');
console.log('Running script: ${scriptId}');
console.log('Parameters:');
console.log(JSON.stringify(params, null, 2));
console.log('-----------------------------------');

// 运行脚本
scriptRegistry.runScript('${scriptId}', params)
  .then(result => {
    console.log('-----------------------------------');
    console.log('Result:', JSON.stringify(result, null, 2));
    console.log('=== TASK COMPLETE ===');
  })
  .catch(error => {
    console.error('-----------------------------------');
    console.error('Error:', error.message);
    console.error('=== TASK FAILED ===');
  });
      `;
      
      fs.writeFileSync(wrapperPath, wrapperScript);
      
      // 3. 在终端中运行包装脚本
      const platform = os.platform();
      if (platform === 'darwin') {
        // macOS
        const appleScript = `
          tell application "Terminal"
            activate
            do script "node '${wrapperPath}'; echo '\\nPress any key to exit...'; read -n 1"
          end tell
        `;
        exec(`osascript -e '${appleScript}'`);
      } else if (platform === 'win32') {
        // Windows
        exec(`start cmd.exe /k "node "${wrapperPath}" && pause"`);
      } else {
        // Linux
        const terminals = ['gnome-terminal', 'xterm', 'konsole', 'xfce4-terminal'];
        for (const terminal of terminals) {
          try {
            exec(`which ${terminal}`, (error, stdout) => {
              if (!error && stdout) {
                if (terminal === 'gnome-terminal') {
                  exec(`gnome-terminal -- bash -c "node ${wrapperPath}; echo '\\nPress Enter to exit...'; read"`);
                } else {
                  exec(`${terminal} -e "node ${wrapperPath} && echo '\\nPress Enter to exit...' && read"`);
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
    } catch (error) {
      console.error('Failed to run key-value task:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new TaskRunnerService();