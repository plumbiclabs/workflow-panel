// src/main/services/script-registry.service.js
const path = require('path');
const fs = require('fs');
const { SCRIPT_DEFINITIONS } = require('../config/script-definitions');

class ScriptRegistryService {
  constructor() {
    this.scriptsDir = path.join(__dirname, '../scripts');
    this.defaultScriptPath = path.join(this.scriptsDir, 'default-handler.js');
    this.scripts = [...SCRIPT_DEFINITIONS];
    
    // 确保脚本目录存在
    this.ensureScriptsDirectory();
    
    // 确保默认脚本存在
    this.ensureDefaultScript();
    
    // 初始化脚本处理程序
    this.initializeScriptHandlers();
  }
  
  // 获取脚本信息
  getScriptById(scriptId) {
    return this.scripts.find(script => script.id === scriptId) || this.scripts[0];
  }

  getAllScripts() {
    return this.scripts.map(script => ({
      id: script.id,
      name: script.name,
      path: script.path,
      description: script.description,
      requiredParams: script.requiredParams
    }));
  }
  
  // 确保脚本目录存在
  ensureScriptsDirectory() {
    const scriptDirs = [
      this.scriptsDir,
      path.join(this.scriptsDir, 'examples')
    ];
    
    scriptDirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }
  
  // 确保默认脚本存在
  ensureDefaultScript() {
    if (!fs.existsSync(this.defaultScriptPath)) {
      const defaultScript = `
const fs = require('fs');
const path = require('path');

/**
 * 默认脚本处理程序
 * @param {Object} params - 参数对象
 * @param {Function} callback - 完成回调
 */
module.exports = function(params, callback) {
  console.log('Task parameters:');
  console.log(JSON.stringify(params, null, 2));
  
  // 这里处理通用逻辑
  console.log('\\nTask completed successfully!');
  
  callback(null, { success: true, message: 'Task completed' });
};
      `;
      fs.writeFileSync(this.defaultScriptPath, defaultScript);
    }
    
    // 确保其他预设脚本存在
    this.createExampleScripts();
  }
  
  // 创建示例脚本
  createExampleScripts() {
    const fileOpsScript = path.join(this.scriptsDir, 'file-operations.js');
    if (!fs.existsSync(fileOpsScript)) {
      const script = `
const fs = require('fs');
const path = require('path');

/**
 * 文件操作脚本
 * @param {Object} params - 参数对象
 * @param {string} params.filePath - 文件路径
 * @param {string} params.operation - 操作类型 (read|write|append|delete)
 * @param {string} [params.content] - 写入内容 (用于write/append操作)
 * @param {Function} callback - 完成回调
 */
module.exports = function(params, callback) {
  const { filePath, operation, content } = params;
  
  if (!filePath) {
    return callback(new Error('filePath parameter is required'));
  }
  
  if (!operation) {
    return callback(new Error('operation parameter is required'));
  }
  
  try {
    const resolvedPath = path.resolve(filePath);
    console.log(\`Performing \${operation} operation on \${resolvedPath}\`);
    
    switch(operation.toLowerCase()) {
      case 'read':
        if (fs.existsSync(resolvedPath)) {
          const content = fs.readFileSync(resolvedPath, 'utf8');
          console.log('File content:', content);
          callback(null, { success: true, content });
        } else {
          callback(new Error('File does not exist'));
        }
        break;
      
      case 'write':
        if (!content) {
          return callback(new Error('content parameter is required for write operation'));
        }
        fs.writeFileSync(resolvedPath, content);
        console.log('File written successfully');
        callback(null, { success: true });
        break;
      
      case 'append':
        if (!content) {
          return callback(new Error('content parameter is required for append operation'));
        }
        fs.appendFileSync(resolvedPath, content);
        console.log('Content appended successfully');
        callback(null, { success: true });
        break;
      
      case 'delete':
        if (fs.existsSync(resolvedPath)) {
          fs.unlinkSync(resolvedPath);
          console.log('File deleted successfully');
          callback(null, { success: true });
        } else {
          callback(new Error('File does not exist'));
        }
        break;
      
      default:
        callback(new Error(\`Unsupported operation: \${operation}\`));
    }
  } catch (error) {
    console.error('Error:', error);
    callback(error);
  }
};
      `;
      fs.writeFileSync(fileOpsScript, script);
    }
    
    // 添加其他预设脚本...
    const apiRequestScript = path.join(this.scriptsDir, 'api-request.js');
    if (!fs.existsSync(apiRequestScript)) {
      const script = `
const https = require('https');
const http = require('http');
const url = require('url');

/**
 * API 请求脚本
 * @param {Object} params - 参数对象
 * @param {string} params.url - 请求URL
 * @param {string} params.method - 请求方法 (GET|POST|PUT|DELETE)
 * @param {Object} [params.headers] - 请求头
 * @param {string|Object} [params.body] - 请求体 (用于POST/PUT)
 * @param {Function} callback - 完成回调
 */
module.exports = function(params, callback) {
  const { url: requestUrl, method, headers, body } = params;
  
  if (!requestUrl) {
    return callback(new Error('url parameter is required'));
  }
  
  if (!method) {
    return callback(new Error('method parameter is required'));
  }
  
  try {
    console.log(\`Performing \${method} request to \${requestUrl}\`);
    
    const parsedUrl = url.parse(requestUrl);
    const isHttps = parsedUrl.protocol === 'https:';
    const httpModule = isHttps ? https : http;
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.path,
      method: method.toUpperCase(),
      headers: headers || {}
    };
    
    const req = httpModule.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(\`Status: \${res.statusCode}\`);
        console.log('Response:', data);
        
        callback(null, {
          success: true,
          statusCode: res.statusCode,
          headers: res.headers,
          data
        });
      });
    });
    
    req.on('error', (error) => {
      console.error('Request error:', error);
      callback(error);
    });
    
    if (body && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT')) {
      const bodyData = typeof body === 'object' ? JSON.stringify(body) : body;
      req.write(bodyData);
    }
    
    req.end();
  } catch (error) {
    console.error('Error:', error);
    callback(error);
  }
};
      `;
      fs.writeFileSync(apiRequestScript, script);
    }
    
    const dataTransformScript = path.join(this.scriptsDir, 'data-transform.js');
    if (!fs.existsSync(dataTransformScript)) {
      const script = `
const fs = require('fs');
const path = require('path');

/**
 * 数据转换脚本
 * @param {Object} params - 参数对象
 * @param {string} params.inputFormat - 输入格式 (json|csv|xml)
 * @param {string} params.outputFormat - 输出格式 (json|csv|xml)
 * @param {string} [params.inputData] - 输入数据
 * @param {string} [params.inputFile] - 输入文件路径
 * @param {string} [params.outputFile] - 输出文件路径
 * @param {Function} callback - 完成回调
 */
module.exports = function(params, callback) {
  const { inputFormat, outputFormat, inputData, inputFile, outputFile } = params;
  
  if (!inputFormat) {
    return callback(new Error('inputFormat parameter is required'));
  }
  
  if (!outputFormat) {
    return callback(new Error('outputFormat parameter is required'));
  }
  
  if (!inputData && !inputFile) {
    return callback(new Error('Either inputData or inputFile parameter is required'));
  }
  
  try {
    console.log(\`Transforming data from \${inputFormat} to \${outputFormat}\`);
    
    // 获取输入数据
    let data;
    if (inputFile) {
      const filePath = path.resolve(inputFile);
      if (!fs.existsSync(filePath)) {
        return callback(new Error(\`Input file not found: \${filePath}\`));
      }
      data = fs.readFileSync(filePath, 'utf8');
    } else {
      data = inputData;
    }
    
    // 解析输入数据
    let parsedData;
    switch(inputFormat.toLowerCase()) {
      case 'json':
        parsedData = JSON.parse(data);
        break;
      case 'csv':
        // 简单CSV解析
        parsedData = data.split('\\n').map(line => line.split(','));
        break;
      case 'xml':
        console.log('XML parsing not fully implemented, using placeholder');
        parsedData = { xmlData: data };
        break;
      default:
        return callback(new Error(\`Unsupported input format: \${inputFormat}\`));
    }
    
    // 转换为输出格式
    let outputData;
    switch(outputFormat.toLowerCase()) {
      case 'json':
        outputData = JSON.stringify(parsedData, null, 2);
        break;
      case 'csv':
        if (Array.isArray(parsedData)) {
          outputData = parsedData.map(row => row.join(',')).join('\\n');
        } else {
          // 对象转CSV
          const headers = Object.keys(parsedData);
          const values = Object.values(parsedData);
          outputData = headers.join(',') + '\\n' + values.join(',');
        }
        break;
      case 'xml':
        console.log('XML generation not fully implemented, using placeholder');
        outputData = \`<data>\${JSON.stringify(parsedData)}</data>\`;
        break;
      default:
        return callback(new Error(\`Unsupported output format: \${outputFormat}\`));
    }
    
    // 输出结果
    console.log('Transformed data:', outputData);
    
    // 写入输出文件
    if (outputFile) {
      const outPath = path.resolve(outputFile);
      fs.writeFileSync(outPath, outputData);
      console.log(\`Output written to \${outPath}\`);
    }
    
    callback(null, {
      success: true,
      outputData,
      outputFile: outputFile ? path.resolve(outputFile) : null
    });
  } catch (error) {
    console.error('Error:', error);
    callback(error);
  }
};
      `;
      fs.writeFileSync(dataTransformScript, script);
    }
  }
  
  // 初始化脚本处理程序
  initializeScriptHandlers() {
    this.scripts.forEach(script => {
      if (script.id === 'default' || !script.path) {
        // 默认脚本使用内置处理程序
        script.handler = require(this.defaultScriptPath);
      } else {
        // 其他脚本使用其指定的脚本文件
        const scriptPath = path.join(this.scriptsDir, script.path);
        
        if (fs.existsSync(scriptPath)) {
          try {
            script.handler = require(scriptPath);
          } catch (error) {
            console.error(`Error loading script ${script.id}:`, error);
            // 降级到默认处理程序
            script.handler = require(this.defaultScriptPath);
          }
        } else {
          console.warn(`Script file not found for ${script.id}: ${scriptPath}`);
          // 降级到默认处理程序
          script.handler = require(this.defaultScriptPath);
        }
      }
    });
  }
  
  // 运行指定脚本
  runScript(scriptId, params) {
    return new Promise((resolve, reject) => {
      const script = this.getScriptById(scriptId);
      
      if (!script) {
        return reject(new Error(`Script not found: ${scriptId}`));
      }
      
      if (!script.handler) {
        return reject(new Error(`No handler available for script: ${scriptId}`));
      }
      
      // 检查必填参数
      const missingParams = script.requiredParams.filter(param => {
        return !params || params[param] === undefined || params[param] === null;
      });
      
      if (missingParams.length > 0) {
        return reject(new Error(`Missing required parameters: ${missingParams.join(', ')}`));
      }
      
      // 运行脚本
      try {
        script.handler(params, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = new ScriptRegistryService();