const SCRIPT_DEFINITIONS = [
  {
    id: 'default',
    name: 'Default Script',
    path: '', // 空路径表示使用默认脚本
    description: 'Basic script that logs all parameters',
    requiredParams: [] // 没有必填参数
  },
  {
    id: 'file-ops',
    name: 'File Operations',
    path: 'file-operations.js',
    description: 'Performs operations on files',
    requiredParams: ['filePath', 'operation'] // 必填参数
  },
  {
    id: 'api-request',
    name: 'API Request',
    path: 'api-request.js',
    description: 'Makes HTTP requests to APIs',
    requiredParams: ['url', 'method'] // 必填参数
  },
  {
    id: 'data-transform',
    name: 'Data Transformation',
    path: 'data-transform.js',
    description: 'Transforms data between formats',
    requiredParams: ['inputFormat', 'outputFormat'] // 必填参数
  },
  {
    id: 'auto-login-evq',
    name: 'Auto Login EVQ',
    path: 'autoLoginEVQ.js',
    description: 'Automatically open a URL and optionally login to EVQ system using Puppeteer',
    requiredParams: ['url'] // 只有URL是必填参数，username和password是可选的
  }
];

module.exports = { SCRIPT_DEFINITIONS };

