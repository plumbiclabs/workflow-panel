const SCRIPT_DEFINITIONS = [
  {
    id: 'default',
    name: 'Default Script',
    path: '',
    description: 'Basic script that logs all parameters',
    requiredParams: []
  },
  {
    id: 'auto-login-evq',
    name: 'Auto Login EVQ',
    path: 'autoLoginEVQ.js',
    description: 'Automatically open a URL and optionally login to EVQ system using Puppeteer',
    requiredParams: ['url']
  }
];

module.exports = { SCRIPT_DEFINITIONS };