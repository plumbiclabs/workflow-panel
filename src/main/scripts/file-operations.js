
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
    console.log(`Performing ${operation} operation on ${resolvedPath}`);
    
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
        callback(new Error(`Unsupported operation: ${operation}`));
    }
  } catch (error) {
    console.error('Error:', error);
    callback(error);
  }
};
      