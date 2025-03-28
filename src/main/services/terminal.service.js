const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

class TerminalService {
  constructor() {
    this.terminalCommands = {
      win32: 'cmd.exe', // Windows
      darwin: 'Terminal.app', // macOS
      linux: 'x-terminal-emulator' // Linux (一般情况)
    };
  }

  // 打开终端并执行命令
  runTaskInTerminal(taskId, commands) {
    if (!commands || commands.length === 0) {
      return { success: false, error: 'No commands to run' };
    }

    const platform = os.platform();
    
    try {
      // 为不同的操作系统创建适当的命令
      if (platform === 'darwin') {
        // macOS - 使用 AppleScript 打开 Terminal 并执行命令
        return this.openMacTerminal(commands);
      } else if (platform === 'win32') {
        // Windows - 使用 cmd 或 PowerShell
        return this.openWindowsTerminal(commands);
      } else if (platform === 'linux') {
        // Linux - 使用常见的终端模拟器
        return this.openLinuxTerminal(commands);
      } else {
        return { 
          success: false, 
          error: `Unsupported platform: ${platform}` 
        };
      }
    } catch (error) {
      console.error('Failed to open terminal:', error);
      return { success: false, error: error.message };
    }
  }

  // macOS - 使用 AppleScript 打开 Terminal
  openMacTerminal(commands) {
    // 创建临时脚本文件
    const scriptPath = path.join(os.tmpdir(), `task_script_${Date.now()}.sh`);
    const scriptContent = commands.join('\n');
    
    fs.writeFileSync(scriptPath, `#!/bin/bash\n${scriptContent}\necho "\nPress any key to exit..."\nread -n 1`);
    fs.chmodSync(scriptPath, '755'); // 设置可执行权限
    
    // 使用 AppleScript 打开终端并执行脚本
    const appleScript = `
      tell application "Terminal"
        activate
        do script "${scriptPath}"
      end tell
    `;
    
    exec(`osascript -e '${appleScript}'`);
    return { success: true };
  }

  // Windows - 使用 cmd 
  openWindowsTerminal(commands) {
    // 创建临时批处理文件
    const batchPath = path.join(os.tmpdir(), `task_script_${Date.now()}.bat`);
    const scriptContent = commands.join('\r\n') + '\r\npause';
    
    fs.writeFileSync(batchPath, scriptContent);
    
    // 打开 CMD 并执行批处理文件
    exec(`start cmd.exe /k "${batchPath}"`);
    return { success: true };
  }

  // Linux - 使用常见的终端模拟器
  openLinuxTerminal(commands) {
    // 创建临时脚本文件
    const scriptPath = path.join(os.tmpdir(), `task_script_${Date.now()}.sh`);
    const scriptContent = commands.join('\n');
    
    fs.writeFileSync(scriptPath, `#!/bin/bash\n${scriptContent}\necho "\nPress Enter to exit..."\nread`);
    fs.chmodSync(scriptPath, '755'); // 设置可执行权限
    
    // 尝试多种常见的终端模拟器
    const terminals = [
      'gnome-terminal', 
      'xterm',
      'konsole',
      'xfce4-terminal',
      'terminator'
    ];
    
    // 尝试找到可用的终端
    for (const terminal of terminals) {
      try {
        exec(`which ${terminal}`, (error, stdout) => {
          if (!error && stdout) {
            if (terminal === 'gnome-terminal') {
              exec(`gnome-terminal -- bash -c "${scriptPath}; exec bash"`);
            } else {
              exec(`${terminal} -e "bash ${scriptPath}"`);
            }
          }
        });
        return { success: true };
      } catch (e) {
        console.log(`Terminal ${terminal} not available`);
      }
    }
    
    return { success: false, error: 'No suitable terminal found' };
  }
}

module.exports = new TerminalService();