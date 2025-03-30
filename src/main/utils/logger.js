const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// 日志文件路径
const LOG_FILE = app.isPackaged 
  ? path.join(app.getPath('userData'), 'main-process.log')
  : path.join(process.cwd(), 'main-process.log');

// 确保日志目录存在
function ensureLogDirectory() {
  const logDir = path.dirname(LOG_FILE);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

// 日志级别
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

// 当前日志级别
let currentLogLevel = LOG_LEVELS.DEBUG;

// 设置日志级别
function setLogLevel(level) {
  if (level in LOG_LEVELS) {
    currentLogLevel = LOG_LEVELS[level];
  }
}

// 写入日志到文件
function writeToFile(level, message) {
  try {
    ensureLogDirectory();
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${level}] ${message}\n`;
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (error) {
    console.error(`Failed to write to log file: ${error.message}`);
  }
}

// 创建日志函数
function createLogger(level, consoleFn) {
  return function(message, ...args) {
    if (LOG_LEVELS[level] >= currentLogLevel) {
      // 格式化消息
      let formattedMessage = message;
      if (args.length > 0) {
        try {
          args = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
          );
          formattedMessage = message.replace(/{}/g, () => args.shift());
        } catch (e) {
          formattedMessage = `${message} ${args.join(' ')}`;
        }
      }
      
      // 控制台输出
      consoleFn(`[MAIN] [${level}] ${formattedMessage}`);
      
      // 文件输出
      writeToFile(level, formattedMessage);
    }
  };
}

// 导出日志函数
module.exports = {
  debug: createLogger('DEBUG', console.log),
  info: createLogger('INFO', console.log),
  warn: createLogger('WARN', console.warn),
  error: createLogger('ERROR', console.error),
  setLogLevel
}; 