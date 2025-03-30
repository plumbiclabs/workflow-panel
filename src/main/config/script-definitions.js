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
    path: 'scripts/file-operations.js',
    description: 'Performs operations on files',
    requiredParams: ['filePath', 'operation'] // 必填参数
  },
  {
    id: 'api-request',
    name: 'API Request',
    path: 'scripts/api-request.js',
    description: 'Makes HTTP requests to APIs',
    requiredParams: ['url', 'method'] // 必填参数
  },
  {
    id: 'data-transform',
    name: 'Data Transformation',
    path: 'scripts/data-transform.js',
    description: 'Transforms data between formats',
    requiredParams: ['inputFormat', 'outputFormat'] // 必填参数
  }
];

module.exports = { SCRIPT_DEFINITIONS };
// // CommonJS环境导出
// if (typeof module !== 'undefined' && module.exports) {
// }

// // ES Module环境导出
// export { SCRIPT_DEFINITIONS };
