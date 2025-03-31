const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * 默认脚本处理程序
 * @param {Object} params - 参数对象
 * @param {Function} callback - 完成回调，格式为 callback(error, result)
 */
module.exports = function(params, callback) {
  console.log('=== 默认脚本处理程序开始执行 ===');
  console.log('收到的参数:');
  console.log(JSON.stringify(params, null, 2));
  
  try {
    // 输出系统信息，便于调试
    console.log('\n系统信息:');
    console.log(`- 平台: ${os.platform()}`);
    console.log(`- 架构: ${os.arch()}`);
    console.log(`- 主机名: ${os.hostname()}`);
    console.log(`- 当前目录: ${process.cwd()}`);
    console.log(`- Node版本: ${process.version}`);
    
    // 处理通用逻辑
    console.log('\n处理参数...');
    
    // 延迟一秒钟模拟处理过程
    setTimeout(() => {
      console.log('\n任务处理完成!');
      
      // 构建结果对象
      const result = {
        success: true,
        message: '任务已成功完成',
        timestamp: new Date().toISOString(),
        params: params,
        systemInfo: {
          platform: os.platform(),
          arch: os.arch(),
          hostname: os.hostname()
        }
      };
      
      // 返回处理结果
      console.log('返回结果:');
      console.log(JSON.stringify(result, null, 2));
      console.log('=== 默认脚本处理程序执行完毕 ===');
      
      callback(null, result);
    }, 1000);
    
  } catch (error) {
    console.error('\n执行过程中出错:');
    console.error(error);
    console.log('=== 默认脚本处理程序执行失败 ===');
    
    callback(error, null);
  }
};
      