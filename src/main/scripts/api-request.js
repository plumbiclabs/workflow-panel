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
    console.log(`Performing ${method} request to ${requestUrl}`);
    
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
        console.log(`Status: ${res.statusCode}`);
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
      