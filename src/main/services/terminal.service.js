const { exec } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

class TerminalService {
  constructor() {
    this.availableTerminals = [];
    this.scanAvailableTerminals();
  }

  // 扫描可用的终端
  scanAvailableTerminals() {
    const platform = os.platform();
    
    if (platform === 'win32') {
      this.scanWindowsTerminals();
    } else if (platform === 'darwin') {
      this.scanMacTerminals();
    } else if (platform === 'linux') {
      this.scanLinuxTerminals();
    }
  }

  // 扫描 Windows 终端
  scanWindowsTerminals() {
    const terminals = [
      {
        id: 'cmd',
        name: 'Command Prompt',
        path: 'cmd.exe',
        args: ['/k'],
        icon: '💻'
      },
      {
        id: 'powershell',
        name: 'PowerShell',
        path: 'powershell.exe',
        args: ['-NoExit'],
        icon: '⚡'
      }
    ];

    // 检查 Git Bash
    const gitBashPaths = [
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Program Files (x86)\\Git\\bin\\bash.exe'
    ];

    for (const gitPath of gitBashPaths) {
      if (fs.existsSync(gitPath)) {
        terminals.push({
          id: 'gitbash',
          name: 'Git Bash',
          path: gitPath,
          args: ['--login'],
          icon: '🐱'
        });
        break;
      }
    }

    this.availableTerminals = terminals;
  }

  // 扫描 Mac 终端
  scanMacTerminals() {
    this.availableTerminals = [
      {
        id: 'terminal',
        name: 'Terminal',
        // path: '/Applications/Utilities/Terminal.app',
        path: 'Terminal',
        args: [],
        icon: '💻'
      },
      {
        id: 'iterm',
        name: 'iTerm',
        // path: '/Applications/iTerm.app',
        path: 'iTerm',
        args: [],
        icon: '🖥️'
      }
    ];
  }

  // 扫描 Linux 终端
  scanLinuxTerminals() {
    const terminals = [
      {
        id: 'gnome-terminal',
        name: 'GNOME Terminal',
        path: 'gnome-terminal',
        args: ['--'],
        icon: '💻'
      },
      {
        id: 'konsole',
        name: 'Konsole',
        path: 'konsole',
        args: ['-e'],
        icon: '🖥️'
      }
    ];

    this.availableTerminals = terminals;
  }

  // 获取可用的终端列表
  getAvailableTerminals() {
    return this.availableTerminals;
  }

  // 运行命令
  runCommand(terminalId, commands) {
    const terminal = this.availableTerminals.find(t => t.id === terminalId);
    if (!terminal) {
      throw new Error(`Terminal ${terminalId} not found`);
    }

    const platform = os.platform();
    const scriptPath = this.createScriptFile(commands, platform);
    
    try {
      if (platform === 'win32') {
        return this.runWindowsCommand(terminal, scriptPath);
      } else if (platform === 'darwin') {
        return this.runMacCommand(terminal, scriptPath);
      } else if (platform === 'linux') {
        return this.runLinuxCommand(terminal, scriptPath);
      }
    } catch (error) {
      console.error('Failed to run command:', error);
      return { success: false, error: error.message };
    }
  }

  // 创建临时脚本文件
  createScriptFile(commands, platform) {
    const scriptPath = path.join(
      os.tmpdir(),
      `task_script_${Date.now()}.${platform === 'win32' ? 'bat' : 'sh'}`
    );

    let scriptContent = '';
    if (platform === 'win32') {
      scriptContent = commands.join('\r\n') + '\r\npause';
    } else {
      scriptContent = `#!/bin/bash\n${commands.join('\n')}\necho "\nPress Enter to exit..."\nread`;
    }

    fs.writeFileSync(scriptPath, scriptContent);
    if (platform !== 'win32') {
      fs.chmodSync(scriptPath, '755');
    }

    return scriptPath;
  }

  // Windows 命令执行
  runWindowsCommand(terminal, scriptPath) {
    const command = `${terminal.path} ${terminal.args.join(' ')} "${scriptPath}"`;
    exec(command);
    return { success: true };
  }

  // Mac 命令执行
  runMacCommand(terminal, scriptPath) {
    const appleScript = `
      tell application "${terminal.path}"
        activate
        do script "${scriptPath}"
      end tell
    `;
    exec(`osascript -e '${appleScript}'`);
    return { success: true };
  }

  // Linux 命令执行
  runLinuxCommand(terminal, scriptPath) {
    const command = `${terminal.path} ${terminal.args.join(' ')} "bash ${scriptPath}"`;
    exec(command);
    return { success: true };
  }
}

module.exports = new TerminalService();